<template>
  <form class="space-y-4 overflow-y-auto" @submit.prevent>
    <!-- SIRET Search -->
    <div>
      <SiretSearch @companyFound="handleCompanyData" />
    </div>

    <!-- Alert when data is prefilled -->
    <Alert v-if="dataFilled" class="mb-4 py-2 bg-green-50 border-green-200 text-green-800">
      <CheckCircleIcon class="h-4 w-4 text-green-600" />
      <AlertTitle class="text-sm font-medium">Données récupérées</AlertTitle>
      <AlertDescription class="text-xs">
        Les informations de l'entreprise ont été récupérées automatiquement. Vérifiez-les avant de valider.
      </AlertDescription>
    </Alert>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Nom -->
      <div class="space-y-2">
        <div class="flex justify-between">
          <Label for="name" class="text-sm font-medium">Nom <span class="text-red-500">*</span></Label>
          <Badge v-if="dataFilled" variant="outline" class="text-xs font-normal h-5 bg-green-50 text-green-700 border-green-200">API SIRET</Badge>
        </div>
        <Input 
          id="name" 
          v-model="formData.name" 
          placeholder="Nom de l'entreprise" 
          required
        />
      </div>
      
      <!-- Téléphone -->
      <div class="space-y-2">
        <div class="flex justify-between">
          <Label for="phone" class="text-sm font-medium">Téléphone</Label>
          <Badge v-if="dataFilled && formData.phone" variant="outline" class="text-xs font-normal h-5 bg-green-50 text-green-700 border-green-200">API SIRET</Badge>
        </div>
        <Input 
          id="phone" 
          v-model="formData.phone" 
          placeholder="Téléphone de l'entreprise"
        />
      </div>
      
      <!-- Email -->
      <div class="space-y-2">
        <div class="flex justify-between">
          <Label for="email" class="text-sm font-medium">Email</Label>
          <Badge v-if="dataFilled && formData.email" variant="outline" class="text-xs font-normal h-5 bg-green-50 text-green-700 border-green-200">API SIRET</Badge>
        </div>
        <Input 
          id="email" 
          v-model="formData.email" 
          type="email" 
          placeholder="contact@entreprise.com"
        />
      </div>
      
      <!-- Site web -->
      <div class="space-y-2">
        <div class="flex justify-between">
          <Label for="website" class="text-sm font-medium">Site web</Label>
          <Badge v-if="dataFilled && formData.website" variant="outline" class="text-xs font-normal h-5 bg-green-50 text-green-700 border-green-200">API SIRET</Badge>
        </div>
        <Input 
          id="website" 
          v-model="formData.website" 
          placeholder="www.entreprise.com"
        />
      </div>
      
      <!-- SIRET -->
      <div class="space-y-2">
        <div class="flex justify-between">
          <Label for="tax_number" class="text-sm font-medium">SIRET</Label>
          <Badge v-if="dataFilled && formData.tax_number" variant="outline" class="text-xs font-normal h-5 bg-green-50 text-green-700 border-green-200">API SIRET</Badge>
        </div>
        <Input 
          id="tax_number" 
          v-model="formData.tax_number" 
          placeholder="12345678901234"
        />
      </div>
      
      <!-- TVA -->
      <div class="space-y-2">
        <div class="flex justify-between">
          <Label for="vat_number" class="text-sm font-medium">Numéro TVA</Label>
          <Badge v-if="dataFilled && formData.vat_number" variant="outline" class="text-xs font-normal h-5 bg-green-50 text-green-700 border-green-200">API SIRET</Badge>
        </div>
        <Input 
          id="vat_number" 
          v-model="formData.vat_number" 
          placeholder="FR12345678901"
        />
      </div>
      
      <!-- Secteur -->
      <div class="space-y-2">
        <div class="flex justify-between">
          <Label for="industry" class="text-sm font-medium">Secteur d'activité</Label>
          <Badge v-if="dataFilled && formData.industry" variant="outline" class="text-xs font-normal h-5 bg-green-50 text-green-700 border-green-200">API SIRET</Badge>
        </div>
        <Input 
          id="industry" 
          v-model="formData.industry" 
          placeholder="Ex: Informatique, Commerce..."
        />
      </div>
      
      <!-- Domaine -->
      <div class="space-y-2">
        <div class="flex justify-between">
          <Label for="domain" class="text-sm font-medium">Domaine</Label>
          <Badge v-if="dataFilled && formData.domain" variant="outline" class="text-xs font-normal h-5 bg-green-50 text-green-700 border-green-200">API SIRET</Badge>
        </div>
        <Input 
          id="domain" 
          v-model="formData.domain" 
          placeholder="Ex: entreprise.com"
        />
      </div>

      <!-- Nombre de salariés -->
      <div class="space-y-2">
        <div class="flex justify-between">
          <Label for="number_of_employees" class="text-sm font-medium">Nombre de salariés</Label>
          <Badge v-if="dataFilled && formData.number_of_employees" variant="outline" class="text-xs font-normal h-5 bg-green-50 text-green-700 border-green-200">API SIRET</Badge>
        </div>
        <Input 
          id="number_of_employees" 
          v-model="formData.number_of_employees" 
          placeholder="Ex: 15"
          type="number"
        />
      </div>

      <!-- Date de création -->
      <div class="space-y-2">
        <div class="flex justify-between">
          <Label for="creation_date" class="text-sm font-medium">Date de création</Label>
          <Badge v-if="dataFilled && formData.creation_date" variant="outline" class="text-xs font-normal h-5 bg-green-50 text-green-700 border-green-200">API SIRET</Badge>
        </div>
        <Input 
          id="creation_date" 
          v-model="formData.creation_date" 
          placeholder="Ex: 15/03/2010"
        />
      </div>
    </div>

    <!-- Adresse -->
    <div class="pt-4">
      <div class="flex justify-between mb-2">
        <div class="text-sm font-medium">Adresse</div>
        <Badge v-if="dataFilled && hasAddressData" variant="outline" class="text-xs font-normal h-5 bg-green-50 text-green-700 border-green-200">API SIRET</Badge>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Numéro de voie -->
        <div class="space-y-2">
          <Label for="street_number" class="text-sm font-medium">Numéro de voie</Label>
          <Input 
            id="street_number" 
            v-model="formData.address.street_number" 
            placeholder="Ex: 12"
          />
        </div>
        
        <!-- Nom de rue -->
        <div class="space-y-2">
          <Label for="street_name" class="text-sm font-medium">Nom de rue</Label>
          <Input 
            id="street_name" 
            v-model="formData.address.street_name" 
            placeholder="Ex: Rue de la Paix"
          />
        </div>
        
        <!-- Code postal -->
        <div class="space-y-2">
          <Label for="postal_code" class="text-sm font-medium">Code postal</Label>
          <Input 
            id="postal_code" 
            v-model="formData.address.postal_code" 
            placeholder="Ex: 75000"
          />
        </div>
        
        <!-- Ville -->
        <div class="space-y-2">
          <Label for="city" class="text-sm font-medium">Ville</Label>
          <Input 
            id="city" 
            v-model="formData.address.city" 
            placeholder="Ex: Paris"
          />
        </div>

        <!-- Pays -->
        <div class="space-y-2 md:col-span-2">
          <Label for="country" class="text-sm font-medium">Pays</Label>
          <Select 
            v-model="formData.address.country_id" 
            :disabled="isCountriesLoading"
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Sélectionnez un pays" />
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
      </div>
    </div>
    
    <!-- Options -->
    <div class="space-y-2 pt-2">
      <Label class="text-sm font-medium">Options</Label>
      <div class="flex flex-wrap space-x-4 items-center">
        <div class="flex items-center space-x-2">
          <Checkbox id="is_customer" v-model="formData.is_customer" />
          <Label for="is_customer" class="text-sm">Client</Label>
        </div>
        <div class="flex items-center space-x-2">
          <Checkbox id="is_supplier" v-model="formData.is_supplier" />
          <Label for="is_supplier" class="text-sm">Fournisseur</Label>
        </div>
        <div class="flex items-center space-x-2">
          <Checkbox id="is_carrier" v-model="formData.is_carrier" />
          <Label for="is_carrier" class="text-sm">Transporteur</Label>
        </div>
      </div>
    </div>
  </form>
