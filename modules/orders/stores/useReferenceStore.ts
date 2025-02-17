import { defineStore } from 'pinia'
import type { Contact, Company, Vehicle } from '../types'
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
        const { data, error } = await useSupabaseClient()
          .from('contacts')
          .select('id, last_name, first_name')
          .order('last_name')

        if (error) throw error
        this.contacts = data.map(contact => ({
          id: contact.id,
          name: `${contact.first_name} ${contact.last_name}`.trim(),
          first_name: contact.first_name,
          last_name: contact.last_name
        })) as Contact[]
      } catch (error) {
        this.error = (error as PostgrestError).message
      } finally {
        this.loading = false
      }
    },

    async fetchCompanies() {
      this.loading = true
      try {
        const { data, error } = await useSupabaseClient()
          .from('companies')
          .select('id, name')
          .order('name')

        if (error) throw error
        this.companies = data as Company[]
      } catch (error) {
        this.error = (error as PostgrestError).message
      } finally {
        this.loading = false
      }
    },

    async fetchVehicles() {
      this.loading = true
      try {
        const { data, error } = await useSupabaseClient()
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
            mileage,
            year,
            vehicle_prices (
              purchase_price_ht,
              selling_price_ht,
              frevo
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
          mileage: vehicle.mileage,
          year: vehicle.year,
          vehicle_prices: {
            purchase_price_ht: vehicle.vehicle_prices?.purchase_price_ht,
            selling_price_ht: vehicle.vehicle_prices?.selling_price_ht,
            frevo: vehicle.vehicle_prices?.frevo
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