//components/DataTable/DataTable.vue
<template>
    <div class="data-table-wrapper">
        <!-- Toolbar -->
        <DataTableToolbar v-if="!loadingState" :columns="tableColumns"
            :searchPlaceholder="tableSettings?.searchPlaceholder" :selectedCount="selectedItems.length"
            :visibleColumns="visibleColumnIds" @search="handleSearch" @toggleColumn="toggleColumn"
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
            <hot-table :data="processedTableData" :settings="mergedTableSettings" :rowHeaders="true"
                :colHeaders="columnHeaders" :height="tableHeight" :width="tableWidth" @afterChange="handleChange"
                @afterSelection="handleSelection" class="excel-theme" ref="hotTableRef" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import DataTableToolbar from './DataTableToolbar.vue'
import { exportToCSV, exportToExcel } from './utils/export'

interface TableProps {
    tableData: any[] | any;
    tableColumns?: any[];
    tableHeight?: number | string;
    tableWidth?: number | string;
    tableSettings?: object;
    isEditable?: boolean;
    toolbarConfig?: {
        searchPlaceholder?: string;
        exportFileName?: string;
    };
    cellRenderers?: Record<string, (value: any, row: any) => string>;
    loadingState?: boolean;
}

const props = withDefaults(defineProps<TableProps>(), {
    tableHeight: 'auto',
    tableWidth: 'auto',
    isEditable: false,
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
}>()

const isHydrated = ref(false)
const tableContainer = ref<HTMLElement | null>(null)
const hotTableRef = ref<any>(null)
const selectedItems = ref<any[]>([])
const visibleColumnIds = ref<string[]>(props.tableColumns?.map(col => col.data) || [])
const searchQuery = ref('')

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
            data: col.data,
            type: col.ype || 'text',
            format: col.format,
            className: `${col.className || ''} text-xs`,
            readOnly: !props.isEditable || col.readOnly,
        }))

    return {
        licenseKey: 'non-commercial-and-evaluation',
        readOnly: !props.isEditable,
        columns: columnSettings,
        colHeaders: columnHeaders.value,
        filters: true,
        dropdownMenu: true,
        columnSorting: true,
        manualColumnResize: true,
        selectionMode: 'multiple',
        outsideClickDeselects: false,
        stretchH: 'all',
        autoWrapRow: true,
        rowHeights: 22,
        renderAllRows: true,
        afterSelectionEnd: (rowStart: number, colStart: number, rowEnd: number, colEnd: number) => {
            handleSelection(rowStart, colStart, rowEnd, colEnd)
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

    const selected = []
    const rowIndexes = new Set() // Pour éviter les doublons

    // Récupérer toutes les sélections actives
    const selectedRanges = hotTable.getSelected() || []
    console.log('Selected ranges:', selectedRanges)

    selectedRanges.forEach(([fromRow, fromCol, toRow, toCol]) => {
        for (let row = Math.min(fromRow, toRow); row <= Math.max(fromRow, toRow); row++) {
            rowIndexes.add(row)
        }
    })

    // Convertir les index en données
    Array.from(rowIndexes).forEach(rowIndex => {
        if (processedTableData.value[rowIndex]) {
            selected.push(processedTableData.value[rowIndex])
        }
    })

    console.log('Final selected data:', selected)
    selectedItems.value = selected
    emit('selection', selected)
}

const handleExport = async (format: string) => {
    console.log('Export demandé:', format)
    console.log('Données sélectionnées:', selectedItems.value)

    // Si des éléments sont sélectionnés, on n'exporte que ceux-là
    const dataToExport = selectedItems.value.length > 0
        ? [...selectedItems.value] // Créer une copie pour éviter les problèmes de réactivité
        : [...processedTableData.value]

    console.log('Données à exporter:', dataToExport)

    try {
        if (format === 'csv') {
            console.log('Exporting to CSV...')
            await exportToCSV(dataToExport, props.tableColumns || [], props.toolbarConfig?.exportFileName)
        } else if (format === 'xlsx') {
            console.log('Exporting to Excel...')
            await exportToExcel(dataToExport, props.tableColumns || [], props.toolbarConfig?.exportFileName)
        }
    } catch (error) {
        console.error('Erreur lors de l\'export:', error)
    }
}

// Methods
const handleChange = (changes: any[]) => {
    if (!changes) return
    emit('change', changes)

    if (props.isEditable && changes) {
        const newData = [...processedTableData.value]
        changes.forEach(([row, prop, oldValue, newValue]) => {
            newData[row][prop] = newValue
        })
        emit('update:tableData', newData)
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

onMounted(async () => {
    await nextTick()
    isHydrated.value = true
})
</script>

<style>
/* Styles de base */
.handsontable {
    font-size: 11px !important;
}

.handsontable td {
    padding: 2px 4px !important;
    height: 22px !important;
}

/* Style des cellules */
.handsontable td {
    padding: 2px 4px !important;
    height: 22px !important;
    font-size: 11px !important;
}

/* Style des en-têtes et des filtres */
.handsontable th {
    font-size: 11px !important;
    height: 22px !important;
}

/* Dark mode */
.dark .handsontable td,
.dark .handsontable tbody tr:nth-of-type(even) td,
.dark .handsontable.ht_master tbody tr td {
    background: #1a1a1a !important;
    color: white !important;
    border-color: #333 !important;
}

.dark .handsontable th,
.dark .handsontable .ht_clone_top th {
    background: #262626 !important;
    color: white !important;
    border-color: #333 !important;
}

.handsontable .htDropdownMenu {
  padding: 0;
  min-width: 180px;
}

.handsontable .htFiltersMenuCondition {
  border: none;
}

/* Pour le mode sombre */
.dark .handsontable .htDropdownMenu {
  background: #262626;
  border-color: #333;
}
</style>