import { defineStore } from 'pinia'
import type { Order, OrderWithRelations, VehicleCommission } from '../types/index'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Store spécialisé pour la récupération et l'affichage des détails d'une commande par son numéro
 * 
 * Ce store est optimisé pour charger une commande avec toutes ses relations en utilisant
 * le numéro de commande (orderNumber) comme identifiant unique.
 * 
 * Relations chargées :
 * - Articles de commande (order_items)
 * - Véhicules associés (vehicles)
 * - Caractéristiques des véhicules (vehicle_features)
 * - Prix des véhicules (vehicle_prices)
 * - Commissions (vehicle_commissions)
 * - Contact acheteur (contact)
 * - Entreprise acheteuse (buyer_company)
 * - Entreprise vendeuse (seller_company)
 */
export const useOrderByNumberStore = defineStore('orderByNumber', {
  state: () => ({
    order: null as OrderWithRelations | null,
    loading: false,
    error: null as string | null,
    commissions: [] as VehicleCommission[]
  }),

  actions: {
    /**
     * Récupère une commande par son numéro avec toutes ses relations
     * @param orderNumber Numéro de la commande à récupérer
     */
    async fetchOrderByNumber(orderNumber: string) {
      this.loading = true
      this.error = null
      
      try {
        const supabase = useSupabaseClient()
        
        // 1. Récupérer la commande avec ses relations de base
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            contact (*),
            buyerCompany: buyer_company_id (*),
            sellerCompany: seller_company_id (*)
          `)
          .eq('orderNumber', orderNumber)
          .single()

        if (orderError) throw orderError

        // 2. Récupérer les articles de commande avec leurs véhicules
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            vehicle:vehicle_id (
              *,
              vehicle_features (*),
              vehicle_prices (*)
            )
          `)
          .eq('order_id', orderData.id)

        if (itemsError) throw itemsError

        // 3. Récupérer les commissions pour chaque article
        const orderItemIds = itemsData.map(item => item.id)
        
        let commissionsData: any[] = []
        
        if (orderItemIds.length > 0) {
          const { data: commissions, error: commissionsError } = await supabase
            .from('vehicle_commissions')
            .select('*')
            .in('order_item_id', orderItemIds)

          if (commissionsError) throw commissionsError
          commissionsData = commissions || []
        }

        // 4. Associer les commissions aux articles
        const itemsWithCommissions = itemsData.map(item => {
          const itemCommissions = commissionsData.filter(
            commission => commission.order_item_id === item.id
          )
          return {
            ...item,
            commissions: itemCommissions
          }
        })

        // 5. Construire l'objet commande complet
        const completeOrder = {
          ...orderData,
          items: itemsWithCommissions
        }

        this.order = completeOrder as OrderWithRelations
        this.commissions = commissionsData as VehicleCommission[]
        
        console.log('Commande chargée avec succès par numéro:', this.order)
        return this.order
      } catch (error) {
        console.error('Erreur lors du chargement de la commande par numéro:', error)
        this.error = (error as PostgrestError).message
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Réinitialise l'état du store
     */
    resetState() {
      this.order = null
      this.loading = false
      this.error = null
      this.commissions = []
    }
  },

  getters: {
    /**
     * Récupère toutes les commissions de la commande
     */
    getAllCommissions(): VehicleCommission[] {
      if (!this.order || !this.order.items) return []
      
      const commissions: VehicleCommission[] = []
      this.order.items.forEach(item => {
        if (item.commissions && item.commissions.length > 0) {
          commissions.push(...item.commissions)
        }
      })
      
      return commissions
    },

    /**
     * Vérifie si la commande est de type intermédiation
     */
    isIntermediationType(): boolean {
      if (!this.order) return false
      
      const intermediationTypes = ['B2B2B', 'B2B2C', 'C2B2C', 'C2B2B']
      return intermediationTypes.includes(this.order.saleType)
    },

    /**
     * Récupère le statut de la commande
     */
    orderStatus(): string {
      return this.order?.status || 'DRAFT'
    },

    /**
     * Récupère le type de vente de la commande
     */
    saleType(): string {
      return this.order?.saleType || ''
    },

    /**
     * Récupère l'ID de la commande
     */
    orderId(): number | null {
      return this.order?.id || null
    }
  }
}) 