<template>
  <div>
    <DataTable
      :columns="tanstackColumns"
      :data="dataSource || vehiclesData"
      :loadingState="props.loadingState || isLoading"
      :pagination="props.pagination !== undefined ? props.pagination : true"
      :searchable="true"
      :columnToggle="props.columnToggle !== undefined ? props.columnToggle : true"
      :columnPinning="true"
      :rowSelection="true"
      :pageSizes="[25, 50, 100, 500]"
      :tableSettings="defaultSettings"
      @selection="handleSelection"
      @delete-request="handleDeleteRequest"
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
      
      <template #toolbar-end>
        <Button 
          variant="outline" 
          size="sm"
          @click="pinDefaultColumns"
          class="mr-2"
          title="Épingler les colonnes principales (Statut, Marque, Modèle)"
        >
          <Pin class="w-4 h-4 mr-2" />
          Colonnes par défaut
        </Button>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, onUnmounted } from 'vue'
import { DataTable } from '@/components/DataTable'
import type { ColumnDef } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import { useVehicleStore } from '../stores/useVehicleStore'
import { VehicleStatusEnum } from '../types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Vehicle } from '../types'
import TextWithHoverCard from './TextWithHoverCard.vue'
import { Pin } from 'lucide-vue-next'

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
}>()

// État local
const isLoading = computed(() => props.loading)
const selectedVehicles = ref<Vehicle[]>([])
const dataTableRef = ref<any>(null)

// Store
const vehicleStore = useVehicleStore()

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
  {
    id: 'brand',
    accessorKey: 'brand',
    header: 'Marque',
    size: 100,
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: 'model',
    accessorKey: 'model',
    header: 'Modèle',
    size: 100,
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: 'version',
    accessorKey: 'version',
    header: 'Version',
    size: 120,
    enableHiding: true,
    enableSorting: true,
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
  {
    id: 'mileage',
    accessorKey: 'mileage',
    header: 'Kilométrage',
    size: 80,
    enableHiding: true,
    enableSorting: true,
    cell: (info) => {
      const mileage = info.row.getValue('mileage')
      return mileage ? `${mileage} km` : '-'
    },
  },
  {
    id: 'color',
    accessorKey: 'color',
    header: 'Couleur',
    size: 80,
    enableHiding: true,
    enableSorting: true,
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
    size: 130,
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: 'registration_number',
    accessorKey: 'registration_number',
    header: 'Immatriculation',
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

// Gestion du clic sur le bouton de suppression
function handleDeleteClick(vehicle: Vehicle) {
  emit('delete-request', [vehicle])
}

// Gestion du clic sur le bouton de visualisation
function handleViewVehicle(vehicle: Vehicle) {
  // À implémenter si nécessaire
  console.log('Visualisation du véhicule:', vehicle.id)
}

// Méthode pour épingler les colonnes par défaut
const pinDefaultColumns = () => {
  if (dataTableRef.value?.table) {
    dataTableRef.value.table.setColumnPinning({
      left: ['vehicle_status', 'brand', 'model'],
      right: []
    })
  }
}

// Initialisation
onMounted(() => {
  if (!props.dataSource) {
    fetchVehicles()
  }
  
  // Épingler les colonnes par défaut après le montage du composant
  setTimeout(pinDefaultColumns, 100)
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
</style> 