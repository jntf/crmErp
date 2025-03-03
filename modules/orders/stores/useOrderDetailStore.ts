import { defineStore } from 'pinia'
import type { Order, OrderWithRelations, VehicleCommission, Address, Country } from '../types/index'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Transforme les données de la commande du format snake_case vers camelCase
 * @param data Données brutes de la commande
 * @returns Données transformées
 */
const transformOrderData = (data: any): OrderWithRelations => {
  // Transformation des champs principaux
  const transformedOrder = {
    ...data,
    orderNumber: data.order_number,
    orderDate: data.order_date,
    saleType: data.sale_type,
    totalHt: data.total_ht,
    totalTva: data.total_tva,
    totalTtc: data.total_ttc,
    buyerCompanyId: data.buyer_company_id,
    sellerCompanyId: data.seller_company_id,
    contactId: data.contact_id,
    metadata: data.metadata || {}
  }

  // Transformation des items
  if (data.items) {
    transformedOrder.items = data.items.map((item: any) => ({
      ...item,
      orderId: item.order_id,
      vehicleId: item.vehicle_id,
      vehicleInternalId: item.vehicle_internal_id,
      totalHt: item.total_ht,
      totalTva: item.total_tva,
      totalTtc: item.total_ttc,
      commissions: item.commissions ? item.commissions.map((commission: any) => ({
        ...commission,
        orderItemId: commission.order_item_id,
        vehicleId: commission.vehicle_id,
        commissionTypeId: commission.commission_type_id,
        recipientType: commission.recipient_type,
        recipientId: commission.recipient_id,
        metadata: {
          ...commission.metadata,
          recipient_type: commission.recipient_type,
          recipient_id: commission.recipient_id,
          recipient_name: commission.metadata?.recipient_name
        }
      })) : []
    }))
  }

  return transformedOrder as OrderWithRelations
}

/**
 * Store spécialisé pour la récupération et l'affichage des détails d'une commande
 * 
 * Ce store est optimisé pour charger une commande avec toutes ses relations :
 * - Articles de commande (order_items)
 * - Véhicules associés (vehicles)
 * - Caractéristiques des véhicules (vehicle_features)
 * - Prix des véhicules (vehicle_prices)
 * - Commissions (vehicle_commissions)
 * - Contact acheteur (contact)
 * - Entreprise acheteuse (buyer_company)
 * - Entreprise vendeuse (seller_company)
 * 
 * Il est conçu pour être utilisé dans la page de visualisation d'une commande.
 */
export const useOrderDetailStore = defineStore('orderDetail', {
  state: () => ({
    order: null as OrderWithRelations | null,
    loading: false,
    error: null as string | null,
    commissions: [] as VehicleCommission[],
    buyerAddress: null as Address | null,
    sellerAddress: null as Address | null,
    buyerCountry: null as Country | null,
    sellerCountry: null as Country | null
  }),

  actions: {
    /**
     * Récupère une commande par son ID avec toutes ses relations
     * @param id ID de la commande à récupérer
     */
    async fetchOrderById(id: number) {
      this.loading = true
      this.error = null
      
      try {
        const supabase = useSupabaseClient()
        
        // 1. Récupérer la commande avec ses relations de base
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            contacts (*),
            buyerCompany: buyer_company_id (*),
            sellerCompany: seller_company_id (*)
          `)
          .eq('id', id)
          .single()

        if (orderError) throw orderError

        // 2. Récupérer l'adresse et le pays de l'acheteur
        if (orderData.buyerCompany) {
          const { data: buyerAddressData, error: buyerAddressError } = await supabase
            .from('addresses')
            .select('*')
            .eq('entity_type', 'company')
            .eq('entity_id', orderData.buyerCompany.id)
            .eq('is_primary', true)
            .single()
          
          if (!buyerAddressError && buyerAddressData) {
            this.buyerAddress = buyerAddressData
            
            const { data: buyerCountryData, error: buyerCountryError } = await supabase
              .from('countries')
              .select('*')
              .eq('id', buyerAddressData.country_id)
              .single()
            
            if (!buyerCountryError) {
              this.buyerCountry = buyerCountryData
            }
          }
        }

        // 3. Récupérer l'adresse et le pays du vendeur
        if (orderData.sellerCompany) {
          const { data: sellerAddressData, error: sellerAddressError } = await supabase
            .from('addresses')
            .select('*')
            .eq('entity_type', 'company')
            .eq('entity_id', orderData.sellerCompany.id)
            .eq('is_primary', true)
            .single()
          
          if (!sellerAddressError && sellerAddressData) {
            this.sellerAddress = sellerAddressData
            
            const { data: sellerCountryData, error: sellerCountryError } = await supabase
              .from('countries')
              .select('*')
              .eq('id', sellerAddressData.country_id)
              .single()
            
            if (!sellerCountryError) {
              this.sellerCountry = sellerCountryData
            }
          }
        }

        // 4. Récupérer les items avec leurs commissions
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            vehicle:vehicle_id (
              *,
              vehicle_features (*),
              vehicle_prices (*)
            ),
            commissions:vehicle_commissions (*)
          `)
          .eq('order_id', id)

        if (itemsError) throw itemsError

        // Récupérer les noms des entités pour les commissions
        if (itemsData) {
          const recipientPromises: Promise<void>[] = []

          for (const item of itemsData) {
            if (item.commissions && item.commissions.length > 0) {
              for (const commission of item.commissions) {
                if (commission.metadata?.recipient_type === 'company') {
                  recipientPromises.push(
                    (async () => {
                      const { data: companyData, error: companyError } = await supabase
                        .from('companies')
                        .select('name')
                        .eq('id', commission.metadata.recipient_id)
                        .single()

                      if (!companyError && companyData) {
                        commission.metadata.recipient_name = companyData.name
                      }
                    })()
                  )
                } else if (commission.metadata?.recipient_type === 'contact') {
                  recipientPromises.push(
                    (async () => {
                      const { data: contactData, error: contactError } = await supabase
                        .from('contacts')
                        .select('first_name, last_name')
                        .eq('id', commission.metadata.recipient_id)
                        .single()

                      if (!contactError && contactData) {
                        commission.metadata.recipient_name = `${contactData.first_name} ${contactData.last_name}`
                      }
                    })()
                  )
                }
              }
            }
          }

          // Attendre que toutes les requêtes soient terminées
          await Promise.all(recipientPromises)
        }

        // 5. Construire l'objet commande complet et transformer les données
        const completeOrder = {
          ...orderData,
          items: itemsData || []
        }

        this.order = transformOrderData(completeOrder)
        
        console.log('Commande chargée avec succès:', this.order)
        return this.order
      } catch (error) {
        console.error('Erreur lors du chargement de la commande:', error)
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
      this.buyerAddress = null
      this.sellerAddress = null
      this.buyerCountry = null
      this.sellerCountry = null
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
     * Récupère l'adresse formatée de l'acheteur
     */
    formattedBuyerAddress(): string {
      if (!this.buyerAddress) return ''
      
      const parts = [
        this.buyerAddress.street_number,
        this.buyerAddress.street_name,
        this.buyerAddress.postal_code,
        this.buyerAddress.city
      ].filter(Boolean)
      
      return parts.join(' ')
    },
    
    /**
     * Récupère l'adresse formatée du vendeur
     */
    formattedSellerAddress(): string {
      if (!this.sellerAddress) return ''
      
      const parts = [
        this.sellerAddress.street_number,
        this.sellerAddress.street_name,
        this.sellerAddress.postal_code,
        this.sellerAddress.city
      ].filter(Boolean)
      
      return parts.join(' ')
    }
  }
}) 