//components/DataTable/DataTable.vue
<template>
    <div class="data-table-wrapper">
        <!-- Toolbar -->
        <DataTableToolbar 
            v-if="!loadingState" 
            :columns="tableColumns || []"
            :selected-count="selectedItems.length"
            :visible-columns="visibleColumnIds"
            :is-read-only="isReadOnly"
            :data="processedTableData"
            :filename="toolbarConfig?.exportFileName"
            @toggleColumn="toggleColumn"
            @toggleReadOnly="toggleReadOnly"
            @export="handleExport">
            <template #actions>
                <slot name="toolbar-actions" :selectedItems="selectedItems"></slot>
            </template>
        </DataTableToolbar>

        <!-- Loading state -->
        <div v-if="loadingState || !isHydrated" class="py-4 text-center">
            <span class="text-sm text-gray-500">Chargement...</span>
        </div>

        <!-- Table -->
        <div v-else-if="isHydrated">
            <hot-table 
                :data="processedTableData" 
                :settings="mergedTableSettings" 
                :rowHeaders="true"
                :colHeaders="columnHeaders" 
                :height="tableHeight" 
                :width="tableWidth" 
                @afterChange="handleChange"
                @afterSelection="handleSelection" 
                class="excel-theme" 
                ref="hotTableRef" 
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import DataTableToolbar from './DataTableToolbar.vue'
import { exportToCSV, exportToExcel, exportToPDF } from './utils/export'

// Types
interface Column {
    data: string
    title: string
    required?: boolean
    width?: number
    className?: string
    readOnly?: boolean
}

interface TableProps {
    tableData: any[]
    tableColumns?: Column[]
    tableHeight?: number | string
    tableWidth?: number | string
    tableSettings?: Record<string, any>
    isEditable?: boolean
    toolbarConfig?: {
        searchPlaceholder?: string
        exportFileName?: string
    }
    cellRenderers?: Record<string, (value: any, row: any) => string>
    loadingState?: boolean
}

const props = withDefaults(defineProps<TableProps>(), {
    tableHeight: 'auto',
    tableWidth: 'auto',
    isEditable: true,
    tableSettings: () => ({}),
    toolbarConfig: () => ({
        searchPlaceholder: 'Rechercher...',
        exportFileName: 'export'
    }),
    loadingState: false
})

const emit = defineEmits<{
    'update:tableData': [data: any[]];
    'change': [changes: any[]];
    'selection': [selectedRows: any[]];
    'delete-request': [rowData: any[]];
}>()

const isHydrated = ref(false)
const tableContainer = ref<HTMLElement | null>(null)
const hotTableRef = ref<any>(null)
const selectedItems = ref<any[]>([])
const visibleColumnIds = ref<string[]>(props.tableColumns?.map(col => col.data) || [])
const searchQuery = ref('')
const isReadOnly = ref(true)

const tableStyle = computed(() => ({
    height: props.tableHeight === 'auto' ? 'auto' : `${props.tableHeight}px`,
    width: props.tableWidth === 'auto' ? '100%' : `${props.tableWidth}px`,
    backgroundColor: 'var(--background)',
    borderRadius: '8px',
    overflow: 'hidden'
}))

// Computed properties
const processedTableData = computed(() => {
    const data = filterTableData.value
    if (!data || !Array.isArray(data)) return []

    return data.map(row => {
        const processedRow: Record<string, any> = {}
        props.tableColumns?.forEach(column => {
            if (!visibleColumnIds.value.includes(column.data)) return

            let value = row[column.data]

            if (props.cellRenderers?.[column.data]) {
                value = props.cellRenderers[column.data](value, row)
            }

            processedRow[column.data] = value
        })
        return processedRow
    })
})

const filterTableData = computed(() => {
    if (!searchQuery.value) return props.tableData

    return props.tableData.filter((row: any) => {
        return Object.entries(row).some(([key, value]) => {
            if (!visibleColumnIds.value.includes(key)) return false
            return String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
        })
    })
})

const columnHeaders = computed(() => {
    if (!props.tableColumns) return true
    return props.tableColumns
        .filter(col => visibleColumnIds.value.includes(col.data))
        .map(col => col.title || col.data)
})

