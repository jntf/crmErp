<template>
  <TableBody>
    <template v-if="loadingState || !data.length">
      <TableRow>
        <TableCell :colspan="columns.length" class="h-24 text-center">
          <div class="flex justify-center items-center">
            <div v-if="loadingState" class="loading-spinner mr-2"></div>
            {{ loadingState ? 'Chargement...' : 'Aucune donnée disponible' }}
          </div>
        </TableCell>
      </TableRow>
    </template>
    <template v-else-if="displayedRows.length">
      <TableRow 
        v-for="row in displayedRows"
        :key="row.id"
        :data-state="row.getIsSelected() ? 'selected' : undefined"
        @click="isEditMode ? null : handleRowClick(row)"
        :class="[
          tableSettings?.rowHeights ? `h-[${tableSettings.rowHeights}px]` : '',
          tableSettings?.currentRowClassName && row.getIsSelected() ? tableSettings.currentRowClassName : '',
          tableSettings?.rowClass || '',
          row.index % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900',
          isEditMode ? 'cursor-default' : 'cursor-pointer'
        ]"
      >
        <TableCell 
          v-for="cell in row.getVisibleCells()" 
          :key="cell.id"
          :class="[
            'p-1 align-middle fixed-width-cell text-xs',
            tableSettings?.cellClass || '',
            tableSettings?.currentColClassName && cell.column.getIsVisible() ? tableSettings.currentColClassName : '',
            cell.column.getIsPinned() === 'left' ? 'sticky left-0 border-r pinned-left' : '',
            cell.column.getIsPinned() === 'right' ? 'sticky right-0 border-l pinned-right' : '',
            row.index % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900',
            isEditMode ? 'editable-cell' : ''
          ]"
          :style="getColumnCellStyle(cell)"
          :id="isEditMode ? `cell-${row.id}-${cell.column.id}` : undefined"
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
        <TableCell :colspan="columns.length" class="h-24 text-center">
          Aucun résultat.
        </TableCell>
      </TableRow>
    </template>
  </TableBody>
</template>

<script setup lang="ts" generic="TData">
import { FlexRender } from '@tanstack/vue-table'
import { 
  TableBody, 
  TableCell,
  TableRow,
} from '@/components/ui/table'
import type { Table, ColumnDef } from '@tanstack/vue-table'

const props = defineProps<{
  table: Table<TData>
  columns: ColumnDef<TData, any>[]
  data: TData[]
  loadingState?: boolean
  isEditMode: boolean
  tableSettings?: Record<string, any>
  displayedRows: any[]
  handleRowClick: (row: any) => void
  getColumnCellStyle: (cell: any) => string
}>()
</script> 