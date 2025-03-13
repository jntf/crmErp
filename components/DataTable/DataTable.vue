<template>
  <div>
    <!-- Barre d'outils -->
    <div class="flex items-center justify-between py-4">
      <div class="flex items-center gap-2">
        <!-- Champ de recherche -->
        <Input
          v-if="searchable"
          class="max-w-sm"
          placeholder="Rechercher..."
          :model-value="searchQuery"
          @update:model-value="handleSearchUpdate"
        />
        
        <slot name="toolbar-start"></slot>
      </div>
      
      <div class="flex items-center gap-2">
        <slot name="toolbar-end"></slot>
        
        <!-- Bouton pour désépingler toutes les colonnes -->
        <Button 
          v-if="columnPinning && columnPinning.left && columnPinning.left.length > 0" 
          variant="outline" 
          size="sm"
          @click="unpinAllColumns"
        >
          <PinOff class="w-4 h-4 mr-2" />
          Désépingler tout
        </Button>
        
        <!-- Sélecteur du nombre de lignes par page -->
        <div v-if="pagination" class="flex items-center mr-2">
          <Select
            :model-value="String(paginationState.pageSize)"
            @update:model-value="(value) => paginationState.pageSize = Number(value)"
          >
            <SelectTrigger class="h-8 w-[70px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="pageSize in pageSizeOptions" 
                :key="pageSize" 
                :value="String(pageSize)"
              >
                {{ pageSize }}
              </SelectItem>
            </SelectContent>
          </Select>
          <span class="ml-2 text-sm text-muted-foreground">lignes par page</span>
        </div>
        
        <!-- Sélecteur de colonnes visibles -->
        <DropdownMenu v-if="columnToggle">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              Colonnes
              <ChevronDown class="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-[200px] max-h-[400px] overflow-y-auto">
            <DropdownMenuCheckboxItem
              v-for="column in table.getAllColumns().filter((column) => column.getCanHide())"
              :key="column.id"
              class="capitalize"
              :checked="column.getIsVisible()"
              @select="column.toggleVisibility(!column.getIsVisible())"
            >
              {{ column.columnDef.header?.toString() || column.id }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border overflow-auto">
      <Table :class="[
        tableSettings?.height ? 'max-h-[' + tableSettings.height + ']' : '',
        'fixed-width-table',
        (columnPinning && (columnPinning.left?.length || columnPinning.right?.length)) ? 'has-pinned-columns' : ''
      ]" 
      :table-layout="props.tableLayout || 'fixed'">
        <TableHeader>
          <TableRow 
            v-for="headerGroup in table.getHeaderGroups()" 
            :key="headerGroup.id"
            :class="tableSettings?.headerRowClass || ''"
          >
            <TableHead 
              v-for="header in headerGroup.headers" 
              :key="header.id"
              :class="[
                'text-xs font-medium fixed-width-cell group', 
                tableSettings?.headerCellClass || '',
                header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                header.column.getIsPinned() === 'left' ? 'sticky left-0 bg-background border-r pinned-left' : '',
                header.column.getIsPinned() === 'right' ? 'sticky right-0 bg-background border-l pinned-right' : ''
              ]"
              :style="getColumnHeaderStyle(header)"
              @click="header.column.getCanSort() ? header.column.toggleSorting() : null"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <FlexRender
                    v-if="!header.isPlaceholder"
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                </div>
                <div class="flex items-center space-x-1">
                  <div v-if="header.column.getCanSort()" class="ml-1">
                    <ChevronUp
                      v-if="header.column.getIsSorted() === 'asc'"
                      class="h-4 w-4 text-muted-foreground"
                    />
                    <ChevronDown
                      v-else-if="header.column.getIsSorted() === 'desc'"
                      class="h-4 w-4 text-muted-foreground"
                    />
                    <ChevronsUpDown
                      v-else
                      class="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100"
                    />
                  </div>
                  
                  <!-- Boutons d'épinglage des colonnes -->
                  <template v-if="columnPinning">
                    <template v-if="header.column.getIsPinned() === 'left'">
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-6 w-6 p-0"
                        @click.stop="() => unpinColumn(header.column.id, 'left')"
                        title="Désépingler cette colonne"
                      >
                        <PinOff class="h-3.5 w-3.5" />
                      </Button>
                    </template>
                    <template v-else>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-6 w-6 p-0"
                        @click.stop="() => pinColumnToLeft(header.column.id)"
                        title="Épingler cette colonne"
                      >
                        <Pin class="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                      </Button>
                    </template>
                  </template>
                </div>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="loadingState || !safeData.length">
            <TableRow>
              <TableCell :colspan="safeColumns.length" class="h-24 text-center">
                <div class="flex justify-center items-center">
                  <div v-if="loadingState" class="loading-spinner mr-2"></div>
                  {{ loadingState ? 'Chargement...' : 'Aucune donnée disponible' }}
                </div>
              </TableCell>
            </TableRow>
          </template>
          <template v-else-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
              @click="row.toggleSelected()"
              class="cursor-pointer"
              :class="[
                tableSettings?.rowHeights ? `h-[${tableSettings.rowHeights}px]` : '',
                tableSettings?.currentRowClassName && row.getIsSelected() ? tableSettings.currentRowClassName : '',
                tableSettings?.rowClass || ''
              ]"
            >
              <TableCell 
                v-for="cell in row.getVisibleCells()" 
                :key="cell.id"
                :class="[
                  'p-2 align-middle fixed-width-cell',
                  tableSettings?.cellClass || '',
                  tableSettings?.currentColClassName && cell.column.getIsVisible() ? tableSettings.currentColClassName : '',
                  cell.column.getIsPinned() === 'left' ? 'sticky left-0 bg-background border-r pinned-left' : '',
                  cell.column.getIsPinned() === 'right' ? 'sticky right-0 bg-background border-l pinned-right' : ''
                ]"
                :style="getColumnCellStyle(cell)"
              >
                <FlexRender 
                  :render="cell.column.columnDef.cell" 
                  :props="cell.getContext()" 
                />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow>
              <TableCell :colspan="safeColumns.length" class="h-24 text-center">
                Aucun résultat.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
    
    <!-- Pagination -->
    <div class="flex items-center justify-between py-4" v-if="pagination && table.getRowModel().rows?.length > 0">
      <div class="flex-1 text-sm text-muted-foreground">
        {{ table.getFilteredSelectedRowModel().rows.length }} sur {{ table.getFilteredRowModel().rows.length }} ligne(s) sélectionnée(s)
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          Précédent
        </Button>
        <div class="flex items-center space-x-1">
          <span class="text-sm">Page {{ table.getState().pagination.pageIndex + 1 }} sur {{ table.getPageCount() }}</span>
        </div>
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
</template>

