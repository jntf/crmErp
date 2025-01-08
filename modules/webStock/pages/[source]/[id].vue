//modules/webStock/pages/[source]/[id].vue
<template>
    <div class="min-h-screen bg-background">
        <!-- En-tête du véhicule -->
        <VehicleHeader :vehicle="vehicle" :loading="loading" :can-publish="canPublish" :has-changes="hasChanges"
            @back="router.back()" @save="handleSave" @reset="handleReset" @status-change="updateStatus" />

        <main class="container py-6">
            <!-- États de chargement et d'erreur -->
            <LoadingState v-if="loading" title="Chargement du véhicule"
                description="Veuillez patienter pendant la récupération des informations..." />

            <Alert v-else-if="error" variant="destructive">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>
                    {{ error }}
                    <Button variant="link" @click="loadVehicle" class="ml-2">Réessayer</Button>
                </AlertDescription>
            </Alert>

            <!-- Contenu principal -->
            <div v-else-if="vehicle" class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <!-- Colonne gauche -->
                <div class="md:col-span-8 space-y-6">
                    <!-- Section Galerie -->
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle>Photos</CardTitle>
                                <CardDescription>{{ vehicle.photos.length }} photos disponibles</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <VehicleGallery ref="galleryRef" v-model:photos="vehicle.photos"
                                :exposed_vehicle_id="vehicle.vehicleData.id" :vehicle-id="vehicle.vehicleData.id"
                                :source="vehicle.vehicleData.source" />
                        </CardContent>
                    </Card>

                    <!-- Sections Accordéon -->
                    <VehicleAccordion v-model="state.ui.activeSection" :sections="accordionSections">
                        <template #technical>
                            <TechnicalSection v-if="draftVehicle" v-model="draftVehicle.vehicleData"
                                @update:modelValue="updateDraft" />
                        </template>

                        <template #colors>
                            <ColorSection v-model="vehicle.vehicleData" @update:modelValue="updateColors" />
                        </template>

                        <template #equipment>
                            <EquipmentSection v-model="vehicle.equipments" @update:modelValue="updateEquipments"
                                :vehicle-id="vehicle.vehicleData.id" :source="vehicle.vehicleData.source" />
                        </template>

                        <template #expertise>
                            <ExpertiseSection v-model="vehicle.expertise" @update:modelValue="updateExpertise" />
                        </template>
                    </VehicleAccordion>
                </div>

                <!-- Colonne droite -->
                <div class="md:col-span-4 space-y-6">
                    <div class="md:sticky md:top-24 space-y-6">
                        <VehicleIdentityCard v-model="vehicle.vehicleData" />
                        <VehicleFinancialCard v-model="vehicle.vehicleData" @update:modelValue="updateFinancials" />
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast/use-toast'
import type { TransformedVehicle } from '../../types'
import { useExposedVehicle } from '../../composables/useExposedVehicle'
import { cloneDeep } from 'lodash'

// Composants
import VehicleAccordion from '../../components/vehicle/VehicleAccordion.vue'
import TechnicalSection from '../../components/vehicle/sections/TechnicalSection.vue'
import ColorSection from '../../components/vehicle/sections/ColorSection.vue'
import EquipmentSection from '../../components/vehicle/sections/EquipmentSection.vue'
import ExpertiseSection from '../../components/vehicle/sections/ExpertiseSection.vue'
import VehicleIdentityCard from '../../components/vehicle/cards/VehicleIdentityCard.vue'
import VehicleFinancialCard from '../../components/vehicle/cards/VehicleFinancialCard.vue'
import VehicleGallery from '../../components/vehicle/VehicleGallery.vue'
import VehicleHeader from '../../components/vehicle/VehicleHeader.vue'
import LoadingState from '../../components/shared/LoadingState.vue'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

// Services et états
const route = useRoute()
const router = useRouter()
const { toast } = useToast()

// Refs
const galleryRef = ref<InstanceType<typeof VehicleGallery> | null>(null)

// État global
const state = reactive({
    ui: {
        activeSection: 'technical'
    }
})

// Vehicle composable
const {
    vehicle,
    loading,
    error,
    canPublish,
    fetchExposedVehicle,
    updateExposedVehicle,
    updateStatus,
    updateEquipments
} = useExposedVehicle()

console.log("Vehicle", vehicle)

// Sections de l'accordéon
const accordionSections = [
    {
        id: 'technical',
        title: 'Fiche Technique',
        badge: computed(() =>
            vehicle.value ? `${vehicle.value.vehicleData.brand} ${vehicle.value.vehicleData.model}` : ''
        )
    },
    {
        id: 'colors',
        title: 'Couleurs',
        badge: computed(() => vehicle.value?.vehicleData.color || '')
    },
    {
        id: 'equipment',
        title: 'Équipements',
        badge: computed(() =>
            vehicle.value ? `${vehicle.value.equipments.length} équipements` : ''
        )
    },
    {
        id: 'expertise',
        title: 'Expertise',
        badge: computed(() =>
            vehicle.value?.expertise?.date || 'Non expertisé'
        )
    }
]

// Actions principales
async function loadVehicle() {
    const source = route.params.source as string
    const vehicleId = route.params.id as string

    if (!source || !vehicleId) {
        error.value = "Paramètres manquants dans l'URL"
        return
    }

    await fetchExposedVehicle(source, vehicleId)
}

const draftVehicle = ref<TransformedVehicle | null>(null)

// Computed pour détecter les changements
const hasChanges = computed(() => {
    if (!vehicle.value || !draftVehicle.value) return false
    return JSON.stringify(vehicle.value) !== JSON.stringify(draftVehicle.value)
})

// Fonction pour initialiser le brouillon
function initializeDraft() {
    if (vehicle.value) {
        draftVehicle.value = cloneDeep(vehicle.value)
    }
}

// Fonction pour mettre à jour le brouillon
function updateDraft(newData: any) {
    if (!draftVehicle.value) return
    draftVehicle.value = {
        ...draftVehicle.value,
        vehicleData: {
            ...draftVehicle.value.vehicleData,
            ...newData
        }
    }
}

// Gérer la sauvegarde
async function handleSave() {
    if (!draftVehicle.value || !hasChanges.value) return
    try {
        await updateExposedVehicle(draftVehicle.value.vehicleData)
        toast({
            title: "Modifications enregistrées",
            description: "Les modifications ont été sauvegardées avec succès.",
        })
    } catch (err) {
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la sauvegarde.",
            variant: "destructive"
        })
    }
}

// Gérer la réinitialisation
function handleReset() {
    initializeDraft()
    toast({
        title: "Réinitialisation effectuée",
        description: "Les modifications ont été annulées."
    })
}

// Gestionnaires de mise à jour
function updateTechnical(newData: any) {
    if (!vehicle.value) return
    updateExposedVehicle(newData)
}

function updateColors(newData: any) {
    if (!vehicle.value) return
    updateExposedVehicle(newData)
}

function updateFinancials(newData: any) {
    if (!vehicle.value) return
    updateExposedVehicle(newData)
}

function updateExpertise(newData: any) {
    if (!vehicle.value) return
    vehicle.value.expertise = newData
}

// Watchers
watch(
    () => route.params,
    async (newParams) => {
        if (newParams.source && newParams.id) {
            await loadVehicle()
        }
    }
)

watch(
    () => route.params,
    () => {
        state.ui.activeSection = 'technical'
    }
)

watch(
    () => vehicle.value,
    (newVehicle) => {
        if (newVehicle) {
            initializeDraft()
        }
    },
    { immediate: true }
)

// Lifecycle
onMounted(async () => {
    await loadVehicle()
})
</script>