<template>
  <div class="container mx-auto p-6">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">Société</h1>
      <p class="text-muted-foreground">
        Gérez les informations et les paramètres de votre société
      </p>
    </header>

    <div class="mt-6 space-y-6">
      <form @submit.prevent="onSubmit" class="space-y-6">
        <!-- Informations de la société -->
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'entreprise</CardTitle>
            <CardDescription>
              Informations principales de votre entreprise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid gap-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>Nom de la société</Label>
                  <Input v-model="form.company.name" placeholder="Nom de la société" required />
                </div>
                
                <div class="space-y-2">
                  <Label>Domaine d'activité</Label>
                  <Input v-model="form.company.industry" placeholder="Domaine d'activité" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>Email</Label>
                  <Input v-model="form.company.email" type="email" placeholder="Email professionnel" />
                </div>
                
                <div class="space-y-2">
                  <Label>Téléphone</Label>
                  <Input v-model="form.company.phone" placeholder="Numéro de téléphone" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>Site web</Label>
                  <Input v-model="form.company.website" placeholder="https://..." />
                </div>
                
                <div class="space-y-2">
                  <Label>Nombre d'employés</Label>
                  <Input v-model="form.company.number_of_employees" type="number" placeholder="Nombre d'employés" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>Numéro de TVA</Label>
                  <Input v-model="form.company.vat_number" placeholder="Numéro de TVA" />
                </div>
                
                <div class="space-y-2">
                  <Label>SIRET</Label>
                  <Input v-model="form.company.tax_number" placeholder="Numéro SIRET" />
                </div>
              </div>

              <div class="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  v-model="form.company.description" 
                  placeholder="Description de la société"
                  rows="3"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Adresse -->
        <Card>
          <CardHeader>
            <CardTitle>Adresse</CardTitle>
            <CardDescription>
              Adresse principale de la société
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid gap-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-2">
                  <Label>Numéro</Label>
                  <Input v-model="form.address.street_number" placeholder="Numéro" />
                </div>
                
                <div class="space-y-2 md:col-span-2">
                  <Label>Rue</Label>
                  <Input v-model="form.address.street_name" placeholder="Nom de la rue" required />
                </div>
              </div>

              <div class="space-y-2">
                <Label>Complément d'adresse</Label>
                <Input v-model="form.address.address_line2" placeholder="Complément d'adresse" />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>Code postal</Label>
                  <Input v-model="form.address.postal_code" placeholder="Code postal" required />
                </div>
                
                <div class="space-y-2">
                  <Label>Ville</Label>
                  <Input v-model="form.address.city" placeholder="Ville" required />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>État/Région</Label>
                  <Input v-model="form.address.state" placeholder="État ou région" />
                </div>
                
                <div class="space-y-2">
                  <Label>Pays</Label>
                  <Select 
                    v-model="countryIdModel" 
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem 
                        v-for="country in countries" 
                        :key="country.id" 
                        :value="String(country.id)"
                      >
                        {{ country.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Configuration Owner -->
        <Card>
          <CardHeader>
            <CardTitle>Configuration de la plateforme</CardTitle>
            <CardDescription>
              Paramètres spécifiques à la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid gap-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>Nom d'affichage</Label>
                  <Input v-model="form.owner.name" placeholder="Nom d'affichage" required />
                </div>
                
                <div class="space-y-2">
                  <Label>Statut</Label>
                  <Select v-model="form.owner.status">
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label class="mb-2 block">Modules</Label>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div v-for="module in availableModules" :key="module.name" class="flex items-center space-x-2">
                    <Switch 
                      :id="module.name"
                      v-model="form.owner.modules[module.name]"
                      @update:model-value="updateModules"
                    />
                    <Label :for="module.name">{{ module.label }}</Label>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <Label>Configuration avancée</Label>
                <Textarea 
                  v-model="form.owner.settings" 
                  placeholder="Configuration JSON"
                  rows="4"
                />
                <p class="text-sm text-muted-foreground">
                  Exemple: {"maxUsers": 10, "features": ["feature1", "feature2"]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div class="flex justify-end space-x-4">
          <Button 
            type="submit"
            :disabled="isLoading"
          >
            <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2Icon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ref, onMounted, watch, computed } from 'vue'
import { useOwnerStore } from '~/stores/useOwnerStore'

// Définition du middleware
definePageMeta({
  middleware: ['admin']
})

const supabase = useSupabaseClient()
const isLoading = ref(false)
const countries = ref<any[]>([])
const currentOwnerId = ref<number | null>(null)

// Types
interface CompanyForm {
  name: string
  industry?: string
  phone?: string
  email?: string
  website?: string
  number_of_employees?: number
  tax_number?: string
  vat_number?: string
  description?: string
}

interface AddressForm {
  street_number?: string
  street_name: string
  address_line2?: string
  postal_code: string
  city: string
  state?: string
  country_id: number | null
}

interface OwnerForm {
  name: string
  status: 'active' | 'inactive'
  modules: Record<string, boolean>
  settings: string
}

interface FormState {
  company: CompanyForm
  address: AddressForm
  owner: OwnerForm
}

// État du formulaire
const form = ref({
  company: {
    name: '',
    industry: '',
    phone: '',
    email: '',
    website: '',
    number_of_employees: null as number | null,
    tax_number: '',
    vat_number: '',
    description: ''
  } as CompanyForm,
  address: {
    street_number: '',
    street_name: '',
    address_line2: '',
    postal_code: '',
    city: '',
    state: '',
    country_id: null
  } as AddressForm,
  owner: {
    name: '',
    status: 'active' as const,
    modules: {} as Record<string, boolean>,
    settings: ''
  } as OwnerForm
})

// Modules disponibles
const availableModules = [
  { name: 'stock', label: 'Gestion de stock' },
  { name: 'orders', label: 'Commandes' },
  { name: 'accounting', label: 'Comptabilité' },
  { name: 'crm', label: 'CRM' },
  { name: 'hr', label: 'Ressources Humaines' },
  { name: 'analytics', label: 'Analyses' }
]

// Mise à jour des modules
const updateModules = () => {
  try {
    // Validation du JSON existant
    const currentSettings = JSON.parse(form.value.owner.settings)
    
    // Mise à jour des modules activés
    currentSettings.modules = Object.entries(form.value.owner.modules)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => ({ name, is_active: true, settings: {} }))
    
    // Mise à jour du JSON
    form.value.owner.settings = JSON.stringify(currentSettings, null, 2)
  } catch (e) {
    // Si le JSON n'est pas valide, on crée un nouveau
    const settings = {
      modules: Object.entries(form.value.owner.modules)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => ({ name, is_active: true, settings: {} }))
    }
    form.value.owner.settings = JSON.stringify(settings, null, 2)
  }
}