<script setup lang="ts" generic="TData">
import { ref, computed, watch } from 'vue'
import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useVueTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
  type ColumnPinningState
} from '@tanstack/vue-table'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown, ChevronUp, ChevronsUpDown, Pin, PinOff } from 'lucide-vue-next'
import { valueUpdater } from './utils/tanstack/column-helpers'

// Props du composant
const props = defineProps<{
  columns: ColumnDef<TData, any>[] // Définitions des colonnes
  data: TData[] // Données
  loadingState?: boolean // État de chargement
  pagination?: boolean // Activer la pagination
  searchable?: boolean // Activer la recherche
  searchField?: string // Champ sur lequel effectuer la recherche
  columnToggle?: boolean // Permettre de masquer/afficher les colonnes
  columnPinning?: boolean // Permettre d'épingler les colonnes
  rowSelection?: boolean // Permettre la sélection des lignes
  tableSettings?: Record<string, any> // Paramètres supplémentaires pour le tableau
  tableLayout?: 'auto' | 'fixed' // Disposition de la table
  pageSizes?: number[] // Tailles de page disponibles
}>()

// Évènements émis
const emit = defineEmits<{
  selection: [selectedRows: TData[]]
  'change': [changes: any]
  'delete-request': [rows: TData[]]
}>()

