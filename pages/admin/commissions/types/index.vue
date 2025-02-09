<template>
  <div class="container mx-auto p-6">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Types de commissions</h1>
        <p class="text-muted-foreground">Gérez les différents types de commissions disponibles</p>
      </div>
      <Button @click="showCreateDialog = true">
        <PlusIcon class="mr-2 h-4 w-4" />
        Nouveau type
      </Button>
    </header>

    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Liste des types de commissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-if="isLoading" class="flex justify-center p-4">
              <Loader2Icon class="h-6 w-6 animate-spin" />
            </div>
            
            <div v-else-if="commissionTypes.length === 0" class="text-center py-6">
              <div class="space-y-2">
                <PercentIcon class="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 class="font-medium">Aucun type de commission</h3>
                <p class="text-sm text-muted-foreground">
                  Commencez par créer un nouveau type de commission
                </p>
              </div>
            </div>

            <div v-else class="divide-y">
              <div v-for="type in commissionTypes" :key="type.id" class="py-4">
                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <h3 class="font-medium">{{ type.name }}</h3>
                    <div class="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Badge :variant="type.is_active ? 'default' : 'secondary'">
                        {{ type.is_active ? 'Actif' : 'Inactif' }}
                      </Badge>
                      <span>·</span>
                      <span>{{ type.description }}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVerticalIcon class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="editType(type)">
                        <PencilIcon class="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="toggleTypeStatus(type)" :class="{'text-destructive': type.is_active}">
                        <PowerIcon class="mr-2 h-4 w-4" />
                        {{ type.is_active ? 'Désactiver' : 'Activer' }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 class="font-medium">Champs de configuration</h4>
                    <div class="mt-1 flex flex-wrap gap-1">
                      <Badge v-for="field in type.settings_schema" :key="field.name" variant="outline">
                        {{ field.label }}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 class="font-medium">Sociétés utilisant ce type</h4>
                    <p class="text-muted-foreground">{{ type.usage_count || 0 }} société(s)</p>
                  </div>

                  <div>
                    <h4 class="font-medium">Dernière modification</h4>
                    <p class="text-muted-foreground">{{ formatDate(type.updated_at) }}</p>
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
          <DialogTitle>{{ editingType ? 'Modifier le type' : 'Nouveau type de commission' }}</DialogTitle>
          <DialogDescription>
            {{ editingType ? 'Modifiez les informations du type de commission' : 'Créez un nouveau type de commission' }}
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4">
              <div class="space-y-2">
                <Label>Nom</Label>
                <Input v-model="form.name" placeholder="Nom du type de commission" required />
              </div>
              
              <div class="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  v-model="form.description" 
                  placeholder="Description du type de commission"
                  rows="2"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label>Champs de configuration</Label>
              <div class="space-y-4">
                <div v-for="(field, index) in form.settings_schema" :key="index" class="flex items-start space-x-4">
                  <div class="flex-1 space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-2">
                        <Label>Nom du champ</Label>
                        <Input v-model="field.name" placeholder="nom_du_champ" required />
                      </div>
                      <div class="space-y-2">
                        <Label>Label</Label>
                        <Input v-model="field.label" placeholder="Label affiché" required />
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-2">
                        <Label>Type</Label>
                        <Select v-model="field.type">
                          <SelectTrigger>
                            <SelectValue placeholder="Type de champ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="number">Nombre</SelectItem>
                            <SelectItem value="text">Texte</SelectItem>
                            <SelectItem value="boolean">Booléen</SelectItem>
                            <SelectItem value="select">Sélection</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div class="space-y-2">
                        <Label>Valeur par défaut</Label>
                        <Input v-model="field.default" placeholder="Valeur par défaut" />
                      </div>
                    </div>
                  </div>
                  <Button 
                    type="button"
                    variant="ghost"
                    size="icon"
                    @click="removeField(index)"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button 
                type="button"
                variant="outline"
                size="sm"
                class="mt-2"
                @click="addField"
              >
                <PlusIcon class="mr-2 h-4 w-4" />
                Ajouter un champ
              </Button>
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
              {{ editingType ? 'Mettre à jour' : 'Créer' }}
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
  PercentIcon,
  MoreVerticalIcon,
  PencilIcon,
  PowerIcon,
  TrashIcon
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// Définition du middleware
definePageMeta({
  middleware: ['superadmin']
})

const supabase = useSupabaseClient()
const isLoading = ref(false)
const showCreateDialog = ref(false)
const commissionTypes = ref<any[]>([])
const editingType = ref<any>(null)

// Interface pour un champ de configuration
interface SettingField {
  name: string
  label: string
  type: 'number' | 'text' | 'boolean' | 'select'
  default?: any
  options?: { label: string, value: any }[]
}

// État du formulaire
const form = ref({
  name: '',
  description: '',
  settings_schema: [] as SettingField[]
})

// Formatage de date
const formatDate = (date: string) => {
  return format(new Date(date), 'dd MMM yyyy', { locale: fr })
}

// Chargement des types de commissions
const fetchCommissionTypes = async () => {
  try {
    isLoading.value = true
    
    const { data, error } = await supabase
      .from('commission_types')
      .select(`
        *,
        usage_count:owner_commission_settings(count)
      `)
      .order('name')

    if (error) throw error
    commissionTypes.value = data || []
  } catch (error) {
    console.error('Error fetching commission types:', error)
    toast.error('Impossible de charger les types de commissions')
  } finally {
    isLoading.value = false
  }
}

// Ajout d'un nouveau champ
const addField = () => {
  form.value.settings_schema.push({
    name: '',
    label: '',
    type: 'text',
    default: ''
  })
}

// Suppression d'un champ
const removeField = (index: number) => {
  form.value.settings_schema.splice(index, 1)
}

// Édition d'un type
const editType = (type: any) => {
  editingType.value = type
  form.value = {
    name: type.name,
    description: type.description,
    settings_schema: [...type.settings_schema]
  }
  showCreateDialog.value = true
}

// Activation/désactivation d'un type
const toggleTypeStatus = async (type: any) => {
  try {
    const { error } = await supabase
      .from('commission_types')
      .update({ 
        is_active: !type.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', type.id)

    if (error) throw error

    type.is_active = !type.is_active
    toast.success(`Le type a été ${type.is_active ? 'activé' : 'désactivé'}`)
  } catch (error) {
    console.error('Error toggling commission type status:', error)
    toast.error('Impossible de modifier le statut du type')
  }
}

// Soumission du formulaire
const onSubmit = async () => {
  try {
    isLoading.value = true

    const data = {
      name: form.value.name,
      description: form.value.description,
      settings_schema: form.value.settings_schema,
      updated_at: new Date().toISOString()
    }

    if (editingType.value) {
      // Mise à jour
      const { error } = await supabase
        .from('commission_types')
        .update(data)
        .eq('id', editingType.value.id)

      if (error) throw error
      toast.success('Type de commission mis à jour')
    } else {
      // Création
      const { error } = await supabase
        .from('commission_types')
        .insert({
          ...data,
          is_active: true
        })

      if (error) throw error
      toast.success('Type de commission créé')
    }

    showCreateDialog.value = false
    editingType.value = null
    form.value = {
      name: '',
      description: '',
      settings_schema: []
    }
    fetchCommissionTypes()
  } catch (error) {
    console.error('Error saving commission type:', error)
    toast.error('Impossible de sauvegarder le type de commission')
  } finally {
    isLoading.value = false
  }
}

// Réinitialisation du formulaire à la fermeture
watch(showCreateDialog, (newValue) => {
  if (!newValue && !editingType.value) {
    form.value = {
      name: '',
      description: '',
      settings_schema: []
    }
  }
})

// Chargement initial
onMounted(() => {
  fetchCommissionTypes()
})
</script> 