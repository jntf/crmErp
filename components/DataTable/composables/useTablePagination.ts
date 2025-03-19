import { computed, watch } from 'vue'
import type { Table } from '@tanstack/vue-table'

export function useTablePagination<TData>(
  table: Table<TData>,
  paginationState: any,
  safeData: any
) {
  // Calculer les lignes à afficher en fonction de la pagination
  const displayedRows = computed(() => {
    // Si la pagination n'est pas activée, retourner toutes les lignes
    if (!paginationState.value || !table.getRowModel) {
      return table.getRowModel().rows
    }
    
    const { pageIndex, pageSize } = paginationState.value
    const filteredRows = table.getFilteredRowModel().rows
    
    const start = pageIndex * pageSize
    const end = start + pageSize
    
    return filteredRows.slice(start, end)
  })
  
  // Calculer le nombre total de pages
  const totalPages = computed(() => {
    if (!paginationState.value || !paginationState.value.pageSize) return 1
    
    const filteredRows = table.getFilteredRowModel().rows
    return Math.ceil(filteredRows.length / paginationState.value.pageSize)
  })
  
  // Fonctions de navigation entre les pages
  const goToNextPage = () => {
    if (!paginationState.value) return
    
    if (paginationState.value.pageIndex < totalPages.value - 1) {
      paginationState.value.pageIndex++
    }
  }
  
  const goToPreviousPage = () => {
    if (!paginationState.value) return
    
    if (paginationState.value.pageIndex > 0) {
      paginationState.value.pageIndex--
    }
  }
  
  // Fonction pour changer la taille de page
  const setPageSize = (size: number) => {
    if (!paginationState.value) return
    
    paginationState.value.pageSize = size
    paginationState.value.pageIndex = 0 // Revenir à la première page lors du changement de taille
  }
  
  // Observer les changements dans la taille de page et forcer la mise à jour du modèle
  watch(() => paginationState.value?.pageSize, (newPageSize) => {
    if (newPageSize) {
      // Forcer la table à mettre à jour son modèle de pagination
      table.setPageSize(newPageSize)
    }
  }, { immediate: true })
  
  return {
    displayedRows,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    setPageSize
  }
} 