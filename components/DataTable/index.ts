import DataTable from './DataTable.vue'
import DataTableHand from './DataTableHand.vue'
import DataTableToolbar from './DataTableToolbar.vue'
import DataTableAdapter from './utils/tanstack/DataTableAdapter.vue'
import { convertHandsontableColumns, valueUpdater } from './utils/tanstack/column-helpers'
import type { HandsontableColumn } from './utils/tanstack/column-helpers'

export {
    DataTable,
    DataTableHand,
    DataTableToolbar,
    DataTableAdapter,
    convertHandsontableColumns,
    valueUpdater
}

export type {
    HandsontableColumn
}

// Pour la rétrocompatibilité, on exporte DataTableAdapter par défaut
// ainsi, les imports existants utilisant l'ancien DataTable utiliseront l'adaptateur
export default DataTableAdapter 