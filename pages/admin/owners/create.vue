<template>
  <div class="container mx-auto p-6">
    <header class="mb-6">
      <h1 class="text-3xl font-bold">Créer une nouvelle société</h1>
      <p class="text-muted-foreground">Configurez une nouvelle société et ses paramètres initiaux</p>
    </header>

    <form @submit.prevent="onSubmit" class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
          <CardDescription>
            Informations principales de la société
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Nom de la société</Label>
                <Input v-model="form.name" placeholder="Nom de la société" required />
              </div>
              
              <div class="space-y-2">
                <Label>Statut</Label>
                <Select v-model="form.status">
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

            <div class="space-y-2">
              <Label>Description</Label>
              <Textarea 
                v-model="form.description" 
                placeholder="Description de la société"
                rows="3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>
            Sélectionnez les modules à activer pour cette société
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="module in availableModules" :key="module.name" class="flex items-center space-x-2">
              <Switch v-model="form.modules[module.name]" :id="module.name" />
              <Label :for="module.name">{{ module.label }}</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration avancée</CardTitle>
          <CardDescription>
            Paramètres spécifiques de la société au format JSON
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Textarea 
              v-model="form.settings" 
              placeholder="Configuration JSON"
              rows="4"
            />
            <p class="text-sm text-muted-foreground">
              Exemple: {"maxUsers": 10, "features": ["feature1", "feature2"]}
            </p>
          </div>
        </CardContent>
      </Card>

      <div class="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          type="button"
          @click="router.back()"
        >
          Annuler
        </Button>
        <Button 
          type="submit"
          :disabled="isLoading"
        >
          <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          Créer la société
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { Loader2Icon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// Définition du middleware
definePageMeta({
  middleware: ['superadmin']
})

const router = useRouter()
const supabase = useSupabaseClient()
const isLoading = ref(false)

// Types
interface CompanyForm {
  name: string
  status: 'active' | 'inactive'
  description: string
  modules: Record<string, boolean>
  settings: string
}

// État du formulaire
const form = ref<CompanyForm>({
  name: '',
  status: 'active',
  description: '',
  modules: {},
  settings: '{}'
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

// Initialisation des modules
onMounted(() => {
  availableModules.forEach(module => {
    form.value.modules[module.name] = false
  })
})

// Soumission du formulaire
const onSubmit = async () => {
  try {
    isLoading.value = true

    // Validation du JSON
    let parsedSettings
    try {
      parsedSettings = JSON.parse(form.value.settings)
    } catch (e) {
      toast.error('Le format JSON de la configuration est invalide')
      return
    }

    // 1. Créer la société
    const { data: owner, error: ownerError } = await supabase
      .from('owners')
      .insert({
        name: form.value.name,
        status: form.value.status,
        description: form.value.description,
        settings: parsedSettings
      })
      .select()
      .single()

    if (ownerError) throw ownerError

    // 2. Créer les modules
    const moduleInserts = Object.entries(form.value.modules)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => ({
        owner_id: owner.id,
        module_name: name,
        is_active: true,
        settings: {}
      }))

    if (moduleInserts.length > 0) {
      const { error: modulesError } = await supabase
        .from('owner_modules')
        .insert(moduleInserts)

      if (modulesError) throw modulesError
    }

    toast.success('La société a été créée avec succès')
    router.push('/admin/owners')
  } catch (error) {
    console.error('Error creating owner:', error)
    toast.error('Impossible de créer la société')
  } finally {
    isLoading.value = false
  }
}
</script> 