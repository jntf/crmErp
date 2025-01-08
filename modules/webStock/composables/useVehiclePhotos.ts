// composables/useVehiclePhotos.ts
import { ref, computed } from 'vue'
import { PhotosAPI } from '../services/supabase/photos'
import type { PhotoData } from '../types'

export const useVehiclePhotos = () => {
    const loading = ref(false)
    const error = ref<string | null>(null)
    const supabase = useSupabaseClient()

    const addPhoto = async (exposed_vehicle_id: string, url: string, type: string = 'vehicle') => {
        loading.value = true
        error.value = null

        try {
            const { data, error: apiError } = await PhotosAPI.add({
                exposed_vehicle_id,
                url,
                type
            })

            if (apiError) throw apiError
            return data

        } catch (err) {
            console.error('Erreur addPhoto:', err)
            error.value = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la photo'
            throw err
        } finally {
            loading.value = false
        }
    }

    const updatePhotosOrder = async (exposed_vehicle_id: string, photoIds: string[]) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: apiError } = await PhotosAPI.updateOrder({
                exposed_vehicle_id,
                photo_order: photoIds
            })

            if (apiError) throw apiError
            return data
        } catch (err) {
            console.error('Erreur updatePhotosOrder:', err)
            error.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'ordre des photos'
            throw err
        } finally {
            loading.value = false
        }
    }

    const setMainPhoto = async (exposed_vehicle_id: string, source: string, photoId: string) => {
        loading.value = true
        error.value = null
        console.log("setMainPhoto", exposed_vehicle_id, source, photoId)
        try {
            const { data, error: apiError } = await PhotosAPI.setMain({
                exposed_vehicle_id,
                source,
                photo_id: photoId
            })

            if (apiError) throw apiError
            return data

        } catch (err) {
            console.error('Erreur setMainPhoto:', err)
            error.value = err instanceof Error ? err.message : 'Erreur lors de la définition de la photo principale'
            throw err
        } finally {
            loading.value = false
        }
    }

    const deletePhoto = async (exposed_vehicle_id: string, photoId: string) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: apiError } = await PhotosAPI.delete({
                exposed_vehicle_id,
                photo_id: photoId
            })

            if (apiError) throw apiError
            return data
        } catch (err) {
            console.error('Erreur deletePhoto:', err)
            error.value = err instanceof Error ? err.message : 'Erreur lors de la suppression de la photo'
            throw err
        } finally {
            loading.value = false
        }
    }

    const uploadPhoto = async (vehicleId: string, source: string, file: File): Promise<string> => {
        loading.value = true
        error.value = null

        try {
            const publicUrl = await PhotosAPI.uploadToStorage(vehicleId, source, file)
            return publicUrl

        } catch (err) {
            console.error('Erreur uploadPhoto:', err)
            error.value = err instanceof Error ? err.message : 'Erreur lors de l\'upload de la photo'
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        loading: computed(() => loading.value),
        error: computed(() => error.value),
        addPhoto,
        updatePhotosOrder,
        setMainPhoto,
        deletePhoto,
        uploadPhoto
    }
}