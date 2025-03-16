import DataTable from './DataTable.vue'
// Les fichiers suivants sont désormais intégrés à la nouvelle architecture
// import DataTableHand from './DataTableHand.vue'
// import DataTableToolbar from './DataTableToolbar.vue'
import DataTableAdapter from './utils/tanstack/DataTableAdapter.vue'
import DataTableSideToolbar from './utils/tanstack/DataTableSideToolbar.vue'
import { convertHandsontableColumns, valueUpdater } from './utils/tanstack/column-helpers'
import type { HandsontableColumn } from './utils/tanstack/column-helpers'

// Importation des composables
import { useTableState } from './composables/useTableState'
import { useTablePinning } from './composables/useTablePinning'
import { useTableSelection } from './composables/useTableSelection'
import { useTableEditing } from './composables/useTableEditing'
import { useTablePagination } from './composables/useTablePagination'
import { useTableSearch } from './composables/useTableSearch'
import { useTableExport } from './composables/useTableExport'

// Importation des utilitaires d'export (pour compatibilité avec le code existant)
import { exportToCSV, exportToExcel, exportToPDF } from './utils/export'

// Importation des sous-composants
import TableHeader from './components/TableHeader.vue'
import TableBody from './components/TableBody.vue'
import TablePagination from './components/TablePagination.vue'
import TableToolbar from './components/TableToolbar.vue'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp.vue'

// Exportations nommées des composants et utilitaires
export {
    DataTable,
    // DataTableHand, // Retiré car remplacé par DataTable
    // DataTableToolbar, // Retiré car remplacé par TableToolbar
    DataTableAdapter,
    DataTableSideToolbar,
    convertHandsontableColumns,
    valueUpdater,
    
    // Composables
    useTableState,
    useTablePinning,
    useTableSelection,
    useTableEditing,
    useTablePagination,
    useTableSearch,
    useTableExport,
    
    // Sous-composants
    TableHeader,
    TableBody,
    TablePagination,
    TableToolbar,
    KeyboardShortcutsHelp,
    
    // Utilitaires d'export (pour compatibilité)
    exportToCSV,
    exportToExcel,
    exportToPDF
}

// Exportation des types
export type {
    HandsontableColumn
}

// Exportation des nouveaux types
export * from './types/table-types'

// Pour la rétrocompatibilité, on exporte DataTableAdapter par défaut
export default DataTableAdapter 