// Options de taille de page par défaut
const pageSizeOptions = computed(() => 
  props.pageSizes || [10, 25, 50, 100, 500]
)

// S'assurer que data est toujours un tableau
const safeData = computed<TData[]>(() => {
  return Array.isArray(props.data) ? props.data : []
})

// S'assurer que columns est toujours un tableau
const safeColumns = computed<ColumnDef<TData, any>[]>(() => {
  return Array.isArray(props.columns) ? props.columns : []
})

// États locaux
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelectionState = ref({})
const columnPinning = ref<ColumnPinningState>({
  left: [],
  right: []
})
const paginationState = ref<PaginationState>({
  pageIndex: 0,
  pageSize: pageSizeOptions.value[0] || 10,
})
const searchQuery = ref('')

// Configuration de la table avec gestion des erreurs
const table = useVueTable({
  get data() { 
    try {
      return safeData.value
    } catch (e) {
      console.error("Erreur lors de l'accès aux données :", e)
      return []
    }
  },
  get columns() { 
    try {
      return safeColumns.value
    } catch (e) {
      console.error("Erreur lors de l'accès aux colonnes :", e)
      return []
    }
  },
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelectionState),
  onColumnPinningChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnPinning),
  onPaginationChange: (updaterOrValue) => valueUpdater(updaterOrValue, paginationState),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: props.pagination ? getPaginationRowModel() : undefined,
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelectionState.value },
    get columnPinning() { 
      console.log('Récupération de l\'état d\'épinglage dans la config de table:', JSON.stringify(columnPinning.value))
      return columnPinning.value 
    },
    get pagination() { return props.pagination ? paginationState.value : undefined },
  },
  enableRowSelection: props.rowSelection,
  enableMultiRowSelection: props.rowSelection,
  enableColumnPinning: props.columnPinning,
  debugTable: true,
  debugHeaders: true,
  debugColumns: true,
  getRowId: (row: any) => {
    // Tenter d'utiliser une clé primaire commune
    for (const key of ['id', 'ID', '_id', 'uuid', 'key']) {
      if (row[key] !== undefined) {
        return String(row[key])
      }
    }
    
    // Sinon, utiliser JSON.stringify comme fallback - attention aux performances
    try {
      return JSON.stringify(row)
    } catch (e) {
      console.error("Erreur lors de la création d'un ID de ligne :", e)
      return Math.random().toString(36).substring(2)
    }
  },
})

// Fonction de gestion du changement de la valeur de recherche
const handleSearchUpdate = (value: string | number) => {
  const stringValue = String(value)
  handleSearch(stringValue)
}

// Fonction de recherche
const handleSearch = (value: string) => {
  searchQuery.value = value
  
  if (props.searchField) {
    table.getColumn(props.searchField)?.setFilterValue(value)
  } else {
    // Si aucun champ de recherche spécifié, on cherche dans toutes les colonnes
    // Cette partie est à implémenter si besoin
  }
}

// Méthodes utilitaires pour gérer les styles des colonnes épinglées
const getColumnHeaderStyle = (header: any) => {
  const baseStyle = header.column.columnDef.size 
    ? `width: ${header.column.columnDef.size}px !important; min-width: ${header.column.columnDef.size}px !important; max-width: ${header.column.columnDef.size}px !important;` 
    : '';
    
  if (header.column.getIsPinned() === 'left') {
    return `${baseStyle} left: ${header.column.getStart('left')}px;`;
  }
  
  if (header.column.getIsPinned() === 'right') {
    return `${baseStyle} right: ${header.column.getAfter('right')}px;`;
  }
  
  return baseStyle;
}

