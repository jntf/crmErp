<template>
    <div class="min-h-screen">
        <!-- Header -->
        <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div class="container flex h-14 items-center">
                <div class="flex items-center gap-4">
                    <Button variant="ghost" @click="router.back()">
                        <ArrowLeft class="mr-2 h-4 w-4" />
                        Retour
                    </Button>
                    <Separator orientation="vertical" class="h-6" />
                    <h1 class="font-semibold">{{ contactData?.first_name }} {{ contactData?.last_name }}</h1>
                    <Badge :variant="contactData?.status === 'active' ? 'success' : 'secondary'">
                        {{ contactData?.status }}
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
        <div v-else class="container max-w-7xl mx-auto py-4 px-2 sm:px-4 lg:px-6">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <!-- Left Column -->
                <div class="lg:col-span-8 space-y-4">
                    <!-- Main Information Card -->
                    <Card class="shadow-sm">
                        <CardHeader class="py-4">
                            <CardTitle class="flex items-center gap-2 text-lg font-medium">
                                <User class="h-4 w-4" />
                                Informations Principales
                                <div class="ml-auto flex gap-2">
                                    <Button v-if="isEditing" variant="outline" size="sm" @click="cancelEdit">
                                        <X class="h-4 w-4 mr-1" />
                                        Annuler
                                    </Button>
                                    <Button v-if="isEditing" variant="default" size="sm" @click="saveChanges">
                                        <Check class="h-4 w-4 mr-1" />
                                        Enregistrer
                                    </Button>
                                    <Button v-else variant="outline" size="sm" @click="startEditing">
                                        <PencilIcon class="h-4 w-4 mr-1" />
                                        Modifier
                                    </Button>
                                </div>
                            </CardTitle>
                            <CardDescription v-if="isEditing" class="mt-2">
                                Modifiez les informations du contact ci-dessous
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <!-- Informations de base -->
                                <div class="sm:col-span-2">
                                    <h3 class="text-sm font-medium text-muted-foreground mb-3">Informations de base</h3>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <EditableField v-model="editedContact.first_name" label="Prénom" :is-editing="isEditing" />
                                        <EditableField v-model="editedContact.last_name" label="Nom" :is-editing="isEditing" />
                                    </div>
                                </div>

                                <!-- Coordonnées -->
                                <div class="sm:col-span-2">
                                    <h3 class="text-sm font-medium text-muted-foreground mb-3">Coordonnées</h3>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <EditableField v-model="editedContact.email" label="Email" type="email" :is-editing="isEditing" />
                                        <EditableField v-model="editedContact.phone" label="Téléphone" type="tel" :is-editing="isEditing" />
                                        <EditableField v-model="editedContact.mobile_phone" label="Mobile" type="tel" :is-editing="isEditing" />
                                        <div class="space-y-1.5">
                                            <Label class="text-sm font-medium">LinkedIn</Label>
                                            <div v-if="isEditing" class="relative">
                                                <Input
                                                    v-model="editedContact.linkedin_profile"
                                                    type="url"
                                                    placeholder="https://linkedin.com/in/..."
                                                    class="w-full"
                                                />
                                            </div>
                                            <div v-else class="relative group">
                                                <div class="min-h-[2.5rem] flex items-center px-3 py-2 text-sm rounded-md border border-transparent bg-muted/40">
                                                    <a
                                                        v-if="editedContact.linkedin_profile"
                                                        :href="editedContact.linkedin_profile"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        class="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                                    >
                                                        <LinkedinIcon class="h-4 w-4" />
                                                        Voir le profil
                                                    </a>
                                                    <span v-else class="text-muted-foreground">Non renseigné</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Informations professionnelles -->
                                <div class="sm:col-span-2">
                                    <h3 class="text-sm font-medium text-muted-foreground mb-3">Informations professionnelles</h3>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <EditableField v-model="editedContact.job_title" label="Fonction" :is-editing="isEditing" />
                                        <EditableField v-model="editedContact.department" label="Service" :is-editing="isEditing" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Companies Card -->
                    <Card class="shadow-sm">
                        <CardHeader class="py-4">
                            <CardTitle class="flex items-center gap-2 text-lg font-medium">
                                <Building2 class="h-4 w-4" />
                                Entreprises Associées
                                <Button variant="ghost" size="icon" class="ml-auto" @click="showAddCompanyDialog = true">
                                    <PlusCircle class="h-4 w-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div class="space-y-3">
                                <div v-for="company in companies" :key="company.id" 
                                    class="flex items-center justify-between p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div>
                                        <h4 class="font-medium text-sm">{{ company.name }}</h4>
                                        <p class="text-xs text-muted-foreground">{{ company.role }}</p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <Badge v-if="company.is_decision_maker" variant="secondary" class="text-xs">
                                            Décideur
                                        </Badge>
                                        <Button variant="ghost" size="icon" @click="removeCompany(company.id)">
                                            <Trash2 class="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div v-if="!companies.length" class="text-sm text-muted-foreground text-center py-2">
                                    Aucune entreprise associée
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Notes Card -->
                    <Card class="shadow-sm">
                        <CardHeader class="py-4">
                            <CardTitle class="flex items-center gap-2 text-lg font-medium">
                                <ScrollText class="h-4 w-4" />
                                Notes
                                <Button variant="ghost" size="icon" class="ml-auto" @click="isEditingNotes = !isEditingNotes">
                                    <PencilIcon class="h-4 w-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div v-if="isEditingNotes">
                                <Textarea 
                                    v-model="editedContact.notes" 
                                    placeholder="Ajouter des notes..." 
                                    class="min-h-[150px] text-sm"
                                />
                                <div class="flex justify-end gap-2 mt-3">
                                    <Button variant="outline" size="sm" @click="cancelEditNotes">Annuler</Button>
                                    <Button size="sm" @click="saveNotes">Enregistrer</Button>
                                </div>
                            </div>
                            <div v-else class="prose prose-sm max-w-none">
                                <p v-if="contactData?.notes" class="text-sm whitespace-pre-line">{{ contactData.notes }}</p>
                                <p v-else class="text-sm text-muted-foreground text-center py-2">Aucune note</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Right Column -->
                <div class="lg:col-span-4 space-y-4">
                    <!-- Addresses Card -->
                    <Card class="shadow-sm">
                        <CardHeader class="py-4">
                            <CardTitle class="flex items-center gap-2 text-lg font-medium">
                                <MapPin class="h-4 w-4" />
                                Adresses
                                <Button variant="ghost" size="icon" class="ml-auto" @click="showAddAddressDialog = true">
                                    <PlusCircle class="h-4 w-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div class="space-y-3">
                                <div v-for="address in addresses" :key="address.id" 
                                    class="p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div class="flex items-center justify-between mb-2">
                                        <Badge class="text-xs">{{ address.address_type }}</Badge>
                                        <div class="flex items-center gap-2">
                                            <Badge v-if="address.is_primary" variant="secondary" class="text-xs">Principal</Badge>
                                            <Button variant="ghost" size="icon" @click="editAddress(address)">
                                                <PencilIcon class="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p class="text-xs leading-relaxed">
                                        {{ address.street_number }} {{ address.street_name }}<br>
                                        <span v-if="address.address_line2">{{ address.address_line2 }}<br></span>
                                        {{ address.postal_code }} {{ address.city }}<br>
                                        {{ address.country?.name }}
                                    </p>
                                </div>
                                <div v-if="!addresses.length" class="text-sm text-muted-foreground text-center py-2">
                                    Aucune adresse
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Tags Card -->
                    <Card class="shadow-sm">
                        <CardHeader class="py-4">
                            <CardTitle class="flex items-center gap-2 text-lg font-medium">
                                <Tags class="h-4 w-4" />
                                Tags
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TagsManager 
                                v-model="selectedTags" 
                                @update:modelValue="handleTagsUpdate"
                                class="text-sm"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <!-- Add Company Dialog -->
        <Dialog v-model:open="showAddCompanyDialog">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajouter une entreprise</DialogTitle>
                </DialogHeader>
                <div class="space-y-4">
                    <div class="space-y-2">
                        <Label>Entreprise</Label>
                        <Select v-model="selectedCompanyId">
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une entreprise" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="company in availableCompanies" :key="company.id" :value="company.id">
                                    {{ company.name }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="space-y-2">
                        <Label>Rôle</Label>
                        <Input v-model="newCompanyRole" placeholder="Ex: Responsable commercial" />
                    </div>
                    <div class="flex items-center space-x-2">
                        <Checkbox v-model="newCompanyIsDecisionMaker" id="decision-maker" />
                        <Label for="decision-maker">Décideur</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" @click="showAddCompanyDialog = false">Annuler</Button>
                    <Button @click="addCompany">Ajouter</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Add Address Dialog -->
        <AddressDialog
            v-model="showAddAddressDialog"
            :current-address="currentEditAddress"
            @save="currentEditAddress ? handleUpdateAddress : handleAddAddress"
            @close="currentEditAddress = null"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContactDetails } from '@/modules/entity/composables/useContactDetails'
