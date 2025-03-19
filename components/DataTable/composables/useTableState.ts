import { ref, computed, watch } from 'vue'
import type { Table } from '@tanstack/vue-table'
import type { DataTableProps, TableState, PendingChange } from '../types/table-types'
import { valueUpdater } from '../utils/tanstack/column-helpers'

export function useTableState<TData>(props: DataTableProps<TData>) {
  // États locaux qui étaient précédemment dans DataTable.vue
  const sorting = ref([])
  const columnFilters = ref([])
  const columnVisibility = ref({})
  const rowSelectionState = ref({})
  const columnPinning = ref({
    left: [],
    right: [] // On garde la structure mais on ne l'utilisera pas
  })
  
  // État de pagination avec valeurs par défaut
  const pageSizeOptions = computed(() => 
    props.pageSizes || [10, 25, 50, 100, 500]
  )
  
  const paginationState = ref({
    pageIndex: 0,
    pageSize: pageSizeOptions.value[0] || 10,
  })
  
  // Autres états
  const isFullWidth = ref(false)
  const readOnly = ref(true)
  const searchQuery = ref('')
  const keyboardShortcutsHelpVisible = ref(props.showKeyboardShortcutsHelp || false)
  const pendingChanges = ref<PendingChange[]>([])
  
  // États pour la gestion des raccourcis clavier
  const lastSelectedRowIndex = ref<number | null>(null)
  const isShiftKeyPressed = ref(false)
  const isCtrlKeyPressed = ref(false)
  const isMetaKeyPressed = ref(false)
  
  // Computed pour le mode édition
  const isEditMode = computed(() => !readOnly.value && props.isEditable)
  
  // S'assurer que data est toujours un tableau
  const safeData = computed<TData[]>(() => {
    return Array.isArray(props.data) ? props.data : []
  })
  
  // S'assurer que columns est toujours un tableau
  const safeColumns = computed(() => {
    return Array.isArray(props.columns) ? props.columns : []
  })
  
  // Fonction pour basculer entre l'affichage normal et pleine largeur
  const toggleFullWidth = () => {
    isFullWidth.value = !isFullWidth.value
    
    // Sauvegarder la préférence dans le localStorage
    try {
      localStorage.setItem('datatable-full-width', isFullWidth.value.toString())
    } catch (e) {
      console.error('Erreur lors de la sauvegarde de la préférence pleine largeur:', e)
    }
    
    // Si on passe en mode pleine largeur, faire défiler la fenêtre vers le haut pour meilleure vue
    if (isFullWidth.value) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  // Fonction pour basculer l'affichage de l'aide sur les raccourcis clavier
  const toggleKeyboardShortcutsHelp = () => {
    keyboardShortcutsHelpVisible.value = !keyboardShortcutsHelpVisible.value
  }
  
  // Réinitialiser la pagination quand les données changent
  watch(() => safeData.value, () => {
    if (props.pagination) {
      paginationState.value.pageIndex = 0
    }
  }, { deep: false })
  
  // Initialisation à partir du localStorage
  const initFromLocalStorage = () => {
    try {
      const savedPreference = localStorage.getItem('datatable-full-width')
      if (savedPreference !== null) {
        isFullWidth.value = savedPreference === 'true'
      }
    } catch (e) {
      console.error('Erreur lors de la récupération de la préférence pleine largeur:', e)
    }
  }
  
  // Méthode utilitaire pour forcer la mise à jour de l'épinglage après manipulation
  const forceUpdatePinning = (table: Table<TData>) => {
    // Déclencher un événement de mise à jour pour s'assurer que les changements sont appliqués
    setTimeout(() => {
      table.setColumnPinning({ ...columnPinning.value })
    }, 0)
  }
  
  return {
    // États réactifs
    sorting,
    columnFilters,
    columnVisibility,
    rowSelectionState,
    columnPinning,
    paginationState,
    isFullWidth,
    readOnly,
    searchQuery,
    keyboardShortcutsHelpVisible,
    pendingChanges,
    lastSelectedRowIndex,
    isShiftKeyPressed,
    isCtrlKeyPressed,
    isMetaKeyPressed,
    
    // Computed
    isEditMode,
    safeData,
    safeColumns,
    pageSizeOptions,
    
    // Fonctions
    toggleFullWidth,
    toggleKeyboardShortcutsHelp,
    initFromLocalStorage,
    forceUpdatePinning,
    valueUpdater
  }
} 