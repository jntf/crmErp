<template>
    <div class="container mx-auto py-6 pr-12">
        <div class="mb-8">
            <h2 class="text-3xl font-bold tracking-tight">Gestion du Stock</h2>
            <p class="text-muted-foreground">Gérez votre parc de véhicules et leurs expositions en ligne.</p>
        </div>

        <!-- Barre de recherche -->
        <div class="mb-4">
            <VehicleSearch @search="handleSearch" />
        </div>

        <!-- Barre d'actions latérale -->
        <VehicleActions 
            :has-selection="selectedVehicles.length > 0"
            @update-status="handleUpdateStatus"
            @delete-selection="handleDeleteRequest"
            @export-excel="() => handleExport('xlsx')"
            @generate-offer="handleGenerateOffer"
            @change-supplier="handleChangeSupplier"
            @create-order="handleCreateOrder"
            @import-excel="handleImportExcel"
        />

        <!-- Table principale -->
        <div class="w-full">
            <DataTable 
                :key="searchState.rawQuery"
                :tableData="filteredVehicles" 
                :tableColumns="columns" 
                :tableSettings="tableSettings"
                :cellRenderers="cellRenderers" 
                :toolbarConfig="toolbarConfig" 
                :loadingState="loading"
                @selection="handleSelection" 
                @change="handleChange" 
                @delete-request="handleDeleteRequest" 
            />
        </div>

        <!-- Modal de confirmation pour la suppression -->
        <ConfirmDialog 
            v-model="showConfirmDialog" 
            title="Confirmer la suppression"
            :message="`Voulez-vous vraiment supprimer ${selectedVehicles.length} véhicule(s) ?`"
            confirm-text="Supprimer" 
            cancel-text="Annuler" 
            :close-on-backdrop="true" 
            @confirm="confirmDelete"
        >
            <template #confirm-icon>
                <Trash2 class="w-4 h-4 mr-2" />
            </template>
        </ConfirmDialog>

        <!-- Modal de mise à jour du statut -->
        <StatusUpdateModal
            v-model="showStatusModal"
            :selected-vehicles="selectedVehicles"
            @status-updated="handleStatusUpdated"
        />

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

        <!-- Modal d'offre commerciale -->
        <CommercialOfferDialog
            v-model="showOfferModal"
            :selected-vehicles="selectedVehicles"
        />

        <!-- Modal de sélection du fournisseur -->
        <SupplierSelectionDialog
            v-model="showSupplierModal"
            :selected-vehicles="selectedVehicles"
            @supplier-selected="handleSupplierSelected"
        />

        <!-- Modal d'import Excel -->
        <ImportExcelDialog
            v-model="showImportModal"
            @import-complete="handleImportComplete"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2 } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, ConfirmDialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import { useVehicleStore } from '../stores/useVehicleStore'
import { exportToCSV, exportToExcel } from '@/components/DataTable/utils/export'
import { VehicleStatusEnum } from '../types'
import type { Vehicle, VehicleTableData, VehicleCreate } from '../types'
import VehicleSearch from '../components/VehicleSearch.vue'
import VehicleActions from '../components/VehicleActions.vue'
import StatusUpdateModal from '../components/StatusUpdateModal.vue'
import CommercialOfferDialog from '../components/CommercialOfferDialog.vue'
import SupplierSelectionDialog from '../components/SupplierSelectionDialog.vue'
import ImportExcelDialog from '../components/ImportExcelDialog.vue'

const router = useRouter()
const { toast } = useToast()
const vehicleStore = useVehicleStore()

// État local
const loading = ref(false)
const showCreateModal = ref(false)
const showConfirmDialog = ref(false)
const showStatusModal = ref(false)
const showOfferModal = ref(false)
const showSupplierModal = ref(false)
const showImportModal = ref(false)
const selectedVehicle = ref<Vehicle | null>(null)
const selectedVehicles = ref<Vehicle[]>([])
const searchState = ref({
    terms: [] as string[],
    rawQuery: ''
})

// Interface pour les données aplaties
interface FlattenedVehicle extends Vehicle {
    // Prix
    vehicle_price_ht: number;
    vehicle_selling_price_ht: number;
    vehicle_repair_cost: number;
    vehicle_frevo: number;
    vehicle_vat_rate: number;
    // Statut
    vehicle_status: VehicleStatusEnum;
    vehicle_location: string;
    vehicle_is_online: boolean;
    // Actions
    actions: string;
}