import {
    ArrowLeft,
    Building2,
    User,
    ScrollText,
    MapPin,
    Tags,
    PencilIcon,
    PlusCircle,
    Trash2,
    LinkedinIcon,
    X,
    Check
} from 'lucide-vue-next'

// UI Components
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast/use-toast'

// Custom Components
import EditableField from '@/modules/entity/components/edit/EditableField.vue'
import TagsManager from '@/modules/entity/components/TagsManager.vue'
import AddressDialog from '@/modules/entity/components/addresses/AddressDialog.vue'

const router = useRouter()
const route = useRoute()
const { toast } = useToast()
const { 
    data: contactDetails, 
    loading, 
    error, 
    fetchContactDetails, 
    updateContact, 
    addCompanyToContact, 
    removeCompanyFromContact, 
    addAddress, 
    updateAddress, 
    deleteAddress, 
    setAddressAsPrimary,
    updateTags
} = useContactDetails()

// Computed properties
const contactData = computed(() => contactDetails.value?.contact)
const companies = computed(() => contactDetails.value?.companies || [])
const addresses = computed(() => contactDetails.value?.addresses || [])
const tags = computed(() => contactDetails.value?.tags || [])

// État local pour l'édition
const isEditing = ref(false)
const isEditingNotes = ref(false)
const editedContact = ref<any>({})
const selectedTags = ref(tags.value)

