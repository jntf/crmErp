<template>
  <div>
    <DataTable
      :columns="tanstackColumns"
      :data="dataSource || vehiclesData"
      :loadingState="props.loadingState || isLoading"
      :pagination="props.pagination !== undefined ? props.pagination : true"
      :searchable="true"
      :columnToggle="props.columnToggle !== undefined ? props.columnToggle : true"
      :columnPinning="props.columnPinning !== undefined ? props.columnPinning : true"
      :rowSelection="true"
      :pageSizes="[25, 50, 100, 500]"
      :tableSettings="defaultSettings"
      :side-toolbar="true"
      :export-filename="'vehicules-export'"
      :isEditable="true"
      :read-only="isReadOnly"
      @selection="handleSelection"
      @delete-request="handleDeleteRequest"
      @export="handleExport"
      @toggle-fullwidth="handleToggleFullWidth"
      @toggle-readonly="handleToggleReadOnly"
      @save-changes="handleSaveChanges"
      @cancel-changes="handleCancelChanges"
      ref="dataTableRef"
    >
      <template #toolbar-start>
        <Button 
          v-if="selectedVehicles.length > 0" 
          variant="outline" 
          size="sm"
          class="mr-2"
        >
          {{ selectedVehicles.length }} véhicule(s) sélectionné(s)
        </Button>
      </template>
      
      <template #side-toolbar-buttons>
        <Button 
          variant="ghost" 
          size="icon" 
          class="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          @click="toggleDefaultColumns"
          :title="hasDefaultColumnsPinned ? 'Désépingler les colonnes' : 'Épingler les colonnes principales'"
        >
          <component 
            :is="hasDefaultColumnsPinned ? PinOff : Pin" 
            class="h-4 w-4" 
            :class="{'text-green-500 dark:text-green-400': hasDefaultColumnsPinned}"
          />
          <span class="sr-only">{{ hasDefaultColumnsPinned ? 'Désépingler les colonnes' : 'Épingler les colonnes principales' }}</span>
        </Button>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, onUnmounted, nextTick } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import { useVehicleStore } from '../stores/useVehicleStore'
import { VehicleStatusEnum } from '../types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Vehicle } from '../types'
import TextWithHoverCard from './TextWithHoverCard.vue'
import { Pin, PinOff, Maximize2, Minimize2 } from 'lucide-vue-next'
import { createEditableColumn } from '@/components/DataTable/utils/editable/createEditableColumn'

// État pour le mode plein écran
const isFullScreen = ref(false)
// État pour suivre si les colonnes par défaut sont épinglées
const hasDefaultColumnsPinned = ref(false)
// État pour suivre le mode lecture seule
const isReadOnly = ref(true) // Débuter en mode lecture

