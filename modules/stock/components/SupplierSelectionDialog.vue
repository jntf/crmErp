<template>
    <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
        <DialogContent class="max-w-3xl">
            <DialogHeader>
                <DialogTitle>{{ currentStep === 1 ? 'Sélectionner un fournisseur' : 'Informations supplémentaires' }}</DialogTitle>
                <DialogDescription>
                    {{ currentStep === 1 ? 'Choisissez un fournisseur existant ou créez-en un nouveau' : 'Complétez les informations pour finaliser l\'attribution' }}
                </DialogDescription>
            </DialogHeader>

            <!-- Étape 1: Sélection du fournisseur -->
            <div v-if="currentStep === 1" class="space-y-4 py-4">
                <div v-if="suppliers.length === 0" class="text-center py-4">
                    <p class="text-muted-foreground mb-4">Aucun fournisseur trouvé.</p>
                    <Button @click="showCreateSupplierDialog = true">
                        <Plus class="w-4 h-4 mr-2" />
                        Créer un nouveau fournisseur
                    </Button>
                </div>
                <div v-else>
                    <div class="flex items-center space-x-4 mb-4">
                        <Input 
                            v-model="searchQuery" 
                            placeholder="Rechercher un fournisseur..." 
                            @input="searchSuppliers"
                        >
                            <template #prefix>
                                <Search class="w-4 h-4 text-muted-foreground" />
                            </template>
                        </Input>
                        <Button variant="outline" @click="showCreateSupplierDialog = true">
                            <Plus class="w-4 h-4 mr-2" />
                            Nouveau
                        </Button>
                    </div>
                    <ScrollArea class="h-[300px] rounded-md border p-4">
                        <div class="space-y-2">
                            <div v-for="supplier in displayedSuppliers" 
                                :key="supplier.id"
                                class="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                                :class="{ 'bg-muted': selectedSupplier?.id === supplier.id }"
                                @click="selectSupplier(supplier)"
                            >
                                <div>
                                    <p class="font-medium">{{ supplier.name }}</p>
                                    <p class="text-sm text-muted-foreground">{{ supplier.vat_number }}</p>
                                </div>
                                <Button variant="ghost" size="sm" @click.stop="editSupplier(supplier)">
                                    <Pencil class="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <!-- Étape 2: Informations supplémentaires -->
            <div v-if="currentStep === 2" class="space-y-4 py-4">
                <div class="grid gap-4">
                    <div class="grid gap-2">
                        <Label for="purchaseDate">Date d'entrée en stock</Label>
                        <Input 
                            id="purchaseDate" 
                            v-model="purchaseDate" 
                            type="date"
                        />
                    </div>
                    <div class="grid gap-2">
                        <Label for="notes">Notes</Label>
                        <Textarea 
                            id="notes" 
                            v-model="notes" 
                            placeholder="Ajoutez des notes concernant ce fournisseur..."
                        />
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button 
                    v-if="currentStep === 1" 
                    variant="outline" 
                    @click="$emit('update:modelValue', false)"
                >
                    Annuler
                </Button>
                <Button 
                    v-if="currentStep === 2" 
                    variant="outline" 
                    @click="currentStep--"
                >
                    Retour
                </Button>
                <Button 
                    :disabled="currentStep === 1 && !selectedSupplier"
                    @click="currentStep === 1 ? nextStep() : confirmSelection()"
                >
                    {{ currentStep === 1 ? 'Suivant' : 'Confirmer' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Modal de création/édition de fournisseur -->
    <Dialog :open="showCreateSupplierDialog" @update:open="showCreateSupplierDialog = $event">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ editingSupplier ? 'Modifier' : 'Créer' }} un fournisseur</DialogTitle>
            </DialogHeader>
            <form @submit.prevent="editingSupplier ? updateSupplier() : createSupplier()" class="space-y-4 py-4">
                <div class="grid gap-4">
                    <div class="grid gap-2">
                        <Label for="vatNumber">Numéro TVA</Label>
                        <div class="flex space-x-2">
                            <Input 
                                id="vatNumber" 
                                v-model="vatNumber" 
                                placeholder="ex: NL810462783B01"
                            />
                            <Button type="button" variant="outline" @click="handleVATValidation">
                                Valider
                            </Button>
                        </div>
                    </div>
                    <div class="grid gap-2">
                        <Label for="supplierName">Nom du fournisseur</Label>
                        <Input 
                            id="supplierName" 
                            v-model="newSupplierName" 
                            required
                        />
                    </div>
                    <div class="grid gap-2">
                        <Label for="streetAddress">Adresse</Label>
                        <Input 
                            id="streetAddress" 
                            v-model="streetAddress"
                        />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label for="zipCode">Code Postal</Label>
                            <Input 
                                id="zipCode" 
                                v-model="zipCode"
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label for="city">Ville</Label>
                            <Input 
                                id="city" 
                                v-model="city"
                            />
                        </div>
                    </div>
                    <div class="grid gap-2">
                        <Label for="supplierCountry">Pays</Label>
                        <Input 
                            id="supplierCountry" 
                            v-model="supplierCountry"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" @click="cancelSupplierDialog">
                        Annuler
                    </Button>
                    <Button type="submit">
                        {{ editingSupplier ? 'Mettre à jour' : 'Créer' }}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Pencil } from 'lucide-vue-next'
