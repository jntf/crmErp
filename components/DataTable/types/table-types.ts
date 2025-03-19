import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
  ColumnPinningState,
  Table
} from '@tanstack/vue-table'

// Interface pour les propriétés du composant principal
export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  loadingState?: boolean
  pagination?: boolean
  searchable?: boolean
  searchField?: string
  columnToggle?: boolean
  columnPinning?: boolean
  rowSelection?: boolean
  tableSettings?: Record<string, any>
  tableLayout?: 'auto' | 'fixed'
  pageSizes?: number[]
  showKeyboardShortcutsHelp?: boolean
  sideToolbar?: boolean
  isEditable?: boolean
  exportFilename?: string
}

// Interface pour les événements émis
export interface DataTableEmits<TData> {
  (e: 'selection', selectedRows: TData[]): void
  (e: 'change', changes: any): void
  (e: 'delete-request', rows: TData[]): void
  (e: 'export', format: string, data: any[], columns: any[]): void
  (e: 'toggle-readonly'): void
  (e: 'save-changes', changes: Record<string, any>[]): void
  (e: 'cancel-changes'): void
}

// Interface pour l'état global de la table
export interface TableState {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
  rowSelection: Record<string, boolean>
  columnPinning: ColumnPinningState
  pagination: PaginationState
  isFullWidth: boolean
  readOnly: boolean
  searchQuery: string
  keyboardShortcutsHelpVisible: boolean
  pendingChanges: PendingChange[]
  isShiftKeyPressed: boolean
  isCtrlKeyPressed: boolean
  isMetaKeyPressed: boolean
  lastSelectedRowIndex: number | null
}

// Interface pour les modifications en attente
export interface PendingChange {
  rowId: string
  columnId: string
  value: any
}

// Type pour les fonctions meta de la table
export interface TableMeta<TData> {
  isEditMode: boolean
  pendingChanges: PendingChange[]
  handleCellChange: (rowId: string, columnId: string, value: any) => void
  activeCell: { rowId: string; columnId: string } | null
  setActiveCell: (rowId: string, columnId: string) => void
  table: Table<TData>
} 