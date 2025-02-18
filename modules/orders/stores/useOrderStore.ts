import { defineStore } from 'pinia'
import type { Order, OrderItem, VehicleCommission, SaleType, OrderStatus } from '../types'
import type { PostgrestError } from '@supabase/supabase-js'

interface CreateOrderResponse {
  success: boolean
  orderId?: number
  orderNumber?: string
  message?: string
  error?: string
}

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
            items: (order.items || []).map(item => ({
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
        const { data, error } = await useSupabaseClient()
          .from('vehicle_commissions')
          .insert([commission])
          .select()
          .single()

        if (error) throw error
        this.commissions.push(data as VehicleCommission)
        return data as VehicleCommission
      } catch (error) {
        this.error = (error as PostgrestError).message
        return null
      } finally {
        this.loading = false
      }
    },

    async createOrderWithFunction(orderData: Record<string, any>): Promise<CreateOrderResponse | null> {
      this.loading = true
      try {
        console.log('Appel de la fonction stockée create_order avec les données:', orderData)
        const { data, error } = await useSupabaseClient()
          .rpc('create_order', { p_data: orderData })

        console.log('Réponse de Supabase:', { data, error })

        if (error) {
          console.error('Erreur Supabase:', error)
          throw error
        }

        if (data.success) {
          console.log('Création réussie, rafraîchissement de la liste')
          await this.fetchOrders()
          return data as CreateOrderResponse
        } else {
          console.error('Échec de la création côté base de données:', data.error)
          throw new Error(data.error || 'Erreur inconnue')
        }
      } catch (error) {
        console.error('Erreur dans createOrderWithFunction:', error)
        this.error = (error as Error).message
        return null
      } finally {
        this.loading = false
      }
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