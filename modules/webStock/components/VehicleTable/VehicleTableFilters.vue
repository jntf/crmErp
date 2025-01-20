# components/VehicleTable/VehicleTableFilters.vue
<template>
  <div class="space-y-4">
    <!-- Barre de filtres supérieure -->
    <div class="flex items-center space-x-4 flex-wrap gap-y-2">
      <!-- Recherche -->
      <div class="relative flex-grow max-w-md">
        <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Rechercher un véhicule..." class="pl-8" />
      </div>

      <!-- Sélecteur de liste prédéfinie -->
      <Select v-model="selectedList">
        <SelectTrigger class="w-[200px]">
          <SelectValue placeholder="Sélectionner une liste" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="list in predefinedLists" :key="list.id" :value="list.id">
            {{ list.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Sélecteur de sources -->
      <Select v-model="selectedSource">
        <SelectTrigger class="w-[200px]">
          <SelectValue placeholder="Source des véhicules" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="source in sources" :key="source.id" :value="source.id">
            {{ source.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Sélecteur de date -->
      <Popover>
        <PopoverTrigger as-child>
          <Button variant="outline" class="w-[250px] justify-start text-left font-normal">
            <CalendarIcon class="mr-2 h-4 w-4" />
            <span v-if="dateRange.from">
              {{ formatDate(dateRange.from) }} -
              {{ dateRange.to ? formatDate(dateRange.to) : '...' }}
            </span>
            <span v-else>Sélectionner une période</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" align="start">
          <Calendar
            v-model="dateRange"
            mode="range"
            :numberOfMonths="2"
            class="rounded-md border"
          />
        </PopoverContent>
      </Popover>

      <!-- Filtre de colonnes -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline">
            <TableIcon class="mr-2 h-4 w-4" />
            Colonnes
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-[200px]">
          <DropdownMenuLabel>Colonnes affichées</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            v-for="column in availableColumns"
            :key="column.id"
            :checked="selectedColumns.includes(column.id)"
            @update:checked="toggleColumn(column.id)"
          >
            {{ column.label }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Plus de filtres -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline">
            <SlidersHorizontal class="mr-2 h-4 w-4" />
            Filtres
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuLabel>Filtres additionnels</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div class="p-2 space-y-4">
            <!-- Photos -->
            <div class="flex items-center space-x-2">
              <Checkbox v-model="withPhotos" id="photos" />
              <label for="photos" class="text-sm font-medium">
                Avec photos uniquement
              </label>
            </div>
            <!-- Prix -->
            <div class="space-y-2">
              <label class="text-sm font-medium">Plage de prix</label>
              <div class="flex gap-2">
                <Input 
                  v-model="priceRange.min" 
                  type="number" 
                  placeholder="Min" 
                  class="w-24"
                />
                <span class="text-muted-foreground">-</span>
                <Input 
                  v-model="priceRange.max" 
                  type="number" 
                  placeholder="Max" 
                  class="w-24"
                />
              </div>
            </div>
            <!-- Kilométrage -->
            <div class="space-y-2">
              <label class="text-sm font-medium">Kilométrage</label>
              <div class="flex gap-2">
                <Input 
                  v-model="mileageRange.min" 
                  type="number" 
                  placeholder="Min" 
                  class="w-24"
                />
                <span class="text-muted-foreground">-</span>
                <Input 
                  v-model="mileageRange.max" 
                  type="number" 
                  placeholder="Max" 
                  class="w-24"
                />
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Badges des filtres actifs -->
    <div class="flex flex-wrap gap-2">
      <Badge 
        v-if="withPhotos" 
        variant="secondary" 
        class="flex items-center gap-1"
      >
        Avec photos
        <XCircle 
          class="h-4 w-4 ml-1 cursor-pointer" 
          @click="withPhotos = false"
        />
      </Badge>

      <Badge 
        v-if="dateRange.from" 
        variant="secondary" 
        class="flex items-center gap-1"
      >
        Période: {{ formatDate(dateRange.from) }} 
        {{ dateRange.to ? `- ${formatDate(dateRange.to)}` : '' }}
        <XCircle 
          class="h-4 w-4 ml-1 cursor-pointer" 
          @click="dateRange = { from: null, to: null }"
        />
      </Badge>

      <Badge 
        v-if="priceRange.min || priceRange.max" 
        variant="secondary" 
        class="flex items-center gap-1"
      >
        Prix: {{ priceRange.min || '0' }}€ - {{ priceRange.max || '∞' }}€
        <XCircle 
          class="h-4 w-4 ml-1 cursor-pointer" 
          @click="priceRange = { min: null, max: null }"
        />
      </Badge>

      <Badge 
        v-if="mileageRange.min || mileageRange.max" 
        variant="secondary" 
        class="flex items-center gap-1"
      >
        Km: {{ mileageRange.min || '0' }} - {{ mileageRange.max || '∞' }}
        <XCircle 
          class="h-4 w-4 ml-1 cursor-pointer" 
          @click="mileageRange = { min: null, max: null }"
        />
      </Badge>
    </div>

    <!-- DataTable -->
    <Card class="p-0">
      <DataTable 
        :table-data="filteredVehicles"
        :table-columns="visibleColumns"
        :table-settings="tableSettings"
        :cell-renderers="cellRenderers"
        :toolbar-config="toolbarConfig"
        :loading-state="loading"
        @change="handleChange"
        @selection="handleSelection"
        @export="handleExport"
      />
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Search,
  CalendarIcon,
  TableIcon,
  SlidersHorizontal,
  XCircle
} from 'lucide-vue-next'

// États
const searchQuery = ref('')
const selectedList = ref('all')
const selectedSource = ref('')
const dateRange = ref({ from: null, to: null })
const withPhotos = ref(false)
const selectedColumns = ref(['source', 'id', 'brand', 'model', 'version', 'mileage', 'price'])
const priceRange = ref({ min: null, max: null })
const mileageRange = ref({ min: null, max: null })

const vehicles = ref('')

// Données statiques
const predefinedLists = [
  { id: 'all', label: 'Tous les véhicules' },
  { id: 'published', label: 'Véhicules publiés' },
  { id: 'new', label: 'Véhicules neufs (<100km)' },
  { id: 'used', label: 'Véhicules occasion' }
]

const sources = [
  { id: 'autoscout', label: 'AutoScout24' },
  { id: 'lacentrale', label: 'La Centrale' },
  { id: 'manual', label: 'Saisie manuelle' }
]

const availableColumns = [
  { id: 'source', label: 'Source' },
  { id: 'id', label: 'ID' },
  { id: 'brand', label: 'Marque' },
  { id: 'model', label: 'Modèle' },
  { id: 'version', label: 'Version' },
  { id: 'mileage', label: 'Kilométrage' },
  { id: 'color', label: 'Couleur' },
  { id: 'registration_date', label: 'Date MEC' },
  { id: 'price', label: 'Prix' },
  { id: 'repair_cost', label: 'Frais' }
]

// Computed properties
const visibleColumns = computed(() => {
  return availableColumns.filter(col => selectedColumns.value.includes(col.id))
})

const filteredVehicles = computed(() => {
  let filtered = [...vehicles.value]

  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(vehicle => 
      vehicle.brand.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query) ||
      vehicle.version.toLowerCase().includes(query)
    )
  }

  // Filtre par liste prédéfinie
  if (selectedList.value === 'new') {
    filtered = filtered.filter(v => v.mileage < 100)
  } else if (selectedList.value === 'published') {
    filtered = filtered.filter(v => v.isPublished)
  } else if (selectedList.value === 'used') {
    filtered = filtered.filter(v => v.mileage >= 100)
  }

  // Filtre par source
  if (selectedSource.value) {
    filtered = filtered.filter(v => v.source === selectedSource.value)
  }

  // Filtre par photos
  if (withPhotos.value) {
    filtered = filtered.filter(v => v.photoCount > 0)
  }

  // Filtre par date
  if (dateRange.value.from) {
    filtered = filtered.filter(v => {
      const vDate = new Date(v.registration_date)
      return vDate >= dateRange.value.from && 
        (!dateRange.value.to || vDate <= dateRange.value.to)
    })
  }

  // Filtre par prix
  if (priceRange.value.min || priceRange.value.max) {
    filtered = filtered.filter(v => {
      const price = v.base_price
      return (!priceRange.value.min || price >= priceRange.value.min) &&
        (!priceRange.value.max || price <= priceRange.value.max)
    })
  }

  // Filtre par kilométrage
  if (mileageRange.value.min || mileageRange.value.max) {
    filtered = filtered.filter(v => {
      return (!mileageRange.value.min || v.mileage >= mileageRange.value.min) &&
        (!mileageRange.value.max || v.mileage <= mileageRange.value.max)
    })
  }

  return filtered
})

// Méthodes
const formatDate = (date: Date) => {
  return format(date, 'dd/MM/yyyy', { locale: fr })
}

const toggleColumn = (columnId: string) => {
  const index = selectedColumns.value.indexOf(columnId)
  if (index === -1) {
    selectedColumns.value.push(columnId)
  } else {
    selectedColumns.value.splice(index, 1)
  }
}

const handleChange = (changes: Array<[number, string, any, any]>) => {
  console.log('Modifications:', changes)
}

const handleSelection = (selected: any) => {
  emit('update:selectedVehicles', selected)
}

const handleExport = (format: string) => {
  // Logique d'export
}

// Configuration du tableau
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
  manualColumnResize: true,
  fixedRowsTop: 1,
  fixedColumnsLeft: 2,
  renderAllRows: false,
  viewportRowRenderingOffset: 20,
  rowHeaders: true,
}

// Props et Emits
const props = defineProps<{
  vehicles: any[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedVehicles', vehicles: any[]): void
}>()
</script>

<style scoped>
.datatable-wrapper {
  @apply rounded-lg border bg-card text-card-foreground shadow-sm;
}
</style>