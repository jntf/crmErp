import { ref } from 'vue'
import type { Vehicle } from '../types'
import { VehicleStatusEnum } from '../types'

export const useVehicleSync = () => {
  const syncing = ref(false)
  const error = ref<string | null>(null)

  /**
   * Synchronise un véhicule avec le système d'exposition en ligne
   */
  const syncVehicle = async (vehicle: Vehicle) => {
    syncing.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()

      // 1. Vérifier si le véhicule est déjà exposé
      const { data: existingStatus } = await supabase
        .from('vehicle_status')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .single()

      if (existingStatus?.is_online) {
        throw new Error('Le véhicule est déjà exposé en ligne')
      }

      // 2. Créer l'exposition
      const { data: exposed, error: exposeError } = await supabase
        .from('exposed_vehicles')
        .insert({
          vehicle_id: vehicle.id,
          title: `${vehicle.brand} ${vehicle.model} ${vehicle.version || ''}`.trim(),
          description: generateDescription(vehicle),
          price: vehicle.selling_price_ht,
          images: [], // TODO: Gérer les images
          features: {}, // TODO: Gérer les équipements
          metadata: {
            mileage: vehicle.mileage,
            year: vehicle.year,
            fuel_type: vehicle.fuel_type,
            transmission: vehicle.transmission
          }
        })
        .select()
        .single()

      if (exposeError) throw exposeError

      // 3. Mettre à jour le statut du véhicule
      const { error: statusError } = await supabase
        .from('vehicle_status')
        .upsert({
          vehicle_id: vehicle.id,
          status: VehicleStatusEnum.EXPOSED,
          is_online: true,
          exposed_id: exposed.id
        })

      if (statusError) throw statusError

      return exposed
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      syncing.value = false
    }
  }

  /**
   * Retire un véhicule du système d'exposition en ligne
   */
  const unsyncVehicle = async (vehicle: Vehicle) => {
    syncing.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()

      // 1. Vérifier si le véhicule est exposé
      const { data: status } = await supabase
        .from('vehicle_status')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .single()

      if (!status?.is_online) {
        throw new Error('Le véhicule n\'est pas exposé en ligne')
      }

      // 2. Supprimer l'exposition
      const { error: deleteError } = await supabase
        .from('exposed_vehicles')
        .delete()
        .eq('id', status.exposed_id)

      if (deleteError) throw deleteError

      // 3. Mettre à jour le statut du véhicule
      const { error: statusError } = await supabase
        .from('vehicle_status')
        .update({
          status: VehicleStatusEnum.IN_STOCK,
          is_online: false,
          exposed_id: null
        })
        .eq('vehicle_id', vehicle.id)

      if (statusError) throw statusError
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      syncing.value = false
    }
  }

  /**
   * Génère une description pour l'exposition en ligne
   */
  const generateDescription = (vehicle: Vehicle): string => {
    const parts = []

    // Informations principales
    parts.push(`${vehicle.brand} ${vehicle.model} ${vehicle.version || ''}`.trim())
    
    // Année et kilométrage
    if (vehicle.year) {
      parts.push(`Année : ${vehicle.year}`)
    }
    if (vehicle.mileage) {
      parts.push(`Kilométrage : ${vehicle.mileage.toLocaleString('fr-FR')} km`)
    }

    // Caractéristiques techniques
    if (vehicle.fuel_type) {
      parts.push(`Carburant : ${vehicle.fuel_type}`)
    }
    if (vehicle.transmission) {
      parts.push(`Boîte de vitesse : ${vehicle.transmission}`)
    }
    if (vehicle.power_hp) {
      parts.push(`Puissance : ${vehicle.power_hp} ch`)
    }
    if (vehicle.co2_emissions) {
      parts.push(`Émissions CO2 : ${vehicle.co2_emissions} g/km`)
    }

    return parts.join('\n')
  }

  return {
    syncing,
    error,
    syncVehicle,
    unsyncVehicle
  }
} 