<template>
  <div class="space-y-6">
    <!-- Informations générales -->
    <Card>
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
        <CardDescription>Informations principales du contact</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-6">
        <div class="grid grid-cols-2 gap-4">
          <!-- Prénom -->
          <div>
            <Label for="first-name">Prénom</Label>
            <Input 
              id="first-name" 
              v-model="formData.first_name" 
              required 
            />
          </div>

          <!-- Nom -->
          <div>
            <Label for="last-name">Nom</Label>
            <Input 
              id="last-name" 
              v-model="formData.last_name" 
              required 
            />
          </div>

          <!-- Email -->
          <div>
            <Label for="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              v-model="formData.email" 
            />
          </div>

          <!-- Téléphone -->
          <div>
            <Label for="phone">Téléphone</Label>
            <Input 
              id="phone" 
              type="tel" 
              v-model="formData.phone" 
            />
          </div>

          <!-- Mobile -->
          <div>
            <Label for="mobile">Mobile</Label>
            <Input 
              id="mobile" 
              type="tel" 
              v-model="formData.mobile_phone" 
            />
          </div>

          <!-- Fonction -->
          <div>
            <Label for="job-title">Fonction</Label>
            <Input 
              id="job-title" 
              v-model="formData.job_title" 
            />
          </div>

          <!-- Service -->
          <div>
            <Label for="department">Service</Label>
            <Input 
              id="department" 
              v-model="formData.department" 
            />
          </div>

          <!-- Statut -->
          <div>
            <Label for="status">Statut</Label>
            <Select v-model="formData.status">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Entreprise -->
          <div class="col-span-2">
            <Label for="company">Entreprise</Label>
            <Select v-model="formData.company_id">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une entreprise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="company in companies" :key="company.id" :value="company.id">
                  {{ company.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Adresse -->
    <Card v-if="showAddress">
      <CardHeader>
        <CardTitle>Adresse</CardTitle>
        <CardDescription>Adresse principale du contact</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-6">
        <div class="grid grid-cols-6 gap-4">
          <!-- Numéro -->
          <div class="col-span-1">
            <Label for="street-number">N°</Label>
            <Input id="street-number" v-model="formData.address.street_number" />
          </div>

          <!-- Rue -->
          <div class="col-span-5">
            <Label for="street-name">Rue</Label>
            <Input id="street-name" v-model="formData.address.street_name" />
          </div>

          <!-- Complément -->
          <div class="col-span-6">
            <Label for="address-line2">Complément d'adresse</Label>
            <Input id="address-line2" v-model="formData.address.address_line2" />
          </div>

          <!-- Code postal -->
          <div class="col-span-2">
            <Label for="postal-code">Code postal</Label>
            <Input id="postal-code" v-model="formData.address.postal_code" />
          </div>

          <!-- Ville -->
          <div class="col-span-4">
            <Label for="city">Ville</Label>
            <Input id="city" v-model="formData.address.city" />
          </div>

          <!-- Pays -->
          <div class="col-span-6">
            <Label for="country">Pays</Label>
            <Select v-model="formData.address.country_id">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="country in countries" :key="country.id" :value="country.id">
                  {{ country.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Type d'adresse -->
          <div class="col-span-3">
            <Label for="address-type">Type d'adresse</Label>
            <Select v-model="formData.address.address_type">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Principale</SelectItem>
                <SelectItem value="billing">Facturation</SelectItem>
                <SelectItem value="shipping">Livraison</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Adresse principale -->
          <div class="col-span-3 flex items-center space-x-2">
            <Checkbox id="is-primary" v-model="formData.address.is_primary" />
            <Label for="is-primary">Adresse principale</Label>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Boutons d'action -->
    <div v-if="showActions" class="flex justify-end gap-4">
      <Button type="button" variant="outline" @click="onCancel">
        Annuler
      </Button>
      <Button type="submit" :disabled="loading">
        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        {{ submitLabel }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useContacts } from '../../composables/useContacts'
import type { CreateContactData } from '../../composables/useContacts'

// Props et émetteurs
const props = defineProps<{
  initialData?: Partial<CreateContactData>
  loading?: boolean
  showActions?: boolean
  showAddress?: boolean
  submitLabel?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: CreateContactData): void
  (e: 'submit'): void
  (e: 'cancel'): void
}>()

// Charger les données nécessaires
const { fetchCompanies, fetchCountries } = useContacts()
const companies = ref<Array<{ id: number, name: string }>>([])
const countries = ref<Array<{ id: number, name: string }>>([])

// Charger les données des listes déroulantes
const loadData = async () => {
  try {
    const [companiesData, countriesData] = await Promise.all([
      fetchCompanies(),
      fetchCountries()
    ])
    companies.value = companiesData
    countries.value = countriesData
  } catch (error) {
    console.error('Erreur chargement données:', error)
  }
}

// Initialiser les données du formulaire
const formData = ref<CreateContactData>({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  mobile_phone: '',
  job_title: '',
  department: '',
  status: 'active',
  address: {
    street_number: '',
    street_name: '',
    address_line2: '',
    postal_code: '',
    city: '',
    country_id: 0,
    address_type: 'main',
    is_primary: true,
  },
  company_id: undefined,
  ...props.initialData,
})

// Observer les changements dans les données du formulaire
watch(formData, (newValue) => {
  emit('update:modelValue', newValue as CreateContactData)
}, { deep: true })

// Si les données initiales changent, mettre à jour le formulaire
watch(() => props.initialData, (newData) => {
  if (newData) {
    formData.value = {
      ...formData.value,
      ...newData
    }
  }
}, { deep: true })

// Gérer les actions du formulaire
const onCancel = () => {
  emit('cancel')
}

// Initialiser le composant
onMounted(() => {
  loadData()
  
  // Si des données initiales sont fournies, mettre à jour le formulaire
  if (props.initialData) {
    formData.value = { 
      ...formData.value, 
      ...props.initialData 
    }
  }
})
</script> 