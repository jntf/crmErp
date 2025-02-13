<template>
  <div class="container mx-auto p-6">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Types de commissions</h1>
        <p class="text-muted-foreground">Gestion des types de commissions disponibles</p>
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
                  <div class="flex-1 space-y-1">
                    <div class="flex items-center justify-between">
                      <h3 class="font-medium">{{ type.name }}</h3>
                      <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2">
                          <Switch :id="'switch-' + type.id" :checked="type.is_active"
                            @update:checked="toggleTypeStatus(type)" />
                          <Label :for="'switch-' + type.id" class="text-sm text-muted-foreground">
                            {{ type.is_active ? 'Actif' : 'Inactif' }}
                          </Label>
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem @click="typeToDelete = type" class="text-destructive">
                              <Trash2Icon class="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div class="text-sm text-muted-foreground">{{ type.description }}</div>
                    <div class="flex items-center justify-between mt-2">
                      <div class="flex items-center space-x-4">
                        <div>
                          <span class="text-sm font-medium">Options :</span>
                          <div class="flex items-center space-x-2 mt-1">
                            <template v-for="(value, key) in type.settings_schema" :key="key">
                              <div v-if="value" class="inline-flex items-center space-x-1 text-sm">
                                <CheckIcon class="h-3 w-3 text-primary" />
                                <span>{{
                                  {
                                    'percentage': 'Pourcentage',
                                    'fixed_amount': 'Montant fixe',
                                    'min_amount': 'Montant minimum',
                                    'max_amount': 'Montant maximum'
                                  }[key as keyof CommissionTypeSchema] || key
                                }}</span>
                                <span
                                  v-if="Object.entries(type.settings_schema).filter(([_, v]) => v).indexOf([key, value]) < Object.entries(type.settings_schema).filter(([_, v]) => v).length - 1">&middot;</span>
                              </div>
                            </template>
                          </div>
                        </div>
                        <div>
                          <span class="text-sm font-medium">Entreprise(s) Active(s) :</span>
                          <div class="flex items-center space-x-2 mt-1">
                            <span v-for="(owner, index) in type.active_owners || []" :key="owner.id" class="text-sm">
                              {{ owner.name }}{{ index < (type.active_owners?.length || 0) - 1 ? ',' : '' }} </span>
                          </div>
                        </div>
                      </div>
                    </div>
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
            {{ editingType ? 'Modifiez les informations du type de commission' : 'Créez un nouveau type de commission'
            }}
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
                <Textarea v-model="form.description" placeholder="Description du type de commission" rows="2" />
              </div>
            </div>

            <!-- Configuration des paramètres disponibles -->
            <div class="space-y-2">
              <Label>Paramètres disponibles</Label>
              <div class="space-y-2">
                <div class="flex items-center space-x-2">
                  <input type="checkbox" v-model="form.settings.percentage" id="percentage" class="rounded" />
                  <Label for="percentage">Pourcentage</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <input type="checkbox" v-model="form.settings.fixed_amount" id="fixed_amount" class="rounded" />
                  <Label for="fixed_amount">Montant fixe</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <input type="checkbox" v-model="form.settings.min_amount" id="min_amount" class="rounded" />
                  <Label for="min_amount">Montant minimum</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <input type="checkbox" v-model="form.settings.max_amount" id="max_amount" class="rounded" />
                  <Label for="max_amount">Montant maximum</Label>
                </div>
              </div>
            </div>

            <!-- Sélection des owners -->
            <div class="space-y-2">
              <Label>Owners autorisés</Label>
              <ComboboxRoot v-model="selectedValues" v-model:search-term="searchTerm" multiple class="relative">
                <ComboboxAnchor
                  class="w-full inline-flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
                  <TagsInputRoot v-slot="{ modelValue: tags }" v-model="selectedValues" delimiter=""
                    class="flex gap-2 items-center rounded-lg flex-wrap">
                    <TagsInputItem v-for="ownerId in selectedValues" :key="ownerId" :value="ownerId"
                      class="flex items-center justify-center gap-2 bg-primary/10 text-primary aria-[current=true]:bg-primary/20 rounded px-2 py-1">
                      <TagsInputItemText class="text-sm">
                        {{ availableOwners.find((o: Owner) => o.id === parseInt(ownerId))?.name }}
                      </TagsInputItemText>
                      <TagsInputItemDelete>
                        <XIcon class="h-3 w-3" />
                      </TagsInputItemDelete>
                    </TagsInputItem>

                    <ComboboxInput as-child>
                      <TagsInputInput placeholder="Rechercher un owner..."
                        class="focus:outline-none flex-1 rounded !bg-transparent placeholder:text-muted-foreground px-1"
                        @keydown.enter.prevent />
                    </ComboboxInput>
                  </TagsInputRoot>

                  <ComboboxTrigger>
                    <ChevronDownIcon class="h-4 w-4 opacity-50" />
                  </ComboboxTrigger>
                </ComboboxAnchor>
                <ComboboxContent
                  class="relative z-50 min-w-[200px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                  <ComboboxViewport class="p-1">
                    <ComboboxEmpty
                      class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-muted-foreground">
                      Aucun résultat trouvé
                    </ComboboxEmpty>

                    <ComboboxGroup>
                      <ComboboxItem v-for="owner in availableOwners" :key="owner.id" :value="owner.id.toString()"
                        class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                        <ComboboxItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                          <CheckIcon class="h-4 w-4" />
                        </ComboboxItemIndicator>
                        <span class="ml-6">{{ owner.name }}</span>
                      </ComboboxItem>
                    </ComboboxGroup>
                  </ComboboxViewport>
                </ComboboxContent>
              </ComboboxRoot>
              <p class="text-sm text-muted-foreground">
                Sélectionnez les owners qui pourront utiliser ce type de commission
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" @click="showCreateDialog = false">
              Annuler
            </Button>
            <Button type="submit" :disabled="isLoading">
              <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              {{ editingType ? 'Mettre à jour' : 'Créer' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Dialog de confirmation de suppression -->
    <Dialog :open="!!typeToDelete" @update:open="typeToDelete = null">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le type de commission</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Si ce type est utilisé par des commissions existantes,
            vous devrez confirmer la suppression et les commissions seront désassociées.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="flex gap-2 justify-end">
          <Button variant="ghost" @click="typeToDelete = null">
            Annuler
          </Button>
          <Button variant="default" @click="deleteType(false)">
            Supprimer
          </Button>
          <Button variant="destructive" @click="deleteType(true)">
            Forcer la suppression
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, reactive } from 'vue'
import { isEqual } from 'lodash-es'
import {
  PlusIcon,
  Loader2Icon,
  PercentIcon,
  MoreVerticalIcon,
  PencilIcon,
  PowerIcon,
  CheckIcon,
  BuildingIcon,
  XIcon,
  ChevronDownIcon,
  Trash2Icon
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputRoot
} from 'radix-vue'
import type {
  CommissionType,
  CommissionFormState,
  CommissionSettings,
  CommissionTypeSchema,
  CommissionTypeData,
  Owner,
  OwnerCommissionSettings,
  CommissionTypeResponse,
  CommissionStore
} from '@/types/commission.d'

// Définition du middleware
definePageMeta({
  middleware: ['superadmin']
})

const supabase = useSupabaseClient()
const commissionStore = useCommissionStore() as CommissionStore

// État
const isLoading = ref(false)
const showCreateDialog = ref(false)
const commissionTypes = computed(() => commissionStore.types)
const editingType = ref<CommissionType | null>(null)
const availableOwners = ref<Owner[]>([])
const typeToDelete = ref<CommissionType | null>(null)

// État du formulaire et des sélections
const form = reactive<CommissionFormState>({
  name: '',
  description: '',
  settings: {
    percentage: false,
    fixed_amount: false,
    min_amount: false,
    max_amount: false
  },
  selected_owners: []
})

const searchTerm = ref('')
const selectedValues = ref<string[]>([])

// Synchronisation entre form et selectedValues
watch(selectedValues, (newValues) => {
  if (newValues && !isEqual(newValues, form.selected_owners)) {
    form.selected_owners = [...newValues]
  }
}, { deep: true })

watch(() => form.selected_owners, (newValues) => {
  if (newValues && !isEqual(newValues, selectedValues.value)) {
    selectedValues.value = [...newValues]
  }
}, { deep: true })

// Gestion des types de commissions
const loadType = (type: CommissionType | null) => {
  if (!type) return

  form.name = type.name
  form.description = type.description
  form.settings = {
    percentage: Boolean(type.settings_schema?.percentage),
    fixed_amount: Boolean(type.settings_schema?.fixed_amount),
    min_amount: Boolean(type.settings_schema?.min_amount),
    max_amount: Boolean(type.settings_schema?.max_amount)
  }
  form.selected_owners = type.active_owners?.map((o: Owner) => o.id.toString()) ?? []
}

// Chargement des types de commissions
const fetchCommissionTypes = async () => {
  try {
    isLoading.value = true
    await commissionStore.fetchCommissionTypes()
  } catch (error) {
    console.error('Error fetching commission types:', error)
    toast.error('Impossible de charger les types de commissions')
  } finally {
    isLoading.value = false
  }
}

// Édition d'un type
const editType = (type: CommissionType) => {
  editingType.value = type
  loadType(type)
  showCreateDialog.value = true
}

// Activation/désactivation d'un type
const toggleTypeStatus = async (type: CommissionType) => {
  try {
    const { error } = await supabase
      .from('commission_types')
      .update({
        is_active: !type.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', type.id)

    if (error) throw error

    // Mettre à jour le store
    await commissionStore.fetchCommissionTypes()
    toast.success(`Le type a été ${type.is_active ? 'activé' : 'désactivé'}`)
  } catch (error) {
    console.error('Error toggling commission type status:', error)
    toast.error('Impossible de modifier le statut du type')
  }
}

// Soumission du formulaire
const onSubmit = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true

    const settingsSchema: CommissionTypeSchema = {
      percentage: Boolean(form.settings.percentage),
      fixed_amount: Boolean(form.settings.fixed_amount),
      min_amount: Boolean(form.settings.min_amount),
      max_amount: Boolean(form.settings.max_amount)
    }

    const { data, error } = await supabase.rpc('upsert_commission_type', {
      p_data: {
        id: editingType.value?.id,
        name: form.name,
        description: form.description,
        code: form.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        settings_schema: settingsSchema,
        is_active: true,
        owner_ids: form.selected_owners.map(id => parseInt(id))
      }
    })

    if (error) throw error

    showCreateDialog.value = false
    editingType.value = null
    await fetchCommissionTypes()

    toast.success(editingType.value ? 'Type de commission mis à jour' : 'Type de commission créé')
  } catch (error) {
    console.error('Error saving commission type:', error)
    toast.error('Impossible de sauvegarder le type de commission')
  } finally {
    isLoading.value = false
  }
}

// Chargement des owners disponibles
const fetchAvailableOwners = async () => {
  try {
    const { data, error } = await supabase
      .from('owners')
      .select('id, name')
      .order('name')

    if (error) throw error
    availableOwners.value = data || []
  } catch (error) {
    console.error('Error fetching owners:', error)
    toast.error('Impossible de charger la liste des owners')
  }
}

// Suppression d'un type
const deleteType = async (force: boolean = false) => {
  if (!typeToDelete.value) return

  try {
    const result = await commissionStore.deleteCommissionType(typeToDelete.value.id, force)

    if (!result.success) {
      toast.error(result.error, {
        description: `${result.details.vehicle_commissions_count} commissions et ${result.details.settings_usage_count} paramètres utilisent ce type.`
      })
      return
    }

    toast.success('Type de commission supprimé', {
      description: force ?
        `${result.details.vehicle_commissions_updated} commissions et ${result.details.settings_deleted} paramètres ont été mis à jour.` :
        undefined
    })

    typeToDelete.value = null
  } catch (error) {
    console.error('Error deleting commission type:', error)
    toast.error('Impossible de supprimer le type de commission')
  }
}

// Réinitialisation du formulaire
const resetForm = () => {
  form.name = ''
  form.description = ''
  form.settings = {
    percentage: false,
    fixed_amount: false,
    min_amount: false,
    max_amount: false
  }
  form.selected_owners = []
}

watch(() => form.settings, (newVal) => {
  console.log('form.settings changed:', newVal)
}, { deep: true })

// Chargement initial
onMounted(async () => {
  await Promise.all([
    fetchCommissionTypes(),
    fetchAvailableOwners()
  ])
})
</script>