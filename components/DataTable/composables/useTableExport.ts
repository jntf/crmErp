import type { Table } from '@tanstack/vue-table'
import type { DataTableEmits } from '../types/table-types'

export function useTableExport<TData>(
  table: Table<TData>,
  emit: DataTableEmits<TData>
) {
  // Fonction pour gérer l'export
  const handleExport = (format: string) => {
    const data = table.getFilteredRowModel().rows.map(row => row.original)
    const columns = table.getAllColumns().filter(col => col.getIsVisible())
    
    emit('export', format, data, columns)
  }
  
  return {
    handleExport
  }
} 