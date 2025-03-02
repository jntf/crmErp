import { defineStore } from 'pinia'
import type { Contact, Company, Vehicle, CountryInfo } from '../types'
import type { PostgrestError } from '@supabase/supabase-js'

interface VehicleRow {
  id: string
  name: string
  internal_id: string
}

export const useReferenceStore = defineStore('orderReferences', {
  state: () => ({
    contacts: [] as Contact[],
    companies: [] as Company[],
    vehicles: [] as Vehicle[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchContacts() {
      this.loading = true
      try {
        const supabase = useSupabaseClient()
        
        // 1. Récupérer les contacts avec leurs informations de base
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select(`
            id, 
            last_name, 
            first_name
          `)
          .order('last_name')

        if (contactsError) throw contactsError
        
        // 2. Récupérer les pays pour chaque contact via leurs adresses
        const contactsWithCountry: Contact[] = [];
        
        for (const contact of contactsData) {
          // Récupérer l'adresse principale du contact
          const { data: addressData, error: addressError } = await supabase
            .from('addresses')
            .select(`
              country_id,
              countries:country_id(
                id, 
                iso_code_2, 
                name, 
                tva_rate, 
                is_eu_member
              )
            `)
            .eq('entity_type', 'contact')
            .eq('entity_id', contact.id)
            .eq('is_primary', true)
            .single()
            
          if (addressError && addressError.code !== 'PGRST116') {
            console.error(`Error fetching address for contact ${contact.id}:`, addressError)
          }
          
          // Extraire les informations du pays si disponibles
          let country: CountryInfo | null = null;
          if (addressData?.countries) {
            const countryData = addressData.countries as any;
            country = {
              id: countryData.id,
              iso_code_2: countryData.iso_code_2,
              name: countryData.name,
              tva_rate: countryData.tva_rate,
              is_eu_member: countryData.is_eu_member
            };
          }
          
          // Ajouter le contact avec ses informations de pays
          contactsWithCountry.push({
            id: contact.id,
            name: `${contact.first_name} ${contact.last_name}`.trim(),
            first_name: contact.first_name,
            last_name: contact.last_name,
            country
          });
        }
        
        this.contacts = contactsWithCountry;
        console.log('Contacts fetched:', this.contacts)
        
      } catch (error) {
        console.error('Error fetching contacts:', error)
        this.error = (error as PostgrestError).message
      } finally {
        this.loading = false
      }
    },

    async fetchCompanies() {
      this.loading = true
      try {
        const supabase = useSupabaseClient()
        
        // 1. Récupérer les entreprises avec leurs informations de base
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select(`
            id, 
            name,
            vat_number
          `)
          .order('name')

        if (companiesError) throw companiesError
        
        // 2. Récupérer les pays pour chaque entreprise via leurs adresses
        const companiesWithCountry: Company[] = [];
        
        for (const company of companiesData) {
          // Récupérer l'adresse principale de l'entreprise
          const { data: addressData, error: addressError } = await supabase
            .from('addresses')
            .select(`
              country_id,
              countries:country_id(
                id, 
                iso_code_2, 
                name, 
                tva_rate, 
                is_eu_member
              )
            `)
            .eq('entity_type', 'company')
            .eq('entity_id', company.id)
            .eq('is_primary', true)
            .single()
            
          if (addressError && addressError.code !== 'PGRST116') {
            console.error(`Error fetching address for company ${company.id}:`, addressError)
          }
          
          // Extraire les informations du pays si disponibles
          let country: CountryInfo | null = null;
          if (addressData?.countries) {
            const countryData = addressData.countries as any;
            country = {
              id: countryData.id,
              iso_code_2: countryData.iso_code_2,
              name: countryData.name,
              tva_rate: countryData.tva_rate,
              is_eu_member: countryData.is_eu_member
            };
          }
          
          // Ajouter l'entreprise avec ses informations de pays
          companiesWithCountry.push({
            id: company.id,
            name: company.name,
            vat_number: company.vat_number,
            country
          });
        }
        
        this.companies = companiesWithCountry;
        console.log('Companies fetched:', this.companies)
      } catch (error) {
        console.error('Error fetching companies:', error)
        this.error = (error as PostgrestError).message
      } finally {
        this.loading = false
      }
    },

    async fetchVehicles() {
      this.loading = true
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('vehicles')
          .select(`
            id,
            internal_id,
            brand,
            model,
            version,
            color,
            vin,
            registration_number,
            registration_date,
            mileage,
            year,
            vehicle_prices (
              purchase_price_ht,
              selling_price_ht,
              frevo,
              vat_rate
            )
          `)
          .order('brand')

        if (error) {
          console.error('Error in fetchVehicles:', error)
          throw error
        }
        
        this.vehicles = (data as any[]).map(vehicle => ({
          id: vehicle.id,
          internal_id: vehicle.internal_id,
          brand: vehicle.brand,
          model: vehicle.model,
          version: vehicle.version,
          color: vehicle.color,
          vin: vehicle.vin,
          registration_number: vehicle.registration_number,
          registration_date: vehicle.registration_date,
          mileage: vehicle.mileage,
          year: vehicle.year,
          // Déterminer si c'est une commande usine basée sur d'autres critères
          // Par exemple, si registration_date est null, c'est probablement une commande usine
          stock_type: !vehicle.registration_date ? 'factory_order' : 'existing',
          vehicle_prices: {
            purchase_price_ht: vehicle.vehicle_prices?.purchase_price_ht,
            selling_price_ht: vehicle.vehicle_prices?.selling_price_ht,
            frevo: vehicle.vehicle_prices?.frevo,
            vat_rate: vehicle.vehicle_prices?.vat_rate
          }
        }))

      } catch (error) {
        console.error('Error in fetchVehicles:', error)
        this.error = (error as PostgrestError).message
      } finally {
        this.loading = false
      }
    },

    async fetchAllReferences() {
      await Promise.all([
        this.fetchContacts(),
        this.fetchCompanies(),
        this.fetchVehicles()
      ])
    }
  },

  getters: {
    getContactById: (state) => (id: number) => {
      return state.contacts.find(contact => contact.id === id)
    },

    getCompanyById: (state) => (id: number) => {
      return state.companies.find(company => company.id === id)
    },

    getVehicleById: (state) => (id: string) => {
      return state.vehicles.find(vehicle => vehicle.id === id)
    }
  }
}) 