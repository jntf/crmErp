<template>
  <div class="flex items-center justify-between py-4" :class="{'toolbar-fullwidth': isFullWidth}">
    <div class="flex items-center gap-2">
      <!-- Champ de recherche -->
      <Input
        v-if="searchable"
        class="max-w-sm"
        :class="{'border-2 border-gray-400 bg-white shadow-md dark:border-gray-500 dark:bg-gray-800': isFullWidth}"
        placeholder="Rechercher..."
        :model-value="searchQuery"
        @update:model-value="handleSearchUpdate"
      />
      
      <slot name="toolbar-start"></slot>
    </div>
    
    <div class="flex items-center gap-2">
      <slot name="toolbar-end"></slot>
      
      <!-- Indicateur de mode édition -->
      <div v-if="isEditMode" class="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 rounded-md text-xs font-medium flex items-center">
        <Edit class="w-3 h-3 mr-1" />
        Mode édition actif
      </div>
      
      <!-- Sélecteur du nombre de lignes par page -->
      <div v-if="pagination" class="flex items-center mr-2">
        <Select
          :model-value="String(pageSize)"
          @update:model-value="(value) => setPageSize(Number(value))"
        >
          <SelectTrigger 
            class="h-8 w-[70px]"
            :class="{'border-2 border-gray-400 bg-white shadow-md dark:border-gray-500 dark:bg-gray-800': isFullWidth}"
          >
            <SelectValue placeholder="10" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="size in pageSizeOptions" 
              :key="size" 
              :value="String(size)"
            >
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <!-- Sélecteur de colonnes visibles (seulement si la barre latérale n'est pas activée) -->
      <DropdownMenu v-if="!sideToolbar && columnToggle">
        <DropdownMenuTrigger as-child>
          <Button 
            variant="outline" 
            size="sm"
            :class="{'border-2 border-amber-400 bg-amber-50 text-amber-800 shadow-md hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-800/40': isFullWidth}"
          >
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
</template>

<script setup lang="ts" generic="TData">
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { ChevronDown, Edit } from 'lucide-vue-next'
import type { Table } from '@tanstack/vue-table'

const props = defineProps<{
  table: Table<TData>
  searchable?: boolean
  searchQuery: string
  handleSearchUpdate: (value: string | number) => void
  pagination?: boolean
  pageSize: number
  pageSizeOptions: number[]
  setPageSize: (size: number) => void
  isFullWidth: boolean
  isEditMode: boolean
  sideToolbar?: boolean
  columnToggle?: boolean
}>()
</script> 