const getColumnCellStyle = (cell: any) => {
  const baseStyle = cell.column.columnDef.size 
    ? `width: ${cell.column.columnDef.size}px !important; min-width: ${cell.column.columnDef.size}px !important; max-width: ${cell.column.columnDef.size}px !important;` 
    : '';
    
  if (cell.column.getIsPinned() === 'left') {
    return `${baseStyle} left: ${cell.column.getStart('left')}px;`;
  }
  
  if (cell.column.getIsPinned() === 'right') {
    return `${baseStyle} right: ${cell.column.getAfter('right')}px;`;
  }
  
  return baseStyle;
}

// Méthode utilitaire pour forcer la mise à jour de l'épinglage après manipulation
const forceUpdatePinning = () => {
  // Déclencher un événement de mise à jour pour s'assurer que les changements sont appliqués
  setTimeout(() => {
    console.log('Mise à jour forcée de l\'affichage des colonnes épinglées')
    table.setColumnPinning({ ...columnPinning.value })
  }, 0)
}

// Méthodes pour gérer les colonnes épinglées
const pinColumnToLeft = (columnId: string) => {
  console.log('Épingler à gauche:', columnId, 'État actuel:', JSON.stringify(columnPinning.value))
  const currentLeft = columnPinning.value.left || []
  
  // Ajouter à 'left' seulement si elle n'y est pas déjà
  const newLeft = currentLeft.includes(columnId) ? currentLeft : [...currentLeft, columnId]
  
  const newPinningState = {
    left: newLeft,
    right: []  // On ne garde aucune colonne épinglée à droite
  }
  
  console.log('Nouvel état d\'épinglage:', JSON.stringify(newPinningState))
  table.setColumnPinning(newPinningState)
  // Mettre à jour directement l'état local pour s'assurer qu'il est synchronisé
  columnPinning.value = newPinningState
  forceUpdatePinning()
}

const unpinColumn = (columnId: string, side: 'left' | 'right') => {
  console.log('Désépingler:', columnId, 'du côté:', side, 'État actuel:', JSON.stringify(columnPinning.value))
  const currentLeft = columnPinning.value.left || []
  
  const newPinningState = {
    left: side === 'left' ? currentLeft.filter(id => id !== columnId) : currentLeft,
    right: []  // On ne garde aucune colonne épinglée à droite
  }
  
  console.log('Nouvel état d\'épinglage après désépinglage:', JSON.stringify(newPinningState))
  table.setColumnPinning(newPinningState)
  // Mettre à jour directement l'état local pour s'assurer qu'il est synchronisé
  columnPinning.value = newPinningState
  forceUpdatePinning()
}

// Méthode pour désépingler toutes les colonnes
const unpinAllColumns = () => {
  console.log('Désépingler toutes les colonnes')
  const newPinningState = {
    left: [],
    right: []
  }
  
  table.setColumnPinning(newPinningState)
  // Mettre à jour directement l'état local pour s'assurer qu'il est synchronisé
  columnPinning.value = newPinningState
  forceUpdatePinning()
}

// Émission de la sélection quand elle change
watch(rowSelectionState, () => {
  try {
    const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
    emit('selection', selectedRows)
  } catch (error) {
    console.error('Erreur lors de la récupération des lignes sélectionnées:', error)
    emit('selection', [])
  }
})

// Réinitialiser la pagination quand les données changent
watch(() => safeData.value, () => {
  if (props.pagination) {
    paginationState.value.pageIndex = 0
  }
}, { deep: false })

// S'assurer que l'état d'épinglage est correctement initialisé
watch(() => props.columnPinning, (enabled) => {
  if (!enabled) {
    // Si l'épinglage est désactivé, réinitialiser l'état
    columnPinning.value = { left: [], right: [] }
    table.setColumnPinning({ left: [], right: [] })
  } else {
    // Forcer une mise à jour de l'affichage des colonnes épinglées
    forceUpdatePinning()
  }
}, { immediate: true })

// Exposer l'instance de la table pour permettre un accès externe
defineExpose({
  table,
})

