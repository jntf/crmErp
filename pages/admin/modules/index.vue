<template>
  <div class="container mx-auto p-6">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Modules</h1>
        <p class="text-muted-foreground">Gérez les modules disponibles dans l'application</p>
      </div>
      <Button @click="showCreateDialog = true">
        <PlusIcon class="mr-2 h-4 w-4" />
        Nouveau module
      </Button>
    </header>

    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Liste des modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-if="isLoading" class="flex justify-center p-4">
              <Loader2Icon class="h-6 w-6 animate-spin" />
            </div>
            
            <div v-else-if="modules.length === 0" class="text-center py-6">
              <div class="space-y-2">
                <LayoutGridIcon class="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 class="font-medium">Aucun module</h3>
                <p class="text-sm text-muted-foreground">
                  Commencez par créer un nouveau module
                </p>
              </div>
            </div>

            <div v-else class="divide-y">
              <div v-for="module in modules" :key="module.name" class="py-4">
                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <h3 class="font-medium">{{ module.label }}</h3>
                    <div class="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Badge :variant="module.is_active ? 'default' : 'secondary'">
                        {{ module.is_active ? 'Actif' : 'Inactif' }}
                      </Badge>
                      <span>·</span>
                      <span>{{ module.description }}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVerticalIcon class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="editModule(module)">
                        <PencilIcon class="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="toggleModuleStatus(module)" :class="{'text-destructive': module.is_active}">
                        <PowerIcon class="mr-2 h-4 w-4" />
                        {{ module.is_active ? 'Désactiver' : 'Activer' }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 class="font-medium">Dépendances</h4>
                    <div class="mt-1 flex flex-wrap gap-1">
                      <Badge v-for="dep in module.dependencies" :key="dep" variant="outline">
                        {{ dep }}
                      </Badge>
                      <span v-if="!module.dependencies?.length" class="text-muted-foreground">
                        Aucune dépendance
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 class="font-medium">Sociétés utilisant ce module</h4>
                    <p class="text-muted-foreground">{{ module.usage_count || 0 }} société(s)</p>
                  </div>

                  <div>
                    <h4 class="font-medium">Dernière modification</h4>
                    <p class="text-muted-foreground">{{ formatDate(module.updated_at) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Dialog de création/édition -->
    <Dialog :open="showCreateDialog" @update:open="showCreateDialog = false">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{{ editingModule ? 'Modifier le module' : 'Nouveau module' }}</DialogTitle>
          <DialogDescription>
            {{ editingModule ? 'Modifiez les informations du module' : 'Créez un nouveau module' }}
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4">
              <div class="space-y-2">
                <Label>Nom du module</Label>
                <Input 
                  v-model="form.name" 
                  placeholder="nom_du_module" 
                  required
                  :disabled="!!editingModule"
                />
                <p class="text-sm text-muted-foreground">
                  Identifiant unique du module (en minuscules, sans espaces)
                </p>
              </div>
              
              <div class="space-y-2">
                <Label>Label</Label>
                <Input v-model="form.label" placeholder="Label affiché" required />
              </div>

              <div class="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  v-model="form.description" 
                  placeholder="Description du module"
                  rows="2"
                />
              </div>

              <div class="space-y-2">
                <Label>Dépendances</Label>
                <MultiSelect
                  v-model="form.dependencies"
                  :options="availableModules"
                  placeholder="Sélectionnez les dépendances"
                />
                <p class="text-sm text-muted-foreground">
                  Modules requis pour le fonctionnement de ce module
                </p>
              </div>

              <div class="space-y-2">
                <Label>Configuration par défaut</Label>
                <Textarea 
                  v-model="form.default_settings" 
                  placeholder="{}"
                  rows="4"
                />
                <p class="text-sm text-muted-foreground">
                  Configuration JSON par défaut du module
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="ghost"
              @click="showCreateDialog = false"
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              :disabled="isLoading"
            >
              <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              {{ editingModule ? 'Mettre à jour' : 'Créer' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  PlusIcon, 
  Loader2Icon, 
  LayoutGridIcon,
  MoreVerticalIcon,
  PencilIcon,
  PowerIcon
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// Définition du middleware
definePageMeta({
  middleware: ['superadmin']
})

const supabase = useSupabaseClient()
const isLoading = ref(false)
const showCreateDialog = ref(false)
const modules = ref<any[]>([])
const editingModule = ref<any>(null)

// État du formulaire
const form = ref({
  name: '',
  label: '',
  description: '',
  dependencies: [] as string[],
  default_settings: '{}'
})

// Modules disponibles pour les dépendances
const availableModules = computed(() => 
  modules.value
    .filter(m => m.name !== editingModule.value?.name)
    .map(m => ({
      label: m.label,
      value: m.name
    }))
)

// Formatage de date
const formatDate = (date: string) => {
  return format(new Date(date), 'dd MMM yyyy', { locale: fr })
}

// Chargement des modules
const fetchModules = async () => {
  try {
    isLoading.value = true
    
    const { data, error } = await supabase
      .from('modules')
      .select(`
        *,
        usage_count:owner_modules(count)
      `)
      .order('name')

    if (error) throw error
    modules.value = data || []
  } catch (error) {
    console.error('Error fetching modules:', error)
    toast.error('Impossible de charger les modules')
  } finally {
    isLoading.value = false
  }
}

// Édition d'un module
const editModule = (module: any) => {
  editingModule.value = module
  form.value = {
    name: module.name,
    label: module.label,
    description: module.description,
    dependencies: module.dependencies || [],
    default_settings: JSON.stringify(module.default_settings || {}, null, 2)
  }
  showCreateDialog.value = true
}

// Activation/désactivation d'un module
const toggleModuleStatus = async (module: any) => {
  try {
    const { error } = await supabase
      .from('modules')
      .update({ 
        is_active: !module.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('name', module.name)

    if (error) throw error

    module.is_active = !module.is_active
    toast.success(`Le module a été ${module.is_active ? 'activé' : 'désactivé'}`)
  } catch (error) {
    console.error('Error toggling module status:', error)
    toast.error('Impossible de modifier le statut du module')
  }
}

// Soumission du formulaire
const onSubmit = async () => {
  try {
    isLoading.value = true

    // Validation du JSON
    let defaultSettings
    try {
      defaultSettings = JSON.parse(form.value.default_settings)
    } catch (e) {
      toast.error('Le format JSON de la configuration est invalide')
      return
    }

    const data = {
      name: form.value.name,
      label: form.value.label,
      description: form.value.description,
      dependencies: form.value.dependencies,
      default_settings: defaultSettings,
      updated_at: new Date().toISOString()
    }

    if (editingModule.value) {
      // Mise à jour
      const { error } = await supabase
        .from('modules')
        .update(data)
        .eq('name', editingModule.value.name)

      if (error) throw error
      toast.success('Module mis à jour')
    } else {
      // Création
      const { error } = await supabase
        .from('modules')
        .insert({
          ...data,
          is_active: true
        })

      if (error) throw error
      toast.success('Module créé')
    }

    showCreateDialog.value = false
    editingModule.value = null
    form.value = {
      name: '',
      label: '',
      description: '',
      dependencies: [],
      default_settings: '{}'
    }
    fetchModules()
  } catch (error) {
    console.error('Error saving module:', error)
    toast.error('Impossible de sauvegarder le module')
  } finally {
    isLoading.value = false
  }
}

// Réinitialisation du formulaire à la fermeture
watch(showCreateDialog, (newValue) => {
  if (!newValue && !editingModule.value) {
    form.value = {
      name: '',
      label: '',
      description: '',
      dependencies: [],
      default_settings: '{}'
    }
  }
})

// Chargement initial
onMounted(() => {
  fetchModules()
})
</script> 