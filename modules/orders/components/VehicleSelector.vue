<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-[95vw] w-[1400px] h-[80vh] flex flex-col p-0 gap-0">
      <DialogHeader class="px-6 py-4 border-b">
        <DialogTitle>Sélection des véhicules</DialogTitle>
        <DialogDescription>
          Sélectionnez les véhicules à ajouter à la commande
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b">
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <Input
                v-model="search"
                placeholder="Rechercher un véhicule..."
                type="search"
              >
                <template #prefix>
                  <Search class="h-4 w-4" />
                </template>
              </Input>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-auto px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[40px] text-xs">
                  <div class="px-1">
                    <Checkbox
                      :checked="isAllSelected"
                      :indeterminate="isIndeterminate"
                      @click="toggleAll"
                    />
                  </div>
                </TableHead>
                <TableHead class="text-xs">Référence</TableHead>
                <TableHead class="text-xs">Marque</TableHead>
                <TableHead class="text-xs">Modèle</TableHead>
                <TableHead class="text-xs">Version</TableHead>
                <TableHead class="text-xs">Couleur</TableHead>
                <TableHead class="text-xs">VIN</TableHead>
                <TableHead class="text-xs">Immat.</TableHead>
                <TableHead class="text-xs whitespace-nowrap">KM</TableHead>
                <TableHead class="text-xs whitespace-nowrap">Prix Achat</TableHead>
                <TableHead class="text-xs whitespace-nowrap">Prix Vente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="vehicle in filteredVehicles"
                :key="vehicle.id"
                class="text-xs hover:bg-muted/50 cursor-pointer"
              >
                <TableCell class="py-2">
                  <div class="px-1">
                    <Checkbox
                      :checked="isSelected(vehicle)"
                      @click.stop="toggleVehicle(vehicle)"
                    />
                  </div>
                </TableCell>
                <TableCell class="py-2" @click="toggleVehicle(vehicle)">{{ vehicle.internal_id }}</TableCell>
                <TableCell class="py-2" @click="toggleVehicle(vehicle)">{{ vehicle.brand }}</TableCell>
                <TableCell class="py-2" @click="toggleVehicle(vehicle)">{{ vehicle.model }}</TableCell>
                <TableCell class="py-2" @click="toggleVehicle(vehicle)">{{ vehicle.version }}</TableCell>
                <TableCell class="py-2" @click="toggleVehicle(vehicle)">{{ vehicle.color }}</TableCell>
                <TableCell class="py-2" @click="toggleVehicle(vehicle)">{{ vehicle.vin }}</TableCell>
                <TableCell class="py-2" @click="toggleVehicle(vehicle)">{{ vehicle.registration_number }}</TableCell>
                <TableCell class="py-2" @click="toggleVehicle(vehicle)">{{ vehicle.mileage?.toLocaleString() }}</TableCell>
                <TableCell class="py-2" @click="toggleVehicle(vehicle)">{{ formatCurrency(vehicle.vehicle_prices?.purchase_price_ht) }}</TableCell>
                <TableCell class="py-2" @click="toggleVehicle(vehicle)">{{ formatCurrency(vehicle.vehicle_prices?.selling_price_ht) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <DialogFooter class="px-6 py-4 border-t">
        <Button variant="outline" @click="close">
          Annuler
        </Button>
        <Button
          type="submit"
          :disabled="selectedVehicles.length === 0"
          @click="confirm"
        >
          Ajouter ({{ selectedVehicles.length }})
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search } from 'lucide-vue-next'
import type { Vehicle } from '../types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  Input,
  Checkbox
} from '#components'
import { formatCurrency } from '~/utils/formatter'

const props = defineProps<{
  modelValue: boolean
  vehicles: Vehicle[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', vehicles: Vehicle[]): void
}>()

const search = ref('')
const selectedVehicles = ref<Vehicle[]>([])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredVehicles = computed(() => {
  let vehicles = props.vehicles
  
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    vehicles = vehicles.filter((vehicle: Vehicle) => 
      vehicle.internal_id.toLowerCase().includes(searchLower) ||
      vehicle.brand.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower) ||
      vehicle.version?.toLowerCase().includes(searchLower) ||
      vehicle.vin?.toLowerCase().includes(searchLower) ||
      vehicle.registration_number?.toLowerCase().includes(searchLower)
    )
  }
  
  return vehicles
})

const isAllSelected = computed(() => {
  const result = filteredVehicles.value.length > 0 && 
    filteredVehicles.value.every(vehicle => isSelected(vehicle))
  return result
})

const isIndeterminate = computed(() => {
  const result = selectedVehicles.value.length > 0 && !isAllSelected.value
  return result
})

const isSelected = (vehicle: Vehicle) => {
  const result = selectedVehicles.value.some(v => v.id === vehicle.id)
  return result
}

const toggleVehicle = (vehicle: Vehicle) => {
  const index = selectedVehicles.value.findIndex(v => v.id === vehicle.id)
  if (index === -1) {
    selectedVehicles.value = [...selectedVehicles.value, vehicle]
  } else {
    selectedVehicles.value = selectedVehicles.value.filter(v => v.id !== vehicle.id)
  }
}

const toggleAll = () => {
  if (isAllSelected.value) {
    selectedVehicles.value = []
  } else {
    selectedVehicles.value = [...filteredVehicles.value]
  }
}

const confirm = () => {
  emit('select', selectedVehicles.value)
  close()
}

const close = () => {
  isOpen.value = false
  selectedVehicles.value = []
  search.value = ''
}
</script> 