// Surveiller les changements dans l'état d'épinglage des colonnes
watch(columnPinning, (newVal) => {
  console.log('État d\'épinglage des colonnes mis à jour:', JSON.stringify(newVal))
}, { deep: true })
</script>

<style scoped>
.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-left-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

:global(.cursor-pointer) {
  cursor: pointer;
}

:global([data-state="selected"]) {
  background-color: rgba(59, 130, 246, 0.1);
}

/* Styles pour la table à largeur fixe */
:deep(.fixed-width-table) {
  width: auto !important;
  table-layout: fixed !important;
}

:deep(.fixed-width-table thead tr),
:deep(.fixed-width-table tbody tr) {
  display: table;
  width: 100%;
  table-layout: fixed;
}

:deep(.fixed-width-cell) {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

/* Empêcher le redimensionnement automatique */
:deep(th),
:deep(td) {
  box-sizing: border-box !important;
  white-space: nowrap !important;
}

/* Styles pour le contenu des cellules */
:deep(td > div),
:deep(th > div) {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

/* Styles pour les colonnes épinglées */
:deep(.has-pinned-columns) {
  position: relative;
  overflow: auto;
}

:deep(.has-pinned-columns table) {
  position: relative;
}

:deep(thead th.sticky),
:deep(tbody td.sticky) {
  position: sticky !important;
  z-index: 1;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(thead th.sticky.left-0),
:deep(tbody td.sticky.left-0) {
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  left: 0;
  z-index: 2;
  background-color: var(--background, white) !important;
  backdrop-filter: blur(4px);
}

:deep(thead th.sticky.right-0),
:deep(tbody td.sticky.right-0) {
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
  right: 0;
  z-index: 2;
  background-color: var(--background, white) !important;
  backdrop-filter: blur(4px);
}

/* Assurer que le header des colonnes épinglées est plus visible */
:deep(thead th.sticky) {
  z-index: 3 !important;
  background-color: var(--background, white) !important;
}

/* Style pour les colonnes épinglées en mode sombre */
.dark :deep(thead th.sticky),
.dark :deep(tbody td.sticky) {
  background-color: var(--background, #1f2937) !important;
}

/* Styles spécifiques pour mieux visualiser les colonnes épinglées */
:deep(.pinned-left),
:deep(.pinned-right) {
  background-color: var(--background, white) !important;
  position: relative;
}

/* Effet visuel pour distinguer les colonnes épinglées */
:deep(.pinned-left)::after,
:deep(.pinned-right)::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  background-color: rgba(59, 130, 246, 0.05);
  pointer-events: none;
}

.dark :deep(.pinned-left)::after,
.dark :deep(.pinned-right)::after {
  background-color: rgba(59, 130, 246, 0.1);
}

:deep(.pinned-left) {
  border-right: 2px solid var(--primary, #3b82f6) !important;
}

:deep(.pinned-right) {
  border-left: 2px solid var(--primary, #3b82f6) !important;
}

/* Ajuster le curseur pour indiquer que les colonnes épinglées sont spéciales */
:deep(th.sticky .group-hover\:opacity-100),
:deep(td.sticky .group-hover\:opacity-100) {
  opacity: 1 !important;
}

/* Animation pour les colonnes nouvellement épinglées */
@keyframes highlight-pinned {
  0% { background-color: rgba(59, 130, 246, 0.2); }
  100% { background-color: rgba(59, 130, 246, 0.05); }
}

:deep(.pinned-left)::after {
  animation: highlight-pinned 1s ease-out;
}

/* Amélioration de l'apparence des boutons d'épinglage */
:deep(.pinned-left .h-3\.5.w-3\.5),
:deep(th:hover .h-3\.5.w-3\.5) {
  opacity: 1 !important;
  transition: color 0.2s ease, transform 0.2s ease;
}

:deep(th:hover .h-3\.5.w-3\.5:hover) {
  transform: scale(1.2);
}
</style>
