import { ref } from 'vue'
import type { Table } from '@tanstack/vue-table'
import type { DataTableProps } from '../types/table-types'

export function useTableSearch<TData>(
  table: Table<TData>,
  props: DataTableProps<TData>
) {
  // État local pour la recherche
  const searchQuery = ref('')
  
  // Fonction de gestion du changement de la valeur de recherche
  const handleSearchUpdate = (value: string | number) => {
    const stringValue = String(value)
    handleSearch(stringValue)
  }
  
  // Fonction de recherche
  const handleSearch = (value: string) => {
    searchQuery.value = value
    
    if (props.searchField) {
      // Si un champ de recherche est spécifié, on utilise ce champ
      table.getColumn(props.searchField)?.setFilterValue(value)
    } else {
      // Si aucun champ de recherche spécifié, on pourrait ajouter une recherche globale
      // Cette fonctionnalité pourrait être implémentée si nécessaire
    }
  }
  
  return {
    searchQuery,
    handleSearchUpdate,
    handleSearch
  }
} 