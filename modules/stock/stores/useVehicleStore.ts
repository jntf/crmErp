import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Vehicle, VehicleState, VehicleCreate } from '../types'
import type { Database } from '../types/database.types'
import { useSupabaseClient } from '#imports'

export const useVehicleStore = defineStore('vehicle', () => {
    const vehicles = ref<Vehicle[]>([])
    const supabase = useSupabaseClient<Database>()

    const fetchVehicles = async () => {
        const { data, error } = await supabase.rpc('get_vehicles_with_details')
        
        if (error) throw error

        vehicles.value = data.results.map((vehicle: any) => ({
            ...vehicle,
            details: {
                price_details: vehicle.details?.price_details || {
                    purchase_price_ht: 0,
                    selling_price_ht: 0,
                    vat_rate: 20,
                    repair_cost: 0,
                    frevo: 0
                },
                status_details: vehicle.details?.status_details || {
                    status: vehicle.status,
                    location: '',
                    is_online: false,
                    exposed_id: null
                },
                features: vehicle.details?.features || {},
                ownership: vehicle.details?.ownership || []
            }
        }))
    }

    const createVehicle = async (vehicle: VehicleCreate) => {
        try {
            const vehicleData = [{
                brand: vehicle.brand,
                model: vehicle.model,
                version: vehicle.version,
                year: vehicle.year,
                mileage: vehicle.mileage,
                fuel_type: vehicle.fuel_type,
                transmission: vehicle.transmission,
                color: vehicle.color,
                vin: vehicle.vin,
                registration_number: vehicle.registration_number,
                status: vehicle.status,
                details: {
                    price_details: vehicle.details?.price_details || {
                        purchase_price_ht: 0,
                        selling_price_ht: 0,
                        vat_rate: 20,
                        repair_cost: 0,
                        frevo: 0
                    },
                    status_details: vehicle.details?.status_details || {
                        status: vehicle.status,
                        location: '',
                        is_online: false,
                        exposed_id: null
                    },
                    features: vehicle.details?.features || {},
                    ownership: vehicle.details?.ownership || []
                }
            }]

            return { data: vehicleData[0], error: null }
        } catch (error) {
            return { data: null, error }
        }
    }

    const updateVehicle = async (vehicle: Partial<Vehicle>) => {
        if (!vehicle.id) throw new Error('Vehicle ID is required')

        try {
            const vehicleData = [{
                id: vehicle.id,
                brand: vehicle.brand,
                model: vehicle.model,
                version: vehicle.version,
                year: vehicle.year,
                mileage: vehicle.mileage,
                fuel_type: vehicle.fuel_type,
                transmission: vehicle.transmission,
                color: vehicle.color,
                vin: vehicle.vin,
                registration_number: vehicle.registration_number,
                status: vehicle.status,
                details: {
                    price_details: vehicle.details?.price_details,
                    status_details: vehicle.details?.status_details,
                    features: vehicle.details?.features,
                    ownership: vehicle.details?.ownership
                }
            }]

            const { data, error } = await supabase.rpc('save_vehicles', {
                vehicles_data: vehicleData
            })

            if (error) throw error

            await fetchVehicles()
        } catch (error) {
            throw error
        }
    }

    const deleteVehicle = async (id: string) => {
        const { error } = await supabase.rpc('delete_vehicle', {
            vehicle_id_param: id
        })

        if (error) throw error

        window.location.reload()
    }

    const saveVehicles = async (vehicles: Vehicle[]) => {
        try {
            if (!vehicles || vehicles.length === 0) {
                throw new Error('Aucun véhicule à sauvegarder')
            }

            vehicles.forEach((vehicle, index) => {
                if (!vehicle.id) {
                    throw new Error('Tous les véhicules doivent avoir un ID')
                }
            })

            const vehiclesData = vehicles.map(vehicle => ({
                ...vehicle,
                details: {
                    price_details: vehicle.details?.price_details || {},
                    status_details: vehicle.details?.status_details || {},
                    features: vehicle.details?.features || {},
                    ownership: vehicle.details?.ownership || []
                }
            }))

            const { data, error } = await supabase
                .rpc('save_vehicles', {
                    vehicles_data: vehiclesData
                })

            if (error) throw error

            return data
        } catch (error) {
            throw error
        }
    }

    return {
        vehicles,
        fetchVehicles,
        createVehicle,
        updateVehicle,
        deleteVehicle,
        saveVehicles
    }
})