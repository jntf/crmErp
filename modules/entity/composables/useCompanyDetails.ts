// composables/useCompanyDetails.ts
import { ref, computed } from 'vue'
import type { Company, Address, Contact, Tag } from '../types'

export interface CompanyDetails {
  company: Company
  addresses: Address[]
  contacts: Contact[]
  tags: Tag[]
}

export function useCompanyDetails() {
  const supabase = useSupabaseClient()
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const data = ref<CompanyDetails | null>(null)

  async function fetchCompanyDetails(companyId: string): Promise<void> {
    try {
      loading.value = true
      error.value = null

      const { data: responseData, error: rpcError } = await supabase
        .rpc('get_company_details', {
          p_input: { company_id: companyId }
        } as any)

      if (rpcError) throw rpcError

      if (!responseData) {
        throw new Error('Aucune donnée reçue')
      }

      // Mise à jour réactive des données
      data.value = responseData
      console.log('Data updated:', data.value)

    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err)
      error.value = err instanceof Error ? err : new Error('Erreur inconnue')
    } finally {
      loading.value = false
    }
  }

  async function updateCompanyDetails(companyId: string, details: Partial<CompanyDetails>) {
    console.log('Update company details:', { companyId, details })
    // À implémenter plus tard
    return
  }

  return {
    data,  // Expose directly the ref for reactivity
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    fetchCompanyDetails,
    updateCompanyDetails
  }
}