</template> 

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import SiretSearch from '../../../entity/components/SiretSearch.vue'
import { CheckCircleIcon } from 'lucide-vue-next'
import { useCountries } from '../../../entity/composables/useCountries'

const props = defineProps<{
  initialData: Record<string, any>
}>()

console.log("initialData reçu:", props.initialData)

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
}>()

// Charger les pays
const { countries, loadCountries } = useCountries()
const isCountriesLoading = ref(true)

onMounted(async () => {
  isCountriesLoading.value = true
  await loadCountries()
  isCountriesLoading.value = false
})

const formData = ref<Record<string, any>>({
  name: '',
  phone: '',
  email: '',
  website: '',
  tax_number: '',
  vat_number: '',
  industry: '',
  domain: '',
  status: 'active',
  number_of_employees: '',
  creation_date: '',
  is_customer: false,
  is_supplier: false,
  is_carrier: false,
  contact_type: [], // Pour stocker les types depuis contact-staging
  address: {
    street_number: '',
    street_name: '',
    postal_code: '',
    city: '',
    country_id: '1' // ID France par défaut comme string
  }
})

const formPreFilled = ref(false)
const siretQuery = ref('')
const loading = ref(false)
const dataFilled = ref(false)

// Vérifier si les données d'adresse sont disponibles
const hasAddressData = computed(() => {
  return (
    formData.value.address.street_number || 
    formData.value.address.street_name || 
    formData.value.address.postal_code || 
    formData.value.address.city
  )
})

