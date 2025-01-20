<template>
    <div class="min-h-screen">
        <!-- Header -->
        <header
            class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div class="container flex h-14 items-center">
                <!-- Navigation section -->
                <div class="flex items-center gap-4">
                    <Button variant="ghost" @click="router.back()">
                        <ArrowLeft class="mr-2 h-4 w-4" />
                        Retour
                    </Button>
                    <Separator orientation="vertical" class="h-6" />
                    <h1 class="font-semibold">{{ companyData?.name }}</h1>
                    <Badge :variant="companyData?.status === 'active' ? 'success' : 'secondary'">
                        {{ companyData?.status }}
                    </Badge>
                </div>
            </div>
        </header>

        <!-- Loading State -->
        <div v-if="loading" class="container py-6">
            <div class="flex justify-center">
                Chargement...
            </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="container py-6">
            <Alert variant="destructive">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{{ error }}</AlertDescription>
            </Alert>
        </div>

        <!-- Main Content -->
        <div v-else class="container py-6">
            <div class="grid grid-cols-12 gap-6">
                <!-- Left Column -->
                <div class="col-span-8 space-y-6">
                    <!-- Main Information Card -->
                    <Card>
                        <CardHeader>
                            <CardTitle class="flex items-center gap-2 text-xl font-semibold">
                                <Building2 class="h-5 w-5" />
                                Informations Principales
                                <div class="ml-auto flex gap-2">
                                    <Button v-if="isEditing" variant="outline" size="sm" @click="cancelEdit">
                                        Annuler
                                    </Button>
                                    <Button v-if="isEditing" variant="default" size="sm" @click="saveChanges">
                                        Enregistrer
                                    </Button>
                                    <Button v-else variant="ghost" size="icon" @click="startEditing">
                                        <PencilIcon class="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div class="grid grid-cols-2 gap-4">
                                <EditableField v-model="editedCompany.name" label="Nom" :is-editing="isEditing" />
                                <EditableField v-model="editedCompany.domain" label="Domaine" :is-editing="isEditing" />
                                <EditableField v-model="editedCompany.email" label="Email" type="email"
                                    :is-editing="isEditing" />
                                <EditableField v-model="editedCompany.phone" label="Téléphone" type="tel"
                                    :is-editing="isEditing" />
                                <EditableField v-model="editedCompany.website" label="Site web" type="url"
                                    :is-editing="isEditing" />
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Addresses Card -->
                    <AddressesCard :addresses="addresses" readonly>
                        <template #header-action>
                            <Button variant="ghost" size="icon">
                                <PencilIcon class="h-4 w-4" />
                            </Button>
                        </template>
                    </AddressesCard>

                    <!-- Contacts Card -->
                    <ContactsCard :contacts="contacts" :company-id="companyData?.id" @refresh="fetchCompanyDetails" />

                    <!-- Notes & Activity Card -->
                    <Card>
                        <CardHeader>
                            <CardTitle class="flex items-center gap-2 text-xl font-semibold">
                                <ScrollText class="h-5 w-5" />
                                Notes & Activité
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="notes">
                                <TabsList>
                                    <TabsTrigger value="notes">Notes</TabsTrigger>
                                    <TabsTrigger value="activity">Activité</TabsTrigger>
                                </TabsList>
                                <TabsContent value="notes">
                                    <NotesTimeline readonly />
                                </TabsContent>
                                <TabsContent value="activity">
                                    <ActivityFeed />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                <!-- Right Column -->
                <div class="col-span-4 space-y-6">
                    <!-- Logo section - Maintenant en premier et plus grand -->
                    <div class="flex items-center">
                        <!-- Legal Info Card -->
                        <div class="flex items-stretch gap-4"> <!-- Changed to items-stretch -->
                            <CompanyLogo :website="companyData?.website" :email="companyData?.email"
                                class="h-12 w-12" />
                            <div class="flex-grow">
                                <LegalInfo v-model="editedCompany" @save="saveLegalInfo" />
                            </div>
                        </div>
                    </div>
                    <!-- Key Figures Card -->
                    <KeyFigures v-model="editedCompany" @save="saveKeyFigures" />

                    <!-- Location Card -->
                    <LocationStreetView :addresses="addresses" :company-name="companyData?.name" />

                    <!-- Tags Card -->
                    <Card>
                        <CardHeader>
                            <CardTitle class="flex items-center gap-2 text-xl font-semibold">
                                <Tags class="h-5 w-5" />
                                Tags
                                <Button variant="ghost" size="icon" class="ml-auto">
                                    <PencilIcon class="h-4 w-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TagsManager v-model="selectedTags" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCompanyDetails } from '@/modules/entity/composables/useCompanyDetails'
