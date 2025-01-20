// useCompanies.ts
import { ref, computed } from 'vue'
import type { Company } from '../types'

export const useCompanies = () => {
    const supabase = useSupabaseClient()
    const companies = ref<Company[]>([])
    const loading = ref(true)
    const error = ref<string | null>(null)
    const selectedCompanies = ref<Company[]>([])

    // Fetch companies using the stored function
    async function fetchCompanies() {
        try {
            loading.value = true
            const { data, error: fetchError } = await supabase
                .rpc('get_companies')

            if (fetchError) throw fetchError
            companies.value = data || []
        } catch (err) {
            console.error('Erreur lors du chargement des entreprises:', err)
            error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des entreprises'
        } finally {
            loading.value = false
        }
    }

    // Create company using the stored function
    async function createCompany(data: Omit<Company, 'id' | 'created_at' | 'updated_at'>) {
        try {
            const { data: result, error: createError } = await supabase
                .rpc('create_company_with_address', {
                    company_data: data
                } as any)

            if (createError) throw createError
            if (!result.success) {
                throw {
                    code: result.code,
                    message: result.message
                }
            }

            await fetchCompanies()
            return { success: true, company: result }
        } catch (err: any) {
            console.error('Erreur lors de la création:', err)

            // Si c'est une erreur de doublon, on renvoie un message personnalisé
            if (err.code === 'DUPLICATE_COMPANY') {
                throw {
                    code: 'DUPLICATE_COMPANY',
                    message: err.message || 'Cette entreprise existe déjà dans la base de données'
                }
            }

            throw {
                code: 'CREATE_ERROR',
                message: 'Une erreur est survenue lors de la création de l\'entreprise'
        }
        }
    }

    // Update company using the stored function
    async function updateCompany(id: string, data: Partial<Company>) {
        try {
            const { data: result, error: updateError } = await supabase
                .rpc('update_company_with_address', {
                    company_id: id,
                    company_data: data
                } as any)

            if (updateError) throw updateError
            if (!result.success) throw new Error(result.error)

            await fetchCompanies()
            return { success: true, company: result }
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err)
            throw err
        }
    }

    // Delete companies (garder la méthode existante car elle fonctionne bien)
    async function deleteCompanies(companyIds: string[]) {
        try {
            const { data, error } = await supabase
                .rpc('delete_companies', {
                    company_ids: companyIds
                } as any)
    
            if (error) throw error
            
            if (!data.success) {
                throw new Error(data.message || 'Erreur lors de la suppression')
            }
    
            // Réinitialiser la sélection et rafraîchir les données
            selectedCompanies.value = []
            await fetchCompanies()
    
            return data
        } catch (err) {
            console.error('Erreur lors de la suppression:', err)
            throw err
        }
    }

    // Handle selection
    function handleSelection(selected: Company[]) {
        selectedCompanies.value = selected
    }

    // Données transformées pour la table
    const companiesData = computed(() => {
        return companies.value.map(company => ({
            ...company,
            status: `<div class="inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }">${company.status}</div>`,
            actions: `
                <div class="flex justify-center gap-2">
                    <span class="edit-button cursor-pointer text-blue-600 hover:text-blue-800">✎</span>
                    <span class="delete-button cursor-pointer text-red-600 hover:text-red-800">🗑</span>
                </div>
            `
        }))
    })

    return {
        companies: computed(() => companies.value),
        companiesData,
        loading: computed(() => loading.value),
        error: computed(() => error.value),
        selectedCompanies: computed(() => selectedCompanies.value),

        fetchCompanies,
        deleteCompanies,
        updateCompany,
        createCompany,
        handleSelection
    }
}