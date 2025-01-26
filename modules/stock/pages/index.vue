<template>
    <div class="container mx-auto py-6">
        <div class="mb-8">
            <h2 class="text-3xl font-bold tracking-tight">Gestion du Stock</h2>
            <p class="text-muted-foreground">Gérez votre parc de véhicules et leurs expositions en ligne.</p>
        </div>

        <!-- Boutons d'action -->
        <div class="mb-4 flex gap-2">
            <Button variant="outline" size="sm" :disabled="!selectedVehicles.length" @click="handleExport">
                <Download class="mr-2 h-4 w-4" />
                Exporter
            </Button>
            <Button variant="outline" size="sm" @click="openCreateModal">
                <PlusCircle class="h-4 w-4" />
            </Button>
        </div>

        <!-- Table principale -->
        <DataTable :tableData="vehiclesData" :tableColumns="columns" :tableSettings="tableSettings"
            :cellRenderers="cellRenderers" :toolbarConfig="toolbarConfig" :loadingState="loading"
            @selection="handleSelection" @change="handleChange" @delete-request="handleDeleteRequest" />

        <!-- Modal de confirmation pour la suppression -->
        <ConfirmDialog v-model="showConfirmDialog" title="Confirmer la suppression"
            :message="`Voulez-vous vraiment supprimer ${selectedVehicles.length} véhicule(s) ?`"
            confirm-text="Supprimer" cancel-text="Annuler" :close-on-backdrop="true" @confirm="confirmDelete">
            <template #confirm-icon>
                <Trash2 class="w-4 h-4 mr-2" />
            </template>
        </ConfirmDialog>

        <!-- Modal d'ajout/édition -->
        <Dialog v-model="showCreateModal">
            <DialogContent class="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>{{ selectedVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule' }}</DialogTitle>
                </DialogHeader>
                <!-- TODO: Ajouter le formulaire de véhicule -->
                <DialogFooter>
                    <Button variant="outline" @click="closeCreateModal">Annuler</Button>
                    <Button type="submit" @click="handleSave">Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PlusCircle, Download, Trash2 } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, ConfirmDialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import { useVehicleStore } from '../stores/useVehicleStore'
import { exportToCSV, exportToExcel } from '@/components/DataTable/utils/export'
import type { Vehicle, VehicleStatusEnum } from '../types'

const router = useRouter()
const { toast } = useToast()
const vehicleStore = useVehicleStore()

// État local
const loading = ref(false)
const showCreateModal = ref(false)
const showConfirmDialog = ref(false)
const selectedVehicle = ref<Vehicle | null>(null)
const selectedVehicles = ref<Vehicle[]>([])

// Données calculées
const vehiclesData = computed(() => {
    return vehicleStore.vehicles.map(vehicle => ({
        ...vehicle,
        details: {
            ...vehicle.details,
            status_details: {
                ...vehicle.details.status_details
            },
            price_details: {
                ...vehicle.details.price_details
            },
            features: {
                ...vehicle.details.features
            }
        },
        actions: '' // Sera rendu par le cellRenderer
    }))
})

console.log('vehiclesData', vehiclesData.value)

// Configuration des colonnes
const columns = [
    // Informations principales
    {
        data: 'brand',
        title: 'Marque',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'model',
        title: 'Modèle',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'version',
        title: 'Version',
        type: 'text',
        className: 'htLeft'
    },
    // Caractéristiques techniques
    {
        data: 'year',
        title: 'Année',
        type: 'numeric',
        className: 'htCenter',
        width: 80
    },
    {
        data: 'mileage',
        title: 'Kilométrage',
        type: 'numeric',
        format: '0,0',
        suffix: ' km',
        className: 'htRight',
        width: 100
    },
    {
        data: 'color',
        title: 'Couleur',
        type: 'text',
        className: 'htCenter',
        width: 90
    },
    {
        data: 'co2_emissions',
        title: 'CO2',
        type: 'numeric',
        suffix: ' g/km',
        className: 'htRight',
        width: 80
    },
    {
        data: 'fuel_type',
        title: 'Carburant',
        type: 'text',
        className: 'htCenter',
        width: 90
    },
    {
        data: 'transmission',
        title: 'Boîte',
        type: 'text',
        className: 'htCenter',
        width: 90
    },
    {
        data: 'power_hp',
        title: 'Puissance',
        type: 'numeric',
        suffix: ' ch',
        className: 'htRight',
        width: 90
    },
    {
        data: 'power_fiscal',
        title: 'CV Fisc.',
        type: 'numeric',
        suffix: ' cv',
        className: 'htRight',
        width: 80
    },
    {
        data: 'doors',
        title: 'Portes',
        type: 'numeric',
        className: 'htCenter',
        width: 70
    },
    {
        data: 'seats',
        title: 'Places',
        type: 'numeric',
        className: 'htCenter',
        width: 70
    },
    // Identifiants
    {
        data: 'vin',
        title: 'VIN',
        type: 'text',
        className: 'htLeft',
        width: 140
    },
    {
        data: 'registration_number',
        title: 'Immat.',
        type: 'text',
        className: 'htCenter',
        width: 90
    },
    // Prix et statut
    {
        data: 'details.price_details.purchase_price_ht',
        title: 'Prix Achat HT',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight',
        width: 100
    },
    {
        data: 'details.price_details.selling_price_ht',
        title: 'Prix Vente HT',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight',
        width: 100
    },
    {
        data: 'details.price_details.repair_cost',
        title: 'Frais Rép.',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight',
        width: 90
    },
    {
        data: 'details.price_details.frevo',
        title: 'Frais VO',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight',
        width: 90
    },
    {
        data: 'details.status_details.status',
        title: 'Statut',
        type: 'text',
        width: 100,
        className: 'text-center status-badge',
        renderer(instance: any, td: any, row: any, col: any, prop: any, value: any) {
            td.innerHTML = cellRenderers.status(value);
            return td;
        }
    },
    {
        data: 'details.status_details.location',
        title: 'Localisation',
        type: 'text',
        className: 'htCenter',
        width: 100
    },
    {
        data: 'details.status_details.is_online',
        title: 'En ligne',
        type: 'checkbox',
        className: 'htCenter',
        width: 80
    },
    {
        data: 'actions',
        title: 'Actions',
        type: 'text',
        width: 80,
        className: 'htCenter',
        renderer(instance: any, td: any, row: any, col: any, prop: any, value: any) {
            td.innerHTML = cellRenderers.actions();
            return td;
        }
    }
]

