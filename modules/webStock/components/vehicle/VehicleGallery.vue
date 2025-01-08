// components/vehicle/VehicleGallery.vue
<template>
    <div class="space-y-4">
        <!-- Actions principales -->
        <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="handleAddPhotosClick">
                <Plus class="h-4 w-4 mr-2" />
                Ajouter
                <input ref="fileInput" type="file" multiple accept="image/*" class="hidden"
                    @change="handlePhotoUpload" />
            </Button>
            <Button variant="outline" size="sm" @click="openGalleryManager">
                <Grid class="h-4 w-4 mr-2" />
                Gérer
            </Button>
        </div>

        <!-- Aperçu des photos -->
        <div class="flex-1 flex items-center gap-4 overflow-x-auto pb-2">
            <div v-for="(photo, index) in sortedPhotos" :key="photo.id" 
                class="relative flex-shrink-0 w-24 h-24 group"
                :class="{ 'ring-2 ring-primary': photo.isMain }">
                <img 
                    :src="photo.url" 
                    :alt="'Photo ' + (index + 1)" 
                    class="w-full h-full object-cover rounded-md cursor-pointer"
                    @click="openFullscreen(index)" 
                />
                <Badge v-if="photo.isMain" variant="secondary" class="absolute top-1 right-1 text-xs">
                    ★
                </Badge>
            </div>
        </div>

        <!-- Modal de gestion des photos -->
        <Dialog :open="state.showGalleryModal" @update:open="state.showGalleryModal = $event">
            <DialogContent class="sm:max-w-6xl max-h-[90vh] w-[90vw]">
                <DialogHeader class="flex flex-row items-center justify-between pb-2">
                    <div>
                        <DialogTitle>Gestion des photos</DialogTitle>
                        <DialogDescription>{{ props.photos.length }} photos</DialogDescription>
                    </div>
                    <div class="flex gap-2">
                        <Button variant="outline" size="sm" @click="toggleSortMode">
                            <component :is="state.sortMode ? 'Check' : 'ArrowUpDown'" class="h-4 w-4 mr-2" />
                            {{ state.sortMode ? 'Terminer' : 'Réorganiser' }}
                        </Button>
                        <Button variant="default" size="sm" @click="$refs.modalFileInput?.click()">
                            <Plus class="h-4 w-4 mr-2" />
                            Ajouter des photos
                            <input ref="modalFileInput" type="file" accept="image/*" multiple class="hidden"
                                @change="handlePhotoUpload" />
                        </Button>
                    </div>
                </DialogHeader>

                <div class="overflow-y-auto max-h-[calc(90vh-12rem)]">
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4"
                        :class="{ 'cursor-move': state.sortMode }">
                        <div v-for="(photo, index) in sortedPhotos" :key="photo.id"
                            class="group relative aspect-square rounded-lg overflow-hidden bg-secondary"
                            :class="{ 'ring-2 ring-primary': photo.isMain }" 
                            draggable="true"
                            @dragstart="handleDragStart($event, index)" 
                            @dragover.prevent
                            @drop="handleDrop($event, index)">
                            <img 
                                :src="photo.url" 
                                :alt="'Photo ' + (index + 1)"
                                class="w-full h-full object-cover transition-opacity group-hover:opacity-80"
                                @click="openFullscreen(index)" 
                            />

                            <!-- Actions sur la photo -->
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                                        transition-opacity flex items-center justify-center gap-2">
                                <Button v-if="!state.sortMode" variant="secondary" size="icon"
                                    @click.stop="openFullscreen(index)">
                                    <Maximize2 class="h-4 w-4" />
                                </Button>
                                <Button v-if="!state.sortMode && !photo.isMain" variant="secondary" size="icon"
                                    @click.stop="setMainPhoto(photo)">
                                    <Star class="h-4 w-4" />
                                </Button>
                                <Button v-if="!state.sortMode" variant="destructive" size="icon"
                                    @click.stop="deletePhoto(photo)">
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            </div>

                            <!-- Badges -->
                            <Badge v-if="photo.isMain" variant="secondary" class="absolute top-2 right-2">
                                Principale
                            </Badge>
                            <Badge v-if="state.sortMode" variant="primary" class="absolute top-2 right-2">
                                {{ index + 1 }}
                            </Badge>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" @click="state.showGalleryModal = false">
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Modal plein écran -->
        <Dialog :open="state.showFullscreen" @update:open="state.showFullscreen = $event">
            <DialogContent class="sm:max-w-[90vw] max-h-[90vh] w-auto flex flex-col p-0">
                <DialogHeader class="p-6">
                    <DialogTitle>Photo {{ state.currentPhotoIndex + 1 }}</DialogTitle>
                    <DialogDescription>
                        {{ state.currentPhotoIndex + 1 }} sur {{ props.photos.length }}
                    </DialogDescription>
                </DialogHeader>

                <div class="relative flex-1 bg-white">
                    <!-- Navigation -->
                    <Button v-if="state.currentPhotoIndex > 0" variant="ghost" size="icon"
                        class="absolute bg-white border hover:bg-gray-200 hover:border-white left-4 top-1/2 -translate-y-1/2 z-10"
                        @click="previousPhoto">
                        <ChevronLeft class="h-8 w-8" />
                    </Button>

                    <Button v-if="state.currentPhotoIndex < props.photos.length - 1" variant="ghost" size="icon"
                        class="absolute bg-white border hover:bg-gray-200 hover:border-white right-4 top-1/2 -translate-y-1/2 z-10"
                        @click="nextPhoto">
                        <ChevronRight class="h-8 w-8" />
                    </Button>

                    <!-- Image courante -->
                    <img :src="currentPhoto?.url" :alt="'Photo ' + (state.currentPhotoIndex + 1)"
                        class="w-full h-[calc(90vh-12rem)] object-contain" />
                </div>

                <!-- Actions -->
                <div class="p-6 flex justify-between items-center border-t">
                    <div class="flex gap-2">
                        <Button v-if="currentPhoto && !currentPhoto.isMain" variant="outline" size="sm"
                            @click="setMainPhoto(currentPhoto)">
                            <Star class="h-4 w-4 mr-2" />
                            Définir comme principale
                        </Button>
                        <Button variant="destructive" size="sm" @click="deletePhoto(currentPhoto)">
                            <Trash2 class="h-4 w-4 mr-2" />
                            Supprimer
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" @click="state.showFullscreen = false">
                        Fermer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useToast } from '@/components/ui/toast/use-toast'