// Props
interface Props {
  dataSource?: any[]
  tableColumns?: any[]
  loading?: boolean
  loadingState?: boolean
  columnToggle?: boolean
  columnPinning?: boolean
  fetchVehicles?: Function
  totalElements?: number
  pageSize?: number
  pagination?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Émissions
const emit = defineEmits<{
  'selection': [selectedRows: Vehicle[]];
  'delete-request': [rowData: Vehicle[]];
  'export': [format: string, data: any[], columns: any[]];
  'save-changes': [changes: any[]];
}>()

// État local
const isLoading = computed(() => props.loading)
const selectedVehicles = ref<Vehicle[]>([])
const dataTableRef = ref<any>(null)

// Store
const vehicleStore = useVehicleStore()

// Liste des colonnes par défaut à épingler
const defaultPinnedColumns = ['vehicle_status', 'brand', 'model', 'version', 'year', 'mileage', 'color']

// Méthode pour épingler/désépingler les colonnes par défaut
const toggleDefaultColumns = () => {
  if (dataTableRef.value?.table) {
    if (hasDefaultColumnsPinned.value) {
      // Désépingler toutes les colonnes
      dataTableRef.value.table.setColumnPinning({
        left: [],
        right: []
      })
      hasDefaultColumnsPinned.value = false
    } else {
      // Épingler les colonnes par défaut
      dataTableRef.value.table.setColumnPinning({
        left: defaultPinnedColumns,
        right: []
      })
      hasDefaultColumnsPinned.value = true
    }
  }
}

// Méthode pour épingler les colonnes par défaut (maintenue pour compatibilité)
const pinDefaultColumns = () => {
  if (dataTableRef.value?.table) {
    dataTableRef.value.table.setColumnPinning({
      left: defaultPinnedColumns,
      right: []
    })
    hasDefaultColumnsPinned.value = true
  }
}

// Gérer l'événement toggle-fullwidth du DataTable pour synchroniser l'état
function handleToggleFullWidth() {
  isFullScreen.value = !isFullScreen.value
}

// Fonction pour gérer la bascule entre mode lecture et édition
function handleToggleReadOnly() {
  isReadOnly.value = !isReadOnly.value
  console.log('Mode édition basculé, lecture seule:', isReadOnly.value)
}

// Fonction pour gérer la sauvegarde des modifications
function handleSaveChanges(changes: any[]) {
  console.log('Changements à sauvegarder:', changes)
  
  // Version simplifiée pour éviter les erreurs de type
  // Cette partie devra être adaptée selon votre modèle de données exact
  changes.forEach(change => {
    // Identifier l'élément à modifier via rowId
    const rowId = change.rowId
    const columnId = change.columnId
    const newValue = change.value
    
    console.log(`Mise à jour: ligne ${rowId}, colonne ${columnId}, nouvelle valeur:`, newValue)
    
    // Ici, vous pourriez implémenter la mise à jour réelle des données
    // selon la structure de votre store vehicleStore
    // Par exemple:
    // vehicleStore.updateVehicle(rowId, { [columnId]: newValue })
  })
  
  // Émettre l'événement vers le parent
  emit('save-changes', changes)
}

// Fonction pour gérer l'annulation des modifications
function handleCancelChanges() {
  console.log('Modifications annulées')
  // Vous pouvez ajouter ici une logique pour réinitialiser l'UI si nécessaire
}

// Settings par défaut
const defaultSettings = {
  stretchH: 'none',    // Ne pas étirer les colonnes
  autoWrapRow: false,  // Pas de retour à la ligne automatique
  wordWrap: false,     // Pas de retour à la ligne
  rowHeights: 32,      // Hauteur de ligne réduite
  currentRowClassName: 'current-row',
  currentColClassName: 'current-col',
  height: '70vh',
  fixedWidth: true,    // Forcer la largeur fixe des colonnes
  tableLayout: 'fixed' // Utiliser table-layout: fixed
}

// Rendu du statut sous forme de badge
const renderStatus = (status: VehicleStatusEnum) => {
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
  const config = statusConfig[status as keyof typeof statusConfig] || { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inconnu' }
    return `<div class="inline-flex items-center justify-center rounded-full px-2 text-xs ${config.bg} ${config.text}">${config.label}</div>`
}

// Colonne statut qui utilise v-html correctement
const renderStatusCell = (info: any) => {
  const status = info.row.getValue('vehicle_status') as VehicleStatusEnum
  return h('div', { innerHTML: renderStatus(status) })
}

// Colonnes adaptées pour TanStack Table
const tanstackColumns = computed<ColumnDef<any, any>[]>(() => [
  {
    id: 'vehicle_status',
    accessorKey: 'vehicle_status',
    header: 'Statut',
    size: 90,
    enableHiding: true,
    enableSorting: true,
    cell: renderStatusCell
  },
  createEditableColumn({
    accessorKey: 'brand',
    header: 'Marque',
    type: 'text',
    size: 100
  }),
  createEditableColumn({
    accessorKey: 'model',
    header: 'Modèle',
    type: 'text',
    size: 100
  }),
  {
    id: 'version',
    accessorKey: 'version',
    header: 'Version',
    size: 120,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const serie = info.row.getValue('version') as string
      return h(TextWithHoverCard, { text: serie })
    }
  },
  {
    id: 'registration_date',
    accessorKey: 'registration_date',
    header: 'M.E.C',
    size: 90,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const date = info.row.getValue('registration_date')
      if (date) {
        try {
          return format(parseISO(date as string), 'dd/MM/yyyy', { locale: fr })
        } catch {
          return String(date)
        }
      }
      return '-'
    },
  },
  {
    id: 'year',
    accessorKey: 'year',
    header: 'Année',
    size: 70,
    enableHiding: true,
    enableSorting: true,
  },
  createEditableColumn({
    accessorKey: 'mileage',
    header: 'Km',
    type: 'number',
    size: 80,
    format: (value) => value ? `${value} km` : '-'
  }),
  {
    id: 'color',
    accessorKey: 'color',
    header: 'Couleur',
    size: 100,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const serie = info.row.getValue('color') as string
      return h(TextWithHoverCard, { text: serie })
    }
  },
  {
    id: 'fuel_type',
    accessorKey: 'fuel_type',
    header: 'Carburant',
    size: 70,
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: 'transmission',
    accessorKey: 'transmission',
    header: 'Boîte',
    size: 70,
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: 'vin',
    accessorKey: 'vin',
    header: 'VIN',
    size: 90,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const serie = info.row.getValue('vin') as string
      return h(TextWithHoverCard, { text: serie })
    }
  },
  {
    id: 'registration_number',
    accessorKey: 'registration_number',
    header: 'Immat',
    size: 90,
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: 'doors',
    accessorKey: 'doors',
    header: 'Portes',
    size: 70,
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: 'seats',
    accessorKey: 'seats',
    header: 'Places',
    size: 70,
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: 'power_hp',
    accessorKey: 'power_hp',
    header: 'Puissance (ch)',
    size: 90,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const power = info.row.getValue('power_hp')
      return power ? `${power} ch` : '-'
    },
  },
  {
    id: 'power_fiscal',
    accessorKey: 'power_fiscal',
    header: 'CV Fiscaux',
    size: 90,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const power = info.row.getValue('power_fiscal')
      return power ? `${power} cv` : '-'
    },
  },
  {
    id: 'co2_emissions',
    accessorKey: 'co2_emissions',
    header: 'CO2',
    size: 80,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const emissions = info.row.getValue('co2_emissions')
      return emissions ? `${emissions} g/km` : '-'
    },
  },
  {
    id: 'vehicle_price_ht',
    accessorKey: 'vehicle_price_ht',
    header: 'Prix Achat HT',
    size: 100,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const price = info.row.getValue('vehicle_price_ht')
      return price ? `${new Intl.NumberFormat('fr-FR').format(price as number)} €` : '-'
    },
  },
  {
    id: 'vehicle_selling_price_ht',
    accessorKey: 'vehicle_selling_price_ht',
    header: 'Prix Vente HT',
    size: 100,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const price = info.row.getValue('vehicle_selling_price_ht')
      return price ? `${new Intl.NumberFormat('fr-FR').format(price as number)} €` : '-'
    },
  },
  {
    id: 'vehicle_repair_cost',
    accessorKey: 'vehicle_repair_cost',
    header: 'Frais Réparation',
    size: 90,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const cost = info.row.getValue('vehicle_repair_cost')
      return cost ? `${new Intl.NumberFormat('fr-FR').format(cost as number)} €` : '-'
    },
  },
  {
    id: 'vehicle_frevo',
    accessorKey: 'vehicle_frevo',
    header: 'FREVO',
    size: 90,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const frevo = info.row.getValue('vehicle_frevo')
      return frevo ? `${new Intl.NumberFormat('fr-FR').format(frevo as number)} €` : '-'
    },
  },
  {
    id: 'vehicle_location',
    accessorKey: 'vehicle_location',
    header: 'Localisation',
    size: 100,
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: 'vehicle_is_online',
    accessorKey: 'vehicle_is_online',
    header: 'En ligne',
    size: 80,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const isOnline = info.row.getValue('vehicle_is_online')
      return isOnline ? 'Oui' : 'Non'
    },
  },
  {
    id: 'vehicle_serie',
    accessorKey: 'vehicle_serie',
    header: 'Équipements Série',
    size: 200,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const serie = info.row.getValue('vehicle_serie') as string
      return h(TextWithHoverCard, { text: serie })
    },
  },
  {
    id: 'vehicle_options',
    accessorKey: 'vehicle_options',
    header: 'Options',
    size: 200,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const options = info.row.getValue('vehicle_options') as string
      return h(TextWithHoverCard, { text: options })
    },
  },
  {
    id: 'vehicle_ownership',
    accessorKey: 'vehicle_ownership',
    header: 'Propriétaire',
    size: 120,
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 100,
    enableHiding: false,
    enableSorting: false,
    cell: (info) => {
      const vehicle = info.row.original
      return h('div', { class: 'flex justify-center gap-2' }, [
        h('button', { 
          class: 'text-gray-500 hover:text-gray-700',
          title: 'Voir',
          onClick: () => handleViewVehicle(vehicle)
        }, '👁️'),
        h('button', { 
          class: 'text-red-500 hover:text-red-700',
          title: 'Supprimer',
          onClick: () => handleDeleteClick(vehicle)
        }, '🗑️')
      ])
    },
  },
])

