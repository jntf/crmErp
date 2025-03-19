<template>
  <div @keydown="handleKeyDown" @keyup="handleKeyUp" tabindex="0" class="outline-none datatable-wrapper" :class="{
    'full-width-container': state.isFullWidth.value,
    'datatable-edit-mode': isEditMode
  }">
    <!-- Barre d'outils latérale -->
    <DataTableSideToolbar v-if="sideToolbar" :table="table" :column-pinning-enabled="!!columnPinning"
      :is-full-width="state.isFullWidth.value" :is-editable-table="isEditable" :read-only="state.readOnly.value"
      :export-filename="exportFilename" @export="handleExport" @toggle-readonly="handleToggleReadOnly"
      @toggle-fullwidth="state.toggleFullWidth()" @toggle-keyboard-help="state.toggleKeyboardShortcutsHelp()"
      @pin-mode="pinning.toggleColumnPinning()">
      <template #additional-buttons>
        <slot name="side-toolbar-buttons"></slot>
      </template>
    </DataTableSideToolbar>

    <!-- Barre d'outils principale -->
    <TableToolbar :table="table" :searchable="searchable" :searchQuery="state.searchQuery.value"
      :handleSearchUpdate="search.handleSearchUpdate" :pagination="pagination"
      :pageSize="state.paginationState.value.pageSize" :pageSizeOptions="state.pageSizeOptions.value"
      :setPageSize="tablePagination.setPageSize" :isFullWidth="state.isFullWidth.value" :isEditMode="!!isEditMode"
      :sideToolbar="sideToolbar" :columnToggle="columnToggle">
      <template #toolbar-start>
        <slot name="toolbar-start"></slot>
      </template>
      <template #toolbar-end>
        <slot name="toolbar-end"></slot>
      </template>
    </TableToolbar>

    <!-- Table -->
    <div class="rounded-md border overflow-auto" :class="{ 'datatable-container': !state.isFullWidth.value }">
      <!-- Bandeau d'édition -->
      <div v-if="isEditMode"
        class="p-2 bg-amber-50 border-b border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-200 flex items-center justify-between">
        <div class="text-sm">
          <span class="font-medium">Mode édition :</span> Cliquez sur les cellules pour les modifier
          <span v-if="state.pendingChanges.value.length > 0"
            class="ml-2 bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-100 px-2 py-0.5 rounded text-xs">
            {{ state.pendingChanges.value.length }} modification{{ state.pendingChanges.value.length > 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex gap-2">
          <Button size="sm" variant="outline"
            class="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900 dark:hover:text-green-300"
            @click="editing.saveChanges()" :disabled="state.pendingChanges.value.length === 0">
            <Save class="w-4 h-4 mr-1" />
            Enregistrer
          </Button>
          <Button size="sm" variant="outline"
            class="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900 dark:hover:text-red-300"
            @click="editing.cancelChanges()" :disabled="state.pendingChanges.value.length === 0">
            <X class="w-4 h-4 mr-1" />
            Annuler
          </Button>
        </div>
      </div>

      <!-- Indicateurs de touches actives -->
      <div
        v-if="(state.isShiftKeyPressed.value || state.isCtrlKeyPressed.value || state.isMetaKeyPressed.value) && !isEditMode"
        class="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 text-xs">
        <span v-if="state.isShiftKeyPressed.value"
          class="px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          Shift
        </span>
        <span v-if="state.isCtrlKeyPressed.value"
          class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          Ctrl
        </span>
        <span v-if="state.isMetaKeyPressed.value"
          class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          Cmd
        </span>
        <span class="text-muted-foreground">Mode sélection multiple actif</span>
      </div>

      <Table :class="[
        tableSettings?.height ? 'max-h-[' + tableSettings.height + ']' : '',
        'fixed-width-table',
        (columnPinning && (state.columnPinning.value.left?.length)) ? 'has-pinned-columns' : ''
      ]" :table-layout="props.tableLayout || 'fixed'">
        <!-- En-tête du tableau -->
        <TableHeader :table="table" :tableSettings="tableSettings" :columnPinning="columnPinning"
          :pinColumnToLeft="pinning.pinColumnToLeft" :unpinColumn="pinning.unpinColumn"
          :getColumnHeaderStyle="pinning.getColumnHeaderStyle" />

        <!-- Corps du tableau -->
        <TableBody :table="table" :columns="state.safeColumns.value" :data="state.safeData.value"
          :loadingState="loadingState" :isEditMode="!!isEditMode" :tableSettings="tableSettings"
          :displayedRows="tablePagination.displayedRows.value" :handleRowClick="selection.handleRowClick"
          :getColumnCellStyle="pinning.getColumnCellStyle" />
      </Table>
    </div>

    <!-- Pagination -->
    <TablePagination v-if="pagination && table.getRowModel().rows?.length > 0" :table="table"
      :pageIndex="state.paginationState.value.pageIndex" :totalPages="tablePagination.totalPages.value"
      :goToPreviousPage="tablePagination.goToPreviousPage" :goToNextPage="tablePagination.goToNextPage" />

    <!-- Boîte de dialogue d'aide pour les raccourcis clavier -->
    <KeyboardShortcutsHelp v-model:visible="state.keyboardShortcutsHelpVisible.value" />
  </div>
</template>

<script setup lang="ts" generic="TData">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useVueTable
} from '@tanstack/vue-table'

