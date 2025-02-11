<template>
  <Card>
    <CardHeader class="flex justify-between items-center">
      <CardTitle>Véhicules</CardTitle>
      <Button
        type="button"
        variant="outline"
        size="sm"
        @click="showVehicleSelector = true"
      >
        <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
        Ajouter
      </Button>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Référence</TableHead>
            <TableHead>Désignation</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Prix unitaire HT</TableHead>
            <TableHead>Prix de vente HT</TableHead>
            <TableHead>TVA</TableHead>
            <TableHead>Total TTC</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="(item, index) in modelValue"
            :key="item.vehicleId"
          >
            <TableCell>{{ item.vehicleInternalId }}</TableCell>
            <TableCell>
              {{ item.vehicle?.brand }} {{ item.vehicle?.model }} {{ item.vehicle?.version }}
              <div class="text-xs text-muted-foreground">
                {{ item.vehicle?.color }} - {{ item.vehicle?.vin }}
              </div>
            </TableCell>
            <TableCell class="text-center">
              <Input v-model.number="item.quantity" type="number" min="1" class="w-16 h-8 text-xs text-center"
                @input="updateItemTotals(index)" />
            </TableCell>
            <TableCell class="text-right font-medium">
              {{ formatCurrency(item.purchasePriceHt) }}
            </TableCell>
            <TableCell class="text-right">
              <Input v-model.number="item.sellingPriceHt" type="number" min="0" step="0.01"
                class="w-24 h-8 text-xs text-right" @input="updateItemTotals(index)" />
            </TableCell>
            <TableCell class="text-center">
              <Input v-model.number="item.tvaRate" type="number" min="0" max="100" step="0.1"
                class="w-16 h-8 text-xs text-center" @input="updateItemTotals(index)" />
            </TableCell>
            <TableCell class="text-right font-medium">{{ formatCurrency(item.totalTtc) }}</TableCell>
            <TableCell>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="removeItem(index)"
              >
                <Icon name="heroicons:trash" class="h-4 w-4 text-red-500" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
        <tfoot>
          <tr>
            <td colspan="5" class="text-right font-medium pr-4">Total HT</td>
            <td>{{ formatCurrency(totalHt) }}</td>
            <td></td>
          </tr>
          <tr>
            <td colspan="5" class="text-right font-medium pr-4">TVA</td>
            <td>{{ formatCurrency(totalTva) }}</td>
            <td></td>
          </tr>
          <tr>
            <td colspan="5" class="text-right font-bold pr-4">Total TTC</td>
            <td class="font-bold">{{ formatCurrency(totalTtc) }}</td>
            <td></td>
          </tr>
        </tfoot>
      </Table>
    </CardContent>

    <VehicleSelector
      v-model="showVehicleSelector"
      @select="addVehicles"
    />
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { OrderItem, Vehicle } from '../types'
import { formatCurrency } from '~/utils/formatter'
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
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: OrderItem[]): void
}>()

const showVehicleSelector = ref(false)

const totalHt = computed(() => {
  return props.modelValue.reduce((sum, item) => sum + item.totalHt, 0)
})

const totalTva = computed(() => {
  return props.modelValue.reduce((sum, item) => sum + item.totalTva, 0)
})

const totalTtc = computed(() => {
  return totalHt.value + totalTva.value
})

const updateItemTotals = (index: number) => {
  const items = [...props.modelValue]
  const item = items[index]
  
  if (!item) return

  // Calcul des totaux de l'article
  item.totalHt = item.quantity * item.sellingPriceHt
  item.totalTva = item.totalHt * (item.tvaRate / 100)
  item.totalTtc = item.totalHt + item.totalTva

  emit('update:modelValue', items)
}

const removeItem = (index: number) => {
  const items = [...props.modelValue]
  items.splice(index, 1)
  emit('update:modelValue', items)
}

const addVehicles = (vehicles: Vehicle[]) => {
  const items = [...props.modelValue]
  
  vehicles.forEach(vehicle => {
    // Vérifier si le véhicule n'est pas déjà dans la liste
    if (!items.some(item => item.vehicleId === vehicle.id)) {
      items.push({
        id: 0,
        orderId: 0,
        vehicleId: vehicle.id,
        vehicleInternalId: vehicle.internal_id,
        quantity: 1,
        purchasePriceHt: vehicle.vehicle_prices?.purchase_price_ht || 0,
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

  // Calculer les totaux pour les nouveaux articles
  items.forEach((item, index) => {
    updateItemTotals(index)
  })

  emit('update:modelValue', items)
}
</script> 