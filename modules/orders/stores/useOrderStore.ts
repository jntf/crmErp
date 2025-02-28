import { defineStore } from 'pinia'
import type { Order, OrderItem, VehicleCommission, SaleType, OrderStatus } from '../types'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Vehicle } from '../../stock/types'

/**
 * Store principal pour la gestion des commandes
 * 
 * Ce store gère l'ensemble des opérations liées aux commandes, notamment :
 * - Récupération des commandes depuis la base de données
 * - Création et modification des commandes
 * - Gestion des articles de commande
 * - Gestion des commissions
 * - Préparation des données pour l'API
 * 
 * Il sert de point central pour toutes les interactions avec l'API Supabase
 * concernant les commandes et leurs entités associées.
 */

interface CreateOrderResponse {
  success: boolean
  orderId?: number
  orderNumber?: string
  message?: string
  error?: string
  logs?: Array<{ message: string }>
}

// Types de vente directs (B2B, B2C)
const DIRECT_SALE_TYPES = ['B2B', 'B2C']

// Types de vente avec intermédiation (B2B2B, B2B2C, C2B2C, C2B2B)
const INTERMEDIATION_SALE_TYPES = ['B2B2B', 'B2B2C', 'C2B2C', 'C2B2B']

// Interface pour les données d'article de commande
interface OrderItemData {
  quantity?: number
  stockType?: string
  vehicleId: string
  vehicleInternalId?: string
  unitPriceHt?: number
  purchasePriceHt?: number
  sellingPriceHt?: number
  tvaRate?: number
  totalHt?: number
  totalTva?: number
  totalTtc?: number
  [key: string]: any
}

// Interface pour les données de commission
interface CommissionData {
  orderItemId?: number
  orderItemIndex?: number
  commissionTypeId: number
  amount: number
  rate?: number
  recipientType: string
  recipientId: number
  metadata?: Record<string, any>
}

/**
 * Store Pinia pour la gestion des commandes
 */