import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { Save, X } from 'lucide-vue-next'
import DataTableSideToolbar from './utils/tanstack/DataTableSideToolbar.vue'

// Composants refactorisés
import TableHeader from './components/TableHeader.vue'
import TableBody from './components/TableBody.vue'
import TablePagination from './components/TablePagination.vue'
import TableToolbar from './components/TableToolbar.vue'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp.vue'

// Composables
import { useTableState } from './composables/useTableState'
import { useTablePinning } from './composables/useTablePinning'
import { useTableSelection } from './composables/useTableSelection'
import { useTableEditing } from './composables/useTableEditing'
import { useTablePagination } from './composables/useTablePagination'
import { useTableSearch } from './composables/useTableSearch'
import { useTableExport } from './composables/useTableExport'

// Types
import type { DataTableProps, DataTableEmits } from './types/table-types'
import type { Table as TableType } from '@tanstack/vue-table'

// Props du composant
const props = defineProps<DataTableProps<TData>>()

// Évènements émis
const emit = defineEmits<DataTableEmits<TData>>()

// Initialiser l'état global
const state = useTableState<TData>(props)

// Computed pour le mode édition
const isEditMode = computed(() => state.isEditMode.value)

// Création d'un type pour la métadonnée de la table pour éviter la référence circulaire
const tableMeta = {
  isEditMode: props.isEditable,
  pendingChanges: state.pendingChanges.value,
  handleCellChange: (rowId: string, columnId: string, value: any) => {
    // Cette fonction sera mise à jour après l'initialisation de la table
  },
  activeCell: null as { rowId: string; columnId: string } | null,
  setActiveCell: (rowId: string, columnId: string) => {
    if (tableMeta) {
      tableMeta.activeCell = { rowId, columnId };
    }
  },
}

// Configuration de la table avec gestion des erreurs et des états
const table = useVueTable<TData>({
  get data() {
    try {
      return state.safeData.value
    } catch (e) {
      console.error("Erreur lors de l'accès aux données :", e)
      return []
    }
  },
  get columns() {
    try {
      return state.safeColumns.value
    } catch (e) {
      console.error("Erreur lors de l'accès aux colonnes :", e)
      return []
    }
  },
  onSortingChange: (updaterOrValue) => state.valueUpdater(updaterOrValue, state.sorting),
  onColumnFiltersChange: (updaterOrValue) => state.valueUpdater(updaterOrValue, state.columnFilters),
  onColumnVisibilityChange: (updaterOrValue) => state.valueUpdater(updaterOrValue, state.columnVisibility),
  onRowSelectionChange: (updaterOrValue) => state.valueUpdater(updaterOrValue, state.rowSelectionState),
  onColumnPinningChange: (updaterOrValue) => state.valueUpdater(updaterOrValue, state.columnPinning),
  onPaginationChange: (updaterOrValue) => state.valueUpdater(updaterOrValue, state.paginationState),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: undefined,
  state: {
    get sorting() { return state.sorting.value },
    get columnFilters() { return state.columnFilters.value },
    get columnVisibility() { return state.columnVisibility.value },
    get rowSelection() { return state.rowSelectionState.value },
    get columnPinning() { return state.columnPinning.value },
    get pagination() { return props.pagination ? state.paginationState.value : undefined },
  },
  meta: tableMeta,
  enableRowSelection: props.rowSelection && !isEditMode.value, // Désactiver la sélection en mode édition
  enableMultiRowSelection: props.rowSelection && !isEditMode.value,
  enableColumnPinning: props.columnPinning,
  debugTable: false,
  debugHeaders: false,
  debugColumns: false,
  getRowId: (row: any) => {
    // Tenter d'utiliser une clé primaire commune
    for (const key of ['id', 'ID', '_id', 'uuid', 'key']) {
      if (row[key] !== undefined) {
        return String(row[key])
      }
    }

    // Sinon, utiliser JSON.stringify comme fallback
    return JSON.stringify(row)
  },
})

// Mettre à jour les fonctions de métadonnées qui ont besoin d'accéder à la table
tableMeta.handleCellChange = (rowId: string, columnId: string, value: any) => {
  editing.handleCellChange(rowId, columnId, value)
}