// Récupérer les véhicules si pas fournis en prop
async function fetchVehicles() {
  const localLoading = ref(true)
  try {
    await vehicleStore.fetchVehicles()
  } catch (error) {
    console.error('Erreur lors de la récupération des véhicules:', error)
  } finally {
    localLoading.value = false
  }
}

// Données par défaut si pas fournies en prop
const vehiclesData = computed(() => {
  return vehicleStore.vehicles.map(vehicle => ({
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version,
    year: vehicle.year,
    mileage: vehicle.mileage,
    fuel_type: vehicle.fuel_type,
    transmission: vehicle.transmission,
    color: vehicle.color,
    vin: vehicle.vin,
    registration_number: vehicle.registration_number,
    registration_date: vehicle.details?.features?.features?.registration_date,
    doors: vehicle.details?.features?.features?.doors,
    seats: vehicle.details?.features?.features?.seats,
    power_hp: vehicle.details?.features?.features?.power_hp,
    power_fiscal: vehicle.details?.features?.features?.power_fiscal,
    co2_emissions: vehicle.details?.features?.features?.co2_emissions,
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
    // Équipements
    vehicle_serie: vehicle.details?.features?.features?.serie?.join(', ') || '',
    vehicle_options: vehicle.details?.features?.features?.options?.join(', ') || '',
    // Ownership
    vehicle_ownership: vehicle.details?.ownership?.[0]?.company?.name || '',
  }))
})

