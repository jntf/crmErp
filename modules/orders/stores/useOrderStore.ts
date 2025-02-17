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
      this.loading = true
      try {
        const { data, error } = await useSupabaseClient()
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        this.orders = data as Order[]
      } catch (error) {
        this.error = (error as PostgrestError).message
      } finally {
        this.loading = false
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
    
    getOrdersByType: (state) => (type: SaleType) => {
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