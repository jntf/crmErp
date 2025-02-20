import { defineStore } from 'pinia'
import { ref, computed } from '#imports'

interface Commission {
  id: number
  order_item_id: number
  commission_type_id: number
  amount: number
  rate: number | null
  metadata: {
    recipientId: number
    recipientType: 'company' | 'contact' | 'owner'
  }
  order_item?: {
    id: number
    order: {
      id: number
      order_number: string
    }
  }
  invoice?: {
    id: number
    status: 'pending' | 'paid' | 'cancelled'
    external_invoice_id: string | null
    recipient?: {
      id: number
      name: string
    }
  }[]
}

export const useCommissionStore = defineStore('commission', () => {
  const commissions = ref<Commission[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters pour les compteurs
  const totalCommissions = computed(() => commissions.value.length)
  const pendingCommissions = computed(() => 
    commissions.value.filter(c => c.invoice?.[0]?.status === 'pending').length
  )
  const paidCommissions = computed(() => 
    commissions.value.filter(c => c.invoice?.[0]?.status === 'paid').length
  )
  const cancelledCommissions = computed(() => 
    commissions.value.filter(c => c.invoice?.[0]?.status === 'cancelled').length
  )

  // Getter filtré par statut
  const getCommissionsByStatus = computed(() => (status: string) => {
    if (status === 'all') return commissions.value
    return commissions.value.filter(c => c.invoice?.[0]?.status === status)
  })

  // Actions
  const fetchCommissions = async () => {
    isLoading.value = true
    error.value = null
    try {
      const supabase = useSupabaseClient()
      const { data, error: err } = await supabase
        .from('vehicle_commissions')
        .select(`
          *,
          order_item:order_items (
            id,
            order:orders (
              id,
              order_number
            )
          ),
          invoice:commission_invoices (
            id,
            status,
            external_invoice_id,
            recipient:companies (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (err) {
        console.error('Erreur détaillée:', err)
        throw err
      }
      
      console.log('commissions récupérées:', data)
      commissions.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Une erreur est survenue'
      console.error('Erreur lors du chargement des commissions:', err)
    } finally {
      isLoading.value = false
    }
  }

  const updateInvoiceStatus = async (invoiceId: number, status: string) => {
    if (!invoiceId) {
      error.value = 'ID de facture invalide'
      return
    }

    try {
      const supabase = useSupabaseClient()
      const { error: err } = await supabase
        .from('commission_invoices')
        .update({ status })
        .eq('id', invoiceId)

      if (err) throw err
      await fetchCommissions()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Une erreur est survenue'
      console.error('Erreur lors de la mise à jour du statut:', err)
    }
  }

  return {
    commissions,
    isLoading,
    error,
    totalCommissions,
    pendingCommissions,
    paidCommissions,
    cancelledCommissions,
    getCommissionsByStatus,
    fetchCommissions,
    updateInvoiceStatus
  }
}) 