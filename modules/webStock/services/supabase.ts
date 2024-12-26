// modules/webStock/services/supabase.ts
import type { TransformedVehicle } from '../connectors/mcautomobiles/types'

export const useVehiclePublisher = () => {
    const supabase = useSupabaseClient()

    /**
     * Vérifie si un véhicule existe déjà
     */
    const checkVehicleExists = async (vin: string) => {
        const { data } = await supabase
            .from('exposed_vehicles')
            .select('id')
            .eq('vin', vin)
            .single()
        return !!data
    }

    /**
     * Ajoute les équipements en base
     */
    const insertEquipments = async (equipments: TransformedVehicle['equipments']) => {
        const equipmentRefs = await Promise.all(
            equipments.map(async (equipment) => {
                // Insérer ou récupérer l'équipement
                const { data, error } = await supabase
                    .from('equipment_references')
                    .upsert(
                        { name: equipment.name, category: equipment.category },
                        { onConflict: 'name' }
                    )
                    .select()
                    .single()

                if (error) throw error
                return { id: data.id, isPresent: equipment.isPresent }
            })
        )
        return equipmentRefs
    }

    /**
     * Ajoute les photos en base
     */
    const insertPhotos = async (photos: TransformedVehicle['photos']) => {
        const photoRefs = await Promise.all(
            photos.map(async (photo) => {
                // Insérer ou récupérer la photo
                const { data, error } = await supabase
                    .from('photo_references')
                    .upsert(
                        {
                            url: photo.url,
                            type: photo.type,
                            model_id: photo.model_id
                        },
                        { onConflict: 'url' }
                    )
                    .select()
                    .single()

                if (error) throw error
                return { id: data.id, position: photo.position }
            })
        )
        return photoRefs
    }

    /**
     * Publie un véhicule
     */
    const publishVehicle = async (
        vehicle: TransformedVehicle,
        sellingPrice: number
    ) => {
        const exists = await checkVehicleExists(vehicle.vehicleData.vin)
        if (exists) {
            throw new Error('Ce véhicule existe déjà dans la base')
        }

        // Début de la transaction
        const { data: vehicleData, error: vehicleError } = await supabase
            .from('exposed_vehicles')
            .insert({
                vehicle_id: vehicle.vehicleData.id,
                source: vehicle.vehicleData.source,
                type: vehicle.vehicleData.type,
                body_type: vehicle.vehicleData.body_type,
                brand: vehicle.vehicleData.brand,
                model: vehicle.vehicleData.model,
                version: vehicle.vehicleData.version,
                fuel_type: vehicle.vehicleData.fuel_type,
                year: vehicle.vehicleData.year,
                registration_date: vehicle.vehicleData.registration_date,
                mileage: vehicle.vehicleData.mileage,
                doors: vehicle.vehicleData.doors,
                seats: vehicle.vehicleData.seats,
                color: vehicle.vehicleData.color,
                transmission: vehicle.vehicleData.transmission,
                power_hp: vehicle.vehicleData.power_hp,
                power_fiscal: vehicle.vehicleData.power_fiscal,
                base_price: vehicle.vehicleData.base_price,
                selling_price: sellingPrice,
                vat_rate: vehicle.vehicleData.vat_rate,
                repair_cost: vehicle.vehicleData.repair_cost,
                co2_emissions: vehicle.vehicleData.co2_emissions,
                stock_location: vehicle.vehicleData.stock_location,
                registration_number: vehicle.vehicleData.registration_number,
                vin: vehicle.vehicleData.vin,
                weight: vehicle.vehicleData.weight,
                new_vehicle_price: vehicle.vehicleData.new_vehicle_price
            })
            .select()
            .single()

        if (vehicleError) throw vehicleError

        // Gestion des équipements
        const equipmentRefs = await insertEquipments(vehicle.equipments)
        await supabase.from('vehicle_equipment_links').insert(
            equipmentRefs.map((eq) => ({
                vehicle_id: vehicleData.id,
                equipment_id: eq.id,
                is_present: eq.isPresent
            }))
        )

        // Gestion des photos
        const photoRefs = await insertPhotos(vehicle.photos)
        await supabase.from('vehicle_photo_links').insert(
            photoRefs.map((photo) => ({
                vehicle_id: vehicleData.id,
                photo_id: photo.id,
                position: photo.position
            }))
        )

        // Ajout de l'expertise
        if (vehicle.expertise) {
            await supabase.from('vehicle_expertise').insert({
                vehicle_id: vehicleData.id,
                source: vehicle.vehicleData.source,
                expertise_date: vehicle.expertise.date,
                expertise_data: vehicle.expertise
            })
        }

        return vehicleData
    }

    return {
        publishVehicle,
        checkVehicleExists
    }
}