// Soumission du formulaire
const onSubmit = async () => {
  try {
    isLoading.value = true

    // Validation du JSON
    let parsedSettings
    try {
      parsedSettings = JSON.parse(form.value.owner.settings)
    } catch (e) {
      toast.error('Le format JSON de la configuration est invalide')
      return
    }

    // Préparation des données pour la fonction
    const ownerData = {
      name: form.value.owner.name,
      status: form.value.owner.status,
      settings: parsedSettings,
      modules: Object.entries(form.value.owner.modules)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => ({ name, is_active: true, settings: {} }))
    }

    // Appel de la fonction stockée
    const { data, error } = await supabase
      .rpc('manage_owner', {
        p_action: 'update',
        p_company_data: form.value.company,
        p_address_data: form.value.address,
        p_owner_data: ownerData,
        p_owner_id: currentOwnerId.value
      })

    if (error) throw error

    if (!data.success) {
      throw new Error(data.error)
    }

    toast.success('Les modifications ont été enregistrées')
  } catch (error) {
    console.error('Error updating owner:', error)
    toast.error('Impossible de mettre à jour la société')
  } finally {
    isLoading.value = false
  }
}

// Chargement initial
onMounted(async () => {
  // Chargement des pays
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    countries.value = data || []
  } catch (error) {
    console.error('Error loading countries:', error)
    toast.error('Impossible de charger la liste des pays')
  }

  // Chargement des données de la société via le store
  const ownerStore = useOwnerStore()
  await ownerStore.chargerDonneesOwner()
  console.log('Owner ID', ownerStore.idOwnerActuel)
})

// Ajout d'un watcher pour mettre à jour le formulaire dès que les données du store sont chargées
watch(() => useOwnerStore().donneesOwner, (nv) => {
  if (nv) {
    currentOwnerId.value = nv.owner.id
    form.value = {
      company: {
        name: nv.company.name,
        industry: nv.company.industry || '',
        phone: nv.company.phone || '',
        email: nv.company.email || '',
        website: nv.company.website || '',
        number_of_employees: nv.company.number_of_employees,
        tax_number: nv.company.tax_number || '',
        vat_number: nv.company.vat_number || '',
        description: nv.company.description || ''
      },
      address: {
        street_number: nv.address.street_number || '',
        street_name: nv.address.street_name,
        address_line2: nv.address.address_line2 || '',
        postal_code: nv.address.postal_code,
        city: nv.address.city,
        state: nv.address.state || '',
        country_id: nv.address.country_id.toString()
      },
      owner: {
        name: nv.owner.name,
        status: nv.owner.status,
        modules: {},
        settings: JSON.stringify(nv.owner.settings, null, 2)
      }
    }
    if (nv.modules) {
      nv.modules.forEach((module: any) => {
        form.value.owner.modules[module.module_name] = module.is_active
      })
    }
  }
})

// Dans la partie script, après la définition des refs
const countryIdModel = computed({
  get: () => form.value.address.country_id ? String(form.value.address.country_id) : '',
  set: (value: string) => {
    form.value.address.country_id = value ? Number(value) : null
  }
})
</script> 