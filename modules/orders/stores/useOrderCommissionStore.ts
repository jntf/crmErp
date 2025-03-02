import { defineStore } from 'pinia'
import { ref, computed } from '#imports'

/**
 * Store pour la gestion des commissions de commandes
 * 
 * Ce store gère les opérations liées aux commissions, notamment :
 * - Récupération des commissions depuis la base de données
 * - Filtrage des commissions par statut
 * - Recherche de commissions
 * - Mise à jour des statuts de facturation
 * 
 * Il utilise la fonction Supabase `get_commissions()` pour récupérer les données
 * et fournit des méthodes pour manipuler ces données côté client.
 */

interface CommissionResult {
  commission_id: number
  commission_amount: number
  commission_rate: number | null
  commission_created_at: string
  invoice_id: number
  invoice_status: string
  invoice_external_id: string | null
  recipient_id: number
  recipient_type: string
  recipient_name: string | null
  vehicle_id: string
  vehicle_internal_id: string
  vehicle_vin: string | null
  vehicle_registration_number: string | null
  vehicle_brand: string
  vehicle_model: string
  order_number: string
}

/**
 * Interface représentant une commission avec ses relations
 */
interface Commission {
  commission_id: number
  commission_amount: number
  commission_rate: number | null
  commission_created_at: string
  invoice_id: number
  invoice_status: 'pending' | 'paid' | 'cancelled'
  invoice_external_id: string | null
  recipient_id: number
  recipient_type: 'company' | 'contact' | 'owner'
  recipient_name: string | null
  vehicle_id: string
  vehicle_internal_id: string
  vehicle_vin: string | null
  vehicle_registration_number: string | null
  vehicle_brand: string
  vehicle_model: string
  order_number: string
}

// Renommé pour éviter les conflits avec le store racine
export const useOrderCommissionStore = defineStore('orderCommission', () => {
  const commissions = ref<Commission[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getter filtré par statut
  const getCommissionsByStatus = (status: string) => {
    if (status === 'all') return commissions.value
    return commissions.value.filter(c => c.invoice_status === status)
  }

  // Getters pour les compteurs
  const totalCommissions = computed(() => commissions.value.length)
  const pendingCommissions = computed(() => 
    commissions.value.filter(c => c.invoice_status === 'pending').length
  )
  const paidCommissions = computed(() => 
    commissions.value.filter(c => c.invoice_status === 'paid').length
  )
  const cancelledCommissions = computed(() => 
    commissions.value.filter(c => c.invoice_status === 'cancelled').length
  )

  // Actions
  const fetchCommissions = async () => {
    isLoading.value = true
    error.value = null
    try {
      const supabase = useSupabaseClient()
      const { data, error: err } = await supabase
        .rpc('get_commissions')

      if (err) {
        console.error('Erreur détaillée:', err)
        throw err
      }

      

      // Transformer les données pour correspondre à l'interface Commission
      const transformedData: Commission[] = (data as CommissionResult[]).map(item => ({
        commission_id: item.commission_id,
        commission_amount: item.commission_amount,
        commission_rate: item.commission_rate,
        commission_created_at: item.commission_created_at,
        invoice_id: item.invoice_id,
        invoice_status: item.invoice_status as 'pending' | 'paid' | 'cancelled',
        invoice_external_id: item.invoice_external_id,
        recipient_id: item.recipient_id,
        recipient_type: item.recipient_type as 'company' | 'contact' | 'owner',
        recipient_name: item.recipient_name,
        vehicle_id: item.vehicle_id,
        vehicle_internal_id: item.vehicle_internal_id,
        vehicle_vin: item.vehicle_vin,
        vehicle_registration_number: item.vehicle_registration_number,
        vehicle_brand: item.vehicle_brand,
        vehicle_model: item.vehicle_model,
        order_number: item.order_number
      }))
      
      commissions.value = transformedData
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