// Initialiser les autres composables avec la table et l'état
const pinning = useTablePinning<TData>(table, state.columnPinning)
const selection = useTableSelection<TData>(
  table,
  state.rowSelectionState,
  state.lastSelectedRowIndex,
  state.isShiftKeyPressed,
  state.isCtrlKeyPressed,
  state.isMetaKeyPressed,
  emit
)
const editing = useTableEditing<TData>(table, state.readOnly, state.pendingChanges, props, emit)
const tablePagination = useTablePagination<TData>(table, state.paginationState, state.safeData)
const search = useTableSearch<TData>(table, props)
const exporter = useTableExport<TData>(table, emit)

// Handler pour la gestion des raccourcis clavier
const handleKeyDown = selection.handleKeyDown
const handleKeyUp = selection.handleKeyUp

// Handler pour l'export
const handleExport = exporter.handleExport

// Handler pour le basculement du mode édition
const handleToggleReadOnly = editing.handleToggleReadOnly

// Exposer l'instance de la table pour permettre un accès externe
defineExpose({
  table,
})

// Initialisation au montage du composant
onMounted(() => {
  // Initialiser à partir du localStorage
  state.initFromLocalStorage()

  // Configurer les écouteurs d'événements pour les raccourcis clavier
  selection.setupKeyboardListeners()

  // Forcer une mise à jour de l'affichage des colonnes épinglées
  if (props.columnPinning) {
    state.forceUpdatePinning(table)
  }

  // Configurer l'éditeur si nécessaire
  if (props.isEditable) {
    editing.setupEditingKeyboardListeners()
  }
})

// Nettoyage des écouteurs d'événements
onUnmounted(() => {
  selection.cleanupKeyboardListeners()

  if (props.isEditable) {
    editing.cleanupEditingKeyboardListeners()
  }
})
</script>

<style scoped>
/* Wrapper de la table avec positionnement relatif pour la barre d'outils latérale */
.datatable-wrapper {
  position: relative;
  padding-left: 0.5rem;
  /* Espace à gauche pour la barre d'outils latérale */
}

/* Mode pleine largeur */
.full-width-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  padding: 1rem;
  overflow: auto;
  transition: all 0.3s ease;
}

/* Overlay semi-transparent pour le fond */
.full-width-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: -1;
  backdrop-filter: blur(2px);
}

.dark .full-width-container::before {
  background-color: rgba(0, 0, 0, 0.85);
}

