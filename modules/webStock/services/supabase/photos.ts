// services/supabase/photos.ts
export interface AddPhotoParams {
    exposed_vehicle_id: string
    url: string
    type?: string
}

export interface UpdateOrderParams {
    exposed_vehicle_id: string
    photo_order: string[]
}

export interface PhotoActionParams {
    exposed_vehicle_id: string
    source: string
    photo_id: string
}

export const PhotosAPI = {
    add: (params: AddPhotoParams) => {
        return useSupabaseClient().rpc('add_vehicle_photo', {
            p_exposed_vehicle_id: params.exposed_vehicle_id,
            p_url: params.url,
            p_type: params.type || 'vehicle'
        })
    },

    updateOrder: (params: UpdateOrderParams) => {
        return useSupabaseClient().rpc('update_photos_order', {
            p_exposed_vehicle_id: params.exposed_vehicle_id,
            p_photo_order: params.photo_order
        })
    },

    setMain: (params: PhotoActionParams) => {
        console.log("setMain photo.ts", params)
        const exposed_vehicle_id = params.exposed_vehicle_id
        const source = params.source
        const photo_id = params.photo_id
        console.log("setMain photo.ts", exposed_vehicle_id, source, photo_id)
        return useSupabaseClient().rpc('set_main_photo', {
            p_exposed_vehicle_id: exposed_vehicle_id,
            p_source: source,
            p_photo_id: photo_id
        } as any)
    },

    delete: (params: PhotoActionParams) => {
        // Même chose ici, construire directement l'objet de paramètres
        return useSupabaseClient().rpc('delete_vehicle_photo', {
            p_exposed_vehicle_id: params.exposed_vehicle_id,
            p_photo_id: params.photo_id
        })
    },

    deleteAll: (exposed_vehicle_id: string) => {
        return useSupabaseClient().rpc('delete_all_vehicle_photos', {
            p_exposed_vehicle_id: exposed_vehicle_id
        })
    },

    uploadToStorage: async (vehicleId: string, source: string, file: File): Promise<string> => {
        const supabase = useSupabaseClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `${source}/${vehicleId}/${Date.now()}.${fileExt}`
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
}