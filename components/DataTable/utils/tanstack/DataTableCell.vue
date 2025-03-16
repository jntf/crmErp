<template>
  <td 
    :style="cellProps?.style" 
    :class="[
      cellProps?.className,
      'border-b border-r border-muted p-2 align-middle relative',
      { 'cursor-pointer': handlers?.onRowClick }
    ]"
    :id="`cell-${rowId}-${columnId}`"
    tabindex="0"
  >
    <FlexRender 
      :render="cell.column.columnDef.cell" 
      :props="flexRenderContext" 
    />
  </td>
</template>

<script setup lang="ts">
import { FlexRender } from '@tanstack/vue-table'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  cell: any
  rowId: string
  columnId: string
  cellProps?: {
    style?: any
    className?: string
  }
  flexRenderContext: any // Contexte pour flexRender
  handlers?: {
    onRowClick?: (row: any) => void
  }
}>()
</script> 