// Fonction pour traiter les types de contact
const processContactType = (contactType: any) => {
  console.log('Traitement du contact_type:', contactType)
  
  if (typeof contactType === 'string') {
    try {
      // Si c'est une chaîne JSON, on essaie de la parser
      const types = JSON.parse(contactType)
      formData.value.is_supplier = types.includes('supplier')
      formData.value.is_customer = types.includes('customer')
      formData.value.is_carrier = types.includes('carrier')
      console.log('ContactType parsé:', types)
    } catch (e) {
      // Si ce n'est pas du JSON valide, on vérifie si c'est une simple chaîne
      formData.value.is_supplier = contactType.includes('supplier')
      formData.value.is_customer = contactType.includes('customer')
      formData.value.is_carrier = contactType.includes('carrier')
      console.log('ContactType comme chaîne:', contactType)
    }
  } else if (Array.isArray(contactType)) {
    // Si c'est déjà un tableau
    formData.value.is_supplier = contactType.includes('supplier')
    formData.value.is_customer = contactType.includes('customer')
    formData.value.is_carrier = contactType.includes('carrier')
    console.log('ContactType comme tableau:', contactType, 'is_customer:', formData.value.is_customer)
  }
}

// Initialiser formData avec initialData si disponible
onMounted(() => {
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    console.log('Initialisation avec:', props.initialData)
    
    // Copier les valeurs de initialData en préservant les booléens
    formData.value = {
      ...structuredClone(props.initialData),
      // Garder les valeurs booléennes existantes ou utiliser les valeurs par défaut
      is_customer: props.initialData.is_customer === true || false,
      is_supplier: props.initialData.is_supplier === true || false,
      is_carrier: props.initialData.is_carrier === true || false
    }
    
    // S'assurer que l'objet address existe
    if (!formData.value.address) {
      formData.value.address = {
        street_number: '',
        street_name: '',
        postal_code: '',
        city: '',
        country_id: '1' // Comme string
      }
    } else {
      // Convertir l'ID pays en string s'il est numérique
      if (formData.value.address.country_id !== undefined) {
        formData.value.address.country_id = String(formData.value.address.country_id)
      }
    }

    // Si contact_type est présent, le traiter en plus des booléens directs
    if (props.initialData.contact_type) {
      processContactType(props.initialData.contact_type)
    }
    
    console.log('État final des checkboxes après initialisation:', {
      customer: formData.value.is_customer,
      supplier: formData.value.is_supplier,
      carrier: formData.value.is_carrier
    })
  }
})

