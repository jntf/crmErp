<template>
  <div class="container mx-auto p-6">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Commissions</h1>
        <p class="text-muted-foreground">
          Gérez les paramètres de commissions de votre société
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="refreshData">
          <RefreshCwIcon class="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>
    </header>

    <div class="space-y-6">
      <!-- Configuration des types de commissions -->
      <Card>
        <CardHeader>
          <CardTitle>Types de commissions actifs</CardTitle>
          <CardDescription>
            Configurez les types de commissions disponibles pour votre société
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-if="isLoading" class="flex justify-center p-4">
              <Loader2Icon class="h-6 w-6 animate-spin" />
            </div>
            
            <div v-else-if="commissionTypes.length === 0" class="text-center py-6">
              <div class="space-y-2">
                <PercentIcon class="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 class="font-medium">Aucun type de commission configuré</h3>
                <p class="text-sm text-muted-foreground">
                  Commencez par activer et configurer les types de commissions
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

                  <Button variant="outline" size="sm" @click="configureCommission(type)">
                    <WrenchIcon class="h-4 w-4 mr-2" />
                    Configurer
                  </Button>
                </div>

                <div v-if="type.settings" class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div v-for="(value, key) in type.settings" :key="String(key)" class="space-y-1">
                    <h4 class="font-medium capitalize">{{ formatKey(key) }}</h4>
                    <p class="text-muted-foreground">{{ formatValue(value) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Historique des commissions -->
      <Card>
        <CardHeader>
          <CardTitle>Historique des commissions</CardTitle>
          <CardDescription>
            Consultez l'historique des commissions générées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="w-full">
            <div class="flex items-center py-4">
              <Input
                class="max-w-sm"
                placeholder="Rechercher..."
                :model-value="table.getColumn('beneficiary')?.getFilterValue() as string"
                @update:model-value="table.getColumn('beneficiary')?.setFilterValue($event)"
              />
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="ml-auto">
                    Colonnes <ChevronDownIcon class="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    v-for="column in table.getAllColumns().filter((column) => column.getCanHide())"
                    :key="column.id"
                    class="capitalize"
                    :checked="column.getIsVisible()"
                    @update:checked="(value) => {
                      column.toggleVisibility(!!value)
                    }"
                  >
                    {{ column.id }}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div class="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                    <TableHead v-for="header in headerGroup.headers" :key="header.id">
                      <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-if="isLoadingHistory">
                    <TableCell :colspan="columns.length" class="h-24 text-center">
                      <Loader2Icon class="mx-auto h-4 w-4 animate-spin" />
                    </TableCell>
                  </TableRow>
                  <template v-else-if="table.getRowModel().rows?.length">
                    <TableRow 
                      v-for="row in table.getRowModel().rows" 
                      :key="row.id"
                    >
                      <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                        <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                      </TableCell>
                    </TableRow>
                  </template>
                  <TableRow v-else>
                    <TableCell
                      :colspan="columns.length"
                      class="h-24 text-center"
                    >
                      Aucune commission
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div class="flex items-center justify-end space-x-2 py-4">
              <div class="flex-1 text-sm text-muted-foreground">
                {{ table.getFilteredRowModel().rows.length }} commission(s)
              </div>
              <div class="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="!table.getCanPreviousPage()"
                  @click="table.previousPage()"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="!table.getCanNextPage()"
                  @click="table.nextPage()"
                >
                  Suivant
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Dialog de configuration -->
    <Dialog :open="showConfigDialog" @update:open="showConfigDialog = false">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configuration de la commission</DialogTitle>
          <DialogDescription>
            {{ selectedType?.description }}
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="saveConfiguration" class="space-y-4">
          <div v-if="selectedType?.settings_schema" class="space-y-4">
            <div v-for="(field, key) in selectedType.settings_schema" :key="key" class="space-y-2">
              <Label>{{ field.description }}</Label>
              
              <Input 
                v-if="field.type === 'number'"
                v-model="configForm[key]"
                type="number"
                step="0.01"
                :required="field.required"
              />

              <Select 
                v-else-if="field.type === 'select'"
                v-model="configForm[key]"
              >
                <SelectTrigger>
                  <SelectValue :placeholder="field.description" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    v-for="option in field.options" 
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Switch
                v-else-if="field.type === 'boolean'"
                v-model="configForm[key]"
                :id="key"
              />
            </div>

            <div class="space-y-2">
              <Label>Statut</Label>
              <Select v-model="configForm.is_active">
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="ghost"
              @click="showConfigDialog = false"
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              :disabled="isLoading"
            >
              <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Loader2Icon,
  PercentIcon,
  WrenchIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  ArrowUpDown
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Row,
  Column,
} from '@tanstack/vue-table'
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { valueUpdater } from '@/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, safeToString, safeToNumber } from '@/utils/formatter'
import type { Commission, CommissionType, CommissionRow, CommissionColumn, CommissionValue } from '@/types/commission'