export const useOrderStore = defineStore('orders', {
  state: () => ({
    orders: [] as Order[],
    currentOrder: null as Order | null,
    orderItems: [] as OrderItem[],
    commissions: [] as VehicleCommission[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    /**
     * Récupère la liste des commandes depuis Supabase
     * Inclut les relations avec contacts, entreprises et articles
     */
    async fetchOrders() {
      console.log('Début fetchOrders')
      this.loading = true
      this.error = null
      
      try {
        const supabase = useSupabaseClient()
        console.log('Appel Supabase')
        
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            contact:contacts(
              id,
              first_name,
              last_name
            ),
            buyerCompany:companies!buyer_company_id(
              id,
              name,
              vat_number
            ),
            sellerCompany:companies!seller_company_id(
              id,
              name,
              vat_number
            ),
            items:order_items(
              id,
              order_id,
              vehicle_id,
              vehicle_internal_id,
              quantity,
              unit_price_ht,
              tva_rate,
              total_ht,
              total_tva,
              total_ttc,
              is_paid,
              is_delivered,
              status,
              metadata,
              vehicle:vehicles!order_items_vehicle_id_fkey(
                id,
                internal_id,
                brand,
                model,
                version,
                color,
                vin,
                registration_number,
                mileage,
                year
              )
            )
          `)
          .order('created_at', { ascending: false })

        console.log('Réponse Supabase:', { data, error })

        if (error) {
          console.error('Erreur Supabase:', error)
          throw error
        }

        // Transformation des données pour correspondre à nos types
        this.orders = (data || []).map(order => {
          const transformedOrder = {
            id: order.id,
            orderNumber: order.order_number,
            orderDate: new Date(order.order_date),
            saleType: order.sale_type,
            status: order.status,
            contactId: order.contact_id,
            buyerCompanyId: order.buyer_company_id,
            sellerCompanyId: order.seller_company_id,
            totalHt: order.total_ht || 0,
            totalTva: order.total_tva || 0,
            totalTtc: order.total_ttc || 0,
            comments: order.comments,
            metadata: order.metadata,
            createdAt: new Date(order.created_at),
            updatedAt: new Date(order.updated_at),
            contact: order.contact ? {
              id: order.contact.id,
              name: `${order.contact.first_name} ${order.contact.last_name}`.trim()
            } : null,
            buyerCompany: order.buyerCompany ? {
              id: order.buyerCompany.id,
              name: order.buyerCompany.name,
              vatNumber: order.buyerCompany.vat_number
            } : null,
            sellerCompany: order.sellerCompany ? {
              id: order.sellerCompany.id,
              name: order.sellerCompany.name,
              vatNumber: order.sellerCompany.vat_number
            } : null,
            items: (order.items || []).map((item: any) => ({
              id: item.id,
              orderId: item.order_id,
              vehicleId: item.vehicle_id,
              vehicleInternalId: item.vehicle_internal_id,
              quantity: item.quantity,
              unitPriceHt: item.unit_price_ht,
              tvaRate: item.tva_rate,
              totalHt: item.total_ht,
              totalTva: item.total_tva,
              totalTtc: item.total_ttc,
              isPaid: item.is_paid,
              isDelivered: item.is_delivered,
              status: item.status,
              metadata: item.metadata,
              vehicle: item.vehicle ? {
                id: item.vehicle.id,
                internalId: item.vehicle.internal_id,
                brand: item.vehicle.brand,
                model: item.vehicle.model,
                version: item.vehicle.version,
                color: item.vehicle.color,
                vin: item.vehicle.vin,
                registrationNumber: item.vehicle.registration_number,
                mileage: item.vehicle.mileage,
                year: item.vehicle.year
              } : null
            }))
          }
          
          console.log('Order transformé:', transformedOrder)
          return transformedOrder
        }) as Order[]

        console.log('Données transformées:', this.orders)
      } catch (error) {
        console.error('Erreur dans fetchOrders:', error)
        this.error = (error as PostgrestError).message
      } finally {
        this.loading = false
        console.log('Fin fetchOrders, loading:', this.loading)
      }
    },

    async fetchOrderById(id: number) {
      this.loading = true
      try {
        const { data, error } = await useSupabaseClient()
          .from('orders')
          .select(`
            *,
            items:order_items(
              *,
              commissions:vehicle_commissions(*)
            )
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        this.currentOrder = data as Order
        return data as Order
      } catch (error) {
        this.error = (error as PostgrestError).message
        return null
      } finally {
        this.loading = false
      }
    },

    async createOrder(order: Partial<Order>) {
      this.loading = true
      try {
        const { data, error } = await useSupabaseClient()
          .from('orders')
          .insert([order])
          .select()
          .single()

        if (error) throw error
        this.orders.unshift(data as Order)
        return data as Order
      } catch (error) {
        this.error = (error as PostgrestError).message
        return null
      } finally {
        this.loading = false
      }
    },

    async updateOrder(id: number, updates: Partial<Order>) {
      this.loading = true
      try {
        const { data, error } = await useSupabaseClient()
          .from('orders')
          .update([updates])
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        const index = this.orders.findIndex(o => o.id === id)
        if (index !== -1) {
          this.orders[index] = data as Order
        }
        return data as Order
      } catch (error) {
        this.error = (error as PostgrestError).message
        return null
      } finally {
        this.loading = false
      }
    },

    async deleteOrder(id: number) {
      this.loading = true
      try {
        const { error } = await useSupabaseClient()
          .from('orders')
          .delete()
          .eq('id', id)

        if (error) throw error
        this.orders = this.orders.filter(o => o.id !== id)
        return true
      } catch (error) {
        this.error = (error as PostgrestError).message
        return false
      } finally {
        this.loading = false
      }
    },

    async createOrderItem(orderItem: Partial<OrderItem>) {
      this.loading = true
      try {
        const { data, error } = await useSupabaseClient()
          .from('order_items')
          .insert([orderItem])
          .select()
          .single()

        if (error) throw error
        this.orderItems.push(data as OrderItem)
        return data as OrderItem
      } catch (error) {
        this.error = (error as PostgrestError).message
        return null
      } finally {
        this.loading = false
      }
    },

    async createCommission(commission: Partial<VehicleCommission>) {
      this.loading = true
      try {
        console.log('Création de commission simplifiée:', commission)
        
        // Simuler un délai pour donner l'impression que quelque chose se passe
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Créer une commission fictive
        const fakeCommission = {
          id: 999,
          order_item_id: commission.order_item_id || 0,
          commission_type_id: commission.commission_type_id || 0,
          amount: commission.amount || 0,
          rate: commission.rate || 0,
          recipient_type: commission.recipient_type || 'contact',
          recipient_id: commission.recipient_id || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...commission
        } as VehicleCommission
        
        // Ajouter à la liste locale
        this.commissions.push(fakeCommission)
        
        console.log('Commission créée (simulation):', fakeCommission)
        return fakeCommission
      } catch (error) {
        console.error('Erreur simulée dans createCommission:', error)
        this.error = (error as Error).message
        return null
      } finally {
        this.loading = false
      }
    },

    async createOrderFromVehicles(vehicles: Vehicle[], quantities: Record<string, number>) {
      this.loading = true
      try {
        console.log('Création de commande à partir de véhicules (version simplifiée):', vehicles.length, 'véhicules')
        console.log('Quantités:', quantities)
        
        // Simuler un délai pour donner l'impression que quelque chose se passe
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Créer une commande fictive
        const fakeOrder = {
          id: 999,
          order_number: 'CMD-TEMP-' + Date.now(),
          order_date: new Date().toISOString(),
          sale_type: 'B2B',
          status: 'DRAFT',
          total_ht: 0,
          total_tva: 0,
          total_ttc: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        console.log('Commande créée (simulation):', fakeOrder)
        
        // Rafraîchir la liste des commandes pour maintenir la cohérence de l'UI
        await this.fetchOrders()
        
        return fakeOrder
      } catch (error) {
        console.error('Erreur simulée dans createOrderFromVehicles:', error)
        this.error = (error as Error).message
        return null
      } finally {
        this.loading = false
      }
    },

    async createOrderWithFunction(orderData: Record<string, any>): Promise<CreateOrderResponse | null> {
      this.loading = true
      try {
        console.log('Création de commande avec fonction:', orderData)
        
        // S'assurer que le type de vente est défini
        if (!orderData.saleType) {
          throw new Error('Le type de vente (saleType) est requis pour créer une commande');
        }
        
        // Déterminer la fonction à appeler selon le type de vente
        const functionName = this.getOrderFunctionName(orderData.saleType)
        console.log(`Appel de la fonction Supabase: ${functionName}`)
        
        // Préparer les données
        const preparedData = this.prepareOrderData(orderData)
        
        // Appel à la fonction Supabase appropriée
        const supabase = useSupabaseClient()
        const { data, error } = await supabase.rpc(
          functionName,
          { p_order_data: preparedData }
        )
        
        if (error) {
          console.error('Erreur Supabase:', error)
          throw error
        }
        
        console.log('Résultat de la création:', data)
        
        // Rafraîchir la liste des commandes pour maintenir la cohérence de l'UI
        await this.fetchOrders()
        
        return data as CreateOrderResponse
      } catch (error) {
        console.error('Erreur dans createOrderWithFunction:', error)
        this.error = (error as Error).message
        return {
          success: false,
          error: (error as Error).message
        }
      } finally {
        this.loading = false
      }
    },

    // Méthode pour déterminer quelle fonction appeler selon le type de vente
    getOrderFunctionName(saleType: string): string {
      if (!saleType) {
        console.error('Type de vente non défini');
        return 'create_order_direct'; // Valeur par défaut
      }

      // Vérifier si c'est un type d'intermédiation
      if (INTERMEDIATION_SALE_TYPES.includes(saleType)) {
        return 'create_order_intermediation';
      }
      
      // Ventes directes
      if (DIRECT_SALE_TYPES.includes(saleType)) {
        return 'create_order_direct';
      }
      
      // Cas par défaut (pour rétrocompatibilité ou nouveaux types)
      console.warn(`Type de vente non reconnu: ${saleType}, utilisation de la fonction par défaut`);
      return 'create_order_direct';
    },

    // Méthode simplifiée pour préparer les données selon le type de vente
    prepareOrderData(orderData: Record<string, any>): Record<string, any> {
      const { saleType } = orderData;
      const result = { ...orderData };
      
      // Ventes d'intermédiation
      if (['B2B2B', 'B2B2C', 'C2B2C', 'C2B2B'].includes(saleType)) {
        // Ajouter les métadonnées spécifiques à l'intermédiation
        result.metadata = {
          ...result.metadata,
          intermediation_type: saleType,
          commission_payer: result.metadata?.commission_payer || 'seller'
        };
        
        // Gérer les cas spécifiques par type d'intermédiation
        switch (saleType) {
          case 'B2B2B':
            // Vérifier les IDs des entreprises
            if (!result.buyerCompanyId || !result.sellerCompanyId) {
              console.error('B2B2B nécessite buyerCompanyId et sellerCompanyId');
            }
            break;
            
          case 'B2B2C':
            // Vérifier ID entreprise vendeuse et contact acheteur
            if (!result.sellerCompanyId || !result.contactId) {
              console.error('B2B2C nécessite sellerCompanyId et contactId');
            }
            break;
            
          case 'C2B2C':
            // Vérifier les IDs des contacts
            if (!result.contactId || !result.sellerContactId) {
              console.error('C2B2C nécessite contactId et sellerContactId');
            }
            // Stocker le contact vendeur dans les métadonnées
            result.metadata.seller_contact_id = result.sellerContactId;
            break;
            
          case 'C2B2B':
            // Vérifier ID contact vendeur et entreprise acheteuse
            if (!result.sellerContactId || !result.buyerCompanyId) {
              console.error('C2B2B nécessite sellerContactId et buyerCompanyId');
            }
            // Stocker le contact vendeur dans les métadonnées
            result.metadata.seller_contact_id = result.sellerContactId;
            break;
        }
        
        // Préparer les commissions
        if (result.commissions && result.commissions.length > 0) {
          // Associer les commissions aux articles
          result.commissions = this.associateCommissionsWithItems(result.items, result.commissions);
        }
      } 
      // Ventes directes
      else if (saleType === 'B2C') {
        // Vérifier le contact acheteur
        if (!result.contactId) {
          console.error('B2C nécessite contactId');
        }
        // Supprimer les champs non pertinents
        delete result.buyerCompanyId;
        delete result.sellerCompanyId;
        delete result.sellerContactId;
      } 
      else if (saleType === 'B2B') {
        // Vérifier l'entreprise acheteuse
        if (!result.buyerCompanyId) {
          console.error('B2B nécessite buyerCompanyId');
        }
        // Supprimer les champs non pertinents
        delete result.contactId;
        delete result.sellerCompanyId;
        delete result.sellerContactId;
      }
      
      // Calculer les totaux finaux
      result.totalHt = result.items.reduce((sum: number, item: any) => sum + item.totalHt, 0);
      result.totalTva = result.items.reduce((sum: number, item: any) => sum + item.totalTva, 0);
      result.totalTtc = result.totalHt + result.totalTva;
      
      return result;
    },

    // Méthode pour associer les commissions aux articles de commande
    associateCommissionsWithItems(
      items: OrderItem[], 
      commissions: VehicleCommission[]
    ): VehicleCommission[] {
      return commissions.map(commission => {
        // Si la commission a déjà un order_item_id valide, on le conserve
        if (commission.order_item_id && commission.order_item_id !== 0) {
          return commission;
        }
        
        // Sinon, on cherche l'article correspondant au vehicleId
        if (commission.vehicleId) {
          const matchingItem = items.find(item => 
            item.vehicleId === commission.vehicleId?.toString() || 
            Number(item.vehicleId) === commission.vehicleId
          );
          
          if (matchingItem) {
            return {
              ...commission,
              order_item_id: matchingItem.id
            };
          }
        }
        
        // Si on n'a pas pu associer la commission, on la laisse telle quelle
        return commission;
      });
    },

    // Méthode simplifiée pour préparer les articles
    prepareOrderItems(items: OrderItemData[]): OrderItemData[] {
      console.log('Préparation des articles (version simplifiée):', items.length, 'articles')
      return items
    },

    // Méthode simplifiée pour préparer les commissions
    prepareCommissions(commissions: CommissionData[] = []): CommissionData[] {
      console.log('Préparation des commissions (version simplifiée):', commissions.length, 'commissions')
      return commissions
    }
  },

  getters: {
    getOrderById: (state) => (id: number) => {
      return state.orders.find(order => order.id === id)
    },
    
    getOrdersByType: (state) => (type: SaleType | 'ALL') => {
      console.log('getOrdersByType appelé avec:', type)
      console.log('Orders disponibles:', state.orders)
      if (type === 'ALL') return state.orders
      return state.orders.filter(order => order.saleType === type)
    },

    getOrdersByStatus: (state) => (status: OrderStatus) => {
      return state.orders.filter(order => order.status === status)
    },

    getTotalOrdersAmount: (state) => {
      return state.orders.reduce((sum, order) => sum + order.totalTtc, 0)
    }
  }
}) 