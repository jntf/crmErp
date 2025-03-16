import { computed } from 'vue'
import type { Table } from '@tanstack/vue-table'

// Composable pour gérer l'épinglage des colonnes (simplifié à gauche uniquement)
export function useTablePinning<TData>(table: Table<TData>, columnPinning: any) {
  
  // Fonction pour épingler une colonne à gauche
  const pinColumnToLeft = (columnId: string) => {
    const currentLeft = columnPinning.value.left || []
    
    // Ajouter à 'left' seulement si elle n'y est pas déjà
    const newLeft = currentLeft.includes(columnId) ? currentLeft : [...currentLeft, columnId]
    
    const newPinningState = {
      left: newLeft,
      right: [] // On ne conserve aucune colonne épinglée à droite
    }
    
    table.setColumnPinning(newPinningState)
    // Mettre à jour directement l'état local pour s'assurer qu'il est synchronisé
    columnPinning.value = newPinningState
    forceUpdatePinning()
  }
  
  // Fonction pour désépingler une colonne
  const unpinColumn = (columnId: string) => {
    const currentLeft = columnPinning.value.left || []
    
    const newPinningState = {
      left: currentLeft.filter((id: string) => id !== columnId),
      right: [] // On ne conserve aucune colonne épinglée à droite
    }
    
    table.setColumnPinning(newPinningState)
    // Mettre à jour directement l'état local
    columnPinning.value = newPinningState
    forceUpdatePinning()
  }
  
  // Fonction pour désépingler toutes les colonnes
  const unpinAllColumns = () => {
    const newPinningState = {
      left: [],
      right: []
    }
    
    table.setColumnPinning(newPinningState)
    // Mettre à jour directement l'état local
    columnPinning.value = newPinningState
    forceUpdatePinning()
  }
  
  // Fonction pour basculer l'épinglage des colonnes (utilisé dans la barre d'outils)
  const toggleColumnPinning = () => {
    if (columnPinning.value.left?.length) {
      // Si des colonnes sont épinglées, tout désépingler
      unpinAllColumns()
    }
  }
  
  // Helper pour forcer la mise à jour de l'affichage des colonnes épinglées
  const forceUpdatePinning = () => {
    setTimeout(() => {
      table.setColumnPinning({ ...columnPinning.value })
    }, 0)
  }
  
  // Style pour les en-têtes de colonnes épinglées
  const getColumnHeaderStyle = (header: any) => {
    const baseStyle = header.column.columnDef.size 
      ? `width: ${header.column.columnDef.size}px !important; min-width: ${header.column.columnDef.size}px !important; max-width: ${header.column.columnDef.size}px !important;` 
      : '';
      
    if (header.column.getIsPinned() === 'left') {
      return `${baseStyle} left: ${header.column.getStart('left')}px;`;
    }
    
    return baseStyle;
  }
  
  // Style pour les cellules épinglées
  const getColumnCellStyle = (cell: any) => {
    const baseStyle = cell.column.columnDef.size 
      ? `width: ${cell.column.columnDef.size}px !important; min-width: ${cell.column.columnDef.size}px !important; max-width: ${cell.column.columnDef.size}px !important;` 
      : '';
      
    if (cell.column.getIsPinned() === 'left') {
      return `${baseStyle} left: ${cell.column.getStart('left')}px;`;
    }
    
    return baseStyle;
  }
  
  return {
    pinColumnToLeft,
    unpinColumn,
    unpinAllColumns,
    toggleColumnPinning,
    forceUpdatePinning,
    getColumnHeaderStyle,
    getColumnCellStyle
  }
} 