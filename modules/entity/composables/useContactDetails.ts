import { ref, computed } from 'vue'
import { useSupabaseClient } from '#imports'
import type { Database } from '@/types/supabase'

interface ContactDetails {
    contact: {
        id: number
        first_name: string
        last_name: string
        email: string
        phone: string
        mobile_phone: string
        job_title: string
        department: string
        linkedin_profile: string
        date_of_birth: string | null
        is_primary: boolean
        status: string
        notes: string
        language: string
        created_at: string
        updated_at: string
    }
    companies: Array<{
        id: number
        name: string
        role: string
        is_decision_maker: boolean
    }>
    addresses: Array<{
        id: number
        address_type: string
        street_number: string
        street_name: string
        address_line2: string | null
        postal_code: string
        city: string
        state: string | null
        country_id: number
        is_primary: boolean
        country: {
            id: number
            name: string
            iso_code_2: string
        }
    }>
    tags: Array<{
        id: string
        name: string
        color: string
        category: string
    }>
}

export function useContactDetails() {
    const supabase = useSupabaseClient<Database>()
    const data = ref<ContactDetails | null>(null)
    const loading = ref(false)
    const error = ref<Error | null>(null)

    const fetchContactDetails = async (contactId: number) => {
        loading.value = true
        error.value = null

        try {
            // Récupérer les informations du contact
            const { data: contactData, error: contactError } = await supabase
                .from('contacts')
                .select('*')
                .eq('id', contactId)
                .single()

            if (contactError) throw contactError

            // Récupérer les entreprises associées
            const { data: companiesData, error: companiesError } = await supabase
                .from('company_contacts')
                .select(`
                    company_id,
                    role,
                    is_decision_maker,
                    companies (
                        id,
                        name
                    )
                `)
                .eq('contact_id', contactId)

            if (companiesError) throw companiesError

            // Récupérer les adresses
            const { data: addressesData, error: addressesError } = await supabase
                .from('addresses')
                .select(`
                    *,
                    countries (
                        id,
                        name,
                        iso_code_2
                    )
                `)
                .eq('entity_type', 'contact')
                .eq('entity_id', contactId)

            if (addressesError) throw addressesError

            // Récupérer les tags
            const { data: tagsData, error: tagsError } = await supabase
                .from('contact_tags')
                .select(`
                    tags (
                        id,
                        name,
                        color,
                        category
                    )
                `)
                .eq('contact_id', contactId)

            if (tagsError) throw tagsError

            // Assembler les données
            data.value = {
                contact: contactData,
                companies: companiesData.map(cc => ({
                    id: cc.companies?.id || 0,
                    name: cc.companies?.name || '',
                    role: cc.role || '',
                    is_decision_maker: cc.is_decision_maker || false
                })),
                addresses: addressesData,
                tags: tagsData.map(t => t.tags).filter((t): t is NonNullable<typeof t> => t !== null)
            }
        } catch (e) {
            error.value = e as Error
            console.error('Error fetching contact details:', e)
        } finally {
            loading.value = false
        }
    }

    const updateContact = async (contactId: number, updates: Partial<ContactDetails['contact']>) => {
        try {
            const { data: updatedContact, error: updateError } = await supabase
                .from('contacts')
                .update(updates)
                .eq('id', contactId)
                .select()
                .single()

            if (updateError) throw updateError

            if (data.value) {
                data.value.contact = { ...data.value.contact, ...updatedContact }
            }

            return updatedContact
        } catch (e) {
            console.error('Error updating contact:', e)
            throw e
        }
    }

    const updateAddress = async (addressId: number, updates: Partial<ContactDetails['addresses'][0]>) => {
        try {
            const { data: updatedAddress, error: updateError } = await supabase
                .from('addresses')
                .update(updates)
                .eq('id', addressId)
                .select()
                .single()

            if (updateError) throw updateError

            if (data.value) {
                const addressIndex = data.value.addresses.findIndex(a => a.id === addressId)
                if (addressIndex !== -1) {
                    data.value.addresses[addressIndex] = { ...data.value.addresses[addressIndex], ...updatedAddress }
                }
            }

            return updatedAddress
        } catch (e) {
            console.error('Error updating address:', e)
            throw e
        }
    }

    const addCompanyToContact = async (contactId: number, companyId: number, role?: string, isDecisionMaker: boolean = false) => {
        try {
            const { data: newCompanyContact, error: insertError } = await supabase
                .from('company_contacts')
                .insert({
                    contact_id: contactId,
                    company_id: companyId,
                    role,
                    is_decision_maker: isDecisionMaker
                })
                .select(`
                    company_id,
                    role,
                    is_decision_maker,
                    companies (
                        id,
                        name
                    )
                `)
                .single()

            if (insertError) throw insertError

            if (data.value && newCompanyContact.companies) {
                data.value.companies.push({
                    id: newCompanyContact.companies.id,
                    name: newCompanyContact.companies.name,
                    role: newCompanyContact.role || '',
                    is_decision_maker: newCompanyContact.is_decision_maker
                })
            }

            return newCompanyContact
        } catch (e) {
            console.error('Error adding company to contact:', e)
            throw e
        }
    }

    const removeCompanyFromContact = async (contactId: number, companyId: number) => {
        try {
            const { error: deleteError } = await supabase
                .from('company_contacts')
                .delete()
                .eq('contact_id', contactId)
                .eq('company_id', companyId)

            if (deleteError) throw deleteError

            if (data.value) {
                data.value.companies = data.value.companies.filter(c => c.id !== companyId)
            }
        } catch (e) {
            console.error('Error removing company from contact:', e)
            throw e
        }
    }

    const addAddress = async (contactId: number, address: Omit<ContactDetails['addresses'][0], 'id' | 'country'>) => {
        try {
            const { data: newAddress, error: insertError } = await supabase
                .from('addresses')
                .insert({
                    ...address,
                    entity_type: 'contact',
                    entity_id: contactId
                })
                .select(`
                    *,
                    countries (
                        id,
                        name,
                        iso_code_2
                    )
                `)
                .single()

            if (insertError) throw insertError

            if (data.value) {
                data.value.addresses.push(newAddress)
            }

            return newAddress
        } catch (e) {
            console.error('Error adding address:', e)
            throw e
        }
    }

    const deleteAddress = async (addressId: number) => {
        try {
            const { error: deleteError } = await supabase
                .from('addresses')
                .delete()
                .eq('id', addressId)

            if (deleteError) throw deleteError

            if (data.value) {
                data.value.addresses = data.value.addresses.filter(a => a.id !== addressId)
            }
        } catch (e) {
            console.error('Error deleting address:', e)
            throw e
        }
    }

    const setAddressAsPrimary = async (contactId: number, addressId: number) => {
        try {
            // D'abord, mettre à false tous les is_primary pour ce contact
            const { error: updateError1 } = await supabase
                .from('addresses')
                .update({ is_primary: false })
                .eq('entity_type', 'contact')
                .eq('entity_id', contactId)

            if (updateError1) throw updateError1

            // Ensuite, mettre à true l'adresse sélectionnée
            const { data: updatedAddress, error: updateError2 } = await supabase
                .from('addresses')
                .update({ is_primary: true })
                .eq('id', addressId)
                .select()
                .single()

            if (updateError2) throw updateError2

            if (data.value) {
                data.value.addresses = data.value.addresses.map(a => ({
                    ...a,
                    is_primary: a.id === addressId
                }))
            }

            return updatedAddress
        } catch (e) {
            console.error('Error setting address as primary:', e)
            throw e
        }
    }

    const updateTags = async (contactId: number, tagIds: string[]) => {
        try {
            // Supprimer tous les tags existants
            const { error: deleteError } = await supabase
                .from('contact_tags')
                .delete()
                .eq('contact_id', contactId)

            if (deleteError) throw deleteError

            if (tagIds.length > 0) {
                // Ajouter les nouveaux tags
                const { data: newTags, error: insertError } = await supabase
                    .from('contact_tags')
                    .insert(
                        tagIds.map(tagId => ({
                            contact_id: contactId,
                            tag_id: tagId
                        }))
                    )
                    .select(`
                        tags (
                            id,
                            name,
                            color,
                            category
                        )
                    `)

                if (insertError) throw insertError

                if (data.value) {
                    data.value.tags = newTags
                        .map(t => t.tags)
                        .filter((t): t is NonNullable<typeof t> => t !== null)
                }
            } else {
                if (data.value) {
                    data.value.tags = []
                }
            }
        } catch (e) {
            console.error('Error updating tags:', e)
            throw e
        }
    }

    return {
        data,
        loading,
        error,
        fetchContactDetails,
        updateContact,
        updateAddress,
        addCompanyToContact,
        removeCompanyFromContact,
        addAddress,
        deleteAddress,
        setAddressAsPrimary,
        updateTags
    }
} 