// Configuration des colonnes
const columns = [
    // Informations principales
    {
        data: 'vehicle_status',
        title: 'Statut',
        type: 'text',
        width: 90,

        className: 'htCenter',
        renderer(instance: any, td: any, row: any, col: any, prop: any, value: any) {
            td.innerHTML = cellRenderers.status(value);
            return td;
        }
    },
    // Ownership
    {
        data: 'vehicle_ownership',
        title: 'Propriétaire',
        type: 'text',
        className: 'htLeft'
    },
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
        data: 'vehicle_price_ht',
        title: 'Prix Achat HT',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight',
        width: 100
    },
    {
        data: 'vehicle_selling_price_ht',
        title: 'Prix Vente HT',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight',
        width: 100
    },
    {
        data: 'vehicle_repair_cost',
        title: 'Frais Rép.',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight',
        width: 90
    },
    {
        data: 'vehicle_frevo',
        title: 'FREVO',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight',
        width: 90
    },
    {
        data: 'vehicle_location',
        title: 'Localisation',
        type: 'text',
        className: 'htCenter',
        width: 100
    },
    {
        data: 'vehicle_is_online',
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
    afterSelectionEnd: (rowStart: number, colStart: number, rowEnd: number, colEnd: number, preventScrolling: object, selectionLayerLevel: number) => {
        console.log('Selection:', { rowStart, colStart, rowEnd, colEnd })
        console.log('Données disponibles:', vehiclesData.value)
        
        // Si pas de données, on sort
        if (!vehiclesData.value.length) {
            console.log('Aucune donnée disponible')
            return
        }

        // Récupération des lignes sélectionnées
        const selectedVehiclesList = []
        for (let row = Math.min(rowStart, rowEnd); row <= Math.max(rowStart, rowEnd); row++) {
            if (row >= 0 && row < vehiclesData.value.length) {
                const vehicle = vehiclesData.value[row]
                if (vehicle && vehicle.id) {
                    selectedVehiclesList.push(vehicle)
                }
            }
        }

        console.log('Véhicules trouvés dans la sélection:', selectedVehiclesList)
        handleSelection(selectedVehiclesList)
    },
    afterOnCellMouseDown: (event: MouseEvent, coords: any, TD: HTMLElement) => {
        const deleteButton = TD.querySelector('.delete-button')
        const viewButton = TD.querySelector('.edit-button')
        if (deleteButton && (event.target === deleteButton || deleteButton.contains(event.target as Node))) {
            event.stopPropagation()
            const rowData = vehiclesData.value[coords.row]
            if (rowData) {
                handleDeleteRequest([rowData])
            }
        } else if (viewButton && (event.target === viewButton || viewButton.contains(event.target as Node))) {
            event.stopPropagation()
            const rowData = vehiclesData.value[coords.row]
            if (rowData) {
                selectedVehicle.value = rowData
                showCreateModal.value = true
            }
        }
    }
}