// Surveiller les changements dans formData et émettre les mises à jour
watch(formData, (newValue) => {
  // Générer le contact_type en fonction des checkboxes
  const contactType = []
  if (newValue.is_supplier) contactType.push('supplier')
  if (newValue.is_customer) contactType.push('customer')
  if (newValue.is_carrier) contactType.push('carrier')
  
  newValue.contact_type = contactType
  
  emit('update:modelValue', newValue)
}, { deep: true })

// Surveiller les changements dans initialData et mettre à jour formData
watch(() => props.initialData, (newValue) => {
  if (newValue && Object.keys(newValue).length > 0) {
    console.log('Mise à jour depuis props:', newValue)
    
    // Sauvegarder l'état actuel des checkboxes
    const currentCheckboxes = {
      is_customer: formData.value.is_customer,
      is_supplier: formData.value.is_supplier,
      is_carrier: formData.value.is_carrier
    }
    
    // Mettez à jour le formulaire avec les nouvelles données
    formData.value = {
      ...structuredClone(newValue),
      // Priorité 1: Valeurs booléennes directes de initialData
      is_customer: newValue.is_customer === true || currentCheckboxes.is_customer || false,
      is_supplier: newValue.is_supplier === true || currentCheckboxes.is_supplier || false,
      is_carrier: newValue.is_carrier === true || currentCheckboxes.is_carrier || false
    }
    
    // S'assurer que l'objet address existe
    if (!formData.value.address) {
      formData.value.address = {
        street_number: '',
        street_name: '',
        postal_code: '',
        city: '',
        country_id: '1' // Comme string
      }
    } else {
      // Convertir l'ID pays en string s'il est numérique
      if (formData.value.address.country_id !== undefined) {
        formData.value.address.country_id = String(formData.value.address.country_id)
      }
    }

    // Priorité 2: Si contact_type est présent, le traiter également
    if (newValue.contact_type) {
      processContactType(newValue.contact_type)
    }
    
    console.log('État final des checkboxes après mise à jour:', {
      customer: formData.value.is_customer,
      supplier: formData.value.is_supplier,
      carrier: formData.value.is_carrier
    })
  }
}, { deep: true })

// Fonction pour traiter les données de l'entreprise récupérées via SIRET
const handleCompanyData = (data: any) => {
  console.log('Données reçues de SiretSearch:', data)
  
  if (data && data.success && data.result && data.result.organization) {
    const org = data.result.organization
    
    // Sauvegarder l'état actuel des checkboxes
    const currentCheckboxes = {
      is_customer: formData.value.is_customer,
      is_supplier: formData.value.is_supplier,
      is_carrier: formData.value.is_carrier
    }
    
    // Mise à jour des données du formulaire
    formData.value = {
      ...formData.value,
      name: org.name || '',
      domain: org.legal_classification?.code || org.activity?.ape_code || '',
      industry: org.activity?.sector || org.activity?.ape_name || '',
      tax_number: data.query?.siret || org.siret || org.full_registration_number || '',
      vat_number: org.vat_number || '',
      email: org.email || '',
      phone: org.phone || '',
      website: org.website || org.web_infos?.website_url || '',
      number_of_employees: org.staff?.size || '',
      status: org.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
      creation_date: org.creation_date ? new Date(org.creation_date).toLocaleDateString('fr-FR') : '',
      address: {
        street_number: org.address?.street_number || '',
        street_name: org.address?.street || '',
        postal_code: org.address?.postal_code || '',
        city: org.address?.city || '',
        country_id: org.address?.country_code === 'FR' ? '1' : '75' // Comme string
      },
      // Restaurer les checkboxes
      is_customer: currentCheckboxes.is_customer,
      is_supplier: currentCheckboxes.is_supplier,
      is_carrier: currentCheckboxes.is_carrier
    }
    
    formPreFilled.value = true
    dataFilled.value = true
    console.log('Données parsées avec checkboxes préservées:', formData.value)
  } else {
    console.warn('Format de données non reconnu ou données incomplètes', data)
  }
}
</script>