const mergedTableSettings = computed(() => {
    const columnSettings = props.tableColumns
        ?.filter(col => visibleColumnIds.value.includes(col.data))
        .map(col => ({
            ...col,
            className: `${col.className || ''} text-xs`,
            readOnly: isReadOnly.value || col.readOnly,
        }));

    return {
        licenseKey: 'non-commercial-and-evaluation',
        readOnly: isReadOnly.value,
        columns: columnSettings,
        colHeaders: columnHeaders.value,
        filters: true,
        dropdownMenu: true,
        columnSorting: true,
        manualColumnResize: true,
        selectionMode: 'multiple',
        outsideClickDeselects: false,
        stretchH: 'all',
        autoWrapRow: false,
        rowHeights: 22,
        colWidths: 100,
        renderAllRows: false,
        viewportRowRenderingOffset: 10,
        fixedRowsTop: 1,
        fixedColumnsLeft: 0,
        wordWrap: false,
        trimWhitespace: true,
        tabMoves: { row: 1, col: 1 },
        enterMoves: { row: 1, col: 0 },
        fillHandle: false,
        autoColumnSize: false,
        afterChange: (changes: any[], source: string) => {
            if (changes && source !== 'loadData') {
                handleChange(changes)
            }
        },
        contextMenu: {
            items: {
                row_above: false,
                row_below: false,
                hsep1: false,
                col_left: false,
                col_right: false,
                hsep2: false,
                remove_row: false,
                remove_col: false,
                hsep3: false,
                undo: false,
                redo: false,
                hsep4: false,
                make_read_only: false,
                alignment: false,
                hsep5: false,
                borders: false,
                commentsAddEdit: false,
                commentsRemove: false
            }
        },
        afterSelectionEnd: (rowStart: number, colStart: number, rowEnd: number, colEnd: number) => {
            handleSelection(rowStart, colStart, rowEnd, colEnd)
        },
        afterOnCellMouseDown: (event: MouseEvent, coords: any, TD: HTMLElement) => {
            const deleteButton = TD.querySelector('.delete-button');
            if (deleteButton && (event.target === deleteButton || deleteButton.contains(event.target as Node))) {
                event.stopPropagation();
                const rowData = processedTableData.value[coords.row];
                if (rowData) {
                    // Émettre un événement pour la suppression au lieu de gérer directement
                    emit('delete-request', [rowData]);
                }
            }
        },
        ...props.tableSettings
    }
})

const handleSelection = (rowStart: number, colStart: number, rowEnd: number, colEnd: number) => {
    console.log('Selection event:', { rowStart, colStart, rowEnd, colEnd })
    const hotTable = hotTableRef.value?.hotInstance

    if (!hotTable) {
        console.warn('HotTable instance not found')
        return
    }

    const selected: any[] = []
    const rowIndexes = new Set<number>()

    const selectedRanges = hotTable.getSelected() || []
    console.log('Selected ranges:', selectedRanges)

    selectedRanges.forEach(([fromRow, fromCol, toRow, toCol]: number[]) => {
        for (let row = Math.min(fromRow, toRow); row <= Math.max(fromRow, toRow); row++) {
            rowIndexes.add(row)
        }
    })

    Array.from(rowIndexes).forEach((rowIndex: number) => {
        if (processedTableData.value[rowIndex]) {
            selected.push(processedTableData.value[rowIndex])
        }
    })

    selectedItems.value = selected
    emit('selection', selected)
}

const handleExport = async (format: string) => {
    console.log('Export demandé:', format)
    console.log('Données sélectionnées:', selectedItems.value)

    // Si des éléments sont sélectionnés, on n'exporte que ceux-là
    const dataToExport = selectedItems.value.length > 0
        ? [...selectedItems.value]
        : [...processedTableData.value]

    // Récupérer uniquement les colonnes visibles
    const visibleColumns = props.tableColumns?.filter(col => visibleColumnIds.value.includes(col.data)) || []

    try {
        const filename = props.toolbarConfig?.exportFileName || 'export'
        
        switch (format) {
            case 'csv':
                await exportToCSV(dataToExport, visibleColumns, filename)
                break
            case 'excel':
                await exportToExcel(dataToExport, visibleColumns, filename)
                break
            case 'pdf':
                await exportToPDF(dataToExport, visibleColumns, filename)
                break
            default:
                console.warn('Format d\'export non supporté:', format)
        }
    } catch (error) {
        console.error('Erreur lors de l\'export:', error)
    }
}

// Methods
const handleChange = (changes: any[]) => {
    console.log('DataTable handleChange called with:', changes)
    if (!changes) return

    if (props.isEditable && changes) {
        const newData = [...processedTableData.value]
        changes.forEach(([row, prop, oldValue, newValue]) => {
            if (newData[row]) {
                // Mise à jour de la valeur dans les données
                const propPath = prop.split('.')
                let current = newData[row]
                
                for (let i = 0; i < propPath.length - 1; i++) {
                    if (!current[propPath[i]]) {
                        current[propPath[i]] = {}
                    }
                    current = current[propPath[i]]
                }
                current[propPath[propPath.length - 1]] = newValue
            }
        })
        
        console.log('Nouvelles données après modification:', newData)
        emit('update:tableData', newData)
        emit('change', changes)
    }
}

const handleSearch = (value: string) => {
    searchQuery.value = value
}

