<template>
  <div class="space-y-6">
    <!-- Informations générales -->
    <Card>
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
        <CardDescription>Informations principales de l'entreprise</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-6 grid-cols-6">
        <!-- Nom -->
        <div class="col-span-6 lg:col-span-4">
          <Label for="company-name">Nom</Label>
          <Field v-slot="{ meta }" name="name">
            <div>
              <Input id="company-name" :value="formData.name"
                @input="(e: Event) => updateFormData('name', (e.target as HTMLInputElement).value)"
                :class="{ 'border-destructive': meta.touched && meta.error }" />
              <span v-if="meta.touched && meta.error" class="text-sm text-destructive">
                {{ meta.error }}
              </span>
            </div>
          </Field>
        </div>

        <!-- Statut -->
        <div class="col-span-6 lg:col-span-2">
          <Label for="company-status">Statut</Label>
          <Field v-slot="{ meta }" name="status">
            <div>
              <Select id="company-status" :model-value="formData.status"
                @update:model-value="(value) => updateFormData('status', value)">
                <SelectTrigger>
                  <SelectValue :placeholder="formData.status || 'Sélectionnez'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Field>
        </div>

        <!-- Code APE/NAF -->
        <div class="col-span-3 lg:col-span-2">
          <Label for="company-domain">Code APE/NAF</Label>
          <Field v-slot="{ meta }" name="domain">
            <div>
              <Input id="company-domain" :value="formData.domain"
                @input="(e: Event) => updateFormData('domain', (e.target as HTMLInputElement).value)" />
            </div>
          </Field>
        </div>

        <!-- Secteur d'activité -->
        <div class="col-span-3 lg:col-span-4">
          <Label for="company-industry">Secteur d'activité</Label>
          <Field v-slot="{ meta }" name="industry">
            <div>
              <Input id="company-industry" :value="formData.industry"
                @input="(e: Event) => updateFormData('industry', (e.target as HTMLInputElement).value)" />
            </div>
          </Field>
        </div>
      </CardContent>
    </Card>

    <!-- Contact & Chiffres clés -->
    <div class="grid gap-6 grid-cols-1 lg:grid-cols-2">
      <!-- Contact -->
      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Email -->
          <div class="grid grid-cols-4 gap-4">
            <div class="col-span-4">
              <Label for="company-email">Email</Label>
              <Field v-slot="{ meta }" name="email">
                <div>
                  <Input id="company-email" type="email" :value="formData.email"
                    @input="(e: Event) => updateFormData('email', (e.target as HTMLInputElement).value)"
                    :class="{ 'border-destructive': meta.touched && meta.error }" />
                  <span v-if="meta.touched && meta.error" class="text-sm text-destructive">
                    {{ meta.error }}
                  </span>
                </div>
              </Field>
            </div>

            <!-- Téléphone -->
            <div class="col-span-2">
              <Label for="company-phone">Téléphone</Label>
              <Field v-slot="{ meta }" name="phone">
                <div>
                  <Input id="company-phone" type="tel" :value="formData.phone"
                    @input="(e: Event) => updateFormData('phone', (e.target as HTMLInputElement).value)" />
                </div>
              </Field>
            </div>

            <!-- Site web -->
            <div class="col-span-4">
              <Label for="company-website">Site web</Label>
              <Field v-slot="{ meta }" name="website">
                <div>
                  <Input id="company-website" type="url" :value="formData.website"
                    @input="(e: Event) => updateFormData('website', (e.target as HTMLInputElement).value)"
                    placeholder="https://"
                    :class="{ 'border-destructive': meta.touched && meta.error }" />
                  <span v-if="meta.touched && meta.error" class="text-sm text-destructive">
                    {{ meta.error }}
                  </span>
                </div>
              </Field>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Chiffres clés -->
      <Card>
        <CardHeader>
          <CardTitle>Chiffres clés</CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-2 gap-4">
          <!-- Employés -->
          <div>
            <Label for="company-employees">Employés</Label>
            <Field v-slot="{ meta }" name="number_of_employees">
              <div>
                <Input id="company-employees" type="number" :value="formData.number_of_employees"
                  @input="(e: Event) => updateFormData('number_of_employees', (e.target as HTMLInputElement).value)" min="0" />
              </div>
            </Field>
          </div>

          <!-- Flotte -->
          <div>
            <Label for="company-fleet">Flotte</Label>
            <Field v-slot="{ meta }" name="fleet_size">
              <div>
                <Input id="company-fleet" type="number" :value="formData.fleet_size"
                  @input="(e: Event) => updateFormData('fleet_size', (e.target as HTMLInputElement).value)" min="0" />
              </div>
            </Field>
          </div>

          <!-- Capital social -->
          <div>
            <Label for="company-capital">Capital social</Label>
            <Field v-slot="{ meta }" name="social_capital">
              <div>
                <Input id="company-capital" type="number" :value="formData.social_capital"
                  @input="(e: Event) => updateFormData('social_capital', (e.target as HTMLInputElement).value)" min="0"
                  step="0.01" />
              </div>
            </Field>
          </div>

          <!-- CA -->
          <div>
            <Label for="company-revenue">CA</Label>
            <Field v-slot="{ meta }" name="revenue">
              <div>
                <Input id="company-revenue" type="number" :value="formData.revenue"
                  @input="(e: Event) => updateFormData('revenue', (e.target as HTMLInputElement).value)" min="0" step="0.01" />
              </div>
            </Field>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Identifiants et Options -->
    <div class="grid gap-6 grid-cols-1 lg:grid-cols-2">
      <!-- Identifiants -->
      <Card>
        <CardHeader>
          <CardTitle>Identifiants</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- SIRET -->
          <Field v-slot="{ meta }" name="tax_number">
            <div class="grid grid-cols-4 gap-4 items-center">
              <Label for="company-siret" class="text-right">SIRET</Label>
              <div class="col-span-3">
                <Input id="company-siret" :value="formData.tax_number"
                  @input="(e: Event) => updateFormData('tax_number', (e.target as HTMLInputElement).value)" />
              </div>
            </div>
          </Field>

          <!-- TVA -->
          <Field v-slot="{ meta }" name="vat_number">
            <div class="grid grid-cols-4 gap-4 items-center">
              <Label for="company-vat" class="text-right">N° TVA</Label>
              <div class="col-span-3">
                <Input id="company-vat" :value="formData.vat_number"
                  @input="(e: Event) => updateFormData('vat_number', (e.target as HTMLInputElement).value)"
                  placeholder="FR1234567890" />
              </div>
            </div>
          </Field>
        </CardContent>
      </Card>

      <!-- Options -->
      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
        </CardHeader>
        <CardContent class="flex gap-8 items-center h-[104px]">
          <!-- Fournisseur -->
          <Label class="flex items-center space-x-2 cursor-pointer">
            <Field v-slot="{ meta }" name="is_supplier">
              <Checkbox :checked="formData.is_supplier"
                @update:checked="(value) => updateFormData('is_supplier', value)" />
            </Field>
            <span>Fournisseur</span>
          </Label>

          <!-- Client -->
          <Label class="flex items-center space-x-2 cursor-pointer">
            <Field v-slot="{ meta }" name="is_customer">
              <Checkbox :checked="formData.is_customer"
                @update:checked="(value) => updateFormData('is_customer', value)" />
            </Field>
            <span>Client</span>
          </Label>
        </CardContent>
      </Card>
    </div>

    <!-- Adresse -->
    <Card>
      <CardHeader>
        <CardTitle>Adresse</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-4">
        <div class="grid grid-cols-6 gap-4">
          <!-- Numéro -->
          <div class="col-span-2 lg:col-span-1">
            <Label for="company-street-number">N°</Label>
            <Field v-slot="{ meta }" name="address.street_number">
              <div>
                <Input id="company-street-number" :value="formData.address?.street_number"
                  @input="(e: Event) => updateNestedFormData('address.street_number', (e.target as HTMLInputElement).value)" />
              </div>
            </Field>
          </div>

          <!-- Rue -->
          <div class="col-span-4 lg:col-span-5">
            <Label for="company-street-name">Rue</Label>
            <Field v-slot="{ meta }" name="address.street_name">
              <div>
                <Input id="company-street-name" :value="formData.address?.street_name"
                  @input="(e: Event) => updateNestedFormData('address.street_name', (e.target as HTMLInputElement).value)" />
              </div>
            </Field>
          </div>
        </div>

        <!-- Complément -->
        <div>
          <Label for="company-address-line2">Complément</Label>
          <Field v-slot="{ meta }" name="address.address_line2">
            <div>
              <Input id="company-address-line2" :value="formData.address?.address_line2"
                @input="(e: Event) => updateNestedFormData('address.address_line2', (e.target as HTMLInputElement).value)" />
            </div>
          </Field>
        </div>

        <div class="grid grid-cols-6 gap-4">
          <!-- Code postal -->
          <div class="col-span-2">
            <Label for="company-postal-code">Code postal</Label>
            <Field v-slot="{ meta }" name="address.postal_code">
              <div>
                <Input id="company-postal-code" :value="formData.address?.postal_code"
                  @input="(e: Event) => updateNestedFormData('address.postal_code', (e.target as HTMLInputElement).value)" />
              </div>
            </Field>
          </div>

          <!-- Ville -->
          <div class="col-span-4">
            <Label for="company-city">Ville</Label>
            <Field v-slot="{ meta }" name="address.city">
              <div>
                <Input id="company-city" :value="formData.address?.city"
                  @input="(e: Event) => updateNestedFormData('address.city', (e.target as HTMLInputElement).value)" />
              </div>
            </Field>
          </div>
        </div>

        <!-- Pays -->
        <div class="w-full lg:w-1/3">
          <Label for="company-country">Pays</Label>
          <Field v-slot="{ meta }" name="address.country_id">
            <div>
              <Select id="company-country" :model-value="formData.address?.country_id"
                @update:model-value="(value) => updateNestedFormData('address.country_id', value)">
                <SelectTrigger>
                  <SelectValue 
                    :placeholder="countries.find(c => c.id === formData.address?.country_id)?.name || 'Sélectionnez'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="country in countries" :key="country.id" :value="country.id">
                    {{ country.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <span v-if="meta.touched && meta.error" class="text-sm text-destructive">
                {{ meta.error }}
              </span>
            </div>
          </Field>
        </div>
      </CardContent>
    </Card>

    <!-- Actions par défaut masquées -->
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
import { computed, onMounted, ref, watch } from 'vue'
import { Field } from 'vee-validate'
import { Loader2 } from 'lucide-vue-next'
import { set } from 'lodash-es'
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
import { useCountries } from '../../composables/useCountries'

const props = defineProps<{
  initialData?: any
  loading?: boolean
  showActions?: boolean
  submitLabel?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'submit'): void
  (e: 'cancel'): void
}>()

// Initialiser le formulaire
const formData = ref<any>({
  name: '',
  status: 'active',
  domain: '',
  industry: '',
  email: '',
  phone: '',
  website: '',
  number_of_employees: 0,
  fleet_size: 0,
  social_capital: 0,
  revenue: 0,
  tax_number: '',
  vat_number: '',
  is_supplier: false,
  is_customer: true,
  description: '',
  address: {
    street_number: '',
    street_name: '',
    address_line2: '',
    postal_code: '',
    city: '',
    country_id: null,
    is_primary: true,
    address_type: 'main'
  },
  ...props.initialData
})

// Charger les pays pour le sélecteur
const { countries, loadCountries } = useCountries()

// Mettre à jour les champs du formulaire
const updateFormData = (field: string, value: any) => {
  formData.value[field] = value
  emit('update:modelValue', formData.value)
}

// Mettre à jour les champs imbriqués (comme address.street_name)
const updateNestedFormData = (path: string, value: any) => {
  const formDataCopy = { ...formData.value }
  set(formDataCopy, path, value)
  formData.value = formDataCopy
  emit('update:modelValue', formData.value)
}

// Si les données initiales changent, mettre à jour le formulaire
watch(() => props.initialData, (newData) => {
  if (newData) {
    formData.value = {
      ...formData.value,
      ...newData
    }
  }
}, { deep: true })

// Émettre les événements pour les actions
const onSubmit = () => {
  emit('submit')
}

const onCancel = () => {
  emit('cancel')
}

// Charger les données nécessaires au chargement du composant
onMounted(() => {
  loadCountries()
  
  // Si des données initiales sont fournies, mettre à jour le formulaire
  if (props.initialData) {
    formData.value = { ...formData.value, ...props.initialData }
  }
})
</script> 