import type { PhotoData } from '../../types'

// Composants UI
import {
    ArrowUpDown, Check, Plus, ChevronLeft, ChevronRight,
    Star, Trash2, Maximize2, Grid
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface State {
    sortMode: boolean
    showFullscreen: boolean
    showGalleryModal: boolean
    currentPhotoIndex: number
}

// Props et Emits
const props = defineProps<{
    photos: PhotoData[]
    exposed_vehicle_id: string
    vehicleId: string
    source: string
}>()

const emit = defineEmits<{
    'update:photos': [photos: PhotoData[]]
}>()

// Services
const supabase = useSupabaseClient()
const { toast } = useToast()

// Refs
const fileInput = ref<HTMLInputElement | null>(null)
const modalFileInput = ref<HTMLInputElement | null>(null)

// État
const state = reactive<State>({
    sortMode: false,
    showFullscreen: false,
    showGalleryModal: false,
    currentPhotoIndex: 0
})

// Computed
const sortedPhotos = computed(() => {
    return [...props.photos].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
})

const currentPhoto = computed(() => props.photos[state.currentPhotoIndex])

// Méthodes de navigation
function openFullscreen(index: number) {
    state.currentPhotoIndex = index
    state.showFullscreen = true
}

function previousPhoto() {
    if (state.currentPhotoIndex > 0) {
        state.currentPhotoIndex--
    }
}

function nextPhoto() {
    if (state.currentPhotoIndex < props.photos.length - 1) {
        state.currentPhotoIndex++
    }
}

// Méthodes de gestion des photos
function handleAddPhotosClick() {
    fileInput.value?.click()
}

function openGalleryManager() {
    state.showGalleryModal = true
}

function toggleSortMode() {
    state.sortMode = !state.sortMode
}

async function handlePhotoUpload(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return

    try {
        const files = Array.from(input.files)
        const newPhotos: PhotoData[] = []

        for (const file of files) {
            const filePath = `vehicles/${props.source}/${props.vehicleId}/${Date.now()}.${file.name.split('.').pop()}`

            const { error: uploadError } = await supabase.storage
                .from('photos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('photos')
                .getPublicUrl(filePath)

            if (!publicUrl) throw new Error('URL publique non disponible')

            const { data: photoId, error: photoError } = await supabase.rpc('add_vehicle_photo', {
                p_exposed_vehicle_id: props.exposed_vehicle_id,
                p_url: publicUrl,
                p_type: 'vehicle'
            })

            if (photoError) throw photoError

            newPhotos.push({
                id: photoId,
                url: publicUrl,
                type: 'vehicle',
                position: props.photos.length + newPhotos.length,
                isMain: props.photos.length === 0 && newPhotos.length === 0
            })
        }

        emit('update:photos', [...props.photos, ...newPhotos])
        toast({
            title: "Photos ajoutées",
            description: `${files.length} photo(s) ajoutée(s) avec succès.`
        })
    } catch (error) {
        console.error('Erreur upload:', error)
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de l'ajout des photos.",
            variant: "destructive"
        })
    }

    input.value = ''
}

