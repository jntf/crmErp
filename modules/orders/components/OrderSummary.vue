<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-base font-semibold">Récapitulatif</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex justify-between items-center text-sm">
        <span class="text-muted-foreground">Total HT</span>
        <span class="font-medium">{{ formatCurrency(totalHT) }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-muted-foreground">TVA</span>
        <span class="font-medium">{{ formatCurrency(totalTVA) }}</span>
      </div>
      <Separator />
      <div class="flex justify-between items-center">
        <span class="font-medium">Total TTC</span>
        <span class="text-lg font-bold">{{ formatCurrency(totalTTC) }}</span>
      </div>
      <template v-if="displayMargin">
        <div class="flex justify-between items-center text-sm">
          <span class="text-muted-foreground">Marge brute</span>
          <span class="font-medium">{{ formatCurrency(totalMargin) }}</span>
        </div>
        <template v-if="showCommissions">
          <div class="flex justify-between items-center text-sm">
            <span class="text-muted-foreground">Total commissions</span>
            <span class="font-medium">{{ formatCurrency(totalCommissions) }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-muted-foreground">Marge nette</span>
            <span class="font-medium">{{ formatCurrency(netMargin) }}</span>
          </div>
        </template>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '~/utils/formatter'
import type { OrderItem, VehicleCommission } from '../types'
import { useOrderCalculations } from '../composables/useOrderCalculations'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Separator
} from '#components'

const props = defineProps<{
  items: OrderItem[]
  commissions: VehicleCommission[]
  displayMargin?: boolean
}>()

const {
  totalHT,
  totalTVA,
  totalTTC,
  totalMargin,
  totalCommissions,
  netMargin
} = useOrderCalculations(
  computed(() => props.items),
  computed(() => props.commissions || [])
)

const showCommissions = computed(() => 
  props.commissions && props.commissions.length > 0
)
</script>

<OrderTotals
  :items="items"
  :display-margin="displayMargin"
/> 