const toggleColumn = (columnId: string) => {
    const index = visibleColumnIds.value.indexOf(columnId)
    if (index === -1) {
        visibleColumnIds.value.push(columnId)
    } else {
        visibleColumnIds.value.splice(index, 1)
    }
}

const toggleReadOnly = () => {
    isReadOnly.value = !isReadOnly.value
}

onMounted(async () => {
    await nextTick()
    isHydrated.value = true
})
</script>

<style>
/* Styles de base */
.data-table-wrapper {
    position: relative;
    z-index: 1;
}

.handsontable {
    font-size: 11px !important;
}

/* Ajustement des z-index pour éviter les conflits avec les modals */
.handsontable .wtHolder,
.handsontable .ht_master,
.handsontable .ht_clone_top,
.handsontable .ht_clone_left,
.handsontable .ht_clone_top_left_corner {
    z-index: 10 !important;
}

/* Assurer que les menus contextuels restent sous les modals */
.handsontable .htDropdownMenu,
.handsontable .htContextMenu,
.handsontable .htFiltersMenuCondition {
    z-index: 1000 !important;
}

/* Style compact pour les cellules */
.handsontable td {
    padding: 0 4px !important;
    height: 22px !important;
    line-height: 22px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    vertical-align: middle !important;
    background-clip: padding-box !important;
}

/* Style des en-têtes */
.handsontable th {
    padding: 0 4px !important;
    height: 22px !important;
    line-height: 22px !important;
    font-size: 11px !important;
    font-weight: 500 !important;
    text-align: left !important;
    vertical-align: middle !important;
}

/* Dark mode - Style de base */
.dark .handsontable {
    background: #1a1a1a !important;
}

.dark .handsontable td {
    background: #1a1a1a !important;
    color: #ffffff !important;
    border-color: #333333 !important;
}

.dark .handsontable tbody tr:nth-of-type(even) td {
    background: #262626 !important;
}

.dark .handsontable th {
    background: #262626 !important;
    color: #ffffff !important;
    border-color: #333333 !important;
}

/* Dark mode - En-têtes fixes */
.dark .handsontable .ht_clone_top th,
.dark .handsontable .ht_clone_left td,
.dark .handsontable .ht_clone_top_left_corner th {
    background: #262626 !important;
}

/* Dark mode - Menus contextuels */
.dark .handsontable .htDropdownMenu {
    background: #262626 !important;
    border-color: #333333 !important;
    color: #ffffff !important;
}

.dark .htDropdownMenu .ht_master .wtHolder {
    background: #262626 !important;
}

/* Dark mode - Sélection */
.dark .handsontable tbody tr.ht__highlight td {
    background: #2a4365 !important;
}

.dark .handsontable .wtBorder.current {
    background: #4299e1 !important;
}

/* Style pour les badges de statut en mode sombre */
.dark .handsontable td.htCenter div[class*="inline-flex"] {
    background-color: rgba(255, 255, 255, 0.1) !important;
}

.dark .handsontable td div[class*="bg-green-100"] {
    background-color: rgba(34, 197, 94, 0.2) !important;
    color: rgb(34, 197, 94) !important;
}

.dark .handsontable td div[class*="bg-red-100"] {
    background-color: rgba(239, 68, 68, 0.2) !important;
    color: rgb(239, 68, 68) !important;
}

.dark .handsontable td div[class*="bg-blue-100"] {
    background-color: rgba(59, 130, 246, 0.2) !important;
    color: rgb(59, 130, 246) !important;
}

.dark .handsontable td div[class*="bg-yellow-100"] {
    background-color: rgba(234, 179, 8, 0.2) !important;
    color: rgb(234, 179, 8) !important;
}

.dark .handsontable td div[class*="bg-purple-100"] {
    background-color: rgba(168, 85, 247, 0.2) !important;
    color: rgb(168, 85, 247) !important;
}

.dark .handsontable td div[class*="bg-gray-100"] {
    background-color: rgba(156, 163, 175, 0.2) !important;
    color: rgb(156, 163, 175) !important;
}

/* Style pour les boutons d'action en mode sombre */
.dark .handsontable .edit-button {
    color: rgb(156, 163, 175) !important;
}

.dark .handsontable .edit-button:hover {
    color: rgb(59, 130, 246) !important;
}

.dark .handsontable .delete-button {
    color: rgb(156, 163, 175) !important;
}

.dark .handsontable .delete-button:hover {
    color: rgb(239, 68, 68) !important;
}

/* Style des filtres en mode sombre */
.dark .handsontable .columnSorting.ascending::after,
.dark .handsontable .columnSorting.descending::after {
    color: #ffffff !important;
}

/* Assurer que les éléments de l'interface utilisateur restent au-dessus de Handsontable */
:deep(.dialog-overlay),
:deep(.dialog-content) {
    z-index: 9999 !important;
}
</style>