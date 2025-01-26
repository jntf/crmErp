import { defineStore } from 'pinia'
import type { Vehicle, VehicleFilters } from '../types'

interface VehicleWithDetails extends Vehicle {
  details: {
    price_details: {
      purchase_price_ht: number
      selling_price_ht: number
      vat_rate: number
      repair_cost: number
      frevo: number
    }
    status_details: {
      status: string
      location: string
      is_online: boolean
      exposed_id: string | null
    }
    features: Record<string, any>
  }
}

interface VehicleState {
  vehicles: VehicleWithDetails[]
  filters: VehicleFilters
  pagination: {
    page: number
    perPage: number
    totalPages: number
  }
}

export const useVehicleStore = defineStore('vehicle', {
  state: (): VehicleState => ({
    vehicles: [],
    filters: {},
    pagination: {
      page: 1,
      perPage: 10,
      totalPages: 1
    }
  }),

  getters: {
    filteredVehicles: (state) => {
      return state.vehicles
    }
  },

  actions: {
    async fetchVehicles() {
      const supabase = useSupabaseClient()
      try {
        const { data, error } = await supabase
          .rpc('get_vehicles_with_details', {
            page_number: this.pagination.page,
            items_per_page: this.pagination.perPage
          } as any)

        if (error) throw error

        if (data) {
          const { results, total_count } = data
          this.vehicles = results
          this.pagination.totalPages = Math.ceil(total_count / this.pagination.perPage)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des véhicules:', error)
        this.vehicles = []
      }
    },

    setFilters(filters: VehicleFilters) {
      this.filters = filters
      this.fetchVehicles() // Recharger les données avec les nouveaux filtres
    },

    setPage(page: number) {
      this.pagination.page = page
      this.fetchVehicles() // Recharger les données pour la nouvelle page
    },

    async addVehicle(vehicleData: Omit<Vehicle, 'id'>) {
      const supabase = useSupabaseClient()
      try {
        // Insérer le véhicule principal
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .insert(vehicleData)
          .select()
          .single()

        if (vehicleError) throw vehicleError

        if (vehicle) {
          // Ajouter les détails de prix
          await supabase
            .from('vehicle_prices')
            .insert({
              vehicle_id: vehicle.id,
              purchase_price_ht: vehicleData.purchase_price_ht,
              selling_price_ht: vehicleData.selling_price_ht
            })

          // Ajouter le statut
          await supabase
            .from('vehicle_status')
            .insert({
              vehicle_id: vehicle.id,
              status: 'in_stock'
            })

          // Ajouter les features si présentes
          if (vehicleData.features) {
            await supabase
              .from('vehicle_features')
              .insert({
                vehicle_id: vehicle.id,
                features: vehicleData.features
              })
          }
        }

        await this.fetchVehicles()
      } catch (error) {
        console.error('Erreur lors de l\'ajout du véhicule:', error)
        throw error
      }
    },

    async updateVehicle(id: string, vehicleData: Partial<VehicleWithDetails>) {
      const supabase = useSupabaseClient()
      try {
        // Mise à jour du véhicule principal
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', id)

        if (vehicleError) throw vehicleError

        // Mise à jour des détails si présents
        if (vehicleData.details) {
          if (vehicleData.details.price_details) {
            await supabase
              .from('vehicle_prices')
              .update(vehicleData.details.price_details)
              .eq('vehicle_id', id)
          }

          if (vehicleData.details.status_details) {
            await supabase
              .from('vehicle_status')
              .update(vehicleData.details.status_details)
              .eq('vehicle_id', id)
          }

          if (vehicleData.details.features) {
            await supabase
              .from('vehicle_features')
              .update({ features: vehicleData.details.features })
              .eq('vehicle_id', id)
          }
        }

        await this.fetchVehicles()
      } catch (error) {
        console.error('Erreur lors de la mise à jour du véhicule:', error)
        throw error
      }
    },

    async deleteVehicle(id: string) {
      const supabase = useSupabaseClient()
      try {
        const { error } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', id)

        if (error) throw error
        
        await this.fetchVehicles()
      } catch (error) {
        console.error('Erreur lors de la suppression du véhicule:', error)
        throw error
      }
    }
  }
})