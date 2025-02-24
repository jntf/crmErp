import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { VehicleStockWithDetails, VehicleStockCreate, VehicleStockUpdate, VehicleStockFilters } from '../types/stock'
import type { Database } from '../types/database.types'
import { useSupabaseClient } from '#imports'

export const useVehicleStockStore = defineStore('vehicleStock', () => {
    const stockItems = ref<VehicleStockWithDetails[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const supabase = useSupabaseClient<Database>()

    /**
     * Récupère la liste des véhicules en stock avec leurs détails
     */
    const fetchStockItems = async (filters?: VehicleStockFilters) => {
        loading.value = true
        error.value = null
        
        try {
            const { data, error: err } = await supabase
                .rpc('get_vehicles_in_stock')
            
            if (err) throw err

            stockItems.value = data

            // Application des filtres côté client si nécessaire
            if (filters) {
                stockItems.value = stockItems.value.filter(item => {
                    let match = true
                    
                    if (filters.status && item.status !== filters.status) {
                        match = false
                    }
                    
                    if (filters.location && !item.location?.toLowerCase().includes(filters.location.toLowerCase())) {
                        match = false
                    }
                    
                    if (filters.hasVin !== undefined) {
                        if (filters.hasVin && !item.vin) match = false
                        if (!filters.hasVin && item.vin) match = false
                    }
                    
                    if (filters.dateFrom && new Date(item.stocked_at) < new Date(filters.dateFrom)) {
                        match = false
                    }
                    
                    if (filters.dateTo && new Date(item.stocked_at) > new Date(filters.dateTo)) {
                        match = false
                    }
                    
                    return match
                })
            }
        } catch (err) {
            console.error('Erreur lors de la récupération des véhicules en stock:', err)
            error.value = err instanceof Error ? err.message : 'Erreur inconnue'
        } finally {
            loading.value = false
        }
    }

    /**
     * Crée une nouvelle entrée en stock
     */
    const createStockItem = async (stockItem: VehicleStockCreate) => {
        loading.value = true
        error.value = null
        
        try {
            const { data, error: err } = await supabase
                .from('vehicle_stock')
                .insert(stockItem)
                .select('*')
                .single()
            
            if (err) throw err

            // Rafraîchir la liste
            await fetchStockItems()
            
            return data
        } catch (err) {
            console.error('Erreur lors de la création de l\'entrée en stock:', err)
            error.value = err instanceof Error ? err.message : 'Erreur inconnue'
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Met à jour une entrée en stock
     */
    const updateStockItem = async (id: string, updates: VehicleStockUpdate) => {
        loading.value = true
        error.value = null
        
        try {
            const { data, error: err } = await supabase
                .from('vehicle_stock')
                .update(updates)
                .eq('id', id)
                .select('*')
                .single()
            
            if (err) throw err

            // Rafraîchir la liste
            await fetchStockItems()
            
            return data
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'entrée en stock:', err)
            error.value = err instanceof Error ? err.message : 'Erreur inconnue'
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Supprime une entrée en stock
     */
    const deleteStockItem = async (id: string) => {
        loading.value = true
        error.value = null
        
        try {
            const { error: err } = await supabase
                .from('vehicle_stock')
                .delete()
                .eq('id', id)
            
            if (err) throw err

            // Rafraîchir la liste
            await fetchStockItems()
        } catch (err) {
            console.error('Erreur lors de la suppression de l\'entrée en stock:', err)
            error.value = err instanceof Error ? err.message : 'Erreur inconnue'
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        stockItems,
        loading,
        error,
        fetchStockItems,
        createStockItem,
        updateStockItem,
        deleteStockItem
    }
}) 