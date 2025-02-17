<template>
  <Card>
    <CardHeader class="flex justify-between items-center">
      <CardTitle class="text-base font-semibold">Véhicules</CardTitle>
      <Button type="button" variant="outline" size="sm" @click="openVehicleSelector">
        <PlusIcon class="h-4 w-4 mr-2" />
        Ajouter
      </Button>
    </CardHeader>
    <CardContent class="p-0">
      <Table>
        <TableHeader>
          <TableRow class="bg-muted/50 hover:bg-muted/50">
            <TableHead class="text-xs font-medium">Référence</TableHead>
            <TableHead class="text-xs font-medium">Désignation</TableHead>
            <TableHead class="text-xs font-medium w-24 text-center">Quantité</TableHead>
            <TableHead class="text-xs font-medium w-32 text-right">Prix d'achat HT</TableHead>
            <TableHead class="text-xs font-medium w-32 text-right">Prix de vente HT</TableHead>
            <TableHead class="text-xs font-medium w-24 text-center">TVA</TableHead>
            <TableHead class="text-xs font-medium w-32 text-right">Total TTC</TableHead>
            <TableHead class="text-xs font-medium w-32 text-right">Marge</TableHead>
            <TableHead class="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="(item, index) in modelValue" :key="item.vehicleId" class="text-xs">
            <TableCell>{{ item.vehicle?.internal_id }}</TableCell>
            <TableCell>
              {{ item.vehicle?.brand }} {{ item.vehicle?.model }} {{ item.vehicle?.version }}
              <div class="text-xs text-muted-foreground">
                {{ item.vehicle?.color }} - {{ item.vehicle?.vin }}
              </div>
            </TableCell>
            <TableCell class="text-center">
              <Input 
                v-model.number="item.quantity" 
                type="number" 
                min="1" 
                class="w-16 h-8 text-xs text-center"
                @input="updateItem(index)" 
              />
            </TableCell>
            <TableCell class="text-right font-medium">
              {{ formatCurrency(item.purchasePriceHt) }}
            </TableCell>
            <TableCell class="text-right">
              <Input 
                v-model.number="item.sellingPriceHt" 
                type="number" 
                min="0" 
                step="0.01"
                class="w-24 h-8 text-xs text-right" 
                @input="updateItem(index)" 
              />
            </TableCell>
            <TableCell class="text-center">
              <Input 
                v-model.number="item.tvaRate" 
                type="number" 
                min="0" 
                max="100" 
                step="0.1"
                class="w-16 h-8 text-xs text-center" 
                @input="updateItem(index)" 
              />
            </TableCell>
            <TableCell class="text-right font-medium">
              {{ formatCurrency(getItemTotals(item).totalTtc) }}
            </TableCell>
            <TableCell class="text-right font-medium">
              {{ formatCurrency(getItemTotals(item).margin) }}
            </TableCell>
            <TableCell>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                class="h-8 w-8" 
                @click="removeItem(index)"
              >
                <Trash2Icon class="h-4 w-4 text-red-500" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  <VehicleSelector 
    v-model="showVehicleSelectorDialog" 
    :vehicles="vehicles" 
    @select="addVehicles" 
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusIcon, Trash2Icon } from 'lucide-vue-next'
import { formatCurrency } from '~/utils/formatter'
import type { OrderItem, Vehicle } from '../types'
import { useOrderCalculations } from '../composables/useOrderCalculations'
import VehicleSelector from './VehicleSelector.vue'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  Input
} from '#components'

const props = defineProps<{
  modelValue: OrderItem[]
  vehicles: Vehicle[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: OrderItem[]]
}>()

const showVehicleSelectorDialog = ref(false)

// Utilisation du composable pour les calculs
const { calculateItemTotals } = useOrderCalculations(ref(props.modelValue))

const getItemTotals = (item: OrderItem) => {
  return calculateItemTotals(item)
}

const updateItem = (index: number) => {
  const items = [...props.modelValue]
  const item = items[index]
  if (!item) return

  const totals = calculateItemTotals(item)
  item.totalHt = totals.totalHt
  item.totalTva = totals.totalTva
  item.totalTtc = totals.totalTtc

  emit('update:modelValue', items)
}

const removeItem = (index: number) => {
  const items = [...props.modelValue]
  items.splice(index, 1)
  emit('update:modelValue', items)
}

const openVehicleSelector = () => {
  showVehicleSelectorDialog.value = true
}

const addVehicles = (selectedVehicles: Vehicle[]) => {
  const items = [...props.modelValue]

  selectedVehicles.forEach(vehicle => {
    if (!items.some(item => item.vehicleId === vehicle.id)) {
      items.push({
        id: 0,
        orderId: 0,
        vehicleId: vehicle.id,
        vehicleInternalId: vehicle.internal_id,
        quantity: 1,
        purchasePriceHt: vehicle.vehicle_prices?.purchase_price_ht || 0,
        unitPriceHt: vehicle.vehicle_prices?.selling_price_ht || 0,
        sellingPriceHt: vehicle.vehicle_prices?.selling_price_ht || 0,
        tvaRate: 20,
        totalHt: 0,
        totalTva: 0,
        totalTtc: 0,
        isPaid: false,
        status: 'DRAFT',
        isDelivered: false,
        vehicle
      })
    }
  })

  emit('update:modelValue', items)
}
</script> 