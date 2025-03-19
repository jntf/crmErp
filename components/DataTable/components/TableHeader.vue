<template>
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
          'text-xs font-medium fixed-width-cell group bg-gray-500 text-white dark:bg-gray-800 dark:text-gray-200', 
          tableSettings?.headerCellClass || '',
          header.column.getCanSort() ? 'cursor-pointer select-none' : '',
          header.column.getIsPinned() === 'left' ? 'sticky left-0 bg-gray-500 text-white dark:bg-gray-800 dark:text-gray-200 border-r pinned-left' : '',
          header.column.getIsPinned() === 'right' ? 'sticky right-0 bg-gray-500 text-white dark:bg-gray-800 dark:text-gray-200 border-l pinned-right' : ''
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
                class="h-4 w-4 text-white dark:text-gray-200"
              />
              <ChevronDown
                v-else-if="header.column.getIsSorted() === 'desc'"
                class="h-4 w-4 text-white dark:text-gray-200"
              />
              <ChevronsUpDown
                v-else
                class="h-4 w-4 text-white/70 dark:text-gray-200/70 opacity-0 group-hover:opacity-100"
              />
            </div>
            
            <!-- Boutons d'épinglage des colonnes -->
            <template v-if="columnPinning">
              <template v-if="header.column.getIsPinned() === 'left'">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-6 w-6 p-0"
                  @click.stop="() => unpinColumn(header.column.id)"
                  title="Désépingler cette colonne"
                >
                  <PinOff class="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
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
                  <Pin class="h-3.5 w-3.5 text-muted-foreground hover:text-green-500 dark:hover:text-green-400" />
                </Button>
              </template>
            </template>
          </div>
        </div>
      </TableHead>
    </TableRow>
  </TableHeader>
</template>

<script setup lang="ts" generic="TData">
import { FlexRender } from '@tanstack/vue-table'
import { 
  TableHeader, 
  TableHead,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, ChevronsUpDown, Pin, PinOff } from 'lucide-vue-next'
import type { Table } from '@tanstack/vue-table'

const props = defineProps<{
  table: Table<TData>
  tableSettings?: Record<string, any>
  columnPinning?: boolean
  pinColumnToLeft: (columnId: string) => void
  unpinColumn: (columnId: string) => void
  getColumnHeaderStyle: (header: any) => string
}>()
</script> 