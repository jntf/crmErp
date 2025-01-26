import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

interface Company {
    id: number
    name: string
    [key: string]: any
}

interface CompanyContact {
    company: Company
}

interface BaseContact {
    id: number
    first_name: string
    last_name: string
    email: string
    phone: string
    mobile_phone: string
    job_title: string
    department: string
    status: string
    [key: string]: any
}

interface Contact extends BaseContact {
    companies?: CompanyContact[]
}

interface ContactWithCompanies extends BaseContact {
    companies: Company[]
}

export interface AddressData {
    street_number?: string
    street_name: string
    address_line2?: string
    postal_code?: string
    city: string
    state?: string
    country_id: number
    is_primary?: boolean
    address_type: 'billing' | 'shipping' | 'main'
}

export interface CreateContactData {
    first_name: string
    last_name: string
    email?: string
    phone?: string
    mobile_phone?: string
    job_title?: string
    department?: string
    status?: string
    company_id?: number
    address?: AddressData
}

export const useContacts = () => {
    const supabase = useSupabaseClient()
    const contactsData = ref<ContactWithCompanies[]>([])
    const loading = ref(false)
    const selectedContacts = ref<ContactWithCompanies[]>([])

    const fetchContacts = async () => {
        try {
            loading.value = true
            const { data, error } = await supabase
                .from('contacts')
                .select(`
                    *,
                    companies:company_contacts(
                        company:companies(*)
                    )
                `)
                .order('last_name', { ascending: true })

            if (error) throw error

            // Transformer les données pour inclure les entreprises dans un format plus simple
            contactsData.value = (data || []).map((contact: Contact) => ({
                ...contact,
                companies: contact.companies?.map(c => c.company) || []
            }))
        } catch (error) {
            console.error('Error fetching contacts:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    const createContact = async (contactData: CreateContactData) => {
        try {
            loading.value = true
            
            // Créer le contact
            const { data: contact, error: contactError } = await supabase
                .from('contacts')
                .insert({
                    first_name: contactData.first_name,
                    last_name: contactData.last_name,
                    email: contactData.email,
                    phone: contactData.phone,
                    mobile_phone: contactData.mobile_phone,
                    job_title: contactData.job_title,
                    department: contactData.department,
                    status: contactData.status || 'active'
                })
                .select()
                .single()

            if (contactError) throw contactError

            // Si une entreprise est spécifiée, créer la relation
            if (contactData.company_id && contact) {
                const { error: relationError } = await supabase
                    .from('company_contacts')
                    .insert({
                        company_id: contactData.company_id,
                        contact_id: contact.id
                    })

                if (relationError) throw relationError
            }

            // Si une adresse est spécifiée, la créer
            if (contactData.address && contact) {
                const { error: addressError } = await supabase
                    .from('addresses')
                    .insert({
                        entity_type: 'contact',
                        entity_id: contact.id,
                        street_number: contactData.address.street_number,
                        street_name: contactData.address.street_name,
                        address_line2: contactData.address.address_line2,
                        postal_code: contactData.address.postal_code,
                        city: contactData.address.city,
                        state: contactData.address.state,
                        country_id: contactData.address.country_id,
                        is_primary: contactData.address.is_primary ?? true,
                        address_type: contactData.address.address_type || 'main'
                    })

                if (addressError) throw addressError
            }

            return contact
        } catch (error) {
            console.error('Error creating contact:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    const deleteContacts = async (contactIds: string[]) => {
        try {
            loading.value = true
            const { error } = await supabase
                .from('contacts')
                .delete()
                .in('id', contactIds)

            if (error) throw error

            // Réinitialiser la sélection après la suppression
            selectedContacts.value = []
        } catch (error) {
            console.error('Error deleting contacts:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    const handleSelection = (rows: ContactWithCompanies[]) => {
        selectedContacts.value = rows
    }

    // Fonction pour récupérer la liste des entreprises (pour le select)
    const fetchCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('id, name')
                .order('name')

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error fetching companies:', error)
            throw error
        }
    }

    // Fonction pour récupérer la liste des pays (pour le select)
    const fetchCountries = async () => {
        try {
            const { data, error } = await supabase
                .from('countries')
                .select('id, name')
                .order('name')

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error fetching countries:', error)
            throw error
        }
    }

    return {
        contactsData,
        loading,
        selectedContacts,
        fetchContacts,
        createContact,
        deleteContacts,
        handleSelection,
        fetchCompanies,
        fetchCountries
    }
} 