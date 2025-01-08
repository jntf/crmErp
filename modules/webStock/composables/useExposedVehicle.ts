// composables/useExposedVehicle.ts
import { ref, computed } from 'vue'
import type { TransformedVehicle } from '../types'

export const useExposedVehicle = () => {
    const supabase = useSupabaseClient()
    const vehicle = ref<TransformedVehicle | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchExposedVehicle(source: string, vehicleId: string) {
        loading.value = true
        error.value = null

        try {
            const { data, error: supabaseError } = await supabase
                .from('exposed_vehicles')
                .select(`
                    *,
                    vehicle_equipment_links (
                        equipment_references (*)
                    ),
                    vehicle_photo_links (
                        photo_references (*)
                    ),
                    vehicle_expertise (*)
                `)
                .eq('source', source)
                .eq('vehicle_id', vehicleId)
                .single()

            if (supabaseError) throw supabaseError

            if (!data) {
                throw new Error('Véhicule non trouvé')
            }

            // Transformer les données au format TransformedVehicle
            vehicle.value = {
                vehicleData: {
                    id: data.vehicle_id,
                    source: data.source,
                    brand: data.brand,
                    model: data.model,
                    version: data.version,
                    type: data.type,
                    body_type: data.body_type,
                    transmission: data.transmission,
                    fuel_type: data.fuel_type,
                    power_fiscal: data.power_fiscal,
                    power_hp: data.power_hp,
                    co2_emissions: data.co2_emissions,
                    doors: data.doors,
                    seats: data.seats,
                    weight: data.weight,
                    year: data.year,
                    registration_date: data.registration_date,
                    registration_number: data.registration_number,
                    mileage: data.mileage,
                    color: data.color,
                    vin: data.vin,
                    stock_location: data.stock_location,
                    // Informations financières
                    base_price: data.base_price,
                    new_vehicle_price: data.new_vehicle_price,
                    selling_price: data.selling_price,
                    repair_cost: data.repair_cost,
                    vat_rate: data.vat_rate,
                    // Métadonnées
                    status: data.status,
                    created_at: data.created_at,
                    updated_at: data.updated_at
                },
                equipments: data.vehicle_equipment_links?.map((link: any) => ({
                    name: link.equipment_references.name,
                    category: link.equipment_references.category,
                    isPresent: link.is_present
                })) || [],
                photos: data.vehicle_photo_links?.map((link: any) => ({
                    id: link.photo_references.id,
                    url: link.photo_references.url,
                    type: link.photo_references.type,
                    position: link.position,
                    isMain: link.position === 0
                })) || [],
                expertise: data.vehicle_expertise?.[0]?.expertise_data || null
            }

        } catch (err) {
            console.error('Erreur lors du chargement du véhicule exposé:', err)
            error.value = err instanceof Error ? err.message : 'Erreur lors du chargement du véhicule'
            vehicle.value = null
        } finally {
            loading.value = false
        }
    }

    async function updateExposedVehicle(vehicleData: Partial<TransformedVehicle['vehicleData']>) {
        if (!vehicle.value) return
    
        loading.value = true
        error.value = null
    
        try {
            const payload = {
                source: vehicle.value.vehicleData.source,
                vehicle_id: vehicle.value.vehicleData.id,
                data: vehicleData
            }
    
            const { data, error: supabaseError } = await supabase
                .rpc('update_exposed_vehicle', { payload })
    
            if (supabaseError) throw supabaseError
    
            vehicle.value.vehicleData = {
                ...vehicle.value.vehicleData,
                ...vehicleData
            }
        } catch (err) {
            console.error('Erreur lors de la mise à jour du véhicule:', err)
            error.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du véhicule'
        } finally {
            loading.value = false
        }
    }

    async function updateStatus(newStatus: string) {
        return updateExposedVehicle({ status: newStatus })
    }

    async function updateEquipments(newEquipments: any[]) {
        if (!vehicle.value) return

        loading.value = true
        error.value = null

        console.log("NewEquipments", newEquipments)

        try {
            for (const equipment of newEquipments) {
                const { data: equipmentRef, error: equipmentError } = await supabase
                    .from('equipment_references')
                    .upsert({ name: equipment.name, category: equipment.category })
                    .select()
                    .single()

                if (equipmentError) throw equipmentError

                const { error: linkError } = await supabase
                    .from('vehicle_equipment_links')
                    .upsert({
                        vehicle_id: vehicle.value.vehicleData.id,
                        equipment_id: equipmentRef.id,
                        is_present: equipment.isPresent
                    })

                if (linkError) throw linkError
            }

            vehicle.value.equipments = newEquipments
        } catch (err) {
            console.error('Erreur lors de la mise à jour des équipements:', err)
            error.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour des équipements'
        } finally {
            loading.value = false
        }
    }

    const canPublish = computed(() => {
        if (!vehicle.value) return false
        const v = vehicle.value
        return !!(
            v.photos.length > 0 &&
            v.vehicleData.selling_price &&
            v.vehicleData.brand &&
            v.vehicleData.model &&
            v.vehicleData.version &&
            v.vehicleData.mileage &&
            v.vehicleData.registration_date
        )
    })

    return {
        vehicle: computed(() => vehicle.value),
        loading: computed(() => loading.value),
        error: computed(() => error.value),
        canPublish,
        fetchExposedVehicle,
        updateExposedVehicle,
        updateStatus,
        updateEquipments
    }
}