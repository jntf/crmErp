import { watch } from 'vue'
import type { Table } from '@tanstack/vue-table'
import type { DataTableEmits } from '../types/table-types'

export function useTableSelection<TData>(
  table: Table<TData>,
  rowSelectionState: any,
  lastSelectedRowIndex: any,
  isShiftKeyPressed: any,
  isCtrlKeyPressed: any,
  isMetaKeyPressed: any,
  emit: DataTableEmits<TData>
) {
  // Fonction pour gérer la sélection de ligne avec prise en charge de Shift+clic
  const handleRowClick = (row: any) => {
    const currentIndex = row.index
    
    if (isShiftKeyPressed.value && lastSelectedRowIndex.value !== null) {
      // Sélection multiple avec Shift+clic
      const startIdx = Math.min(lastSelectedRowIndex.value, currentIndex)
      const endIdx = Math.max(lastSelectedRowIndex.value, currentIndex)
      
      // Sélectionner toutes les lignes entre startIdx et endIdx
      table.getRowModel().rows.forEach((r) => {
        if (r.index >= startIdx && r.index <= endIdx) {
          r.toggleSelected(true)
        }
      })
    } else {
      // Comportement normal de sélection/désélection
      if (isCtrlKeyPressed.value || isMetaKeyPressed.value) {
        // Avec Ctrl/Cmd, on bascule la sélection sans affecter les autres
        row.toggleSelected()
      } else {
        // Sans modificateur, on désélectionne tout et on sélectionne la ligne actuelle
        if (!row.getIsSelected()) {
          table.toggleAllRowsSelected(false)
          row.toggleSelected(true)
        } else {
          row.toggleSelected()
        }
      }
      
      // Mettre à jour l'index de la dernière ligne sélectionnée
      lastSelectedRowIndex.value = currentIndex
    }
  }
  
  // Gestionnaires d'événements pour les touches de modification
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      isShiftKeyPressed.value = true
    } else if (e.key === 'Control') {
      isCtrlKeyPressed.value = true
    } else if (e.key === 'Meta') { // Touche Cmd sur Mac
      isMetaKeyPressed.value = true
    } else if (e.key === 'Escape') {
      // Désélectionner toutes les lignes avec Échap
      table.toggleAllRowsSelected(false)
    } else if ((e.key === 'a' || e.key === 'A') && (isCtrlKeyPressed.value || isMetaKeyPressed.value)) {
      // Sélectionner toutes les lignes avec Ctrl+A ou Cmd+A
      e.preventDefault() // Empêcher le comportement par défaut (sélection de tout le texte)
      table.toggleAllRowsSelected(true)
    }
  }
  
  // Gestionnaire de relâchement des touches
  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      isShiftKeyPressed.value = false
    } else if (e.key === 'Control') {
      isCtrlKeyPressed.value = false
    } else if (e.key === 'Meta') { // Touche Cmd sur Mac
      isMetaKeyPressed.value = false
    }
  }
  
  // Émission de la sélection quand elle change
  watch(rowSelectionState, () => {
    try {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      emit('selection', selectedRows)
    } catch (error) {
      console.error('Erreur lors de la récupération des lignes sélectionnées:', error)
      emit('selection', [])
    }
  })
  
  // Configuration des écouteurs d'événements
  const setupKeyboardListeners = () => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
  }
  
  // Nettoyage des écouteurs d'événements
  const cleanupKeyboardListeners = () => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
  }
  
  return {
    handleRowClick,
    handleKeyDown,
    handleKeyUp,
    setupKeyboardListeners,
    cleanupKeyboardListeners
  }
} 