// État pour l'ajout d'entreprise
const showAddCompanyDialog = ref(false)
const selectedCompanyId = ref<number | null>(null)
const newCompanyRole = ref('')
const newCompanyIsDecisionMaker = ref(false)
const availableCompanies = ref([]) // À remplir avec les entreprises disponibles

// État pour la gestion des adresses
const showAddAddressDialog = ref(false)
const currentEditAddress = ref<any>(null)

// Gestion de l'édition
const startEditing = () => {
    if (contactData.value) {
        editedContact.value = { ...contactData.value }
        isEditing.value = true
    }
}

const cancelEdit = () => {
    if (contactData.value) {
        editedContact.value = { ...contactData.value }
        isEditing.value = false
    }
}

const saveChanges = async () => {
    try {
        await updateContact(contactData.value!.id, editedContact.value)
        isEditing.value = false
        toast({
            title: "Modifications enregistrées",
            description: "Les informations du contact ont été mises à jour"
        })
    } catch (error) {
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la sauvegarde",
            variant: "destructive"
        })
    }
}

// Gestion des notes
const cancelEditNotes = () => {
    editedContact.value.notes = contactData.value?.notes
    isEditingNotes.value = false
}

const saveNotes = async () => {
    try {
        await updateContact(contactData.value!.id, { notes: editedContact.value.notes })
        isEditingNotes.value = false
        toast({
            title: "Notes enregistrées",
            description: "Les notes ont été mises à jour"
        })
    } catch (error) {
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la sauvegarde des notes",
            variant: "destructive"
        })
    }
}

// Gestion des entreprises
const addCompany = async () => {
    if (!selectedCompanyId.value) return

    try {
        await addCompanyToContact(
            contactData.value!.id,
            selectedCompanyId.value,
            newCompanyRole.value,
            newCompanyIsDecisionMaker.value
        )
        showAddCompanyDialog.value = false
        selectedCompanyId.value = null
        newCompanyRole.value = ''
        newCompanyIsDecisionMaker.value = false
        toast({
            title: "Entreprise ajoutée",
            description: "L'entreprise a été associée au contact"
        })
    } catch (error) {
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de l'ajout de l'entreprise",
            variant: "destructive"
        })
    }
}

const removeCompany = async (companyId: number) => {
    try {
        await removeCompanyFromContact(contactData.value!.id, companyId)
        toast({
            title: "Entreprise retirée",
            description: "L'entreprise a été dissociée du contact"
        })
    } catch (error) {
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la suppression de l'entreprise",
            variant: "destructive"
        })
    }
}

// Gestion des adresses
const handleAddAddress = async (addressData: any) => {
    try {
        await addAddress(contactData.value!.id, addressData)
        toast({
            title: "Adresse ajoutée",
            description: "L'adresse a été ajoutée avec succès"
        })
    } catch (error) {
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de l'ajout de l'adresse",
            variant: "destructive"
        })
    }
}

const handleUpdateAddress = async (addressData: any) => {
    try {
        await updateAddress(addressData.id, addressData)
        toast({
            title: "Adresse modifiée",
            description: "L'adresse a été mise à jour avec succès"
        })
    } catch (error) {
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la modification de l'adresse",
            variant: "destructive"
        })
    }
}

const handleDeleteAddress = async (addressId: number) => {
    try {
        await deleteAddress(addressId)
        toast({
            title: "Adresse supprimée",
            description: "L'adresse a été supprimée avec succès"
        })
    } catch (error) {
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la suppression de l'adresse",
            variant: "destructive"
        })
    }
}

const handleSetAddressAsPrimary = async (addressId: number) => {
    try {
        await setAddressAsPrimary(contactData.value!.id, addressId)
        toast({
            title: "Adresse principale",
            description: "L'adresse a été définie comme principale"
        })
    } catch (error) {
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la modification de l'adresse principale",
            variant: "destructive"
        })
    }
}

const editAddress = (address: any) => {
    currentEditAddress.value = address
    showAddAddressDialog.value = true
}

// Gestion des tags
const handleTagsUpdate = async (newTags: string[]) => {
    try {
        await updateTags(contactData.value!.id, newTags)
        toast({
            title: "Tags mis à jour",
            description: "Les tags ont été mis à jour avec succès"
        })
    } catch (error) {
        toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la mise à jour des tags",
            variant: "destructive"
        })
    }
}

// Initialisation
onMounted(async () => {
    const contactId = parseInt(route.params.id as string)
    if (!isNaN(contactId)) {
        await fetchContactDetails(contactId)
        if (contactData.value) {
            editedContact.value = { ...contactData.value }
        }
    }
})
</script>

<style>
.prose {
    max-width: none;
}
</style> 