async function deletePhoto(photo: PhotoData | undefined) {
    if (!photo) return

    try {
        const { error } = await supabase.rpc('delete_vehicle_photo', {
            p_exposed_vehicle_id: props.exposed_vehicle_id,
            p_photo_id: photo.id
        })

        if (error) throw error

        const updatedPhotos = props.photos.filter(p => p.id !== photo.id)
        emit('update:photos', updatedPhotos)

        toast({
            title: "Photo supprimée",
            description: "La photo a été supprimée avec succès."
        })

        state.showFullscreen = false
    } catch (error) {
        console.error('Erreur suppression:', error)
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la suppression de la photo.",
            variant: "destructive"
        })
    }
}

async function setMainPhoto(photo: PhotoData | undefined) {
    if (!photo) return

    try {
        const { error } = await supabase.rpc('set_main_photo', {
            p_exposed_vehicle_id: props.exposed_vehicle_id,
            p_photo_id: photo.id,
            p_source: props.source
        })

        if (error) throw error

        const updatedPhotos = props.photos.map(p => ({
            ...p,
            isMain: p.id === photo.id
        }))

        emit('update:photos', updatedPhotos)

        toast({
            title: "Photo principale définie",
            description: "La photo principale a été mise à jour avec succès."
        })

        state.showFullscreen = false
    } catch (error) {
        console.error('Erreur photo principale:', error)
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la définition de la photo principale.",
            variant: "destructive"
        })
    }
}

// Gestion du drag & drop
function handleDragStart(event: DragEvent, index: number) {
    if (!state.sortMode || !event.dataTransfer) return
    event.dataTransfer.setData('text/plain', index.toString())
}

async function handleDrop(event: DragEvent, newIndex: number) {
    if (!state.sortMode || !event.dataTransfer) return
    const oldIndex = Number(event.dataTransfer.getData('text/plain'))
    if (isNaN(oldIndex)) return

    try {
        const newPhotos = [...props.photos]
        const [movedPhoto] = newPhotos.splice(oldIndex, 1)
        newPhotos.splice(newIndex, 0, movedPhoto)

        // Mise à jour des positions
        const { error } = await supabase.rpc('update_photos_order', {
            p_exposed_vehicle_id: props.exposed_vehicle_id,
            p_source: props.source,
            p_photo_order: newPhotos.map(photo => photo.id)
        })

        if (error) throw error

        emit('update:photos', newPhotos)
        
        toast({
            title: "Photos réorganisées",
            description: "L'ordre des photos a été mis à jour avec succès."
        })
    } catch (error) {
        console.error('Erreur lors du tri:', error)
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de réorganiser les photos."
        })
    }
}

// Méthodes exposées
defineExpose({
    openGalleryManager() {
        state.showGalleryModal = true
    },
    toggleSortMode() {
        state.sortMode = !state.sortMode
    }
})
</script>