const tableSettings = {
    stretchH: 'all',
    autoWrapRow: false,
    wordWrap: false,
    rowHeights: 35,
    contextMenu: true,
    height: '70vh',
    selectionMode: 'multiple',
    outsideClickDeselects: false,
    multiSelect: true,
    currentRowClassName: 'current-row',
    currentColClassName: 'current-col',
    manualColumnResize: true,
    fixedRowsTop: 1,
    fixedColumnsLeft: 7,
    renderAllRows: false,
    viewportRowRenderingOffset: 20,
    rowHeaders: true,
    trimWhitespace: true,
    afterSelectionEnd: (rowStart: number, colStart: number, rowEnd: number, colEnd: number) => {
        console.log('Selection:', { rowStart, colStart, rowEnd, colEnd });
    },
    afterOnCellMouseDown: (event: MouseEvent, coords: any, TD: HTMLElement) => {
        const deleteButton = TD.querySelector('.delete-button');
        const viewButton = TD.querySelector('.edit-button');
        if (deleteButton && (event.target === deleteButton || deleteButton.contains(event.target as Node))) {
            event.stopPropagation();
            const rowData = vehiclesData.value[coords.row];
            if (rowData) {
                showConfirmDialog.value = true;
                handleSelection([rowData]);
            }
        } else if (viewButton && (event.target === viewButton || viewButton.contains(event.target as Node))) {
            event.stopPropagation();
            const rowData = vehiclesData.value[coords.row];
            if (rowData) {
                selectedVehicle.value = rowData;
                showCreateModal.value = true;
            }
        }
    }
}

const cellRenderers = {
    status: (value: VehicleStatusEnum) => {
        const statusConfig = {
            in_stock: { bg: 'bg-green-100', text: 'text-green-700', label: 'En stock' },
            reserved: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Réservé' },
            sold: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Vendu' },
            exposed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Exposé' }
        }
        const config = statusConfig[value as keyof typeof statusConfig] || { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inconnu' }
        return `<div class="inline-flex items-center justify-center rounded-full px-2 text-xs ${config.bg} ${config.text}">${config.label}</div>`
    },
    actions: () => {
        return `<span class="edit-button inline-flex items-center justify-center h-4 w-4 text-gray-500 cursor-pointer opacity-70 hover:opacity-100 mr-2" title="Voir">👁️</span><span class="delete-button text-red-500 inline-flex items-center justify-center h-4 w-4 text-red-500 cursor-pointer opacity-70 hover:opacity-100" title="Supprimer">🗑️</span>`
    }
}

const toolbarConfig = {
    searchPlaceholder: 'Rechercher un véhicule...',
    exportFileName: 'liste-vehicules'
}

// Handlers
const handleSelection = (vehicles: Vehicle[]) => {
    selectedVehicles.value = vehicles
}

const handleDeleteRequest = (vehicles: Vehicle[]) => {
    selectedVehicles.value = vehicles
    showConfirmDialog.value = true
}

const handleChange = (changes: Array<[number, string, any, any]>) => {
    console.log('Modifications:', changes)
}

const handleExport = (format: 'csv' | 'xlsx') => {
    const dataToExport = selectedVehicles.value.length > 0
        ? selectedVehicles.value
        : vehiclesData.value

    if (format === 'csv') {
        exportToCSV(dataToExport, columns, toolbarConfig.exportFileName)
    } else {
        exportToExcel(dataToExport, columns, toolbarConfig.exportFileName)
    }
}

const openCreateModal = () => {
    selectedVehicle.value = null
    showCreateModal.value = true
}

const closeCreateModal = () => {
    showCreateModal.value = false
    selectedVehicle.value = null
}

const handleSave = async () => {
    // TODO: Implémenter la sauvegarde
    closeCreateModal()
}

const confirmDelete = async () => {
    try {
        await Promise.all(selectedVehicles.value.map(v => vehicleStore.deleteVehicle(v.id)))
        showConfirmDialog.value = false

        toast({
            title: "Suppression réussie",
            description: "Les véhicules sélectionnés ont été supprimés"
        })

        await vehicleStore.fetchVehicles()
    } catch (err) {
        toast({
            title: "Erreur de suppression",
            description: "Une erreur est survenue lors de la suppression",
            variant: "destructive"
        })
    }
}

// Initialisation
onMounted(async () => {
    loading.value = true
    try {
        await vehicleStore.fetchVehicles()
    } finally {
        loading.value = false
    }
})
</script>

<style>
.current-row {
    background-color: rgba(233, 237, 244, 0.4) !important;
}

.current-col {
    background-color: rgba(233, 237, 244, 0.2) !important;
}

/* Style pour tronquer le texte */
.handsontable td {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
}

/* Style spécifique pour les badges de statut */
.handsontable td.text-center.status-badge div {
    display: inline-flex !important;
    max-width: 100% !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
}

/* Style pour les actions */
.handsontable td.htCenter span {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
}
</style>