// Composants de cellules
export { default as TextCell } from './TextCell.vue'
export { default as NumberCell } from './NumberCell.vue'
export { default as SelectCell } from './SelectCell.vue'
export { default as DateCell } from './DateCell.vue'
export { default as CheckboxCell } from './CheckboxCell.vue'

// Utilitaires pour la création de colonnes éditables
export { 
  createEditableColumn,
  type EditableColumnOptions,
  type EditableTableMeta
} from './createEditableColumn'

// Fonction pour créer des colonnes éditables en masse
import { createEditableColumn, type EditableColumnOptions, type EditableTableMeta } from './createEditableColumn'
import type { ColumnDef } from '@tanstack/vue-table'

/**
 * Crée un ensemble de colonnes éditables à partir d'une configuration
 * 
 * @param columnsConfig Configuration des colonnes
 * @returns Array de définitions de colonnes pour TanStack Table
 */
export function createEditableColumns<T>(
  columnsConfig: EditableColumnOptions<T>[]
): ColumnDef<T>[] {
  return columnsConfig.map(config => createEditableColumn<T>(config))
} 