/* Style pour la barre d'outils en mode pleine largeur */
.toolbar-fullwidth {
  background-color: var(--background, white);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dark .toolbar-fullwidth {
  background-color: var(--background, #020617);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

/* Conteneur du tableau avec effet d'élévation */
.full-width-container :deep(.rounded-md.border) {
  background-color: var(--background, white);
  border-radius: 0.5rem;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dark .full-width-container :deep(.rounded-md.border) {
  background-color: var(--background, #020617);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
}

/* S'assurer que le tableau prend toute la hauteur disponible en mode pleine largeur */
.full-width-container :deep(.fixed-width-table) {
  height: calc(100vh - 170px) !important;
  max-height: none !important;
  overflow: auto;
}

/* Ajouter une animation de transition pour un basculement fluide */
:deep(.fixed-width-table) {
  transition: all 0.3s ease;
}

/* Assurer que la pagination est également bien visible en mode pleine largeur */
.full-width-container>.flex.items-center.justify-between.py-4:last-child {
  background-color: var(--background, white);
  border-radius: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.dark .full-width-container>.flex.items-center.justify-between.py-4:last-child {
  background-color: var(--background, #020617);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5);
}

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
  to {
    transform: rotate(360deg);
  }
}

:global(.cursor-pointer) {
  cursor: pointer;
}

:global([data-state="selected"]) {
  background-color: rgba(34, 197, 94, 0.1) !important;
}

:global([data-state="selected"] td) {
  background-color: rgba(34, 197, 94, 0.1) !important;
}

.dark :global([data-state="selected"]),
.dark :global([data-state="selected"] td) {
  background-color: rgba(34, 197, 94, 0.2) !important;
}

/* Styles pour la table à largeur fixe */
:deep(.fixed-width-table) {
  width: auto !important;
  table-layout: fixed !important;
  font-size: 0.75rem !important;
  /* text-xs équivalent */
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
  font-size: 0.75rem !important;
  /* text-xs équivalent */
}

/* Empêcher le redimensionnement automatique */
:deep(th),
:deep(td) {
  box-sizing: border-box !important;
  white-space: nowrap !important;
  padding: 0.25rem 0.5rem !important;
  /* p-1 équivalent */
}

/* Styles pour le contenu des cellules */
:deep(td > div),
:deep(th > div) {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  font-size: 0.75rem !important;
  /* text-xs équivalent */
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
  backdrop-filter: blur(4px);
}

/* Assurer que le header des colonnes épinglées est plus visible */
:deep(thead th.sticky) {
  z-index: 3 !important;
  background-color: var(--gray-500, #6b7280) !important;
  color: white !important;
}

.dark :deep(thead th.sticky) {
  background-color: var(--gray-800, #1f2937) !important;
  color: var(--gray-200, #e5e7eb) !important;
}

/* Style pour les colonnes épinglées en mode sombre */
.dark :deep(tbody td.sticky) {
  background-color: inherit !important;
}

/* Styles spécifiques pour mieux visualiser les colonnes épinglées */
:deep(.pinned-left),
:deep(.pinned-right) {
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
  background-color: rgba(34, 197, 94, 0.05);
  pointer-events: none;
}

.dark :deep(.pinned-left)::after,
.dark :deep(.pinned-right)::after {
  background-color: rgba(34, 197, 94, 0.1);
}

:deep(.pinned-left) {
  border-right: 2px solid var(--green-500, #22c55e) !important;
}

:deep(.pinned-right) {
  border-left: 2px solid var(--green-500, #22c55e) !important;
}

/* Ajuster le curseur pour indiquer que les colonnes épinglées sont spéciales */
:deep(th.sticky .group-hover\:opacity-100),
:deep(td.sticky .group-hover\:opacity-100) {
  opacity: 1 !important;
}

/* Animation pour les colonnes nouvellement épinglées */
@keyframes highlight-pinned {
  0% {
    background-color: rgba(59, 130, 246, 0.2);
  }

  100% {
    background-color: rgba(59, 130, 246, 0.05);
  }
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

/* Assurer que les colonnes épinglées respectent le style alterné des lignes */
:deep(tbody tr:nth-child(even) td.sticky) {
  background-color: var(--white, white) !important;
}

:deep(tbody tr:nth-child(odd) td.sticky) {
  background-color: var(--gray-50, #f9fafb) !important;
}

.dark :deep(tbody tr:nth-child(even) td.sticky) {
  background-color: var(--gray-950, #030712) !important;
}

.dark :deep(tbody tr:nth-child(odd) td.sticky) {
  background-color: var(--gray-900, #111827) !important;
}

/* Assurer que les colonnes épinglées respectent la sélection */
:deep(tbody tr[data-state="selected"] td),
:deep(tbody tr[data-state="selected"] td.sticky) {
  background-color: rgba(34, 197, 94, 0.1) !important;
}

.dark :deep(tbody tr[data-state="selected"] td),
.dark :deep(tbody tr[data-state="selected"] td.sticky) {
  background-color: rgba(34, 197, 94, 0.2) !important;
}

/* Réduire la hauteur des lignes pour un tableau plus compact */
:deep(tbody tr) {
  height: 28px !important;
  /* Hauteur réduite pour les lignes */
}

:deep(thead tr) {
  height: 32px !important;
  /* Hauteur légèrement plus grande pour l'en-tête */
}

/* Réduire l'espacement vertical dans les cellules */
:deep(td),
:deep(th) {
  padding-top: 0.125rem !important;
  /* py-0.5 équivalent */
  padding-bottom: 0.125rem !important;
}

/* Styles pour le tableau en mode normal avec défilement */
.datatable-container {
  max-height: 500px;
  /* Hauteur maximale en mode normal */
  overflow: auto;
}

/* Permettre le défilement du tableau même en mode normal */
:deep(.fixed-width-table) {
  width: auto !important;
  table-layout: fixed !important;
  font-size: 0.75rem !important;
  /* text-xs équivalent */
  overflow: visible;
  /* Pour permettre au conteneur parent de gérer le défilement */
}

/* Styles pour le mode édition */
.datatable-edit-mode .editable-cell {
  position: relative;
  cursor: text !important;
  transition: all 0.2s ease;
}

.datatable-edit-mode .editable-cell:hover {
  background-color: rgba(59, 130, 246, 0.05) !important;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
}

.datatable-edit-mode .editable-cell::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 6px 6px 0;
  border-color: transparent rgba(59, 130, 246, 0.3) transparent transparent;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.datatable-edit-mode .editable-cell:hover::after {
  opacity: 1;
}

/* Ajuster l'apparence en mode édition */
.datatable-edit-mode tbody tr:hover {
  background-color: inherit !important;
}

/* Style pour les cellules modifiées */
.datatable-edit-mode .modified-cell {
  background-color: rgba(250, 204, 21, 0.1) !important;
  box-shadow: inset 0 0 0 1px rgba(202, 138, 4, 0.5);
}

.datatable-edit-mode .modified-cell::after {
  border-color: transparent rgba(202, 138, 4, 0.5) transparent transparent;
  opacity: 1;
}
</style>