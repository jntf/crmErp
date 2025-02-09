<template>
  <div class="space-y-4">
    <DataTable
      :table-data="filteredOrders"
      :table-columns="columns"
      :loading="loading"
      :searchable="true"
      :sortable="true"
    >
      <template #toolbar>
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <Input
              v-model="search"
              placeholder="Rechercher une commande..."
              type="search"
            >
              <template #prefix>
                <Icon name="heroicons:magnifying-glass" class="w-5 h-5" />
              </template>
            </Input>
          </div>
          <OrderActions />
        </div>
      </template>

      <template #cell-orderNumber="{ row }">
        <NuxtLink
          :to="'/orders/' + row.id"
          class="text-blue-600 hover:text-blue-800"
        >
          {{ row.orderNumber }}
        </NuxtLink>
      </template>

      <template #cell-orderDate="{ row }">
        {{ formatDate(row.orderDate) }}
      </template>

      <template #cell-totalTtc="{ row }">
        {{ formatCurrency(row.totalTtc) }}
      </template>

      <template #cell-status="{ row }">
        <OrderStatusBadge :status="row.status" />
      </template>

      <template #cell-actions="{ row }">
        <OrderRowActions :order="row" />
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { SaleType, Order } from '../types'
import type { Column } from '../types/datatable'
import { useOrderStore } from '../stores/useOrderStore'
import { formatCurrency } from '~/utils/format'
import { formatDate } from '~/utils/formatter'
import OrderStatusBadge from './OrderStatusBadge.vue'
import OrderRowActions from './actions/OrderRowActions.vue'
import OrderActions from './actions/OrderActions.vue'
import { DataTable, Input } from '#components'

const props = defineProps<{
  saleType: SaleType
}>()

const store = useOrderStore()
const search = ref('')
const loading = computed(() => store.loading)

const columns: Column[] = [
  { 
    data: 'orderNumber',
    title: 'N° Commande',
    sortable: true
  },
  {
    data: 'orderDate',
    title: 'Date',
    sortable: true
  },
  {
    data: 'totalTtc',
    title: 'Total TTC',
    sortable: true,
    align: 'right'
  },
  {
    data: 'status',
    title: 'Statut',
    sortable: true,
    align: 'center'
  },
  {
    data: 'actions',
    title: 'Actions',
    sortable: false,
    align: 'center',
    width: 100
  }
]

const filteredOrders = computed(() => {
  let orders = store.getOrdersByType(props.saleType)
  
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    orders = orders.filter(order => 
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower)
    )
  }
  
  return orders
})

onMounted(async () => {
  await store.fetchOrders()
})
</script> 