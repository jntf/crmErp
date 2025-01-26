<template>
    <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
        <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>{{ isEditing ? 'Modifier l\'adresse' : 'Ajouter une adresse' }}</DialogTitle>
            </DialogHeader>
            <form @submit.prevent="handleSubmit" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <!-- Type d'adresse -->
                    <div class="col-span-2">
                        <Label>Type d'adresse</Label>
                        <Select v-model="formData.address_type">
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="main">Principale</SelectItem>
                                <SelectItem value="billing">Facturation</SelectItem>
                                <SelectItem value="shipping">Livraison</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <!-- Numéro et rue -->
                    <div>
                        <Label>Numéro</Label>
                        <Input v-model="formData.street_number" placeholder="123" />
                    </div>
                    <div>
                        <Label>Rue</Label>
                        <Input v-model="formData.street_name" placeholder="Rue de la Paix" />
                    </div>

                    <!-- Complément d'adresse -->
                    <div class="col-span-2">
                        <Label>Complément d'adresse</Label>
                        <Input v-model="formData.address_line2" placeholder="Bâtiment, étage, etc." />
                    </div>

                    <!-- Code postal et ville -->
                    <div>
                        <Label>Code postal</Label>
                        <Input v-model="formData.postal_code" placeholder="75000" />
                    </div>
                    <div>
                        <Label>Ville</Label>
                        <Input v-model="formData.city" placeholder="Paris" />
                    </div>

                    <!-- Pays -->
                    <div class="col-span-2">
                        <Label>Pays</Label>
                        <Select v-model="formData.country_id">
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un pays" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem 
                                    v-for="country in countries" 
                                    :key="country.id" 
                                    :value="country.id"
                                >
                                    {{ country.name }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <!-- Adresse principale -->
                    <div class="col-span-2 flex items-center space-x-2">
                        <Checkbox 
                            id="is-primary" 
                            v-model="formData.is_primary"
                            :disabled="isEditing && currentAddress?.is_primary"
                        />
                        <Label for="is-primary">Définir comme adresse principale</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" @click="$emit('update:modelValue', false)">
                        Annuler
                    </Button>
                    <Button type="submit" :disabled="loading">
                        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                        {{ isEditing ? 'Modifier' : 'Ajouter' }}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useCountries } from '@/modules/entity/composables/useCountries'

interface Address {
    id?: number
    address_type: string
    street_number: string
    street_name: string
    address_line2: string | null
    postal_code: string
    city: string
    country_id: number
    is_primary: boolean
}

const props = defineProps<{
    modelValue: boolean
    currentAddress?: Address
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'save', address: Omit<Address, 'id'>): void
}>()

const { countries, loadCountries } = useCountries()
const loading = ref(false)

const isEditing = computed(() => !!props.currentAddress)

const formData = ref<Omit<Address, 'id'>>({
    address_type: 'main',
    street_number: '',
    street_name: '',
    address_line2: null,
    postal_code: '',
    city: '',
    country_id: 0,
    is_primary: false
})

const handleSubmit = async () => {
    loading.value = true
    try {
        emit('save', formData.value)
        emit('update:modelValue', false)
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    await loadCountries()
    if (props.currentAddress) {
        formData.value = { ...props.currentAddress }
    }
})
</script> 