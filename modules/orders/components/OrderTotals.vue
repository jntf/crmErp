<template>
  <Card>
    <CardHeader>
      <CardTitle>Montants</CardTitle>
    </CardHeader>
    <CardContent>
      <dl class="grid grid-cols-2 gap-4">
        <div>
          <dt class="text-sm font-medium text-gray-500">Total HT</dt>
          <dd class="mt-1 text-2xl font-semibold">
            {{ formatCurrency(totalHt) }}
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">TVA</dt>
          <dd class="mt-1 text-2xl font-semibold">
            {{ formatCurrency(totalTva) }}
          </dd>
        </div>
        <div class="col-span-2">
          <dt class="text-sm font-medium text-gray-500">Total TTC</dt>
          <dd class="mt-1 text-3xl font-bold text-primary">
            {{ formatCurrency(totalTtc) }}
          </dd>
        </div>

        <!-- Affichage de la marge uniquement si displayMargin est true -->
        <template v-if="displayMargin">
          <div class="col-span-2 mt-4 pt-4 border-t">
            <dt class="text-sm font-medium text-gray-500">Marge</dt>
            <dd class="mt-1 text-2xl font-semibold text-success">
              {{ formatCurrency(margin) }}
            </dd>
          </div>
        </template>
      </dl>

      <div v-if="showDetails" class="mt-6 border-t pt-4">
        <h4 class="font-medium mb-2">Détail TVA</h4>
        <div class="space-y-2">
          <div
            v-for="(total, rate) in tvaTotals"
            :key="rate"
            class="flex justify-between text-sm"
          >
            <span>TVA {{ rate }}%</span>
            <span>{{ formatCurrency(total) }}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OrderItem } from '../types'
import { formatCurrency } from '~/utils/formatter'
import { Card, CardHeader, CardTitle, CardContent } from '#components'

const props = defineProps<{
  items: OrderItem[]
  showDetails?: boolean
  displayMargin?: boolean // Nouvelle prop pour contrôler l'affichage de la marge
}>()

const totalHt = computed(() => {
  return props.items.reduce((sum, item) => sum + item.totalHt, 0)
})

const totalTva = computed(() => {
  return props.items.reduce((sum, item) => sum + item.totalTva, 0)
})

const totalTtc = computed(() => {
  return totalHt.value + totalTva.value
})

// Calcul de la marge uniquement si nécessaire
const margin = computed(() => {
  if (!props.displayMargin) return 0
  return props.items.reduce((sum, item) => {
    const purchasePrice = item.purchasePriceHt * item.quantity
    const sellingPrice = item.sellingPriceHt * item.quantity
    return sum + (sellingPrice - purchasePrice)
  }, 0)
})

const tvaTotals = computed(() => {
  const totals: Record<string, number> = {}
  
  props.items.forEach(item => {
    const rate = item.tvaRate.toString()
    totals[rate] = (totals[rate] || 0) + item.totalTva
  })
  
  return totals
})
</script> 