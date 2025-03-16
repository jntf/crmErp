import { h } from 'vue'
import type { ColumnDef, CellContext } from '@tanstack/vue-table'
import TextCell from './TextCell.vue'
import NumberCell from './NumberCell.vue'
import SelectCell from './SelectCell.vue'
import DateCell from './DateCell.vue'
import CheckboxCell from './CheckboxCell.vue'

// Interface pour étendre les métadonnées de la table
export interface EditableTableMeta<T> {
  isEditMode?: boolean
  pendingChanges?: Array<{
    rowId: string
    columnId: string
    value: any
  }>
  handleCellChange?: (rowId: string, columnId: string, value: any) => void
  activeCell?: { rowId: string; columnId: string } | null // Cellule active pour la navigation au clavier
  setActiveCell?: (rowId: string, columnId: string) => void // Fonction pour définir la cellule active
}

// Type pour les options de colonne éditable
export interface EditableColumnOptions<T> {
  accessorKey: keyof T & string
  header: string
  type?: 'text' | 'number' | 'select' | 'date' | 'checkbox'
  editable?: boolean
  required?: boolean
  minWidth?: number
  size?: number
  format?: (value: any) => string
  
  // Options pour SelectCell
  options?: Array<{ label: string, value: string | number } | string | number>
  withEmptyOption?: boolean
  emptyOptionLabel?: string
  valueKey?: string
  labelKey?: string
  
  // Options pour NumberCell
  min?: number
  max?: number
  step?: number
  
  // Options pour DateCell
  minDate?: string | Date
  maxDate?: string | Date
  displayFormat?: string
  inputFormat?: string
  calendarContainerClass?: string
  
  // Options pour CheckboxCell
  trueValue?: any
  falseValue?: any
}

/**
 * Crée une définition de colonne éditable pour TanStack Table
 * 
 * @param options Options de la colonne éditable
 * @returns Définition de colonne compatible avec TanStack Table
 */
export function createEditableColumn<T>(options: EditableColumnOptions<T>): ColumnDef<T> {
  const columnDef: Partial<ColumnDef<T>> = {
    header: options.header,
    accessorKey: options.accessorKey,
    size: options.size,
    minSize: options.minWidth || 100,
    enableSorting: true,
    enableHiding: true,
  }

  const getCellValue = (row: T) => {
    return row[options.accessorKey]
  }

  const type = options.type || 'text'

  return {
    ...columnDef,
    cell: ({ row, table, column }: CellContext<T, unknown>) => {
      // Cast des métadonnées pour accéder aux propriétés d'édition
      const meta = table.options.meta as EditableTableMeta<T> | undefined
      const isEditMode = meta?.isEditMode || false
      const pendingChanges = meta?.pendingChanges || []
      
      // Vérifier si cette cellule a été modifiée
      const isModified = pendingChanges.some(
        (change) => change.rowId === row.id && change.columnId === column.id
      )
      
      // Valeur de la cellule (utilise la valeur modifiée si elle existe)
      const modifiedValue = isModified ? 
        pendingChanges.find(
          (change) => change.rowId === row.id && change.columnId === column.id
        )?.value : 
        undefined
      
      const value = modifiedValue !== undefined ? modifiedValue : getCellValue(row.original)
      
      // Fonction pour gérer la mise à jour
      const handleUpdate = (newValue: any) => {
        if (!isEditMode || !meta?.handleCellChange) return
        meta.handleCellChange(row.id, column.id, newValue)
      }
      
      // Props communs pour tous les types de cellules
      const commonProps = {
        isEditable: isEditMode && (options.editable !== false),
        isModified,
        formatDisplay: options.format,
        'onUpdate:modelValue': handleUpdate,
        'onEdit-complete': handleUpdate,
        cellId: `cell-${row.id}-${column.id}`
      }
      
      // Différents types de cellules
      switch (type) {
        case 'number':
          return h(NumberCell, {
            ...commonProps,
            modelValue: value,
            min: options.min,
            max: options.max,
            step: options.step
          })
          
        case 'select':
          return h(SelectCell, {
            ...commonProps,
            modelValue: value,
            options: options.options || [],
            valueKey: options.valueKey,
            labelKey: options.labelKey,
            withEmptyOption: options.withEmptyOption,
            emptyOptionLabel: options.emptyOptionLabel
          })
          
        case 'date':
          return h(DateCell, {
            ...commonProps,
            modelValue: value,
            min: options.minDate,
            max: options.maxDate,
            displayFormat: options.displayFormat,
            inputFormat: options.inputFormat,
            calendarContainerClass: options.calendarContainerClass
          })
          
        case 'checkbox':
          return h(CheckboxCell, {
            ...commonProps,
            modelValue: value,
            trueValue: options.trueValue,
            falseValue: options.falseValue
          })
          
        case 'text':
        default:
          return h(TextCell, {
            ...commonProps,
            modelValue: value
          })
      }
    }
  } as ColumnDef<T>
} 