import {
    ArrowLeft,
    Building2,
    ScrollText,
    BarChart3,
    FileText,
    MapPin,
    Tags,
    PencilIcon
} from 'lucide-vue-next'

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCompanies } from '@/modules/entity/composables/useCompanies'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

// Custom Components
import CompanyLogo from '@/modules/entity/components/companies/CompanyLogo.vue'
import KeyFigure from '@/modules/entity/components/companies/KeyFigure.vue'
import AddressesCard from '@/modules/entity/components/companies/AddressesCard.vue'
import ContactsCard from '@/modules/entity/components/companies/ContactsCard.vue'
import NotesTimeline from '@/modules/entity/components/companies/NotesTimeline.vue'
import ActivityFeed from '@/modules/entity/components/companies/ActivityFeed.vue'
import TagsManager from '@/modules/entity/components/TagsManager.vue'
import LocationStreetView from '@/modules/entity/components/LocationStreetView.vue'
import EditableField from '@/modules/entity/components/edit/Principals.vue'
import LegalInfo from '@/modules/entity/components/edit/LegalInfo.vue'
import KeyFigures from '@/modules/entity/components/edit/KeyFigures.vue'

const router = useRouter()
const { data: companyDetails, loading, error, fetchCompanyDetails } = useCompanyDetails()
const { updateCompany } = useCompanies()

// Computed properties
const companyData = computed(() => companyDetails.value?.company)
const addresses = computed(() => companyDetails.value?.addresses || [])
const contacts = computed(() => companyDetails.value?.contacts || [])
const tags = computed(() => companyDetails.value?.tags || [])

const selectedTags = ref(tags.value)

const isEditing = ref(false)
const editedCompany = ref<any>({})  // Type any temporaire, à remplacer par le bon type

// Attendre que les données soient chargées avant d'initialiser editedCompany
watch(() => companyData.value, (newData) => {
    if (newData && !isEditing.value) {
        editedCompany.value = { ...newData }
    }
}, { immediate: true })

const startEditing = () => {
    if (companyData.value) {
        editedCompany.value = { ...companyData.value }
        isEditing.value = true
    }
}

const cancelEdit = () => {
    if (companyData.value) {
        editedCompany.value = { ...companyData.value }
        isEditing.value = false
    }
}

const saveChanges = async () => {
    try {
        if (editedCompany.value?.id) {
            await updateCompany(editedCompany.value.id, editedCompany.value)
            await fetchCompanyDetails(router.currentRoute.value.params.id as string)
            isEditing.value = false
        }
    } catch (err) {
        console.error('Erreur lors de la sauvegarde des modifications', err)
    }
}

const saveLegalInfo = async (legalInfo: { tax_number: string; vat_number: string }) => {
    try {
        if (editedCompany.value?.id) {
            await updateCompany(editedCompany.value.id, {
                ...editedCompany.value,
                tax_number: legalInfo.tax_number,
                vat_number: legalInfo.vat_number
            })
            await fetchCompanyDetails(router.currentRoute.value.params.id as string)
        }
    } catch (err) {
        console.error('Erreur lors de la sauvegarde des informations légales', err)
    }
}

const saveKeyFigures = async (figures: {
    revenue?: number
    social_capital?: number
    number_of_employees?: number
    fleet_size?: number
}) => {
    try {
        if (editedCompany.value?.id) {
            await updateCompany(editedCompany.value.id, {
                ...editedCompany.value,
                revenue: figures.revenue,
                social_capital: figures.social_capital,
                number_of_employees: figures.number_of_employees,
                fleet_size: figures.fleet_size
            })
            await fetchCompanyDetails(router.currentRoute.value.params.id as string)
        }
    } catch (err) {
        console.error('Erreur lors de la sauvegarde des chiffres clés', err)
    }
}

// Initial data fetch
onMounted(async () => {
    const routeId = router.currentRoute.value.params.id as string
    await fetchCompanyDetails(routeId)
})
</script>