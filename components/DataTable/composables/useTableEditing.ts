import { computed } from 'vue'
import type { Table } from '@tanstack/vue-table'
import type { DataTableProps, DataTableEmits, PendingChange } from '../types/table-types'

export function useTableEditing<TData>(
  table: Table<TData>,
  readOnly: any,
  pendingChanges: any,
  props: DataTableProps<TData>,
  emit: DataTableEmits<TData>
) {
  // Computed pour le mode édition - vrai seulement si le tableau est éditable et pas en mode lecture seule
  const isEditMode = computed(() => !readOnly.value && props.isEditable)
  
  // Fonction pour gérer le basculement du mode lecture seule
  const handleToggleReadOnly = () => {
    if (readOnly.value === false) {
      // Si on quitte le mode édition, vérifier s'il y a des changements en attente
      if (pendingChanges.value.length > 0) {
        // Ici, on pourrait afficher une confirmation avant de quitter le mode édition
        // Pour l'instant, on ne fait que réinitialiser les changements
        pendingChanges.value = []
      }
    }
    
    readOnly.value = !readOnly.value
    emit('toggle-readonly')
    
    // Si on entre en mode édition, désélectionner toutes les lignes
    if (!readOnly.value) {
      table.toggleAllRowsSelected(false)
    }
  }
  
  // Fonction pour suivre les modifications de cellules
  const handleCellChange = (rowId: string, columnId: string, value: any) => {
    // Trouver si une modification existe déjà pour cette cellule
    const existingChangeIndex = pendingChanges.value.findIndex(
      (change: PendingChange) => change.rowId === rowId && change.columnId === columnId
    )

    if (existingChangeIndex !== -1) {
      // Mettre à jour la modification existante
      pendingChanges.value[existingChangeIndex].value = value
    } else {
      // Ajouter une nouvelle modification
      pendingChanges.value.push({
        rowId,
        columnId,
        value
      })
    }
  }
  
  // Nouvelles fonctions pour gérer les changements pendant l'édition
  const saveChanges = () => {
    if (pendingChanges.value.length > 0) {
      emit('save-changes', pendingChanges.value)
      pendingChanges.value = [] // Réinitialiser après sauvegarde
      readOnly.value = true // Revenir en mode lecture
    }
  }
  
  const cancelChanges = () => {
    pendingChanges.value = [] // Réinitialiser sans sauvegarder
    emit('cancel-changes')
    readOnly.value = true // Revenir en mode lecture
  }
  
  // Fonction pour gérer la navigation au clavier en mode édition
  const handleKeyNavigation = (event: KeyboardEvent) => {
    if (!table) return;
    
    const meta = table.options.meta as any;
    if (!meta || !meta.isEditMode || !meta.activeCell) {
      return;
    }
  
    const { rowId, columnId } = meta.activeCell;
    const rows = table.getRowModel().rows;
    const currentRowIndex = rows.findIndex((row: any) => row.id === rowId);
    const visibleColumns = table.getVisibleLeafColumns();
    const currentColIndex = visibleColumns.findIndex((col: any) => col.id === columnId);
  
    if (currentRowIndex === -1 || currentColIndex === -1) {
      return;
    }
  
    let nextRowIndex = currentRowIndex;
    let nextColIndex = currentColIndex;
  
    // Empêcher la propagation des événements de navigation
    const shouldPreventDefault = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key);
  
    switch (event.key) {
      case 'ArrowUp':
        nextRowIndex = Math.max(0, currentRowIndex - 1);
        break;
      case 'ArrowDown':
        nextRowIndex = Math.min(rows.length - 1, currentRowIndex + 1);
        break;
      case 'ArrowLeft':
        nextColIndex = Math.max(0, currentColIndex - 1);
        break;
      case 'ArrowRight':
        nextColIndex = Math.min(visibleColumns.length - 1, currentColIndex + 1);
        break;
      case 'Tab':
        if (event.shiftKey) {
          // Shift+Tab: naviguer vers la cellule précédente
          if (currentColIndex > 0) {
            nextColIndex = currentColIndex - 1;
          } else if (currentRowIndex > 0) {
            nextRowIndex = currentRowIndex - 1;
            nextColIndex = visibleColumns.length - 1;
          }
        } else {
          // Tab: naviguer vers la cellule suivante
          if (currentColIndex < visibleColumns.length - 1) {
            nextColIndex = currentColIndex + 1;
          } else if (currentRowIndex < rows.length - 1) {
            nextRowIndex = currentRowIndex + 1;
            nextColIndex = 0;
          }
        }
        break;
      default:
        return; // Ne pas traiter les autres touches
    }
  
    // Si une nouvelle cellule a été sélectionnée
    if (nextRowIndex !== currentRowIndex || nextColIndex !== currentColIndex) {
      const nextRow = rows[nextRowIndex];
      const nextCol = visibleColumns[nextColIndex];
      
      if (nextRow && nextCol) {
        if (shouldPreventDefault) {
          event.preventDefault();
        }
        
        // Activer la nouvelle cellule
        if (meta.setActiveCell) {
          meta.setActiveCell(nextRow.id, nextCol.id);
        }
        
        // Focus sur la nouvelle cellule (si nécessaire)
        const cellId = `cell-${nextRow.id}-${nextCol.id}`;
        const cellElement = document.getElementById(cellId);
        if (cellElement) {
          const inputElement = cellElement.querySelector('input, select, button');
          if (inputElement) {
            (inputElement as HTMLElement).focus();
          } else {
            cellElement.focus();
          }
        }
      }
    }
  }
  
  // Configuration des écouteurs d'événements pour la navigation au clavier
  const setupEditingKeyboardListeners = () => {
    if (props.isEditable) {
      window.addEventListener('keydown', handleKeyNavigation)
    }
  }
  
  // Nettoyage des écouteurs d'événements
  const cleanupEditingKeyboardListeners = () => {
    window.removeEventListener('keydown', handleKeyNavigation)
  }
  
  return {
    isEditMode,
    handleToggleReadOnly,
    handleCellChange,
    saveChanges,
    cancelChanges,
    handleKeyNavigation,
    setupEditingKeyboardListeners,
    cleanupEditingKeyboardListeners
  }
} 