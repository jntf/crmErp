// services/photos.ts
export interface PhotoData {
    id: string
    model_id?: string
    url: string
    type: string
    position: number
    isMain?: boolean
}

export interface VehicleIdentifier {
    vehicleId: string
    source: string
}

export const useVehiclePhotos = () => {
    const supabase = useSupabaseClient()

    const addPhoto = async (vehicle: VehicleIdentifier, url: string, type: string = 'vehicle') => {
        const { data, error } = await supabase
            .rpc('add_vehicle_photo', {
                p_vehicle_id: vehicle.vehicleId,
                p_source: vehicle.source,
                p_url: url,
                p_type: type
            } as any)
        
        if (error) {
            console.error('Erreur addPhoto:', error)
            throw error
        }
        return data
    }

    const updatePhotosOrder = async (vehicle: VehicleIdentifier, photoIds: string[]) => {
        const { data, error } = await supabase
            .rpc('update_photos_order', {
                p_vehicle_id: vehicle.vehicleId,
                p_source: vehicle.source,
                p_photo_order: photoIds
            } as any)
        
        if (error) {
            console.error('Erreur updatePhotosOrder:', error)
            throw error
        }
        return data
    }

    const setMainPhoto = async (vehicle: VehicleIdentifier, photoId: string) => {
        if (!photoId) {
            throw new Error('Photo ID is required')
        }
        
        const { data, error } = await supabase
            .rpc('set_main_photo', {
                p_photo_id: photoId,        // UUID de la photo
                p_source: vehicle.source,
                p_vehicle_id: vehicle.vehicleId
            } as any)
        
        if (error) {
            console.error('Erreur setMainPhoto:', error)
            throw error
        }
        return data
    }

    const deletePhoto = async (vehicle: VehicleIdentifier, photoId: string) => {
        if (!photoId) {
            throw new Error('Photo ID is required')
        }

        const { data, error } = await supabase
            .rpc('delete_vehicle_photo', {
                p_photo_id: photoId,        // UUID de la photo
                p_source: vehicle.source,
                p_vehicle_id: vehicle.vehicleId
            } as any)
        
        if (error) {
            console.error('Erreur deletePhoto:', error)
            throw error
        }
        return data
    }

    const deleteAllPhotos = async (vehicle: VehicleIdentifier) => {
        const { data, error } = await supabase
            .rpc('delete_all_vehicle_photos', {
                p_vehicle_id: vehicle.vehicleId,
                p_source: vehicle.source
            } as any)
        
        if (error) {
            console.error('Erreur deleteAllPhotos:', error)
            throw error
        }
        return data
    }

    const uploadPhoto = async (vehicle: VehicleIdentifier, file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${vehicle.source}/${vehicle.vehicleId}/${Date.now()}.${fileExt}`
        const filePath = `vehicles/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(filePath, file)

        if (uploadError) {
            console.error('Erreur uploadPhoto:', uploadError)
            throw uploadError
        }

        const { data } = supabase.storage
            .from('photos')
            .getPublicUrl(filePath)

        if (!data.publicUrl) {
            throw new Error('Impossible de récupérer l\'URL publique')
        }

        return data.publicUrl
    }

    return {
        addPhoto,
        updatePhotosOrder,
        setMainPhoto,
        deletePhoto,
        deleteAllPhotos,
        uploadPhoto
    }
}