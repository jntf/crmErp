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
        <Button variant="outline" size="sm" :disabled="!selectedVehicles.length || !hasPublishedSelected"
            @click="showUnpublishConfirmation">
            <MinusCircle class="mr-2 h-4 w-4" />
            Dépublier la sélection
        </Button>

        <!-- <VehicleTableFilters v-model:selectedVehicles="selectedVehicles" :vehicles="vehiclesData" :loading="loading"
            class="mb-4" /> -->

        <DataTable :tableData="vehiclesData" :tableColumns="columns" :tableSettings="tableSettings"
            :cellRenderers="cellRenderers" :toolbarConfig="toolbarConfig" :loadingState="loading" @change="handleChange"
            @selection="handleSelection" @export="handleExport">
        </DataTable>
    </div>
    <!-- Modal de confirmation -->
    <ConfirmationDialog v-model:isOpen="showConfirmDialog" title="Confirmer la dépublication"
        :description="`Voulez-vous vraiment dépublier ${selectedVehicles.length} véhicule(s) ? Cette action les retirera du site web.`"
        @confirm="handleUnpublish">
        <template #confirm-button>
            <Trash2 class="w-4 h-4 mr-2" />
            Dépublier
        </template>
    </ConfirmationDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from '@/components/DataTable'
import VehicleTableFilters from '../components/VehicleTable/VehicleTableFilters.vue'
import { useVehicles } from '../composables/useVehicles'
import { useToast } from '@/components/ui/toast/use-toast'
import { exportToCSV, exportToExcel } from '@/components/DataTable/utils/export'
import { useRouter } from 'vue-router'
import { usePublishState } from '../composables/usePublishState'
import { useVehiclePublisher } from '../services/supabase'
import { PlusCircle, MinusCircle, Trash2 } from 'lucide-vue-next'
import ConfirmationDialog from '../components/ConfirmationDialog.vue'
const { vehicles, loading, fetchVehicles } = useVehicles()
const selectedVehicles = ref([])
const exportFormat = ref('xlsx')
const { toast } = useToast()
const router = useRouter()
const { setVehiclesForPublish } = usePublishState()
const { getPublishedVehicles } = useVehiclePublisher()
const publishedVehiclesMap = ref<Record<string, boolean>>({})

const showConfirmDialog = ref(false)

// Fonction pour afficher le modal de confirmation
const showUnpublishConfirmation = () => {
    if (selectedVehicles.value.length === 0) return
    showConfirmDialog.value = true
}

const loadPublishedVehicles = async () => {
    try {
        const publishedVehicles = await getPublishedVehicles()
        publishedVehiclesMap.value = publishedVehicles.reduce((acc, vehicle) => {
            // Créer une clé unique combinant source et vehicle_id
            const key = `${vehicle.source}-${vehicle.vehicle_id}`
            acc[key] = true
            return acc
        }, {} as Record<string, boolean>)
    } catch (error) {
        console.error('Erreur lors du chargement des véhicules publiés:', error)
    }
}

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
        data: 'actions',
        title: 'Actions',
        type: 'text',
        width: 50,
        className: 'htCenter',
        renderer(instance, td, row, col, prop, value) {
            td.innerHTML = value;
            return td;
        }
    },
    {
        data: 'isPublished',
        title: 'Status',
        type: 'text',
        width: 70,
        className: 'text-center status-badge',
        renderer(instance, td, row, col, prop, value) {
            // On s'attend à recevoir une string HTML
            td.innerHTML = value;
            return td;
        }
    },
    {
        data: 'photoCount',
        title: 'Photos',
        type: 'text',
        width: 70,
        className: 'text-center photos-badge',
        renderer(instance, td, row, col, prop, value) {
            // On s'attend à recevoir une string HTML
            td.innerHTML = value;
            return td;
        }
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
        data: 'repair_cost',
        title: 'Frais',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight'
    },
    {
        data: 'base_price',
        title: 'Prix',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight'
    },
]