const cellRenderers = {
    status: (value: VehicleStatusEnum) => {
        const statusConfig = {
            in_stock: { bg: 'bg-green-100', text: 'text-green-700', label: 'En stock' },
            reserved: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Réservé' },
            in_trading: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En trading' },
            in_dealing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En négociation' },
            in_offer: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'En offre' },
            in_transit: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En transit' },
            delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Livré' },
            billed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Facturé' },
            archived: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Archivé' },
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
    selectedVehicles.value = [...vehicles]
    console.log('État final de la sélection:', selectedVehicles.value)
}

const handleDeleteRequest = (vehicles?: Vehicle[]) => {
    console.log('Action: Suppression')
    if (vehicles) {
        console.log('Véhicules à supprimer:', vehicles)
        selectedVehicles.value = vehicles
    }
    console.log('IDs à supprimer:', selectedVehicles.value.map(v => v.id))
    showConfirmDialog.value = true
}

const handleChange = (changes: Array<[number, string, any, any]>) => {
    console.log('Modifications:', changes)
}

const handleExport = (format: 'csv' | 'xlsx') => {
    console.log('Action: Export', format)
    const dataToExport = selectedVehicles.value.length > 0
        ? selectedVehicles.value
        : vehiclesData.value

    console.log('Données à exporter:', dataToExport)
    console.log('IDs à exporter:', dataToExport.map(v => v.id))

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

// Nouveaux handlers pour les actions
const handleSearch = (searchData: { terms: string[], rawQuery: string }) => {
    loading.value = true
    try {
        searchState.value = searchData
        // Réinitialise la sélection lors d'une nouvelle recherche
        selectedVehicles.value = []
    } finally {
        loading.value = false
    }
}

const handleUpdateStatus = async () => {
    showStatusModal.value = true
}

const handleStatusUpdated = async () => {
    // Recharger les véhicules pour mettre à jour l'affichage
    await vehicleStore.fetchVehicles()
    // refresh la page
    window.location.reload()
}

const handleGenerateOffer = async () => {
    if (selectedVehicles.value.length === 0) {
        toast({
            title: "Aucun véhicule sélectionné",
            description: "Veuillez sélectionner au moins un véhicule",
            variant: "destructive"
        })
        return
    }
    showOfferModal.value = true
}

const handleChangeSupplier = async () => {
    if (selectedVehicles.value.length === 0) {
        toast({
            title: "Aucun véhicule sélectionné",
            description: "Veuillez sélectionner au moins un véhicule",
            variant: "destructive"
        })
        return
    }
    showSupplierModal.value = true
}

const handleCreateOrder = async () => {
    console.log('Action: Création bon de commande')
    console.log('Véhicules sélectionnés:', selectedVehicles.value)
    console.log('IDs des véhicules:', selectedVehicles.value.map(v => v.id))
    // TODO: Implémenter la création de bon de commande
}

const handleSupplierSelected = async () => {
    // Recharger les véhicules pour mettre à jour l'affichage
    await vehicleStore.fetchVehicles()
    // Réinitialiser la sélection
    selectedVehicles.value = []
    // Rafraîchir la page pour mettre à jour les données
    // window.location.reload()
}

// Fonction utilitaire pour normaliser les chaînes de caractères
const normalizeString = (str: string) => {
    if (!str) return ''
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
}

// Données calculées
const vehiclesData = computed<VehicleTableData[]>(() => {
    return vehicleStore.vehicles.map(vehicle => ({
        ...vehicle,
        // Prix
        vehicle_price_ht: vehicle.details?.price_details?.purchase_price_ht || 0,
        vehicle_selling_price_ht: vehicle.details?.price_details?.selling_price_ht || 0,
        vehicle_repair_cost: vehicle.details?.price_details?.repair_cost || 0,
        vehicle_frevo: vehicle.details?.price_details?.frevo || 0,
        vehicle_vat_rate: vehicle.details?.price_details?.vat_rate || 20,
        // Statut
        vehicle_status: (vehicle.details?.status_details?.status || VehicleStatusEnum.IN_STOCK) as VehicleStatusEnum,
        vehicle_location: vehicle.details?.status_details?.location || '',
        vehicle_is_online: vehicle.details?.status_details?.is_online || false,
        // Ownership
        vehicle_ownership: vehicle.details?.ownership?.[0]?.company?.name || '',
        // Actions
        actions: ''
    }))
})

// Véhicules filtrés
const filteredVehicles = computed(() => {
    if (!searchState.value.terms.length) return vehiclesData.value

    return vehiclesData.value.filter(vehicle => {
        // Champs à rechercher
        const searchableFields = [
            vehicle.brand,
            vehicle.model,
            vehicle.version,
            vehicle.vin,
            vehicle.registration_number,
            vehicle.vehicle_status,
            vehicle.vehicle_location
        ]

        // Normalise chaque champ pour la recherche
        const normalizedFields = searchableFields
            .filter(field => field !== null && field !== undefined)
            .map(field => normalizeString(String(field)))

        // Vérifie que tous les termes de recherche correspondent à au moins un champ
        return searchState.value.terms.every(term =>
            normalizedFields.some(field => field.includes(normalizeString(term)))
        )
    })
})

// Handler pour l'import
const handleImportExcel = () => {
    showImportModal.value = true
}

const handleImportComplete = async (data: any[]) => {
    loading.value = true
    try {
        // Convertir les données en véhicules
        const vehicles: VehicleCreate[] = data.map(item => ({
            brand: item.brand,
            model: item.model,
            version: item.version,
            year: parseInt(item.year),
            mileage: parseInt(item.mileage),
            fuel_type: item.fuel_type,
            transmission: item.transmission,
            color: item.color,
            vin: item.vin,
            registration_number: item.registration_number,
            status: VehicleStatusEnum.IN_STOCK,
            details: {
                price_details: {
                    purchase_price_ht: parseInt(item.vehicle_price_ht) || 0,
                    selling_price_ht: 0,
                    vat_rate: 20,
                    repair_cost: 0,
                    frevo: 0
                },
                status_details: {
                    status: VehicleStatusEnum.IN_STOCK,
                    location: '',
                    is_online: false,
                    exposed_id: null
                },
                features: {
                    features: {}
                }
            }
        }))

        // Créer les véhicules
        await Promise.all(vehicles.map(vehicle => vehicleStore.createVehicle(vehicle)))

        toast({
            title: "Import réussi",
            description: `${vehicles.length} véhicules ont été importés avec succès`
        })

        // Recharger les véhicules
        await vehicleStore.fetchVehicles()
    } catch (error) {
        console.error('Erreur lors de l\'import:', error)
        toast({
            title: "Erreur lors de l'import",
            description: "Une erreur est survenue lors de l'import des véhicules",
            variant: "destructive"
        })
    } finally {
        loading.value = false
    }
}

// Initialisation
onMounted(async () => {
    loading.value = true
    try {
        await vehicleStore.fetchVehicles()
        console.log('Véhicules chargés:', vehicleStore.vehicles)
    } catch (error) {
        console.error('Erreur lors du chargement des véhicules:', error)
        toast({
            title: "Erreur de chargement",
            description: "Impossible de charger les véhicules",
            variant: "destructive"
        })
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