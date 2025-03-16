<template>
  <div class="flex items-center relative">
    <!-- Left floating section -->
    <div class="absolute -left-12 top-0 flex flex-col space-y-4 h-full py-5">
      <!-- Column visibility -->
      <Popover class="relative">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" class="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 group">
            <div class="relative w-4 h-4">
              <!-- Custom column icon -->
              <div class="absolute inset-0 flex flex-col justify-between">
                <div class="h-[2px] w-full bg-gray-500 dark:bg-gray-400 group-hover:bg-gray-700 dark:group-hover:bg-gray-300 transition-colors"></div>
                <div class="h-[2px] w-3/4 bg-gray-500 dark:bg-gray-400 group-hover:bg-gray-700 dark:group-hover:bg-gray-300 transition-colors"></div>
                <div class="h-[2px] w-1/2 bg-gray-500 dark:bg-gray-400 group-hover:bg-gray-700 dark:group-hover:bg-gray-300 transition-colors"></div>
              </div>
            </div>
            <span class="sr-only">Gérer les colonnes</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-64 p-0" align="start">
          <Command class="border-none">
            <CommandInput placeholder="Rechercher une colonne..." class="h-9" />
            <CommandList>
              <CommandEmpty>Aucune colonne trouvée.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  v-for="column in tableColumns"
                  :key="column.id"
                  :value="column.id"
                  class="flex items-center space-x-2 px-2 py-1.5"
                >
                  <Checkbox
                    :id="column.id"
                    :checked="column.getIsVisible()"
                    @update:checked="() => column.toggleVisibility(!column.getIsVisible())"
                    :disabled="!column.getCanHide()"
                    class="h-4 w-4"
                  />
                  <span class="text-sm">{{ column.columnDef.header?.toString() || column.id }}</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <!-- Bouton pleine largeur -->
      <Button 
        variant="ghost" 
        size="icon" 
        class="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
        @click="emit('toggle-fullwidth')"
      >
        <component 
          :is="isFullWidth ? Minimize2 : Maximize2"
          class="h-4 w-4 text-gray-500 dark:text-gray-400" 
        />
        <span class="sr-only">{{ isFullWidth ? 'Réduire' : 'Pleine largeur' }}</span>
      </Button>
      
      <!-- Raccourcis clavier -->
      <Button 
        variant="ghost" 
        size="icon" 
        class="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
        @click="emit('toggle-keyboard-help')"
      >
        <Keyboard class="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span class="sr-only">Raccourcis clavier</span>
      </Button>

      <!-- Export -->
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" class="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Download class="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span class="sr-only">Exporter</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="w-48">
          <DropdownMenuItem @click="handleExportClick('excel')" class="flex items-center">
            <FileSpreadsheet class="h-4 w-4 mr-2" />
            <span>Excel</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="handleExportClick('csv')" class="flex items-center">
            <FileText class="h-4 w-4 mr-2" />
            <span>CSV</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="handleExportClick('pdf')" class="flex items-center">
            <FileDown class="h-4 w-4 mr-2" />
            <span>PDF</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <!-- Read-only toggle (si applicable) -->
      <Button 
        v-if="isEditableTable"
        variant="ghost" 
        size="icon" 
        class="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
        :class="{ 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800': !readOnly }"
        @click="emit('toggle-readonly')"
        :title="readOnly ? 'Passer en mode édition' : 'Terminer l\'édition'"
      >
        <component 
          :is="readOnly ? Edit : Save"
          class="h-4 w-4" 
          :class="readOnly ? 'text-gray-500 dark:text-gray-400' : 'text-amber-600 dark:text-amber-300'" 
        />
        <span class="sr-only">{{ readOnly ? 'Activer l\'édition' : 'Désactiver l\'édition' }}</span>
      </Button>

      <!-- Slot pour des boutons personnalisés -->
      <slot name="additional-buttons"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Download, FileText, FileSpreadsheet, FileDown, 
  Lock, Unlock, Keyboard, Maximize2, Minimize2, Edit, Save
} from 'lucide-vue-next'
import { Button } from '../../../ui/button'
import { exportToCSV, exportToExcel, exportToPDF } from '../export'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../../ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../ui/dropdown-menu'
import { Checkbox } from '../../../ui/checkbox'

// Définir les props
const props = defineProps<{
  // Propriétés de TanStack Table
  table: any
  isFullWidth?: boolean
  columnPinningEnabled?: boolean
  
  // Propriétés optionnelles pour les fonctionnalités additionnelles
  isEditableTable?: boolean
  readOnly?: boolean
  
  // Props pour l'export
  exportFilename?: string
}>()

// Événements émis
const emit = defineEmits<{
  'export': [format: string, data: any[], columns: any[]]
  'toggle-readonly': []
  'toggle-fullwidth': []
  'toggle-keyboard-help': []
  'pin-mode': []
}>()

// Computed pour accéder facilement aux colonnes
const tableColumns = computed(() => {
  return props.table?.getAllColumns() || []
})

// Computed pour accéder aux données filtrées
const tableData = computed(() => {
  return props.table?.getFilteredRowModel().rows.map((row: any) => row.original) || []
})

// Fonction pour gérer l'export
const handleExportClick = async (format: 'csv' | 'excel' | 'pdf'): Promise<void> => {
  try {
    // Récupérer uniquement les colonnes visibles
    const visibleColumns = props.table?.getVisibleLeafColumns() || []
    
    // Convertir les colonnes au format attendu par les fonctions d'export
    const exportColumns = visibleColumns.map((column: any) => ({
      data: column.id,
      title: column.columnDef.header?.toString() || column.id
    }))
    
    // Émettre l'événement export
    emit('export', format, tableData.value, exportColumns)

    // Exécuter la fonction d'export appropriée
    switch (format) {
      case 'csv':
        await exportToCSV(tableData.value, exportColumns, props.exportFilename || 'export')
        break
      case 'excel':
        await exportToExcel(tableData.value, exportColumns, props.exportFilename || 'export')
        break
      case 'pdf':
        await exportToPDF(tableData.value, exportColumns, props.exportFilename || 'export')
        break
    }
  } catch (error) {
    console.error(`Erreur lors de l'export ${format}:`, error)
  }
}
</script>

<style scoped>
/* Styles pour gérer la position de la barre d'outils latérale */
.absolute.-left-12 {
  transition: all 0.2s ease;
}
</style> 