// Transformation des données en format plat
const vehiclesData = computed(() => {
    return vehicles.value.map(vehicle => {
        const publishKey = `${vehicle.vehicleData.source}-${vehicle.vehicleData.id}`
        const isPublished = Boolean(publishedVehiclesMap.value[publishKey]) // Force un booléen
        const photoCount = Number(vehicle.photos?.length || 0) // Force un nombre

        return {
            // Données existantes
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

            // Nouvelles données
            isPublished: isPublished,
            photoCount: photoCount,

            // Données originales
            _originalData: vehicle
        }
    })
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
    // colWidths: [40, 120, 80, 100, 100, 300], // Ajustez ces valeurs selon vos besoins
    currentRowClassName: 'current-row',
    currentColClassName: 'current-col',
    manualColumnResize: true,
    fixedRowsTop: 1,
    fixedColumnsLeft: 2,
    renderAllRows: false,
    viewportRowRenderingOffset: 20,
    rowHeaders: true,
    afterOnCellMouseDown: (event: MouseEvent, coords: any, TD: HTMLElement) => {
        const editButton = TD.querySelector('.edit-button');
        if (editButton && (event.target === editButton || editButton.contains(event.target as Node))) {
            event.stopPropagation();

            const rowData = vehiclesData.value[coords.row];
            if (rowData) {
                router.push(`/erp/webstock/edit/${rowData.source}/${rowData.id}`);
            }
        }
    }
}

const toolbarConfig = {
    searchPlaceholder: 'Rechercher un véhicule...',
    exportFileName: 'stock-vehicules'
}

const cellRenderers = {
    color: (value: string, row: any) => {
        if (!value) return ''
        return `${value}`
    },
    repair_cost: (value: number, row: any) => {
        if (!value || value === 0) return ''
        return `${value.toLocaleString()}`
    },
    isPublished: (value: boolean) => {
        const isPublished = Boolean(value);
        return `<div class="inline-flex items-center justify-center h-5 w-5 rounded-full ${isPublished
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
            }">${isPublished ? '●' : '○'}</div>`;
    },
    photoCount: (value: number) => {
        const count = Number(value) || 0;
        return `<div class="inline-flex items-center justify-center h-5 w-8 rounded-full ${count > 0
            ? 'bg-blue-100 text-blue-700'
            : 'bg-red-100 text-red-700'
            }">${count}</div>`;
    },
    actions: () => {
        return `<span class="edit-button inline-flex items-center justify-center h-5 w-5 text-gray-500 cursor-pointer">✎</span>`;
    }
}

const handleChange = (changes: Array<[number, string, any, any]>) => {
    console.log('Modifications:', changes)
}

const handleSelection = (selected: any) => {
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

// Ajouter le computed hasPublishedSelected
const hasPublishedSelected = computed(() => {
    return selectedVehicles.value.some(vehicle => {
        const key = `${vehicle.vehicleData.source}-${vehicle.vehicleData.id}`
        return publishedVehiclesMap.value[key]
    })
})

// Ajouter la fonction handleUnpublish
const handleUnpublish = async () => {
    if (!selectedVehicles.value.length) return

    try {
        const supabase = useSupabaseClient()

        const vehiclesToUnpublish = selectedVehicles.value.map(vehicle => ({
            source: vehicle.vehicleData.source,
            id: vehicle.vehicleData.id
        }))

        console.log('Vehicles to unpublish:', vehiclesToUnpublish)

        const { data, error } = await supabase.rpc('unpublish_vehicles', {
            vehicle_list: vehiclesToUnpublish
        })

        console.log('Unpublish response:', data)

        if (error) throw error

        // Attendre que la mise à jour soit terminée
        await Promise.all([
            loadPublishedVehicles(),
            fetchVehicles()
        ])

        const successCount = (data.success || []).length
        const errorCount = (data.errors || []).length

        if (successCount > 0) {
            toast({
                title: "Dépublication terminée",
                description: `${successCount} véhicule(s) dépublié(s) avec succès${errorCount > 0 ? ` (${errorCount} échec(s))` : ''
                    }`,
                variant: successCount > 0 ? "default" : "warning"
            })
        } else {
            throw new Error('Aucun véhicule n\'a été dépublié')
        }

        if (errorCount > 0) {
            data.errors.forEach((err: any) => {
                toast({
                    title: `Erreur - Véhicule ${err.id}`,
                    description: err.error,
                    variant: "destructive"
                })
            })
        }

    } catch (error) {
        console.error('Erreur lors de la dépublication:', error)
        toast({
            title: "Erreur de dépublication",
            description: error instanceof Error ? error.message : "Une erreur est survenue",
            variant: "destructive"
        })
    }
}

onMounted(() => {
    fetchVehicles()
    loadPublishedVehicles()
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