// Gestion de la sélection
function handleSelection(vehicles: Vehicle[]) {
  selectedVehicles.value = vehicles
  emit('selection', vehicles)
}

// Gestion de la suppression
function handleDeleteRequest(rows: Vehicle[]) {
  emit('delete-request', rows)
}

// Gestion de l'export
function handleExport(format: string, data: any[], columns: any[]) {
  emit('export', format, data, columns)
  console.log(`Export des véhicules au format ${format} - ${data.length} véhicules exportés`)
}

// Gestion du clic sur le bouton de suppression
function handleDeleteClick(vehicle: Vehicle) {
  emit('delete-request', [vehicle])
}

// Gestion du clic sur le bouton de visualisation
function handleViewVehicle(vehicle: Vehicle) {
  // À implémenter si nécessaire
  console.log('Visualisation du véhicule:', vehicle.id)
}

// Initialisation
onMounted(() => {
  // Lors du montage, ajouter une référence au bouton de plein écran pour pouvoir y accéder plus tard
  nextTick(() => {
    if (dataTableRef.value && dataTableRef.value.$el) {
      // Ajouter une classe aux boutons de plein écran pour les identifier facilement
      const fullWidthButton = dataTableRef.value.$el.querySelector('.DataTableSideToolbar button[title*="Pleine largeur"], .DataTableSideToolbar button[title*="Réduire"]');
      if (fullWidthButton) {
        fullWidthButton.classList.add('side-toolbar-fullwidth-button');
      }
    }
  });
  
  if (!props.dataSource) {
    fetchVehicles();
  }
  
  // Épingler les colonnes par défaut après le montage du composant
  setTimeout(() => {
    pinDefaultColumns();
    // Vérifier l'état des colonnes épinglées pour mettre à jour l'indicateur visuel
    if (dataTableRef.value?.table) {
      const pinnedColumns = dataTableRef.value.table.getState().columnPinning?.left || [];
      hasDefaultColumnsPinned.value = pinnedColumns.length > 0;
    }
  }, 100);
})

// Nettoyage des écouteurs au démontage
onUnmounted(() => {
  // Plus d'écouteurs à nettoyer
})
</script>

<style scoped>
/* Styles pour garantir les largeurs fixes */
:deep(table) {
  width: auto !important;
  table-layout: fixed !important;
}

:deep(th),
:deep(td) {
  box-sizing: border-box !important;
  white-space: nowrap !important;
  word-break: break-word !important;
}

:deep(.fixed-width-cell) {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

:deep(.truncate) {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  max-width: 100% !important;
  display: block !important;
}

/* Style pour optimiser l'affichage du tableau */
:deep(.current-row) {
  background-color: rgba(233, 237, 244, 0.4) !important;
}

:deep(.current-col) {
  background-color: rgba(233, 237, 244, 0.2) !important;
}

/* Hover Cards */
:deep(.hover-card-content) {
  z-index: 9999 !important;
}

/* S'assurer que la barre d'outils latérale reste accessible en mode plein écran */
:deep(.full-width-container .absolute.-left-12) {
  left: 0 !important;
  z-index: 60 !important;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 8px 0;
  margin-left: 8px;
}

:deep(.dark .full-width-container .absolute.-left-12) {
  background-color: rgba(17, 24, 39, 0.8);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}
</style> 