import { validateVAT } from '@/services/vatValidate'
import type { Supplier, SupplierAddress, VehicleOwnership, Database } from '../types'
import { VehicleOwnershipType } from '../types'
import type { Vehicle } from '../types'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabase = useSupabaseClient<Database>()
const { toast } = useToast()

const props = defineProps<{
    modelValue: boolean
    selectedVehicles: Vehicle[]
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'supplier-selected': [supplier: Supplier]
}>()

// États
const currentStep = ref(1)
const searchQuery = ref('')
const suppliers = ref<Supplier[]>([])
const filteredSuppliers = ref<Supplier[]>([])
const selectedSupplier = ref<Supplier | null>(null)
const showCreateSupplierDialog = ref(false)
const editingSupplier = ref<Supplier | null>(null)

// États pour le formulaire de création/édition
const vatNumber = ref('')
const newSupplierName = ref('')
const streetAddress = ref('')
const zipCode = ref('')
const city = ref('')
const supplierCountry = ref('')
const countryId = ref<number | null>(null)

// États pour l'étape 2
const purchaseDate = ref(new Date().toISOString().split('T')[0])
const notes = ref('')

// Computed
const displayedSuppliers = computed(() => filteredSuppliers.value.slice(0, 10))

// Méthodes
const fetchSuppliers = async () => {
    const { data, error } = await supabase
        .from('companies')
        .select(`
            id, 
            name,
            vat_number,
            domain,
            is_supplier
        `)
        .eq('is_supplier', true)

    if (error) {
        console.error('Error fetching suppliers:', error)
        toast({
            title: 'Erreur',
            description: 'Impossible de charger les fournisseurs',
            variant: 'destructive'
        })
    } else {
        suppliers.value = data || []
        filteredSuppliers.value = data || []
    }
}

const searchSuppliers = () => {
    if (!searchQuery.value.trim()) {
        filteredSuppliers.value = suppliers.value
        return
    }

    const query = searchQuery.value.toLowerCase()
    filteredSuppliers.value = suppliers.value.filter(supplier =>
        supplier.name.toLowerCase().includes(query) ||
        (supplier.vat_number && supplier.vat_number.toLowerCase().includes(query))
    )
}

const selectSupplier = (supplier: any) => {
    selectedSupplier.value = supplier
}

const nextStep = () => {
    if (selectedSupplier.value) {
        currentStep.value = 2
    }
}

const handleVATValidation = async () => {
    try {
        const result = await validateVAT(vatNumber.value)
        if (result.isValid && result.companyInfo) {
            newSupplierName.value = result.companyInfo.name
            streetAddress.value = result.companyInfo.streetAddress
            zipCode.value = result.companyInfo.zipCode
            city.value = result.companyInfo.city
            supplierCountry.value = result.companyInfo.countryCode
            await fetchCountryId(result.companyInfo.countryCode)
            toast({
                title: 'Succès',
                description: 'Numéro de TVA valide'
            })
        } else {
            toast({
                title: 'Erreur',
                description: result.error || 'Numéro de TVA invalide',
                variant: 'destructive'
            })
        }
    } catch (error) {
        console.error('Erreur lors de la validation:', error)
        toast({
            title: 'Erreur',
            description: 'Impossible de valider le numéro de TVA',
            variant: 'destructive'
        })
    }
}

const fetchCountryId = async (countryCode: string) => {
    const { data, error } = await supabase
        .from('countries')
        .select('id')
        .eq('iso_code_2', countryCode)
        .single()

    if (error) {
        console.error('Erreur lors de la récupération du pays:', error)
        return
    }

    countryId.value = data.id
}

