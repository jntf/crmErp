<template>
  <DataTable
    :data="dataToUse"
    :columns="columnsToUse"
    :loading-state="loadingState"
    :table-settings="tableSettings"
    :pagination="true"
    :searchable="true"
    :column-toggle="true"
    :row-selection="true"
    :table-layout="tableSettings?.tableLayout || 'fixed'"
    @selection="handleSelection"
    @delete-request="handleDeleteRequest"
  >
    <template #toolbar-start>
      <slot name="toolbar-actions" :selectedItems="selectedItems"></slot>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DataTable from '../../DataTable.vue'
import { convertHandsontableColumns, type HandsontableColumn } from './column-helpers'
import type { ColumnDef } from '@tanstack/vue-table'

// Props: accepte les deux formats (Handsontable et TanStack)
const props = defineProps<{
  // Format Handsontable
  tableData?: any[]
  tableColumns?: HandsontableColumn[]
  // Format TanStack
  data?: any[]
  columns?: ColumnDef<any, any>[]
  // Props communes
  loadingState?: boolean
  tableSettings?: Record<string, any>
  cellRenderers?: Record<string, (value: any, row: any) => string>
  toolbarConfig?: Record<string, any>
}>()

const emit = defineEmits<{
  'update:tableData': [data: any[]];
  'change': [changes: any[]];
  'selection': [selectedRows: any[]];
  'delete-request': [rowData: any[]];
}>()

// Détermine quelles données utiliser (format Handsontable ou TanStack)
const dataToUse = computed(() => {
  // Préférer les données au format TanStack si disponibles
  if (props.data && Array.isArray(props.data)) {
    return props.data
  }
  // Sinon, utiliser les données au format Handsontable
  return props.tableData || []
})

// Détermine quelles colonnes utiliser (format Handsontable ou TanStack)
const columnsToUse = computed(() => {
  // Si des colonnes au format TanStack sont fournies, les utiliser directement
  if (props.columns && Array.isArray(props.columns)) {
    return props.columns
  }
  
  // Sinon, convertir les colonnes Handsontable en colonnes TanStack
  if (props.tableColumns && Array.isArray(props.tableColumns) && props.tableColumns.length > 0) {
    try {
      return convertHandsontableColumns(props.tableColumns, props.cellRenderers)
    } catch (error) {
      console.error("Erreur lors de la conversion des colonnes:", error)
      return []
    }
  }
  
  console.warn("DataTableAdapter: Aucune colonne valide fournie (ni columns ni tableColumns)")
  return []
})

// État interne
const selectedItems = ref<any[]>([])

// Gestion de la sélection
function handleSelection(rows: any[]) {
  selectedItems.value = rows
  emit('selection', rows)
}

// Gestion de la demande de suppression
function handleDeleteRequest(rows: any[]) {
  emit('delete-request', rows)
}

// Surveillance des changements de données
watch(() => dataToUse.value, () => {
  // Si besoin de réagir aux changements de données
}, { deep: true })
</script>

<style>
/* Styles globaux pour s'assurer que les HoverCard s'affichent correctement */
.hover-card-content {
  z-index: 9999 !important;
}

/* Reset des styles pour les éléments de formulaire dans le tableau */
.data-table input, 
.data-table select {
  margin: 0;
  padding: 0.25rem;
  font-size: 0.75rem;
}
</style> 