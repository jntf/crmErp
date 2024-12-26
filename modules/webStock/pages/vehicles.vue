//modules/webStock/pages/vehicles.vue
<template>
    <div class="container mx-auto py-6">
        <div class="mb-8">
            <h2 class="text-3xl font-bold tracking-tight">Stock Véhicules</h2>
            <p class="text-muted-foreground">Gérez votre stock de véhicules depuis différentes sources.</p>
        </div>
        <Button variant="outline" size="sm" :disabled="!selectedVehicles.length" @click="goToPublish">
            <PlusCircle class="mr-2 h-4 w-4" />
            Publier sur le site
        </Button>

        <DataTable :tableData="vehiclesData" :tableColumns="columns" :tableSettings="tableSettings"
            :cellRenderers="cellRenderers" :toolbarConfig="toolbarConfig" :loadingState="loading" @change="handleChange"
            @selection="handleSelection" @export="handleExport">
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import { useVehicles } from '../composables/useVehicles'
import { useToast } from '@/components/ui/toast/use-toast'
import { exportToCSV, exportToExcel } from '@/components/DataTable/utils/export'
import { useRouter } from 'vue-router'
import { usePublishState } from '../composables/usePublishState'

const { vehicles, loading, fetchVehicles } = useVehicles()
const selectedVehicles = ref([])
const exportFormat = ref('xlsx')
const { toast } = useToast()
const router = useRouter()
const { setVehiclesForPublish } = usePublishState()

// Colonnes pour le DataTable
const columns = [
    {
        title: 'Source',
        data: 'source',
        type: 'text'
    },
    {
        data: 'id',
        title: 'ID',
        type: 'text'
    },
    {
        data: 'brand',
        title: 'Marque',
        type: 'text',
    },
    {
        data: 'model',
        title: 'Modèle',
        type: 'text'
    },
    {
        data: 'version',
        title: 'Version',
        type: 'text'
    },
    {
        data: 'mileage',
        title: 'KM',
        type: 'numeric',
        format: '0,0',
        suffix: ' km',
        className: 'htRight'
    },
    {
        data: 'color',
        title: 'Couleur',
        type: 'text'
    },
    {
        data: 'registration_date',
        title: 'M.E.C',
        type: 'date',
    },
    {
        data: 'base_price',
        title: 'Prix',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight'
    },
    {
        data: 'repair_cost',
        title: 'Frais',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight'
    }
]

// Transformation des données en format plat
const vehiclesData = computed(() => {
    return vehicles.value.map(vehicle => ({
        // Données de base du véhicule (format plat)
        id: vehicle.vehicleData.id,
        source: vehicle.vehicleData.source,
        brand: vehicle.vehicleData.brand,
        model: vehicle.vehicleData.model,
        version: vehicle.vehicleData.version,
        mileage: vehicle.vehicleData.mileage,
        color: vehicle.vehicleData.color,
        registration_date: vehicle.vehicleData.registration_date,
        base_price: vehicle.vehicleData.base_price,
        repair_cost: vehicle.vehicleData.repair_cost || 0,

        // Garder les données complètes pour un usage ultérieur
        _originalData: vehicle
    }))
})

const tableSettings = {
    stretchH: 'all',
    autoWrapRow: true,
    rowHeights: 35,
    contextMenu: true,
    height: '70vh',
    selectionMode: 'multiple',
    outsideClickDeselects: false,
    multiSelect: true,
    currentRowClassName: 'current-row',
    currentColClassName: 'current-col',
    // Ajout des paramètres suivants
    // colWidths: [40, 120, 80, 100, 100, 300], // Ajustez ces valeurs selon vos besoins
    manualColumnResize: true,
    fixedRowsTop: 1, // Fixe l'en-tête
    fixedColumnsLeft: 2, // Fixe la première colonne (numérotation)
    renderAllRows: false,
    viewportRowRenderingOffset: 20,
    rowHeaders: true // Pour afficher les numéros de ligne
}

const toolbarConfig = {
    searchPlaceholder: 'Rechercher un véhicule...',
    exportFileName: 'stock-vehicules'
}

const cellRenderers = {
    color: (value, row) => {
        if (!value) return ''
        return `${value}`
    },
    repair_cost: (value, row) => {
        if (!value || value === 0) return ''
        return `${value.toLocaleString()}`
    }
}

const handleChange = (changes: Array<[number, string, any, any]>) => {
    console.log('Modifications:', changes)
}

const handleSelection = (selected) => {
    console.log('Selection reçue dans vehicles:', selected)
    // Récupérer les données originales pour les véhicules sélectionnés
    selectedVehicles.value = selected.map(item =>
        vehicles.value.find(v => v.vehicleData.id === item.id)
    ).filter(Boolean)
}

const handleExport = (format: string) => {
    exportFormat.value = format
    const dataToExport = selectedVehicles.value.length > 0
        ? selectedVehicles.value
        : vehiclesData.value

    if (format === 'csv') {
        exportToCSV(dataToExport, columns, toolbarConfig.exportFileName)
    } else {
        exportToExcel(dataToExport, columns, toolbarConfig.exportFileName)
    }
}

function goToPublish() {
    if (!selectedVehicles.value.length) return

    setVehiclesForPublish(selectedVehicles.value)
    router.push('/erp/webstock/publish')
}

onMounted(() => {
    fetchVehicles()
})
</script>

<style>
.color-cell {
    padding: 2px 8px;
    border-radius: 4px;
    text-align: center;
    background-color: #f3f4f6;
}

.repair-cost-cell {
    padding: 2px 8px;
    border-radius: 4px;
    text-align: right;
    color: #f59e0b;
    font-weight: 500;
}
</style>