const createSupplier = async () => {
    if (!newSupplierName.value.trim() || !vatNumber.value.trim()) {
        toast({
            title: 'Erreur',
            description: 'Le nom et le numéro de TVA sont requis',
            variant: 'destructive'
        })
        return
    }

    try {
        // Création de l'entreprise
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .insert({
                name: newSupplierName.value.trim(),
                vat_number: vatNumber.value.trim(),
                domain: extractDomainFromEmail(vatNumber.value),
                is_supplier: true,
                created_by: 'system',
                updated_by: 'system'
            })
            .select()
            .single()

        if (companyError) throw companyError
        if (!company) throw new Error('Aucune donnée retournée')

        // Création de l'adresse si fournie
        if (streetAddress.value && zipCode.value && city.value && countryId.value) {
            const { error: addressError } = await supabase
                .from('company_addresses')
                .insert({
                    company_id: company.id,
                    adress_line1: streetAddress.value,
                    zip_code: zipCode.value,
                    city: city.value,
                    country_id: countryId.value
                })

            if (addressError) {
                console.error('Error creating company address:', addressError)
            }
        }

        toast({
            title: 'Succès',
            description: 'Fournisseur créé avec succès'
        })

        // Mise à jour de la liste et sélection du nouveau fournisseur
        await fetchSuppliers()
        selectSupplier(company)
        showCreateSupplierDialog.value = false
        resetSupplierForm()
    } catch (error) {
        console.error('Error creating supplier:', error)
        toast({
            title: 'Erreur',
            description: 'Impossible de créer le fournisseur',
            variant: 'destructive'
        })
    }
}

const updateSupplier = async () => {
    if (!editingSupplier.value || !newSupplierName.value.trim()) return

    try {
        const { data, error } = await supabase
            .from('companies')
            .update({
                name: newSupplierName.value.trim(),
                vat_number: vatNumber.value.trim(),
                updated_by: 'system'
            })
            .eq('id', editingSupplier.value.id)
            .select()
            .single()

        if (error) throw error
        if (!data) throw new Error('Aucune donnée retournée')

        toast({
            title: 'Succès',
            description: 'Fournisseur mis à jour avec succès'
        })

        await fetchSuppliers()
        selectSupplier(data)
        showCreateSupplierDialog.value = false
        resetSupplierForm()
    } catch (error) {
        console.error('Error updating supplier:', error)
        toast({
            title: 'Erreur',
            description: 'Impossible de mettre à jour le fournisseur',
            variant: 'destructive'
        })
    }
}

const confirmSelection = async () => {
    if (!selectedSupplier.value) return

    try {
        // Préparation des données pour l'insertion en lot
        const ownershipData = props.selectedVehicles.map(vehicle => ({
            vehicle_id: vehicle.id,
            company_id: Number(selectedSupplier.value!.id),
            ownership_type: VehicleOwnershipType.SUPPLIER,
            start_date: purchaseDate.value,
            is_primary: true,
            notes: notes.value,
            created_by: 'system',
            updated_by: 'system'
        }))

        // Appel de la fonction stockée
        const { data, error } = await supabase
            .rpc('batch_insert_vehicle_ownership', {
                ownership_data: ownershipData
            })

        if (error) throw error

        if (!data.success) {
            throw new Error(data.error || 'Erreur lors de l\'insertion des propriétés')
        }

        toast({
            title: 'Succès',
            description: `${data.inserted_count} véhicule(s) assigné(s) avec succès`
        })

        emit('supplier-selected', selectedSupplier.value)
        emit('update:modelValue', false)
    } catch (error: any) {
        console.error('Error assigning supplier:', error)
        console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        })
        toast({
            title: 'Erreur',
            description: `Impossible d'attribuer le fournisseur: ${error.message || 'Erreur inconnue'}`,
            variant: 'destructive'
        })
    }
}

const editSupplier = (supplier: any) => {
    editingSupplier.value = supplier
    newSupplierName.value = supplier.name
    vatNumber.value = supplier.vat_number || ''
    showCreateSupplierDialog.value = true
}

const cancelSupplierDialog = () => {
    showCreateSupplierDialog.value = false
    resetSupplierForm()
}

const resetSupplierForm = () => {
    editingSupplier.value = null
    vatNumber.value = ''
    newSupplierName.value = ''
    streetAddress.value = ''
    zipCode.value = ''
    city.value = ''
    supplierCountry.value = ''
    countryId.value = null
}

const extractDomainFromEmail = (email: string) => {
    const parts = email.split('@')
    return parts.length > 1 ? parts[1] : null
}

// Initialisation
fetchSuppliers()
</script> 