definePageMeta({
  middleware: ['admin']
})

// État
const supabase = useSupabaseClient()
const isLoading = ref(false)
const isLoadingHistory = ref(false)
const showConfigDialog = ref(false)
const commissionTypes = ref<CommissionType[]>([])
const commissions = ref<Commission[]>([])
const selectedType = ref<CommissionType | null>(null)
const configForm = ref<{
  is_active: 'active' | 'inactive'
  [key: string]: any
}>({
  is_active: 'active'
})

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})

// Colonnes pour le tableau
const columns: ColumnDef<Commission>[] = [
  {
    accessorKey: 'created_at',
    header: ({ column }: { column: CommissionColumn }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['Date', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
    },
    cell: ({ row }: { row: CommissionRow }) => {
      const date = new Date(row.getValue('created_at'))
      return format(date, 'dd MMM yyyy', { locale: fr })
    },
  },
  {
    accessorKey: 'commission_type.name',
    header: 'Type',
    cell: ({ row }: { row: CommissionRow }) => {
      const name = row.getValue('commission_type.name') as string
      return h('div', { class: 'capitalize' }, name)
    },
  },
  {
    accessorKey: 'beneficiary',
    header: 'Bénéficiaire',
    cell: ({ row }: { row: CommissionRow }) => {
      const beneficiary = row.getValue('beneficiary') as string
      return beneficiary
    },
  },
  {
    accessorKey: 'amount',
    header: () => h('div', { class: 'text-right' }, 'Montant'),
    cell: ({ row }: { row: CommissionRow }) => {
      const value = row.getValue('amount') as CommissionValue
      const amount = safeToNumber(value)
      return h('div', { class: 'text-right font-medium' }, formatCurrency(amount))
    },
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }: { row: CommissionRow }) => {
      const status = row.getValue('status') as 'pending' | 'paid'
      return h('div', { class: 'capitalize' }, status === 'paid' ? 'Payée' : 'En attente')
    },
  },
]

// Configuration de la table
const table = useVueTable({
  data: commissions.value,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
  },
})

// Chargement des types de commissions
const fetchCommissionTypes = async () => {
  try {
    isLoading.value = true
    
    // Récupérer les types de commissions avec leurs paramètres
    const { data, error } = await supabase
      .from('commission_types')
      .select(`
        *,
        owner_settings:owner_commission_settings(
          settings,
          is_active
        )
      `)
      .order('name')

    if (error) throw error

    // Transformation des données pour inclure les paramètres de l'owner
    commissionTypes.value = (data || []).map(type => ({
      ...type,
      settings: type.owner_settings?.[0]?.settings || {},
      is_active: type.owner_settings?.[0]?.is_active || false
    }))
  } catch (error) {
    console.error('Error fetching commission types:', error)
    toast.error('Impossible de charger les types de commissions')
  } finally {
    isLoading.value = false
  }
}

// Chargement de l'historique des commissions
const fetchCommissionHistory = async () => {
  try {
    isLoadingHistory.value = true

    const { data, error } = await supabase
      .from('vehicle_commissions')
      .select(`
        *,
        commission_type:commission_types(name),
        beneficiary:contacts(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    commissions.value = data || []
  } catch (error) {
    console.error('Error fetching commission history:', error)
    toast.error('Impossible de charger l\'historique des commissions')
  } finally {
    isLoadingHistory.value = false
  }
}

// Configuration d'une commission
const configureCommission = (type: CommissionType) => {
  selectedType.value = type
  configForm.value = {
    ...type.settings,
    is_active: type.settings.is_active ? 'active' : 'inactive'
  }
  showConfigDialog.value = true
}

// Sauvegarde de la configuration
const saveConfiguration = async () => {
  if (!selectedType.value) return

  try {
    isLoading.value = true

    const { is_active, ...settings } = configForm.value

    const { error } = await supabase
      .from('owner_commission_settings')
      .upsert({
        commission_type_id: selectedType.value.id,
        settings,
        is_active: is_active === 'active',
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    showConfigDialog.value = false
    toast.success('Configuration enregistrée')
    refreshData()
  } catch (error) {
    console.error('Error saving commission configuration:', error)
    toast.error('Impossible de sauvegarder la configuration')
  } finally {
    isLoading.value = false
  }
}

// Formatage des clés et valeurs
const formatKey = (key: string | number) => {
  return String(key).replace(/_/g, ' ')
}

const formatValue = (value: any) => {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non'
  }
  return value
}

// Actualisation des données
const refreshData = () => {
  fetchCommissionTypes()
  fetchCommissionHistory()
}

// Chargement initial
onMounted(() => {
  refreshData()
})
</script> 