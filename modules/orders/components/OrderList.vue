<template>
  <div class="w-full">
    <div class="flex items-center py-4">
      <Input class="max-w-sm" placeholder="Rechercher une commande..."
        :model-value="table.getColumn('orderNumber')?.getFilterValue() as string"
        @update:model-value="table.getColumn('orderNumber')?.setFilterValue($event)" />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="ml-auto">
            Colonnes
            <ChevronDownIcon class="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem v-for="column in table.getAllColumns().filter(column => column.getCanHide())"
            :key="column.id" class="capitalize" :checked="column.getIsVisible()"
            @update:checked="value => column.toggleVisibility(!!value)">
            {{ column.id }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header"
                :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow v-for="row in table.getRowModel().rows" :key="row.id"
              :data-state="row.getIsSelected() && 'selected'">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              Aucun résultat.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="flex-1 text-sm text-muted-foreground">
        {{ table.getFilteredSelectedRowModel().rows.length }} sur
        {{ table.getFilteredRowModel().rows.length }} ligne(s) sélectionnée(s).
      </div>
      <div class="space-x-2">
        <Button variant="outline" size="sm" :disabled="!table.getCanPreviousPage()" @click="table.previousPage()">
          Précédent
        </Button>
        <Button variant="outline" size="sm" :disabled="!table.getCanNextPage()" @click="table.nextPage()">
          Suivant
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SaleType, Order } from '../types'
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState
} from '@tanstack/vue-table'
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { useOrderStore } from '../stores/useOrderStore'
import { formatCurrency } from '~/utils/formatter'
import { formatDate } from '~/utils/formatter'
import { valueUpdater } from '~/utils'
import OrderStatusBadge from './OrderStatusBadge.vue'
import OrderRowActions from './actions/OrderRowActions.vue'
import OrderActions from './actions/OrderActions.vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
// import { ChevronDownIcon, CaretSortIcon } from '@radix-icons/vue'
import { ChevronDownIcon, ArrowUpDown } from 'lucide-vue-next'

const props = defineProps<{
  saleType: SaleType
}>()

const store = useOrderStore()
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['N° Commande', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
    },
    cell: ({ row }) => {
      return h(NuxtLink, {
        to: '/orders/' + row.original.id,
        class: 'text-blue-600 hover:text-blue-800'
      }, () => row.getValue('orderNumber'))
    }
  },
  {
    accessorKey: 'orderDate',
    header: ({ column }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['Date', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
    },
    cell: ({ row }) => formatDate(row.getValue('orderDate'))
  },
  {
    accessorKey: 'totalTtc',
    header: () => h('div', { class: 'text-right' }, 'Total TTC'),
    cell: ({ row }) => h('div', { class: 'text-right' }, formatCurrency(row.getValue('totalTtc')))
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => h(OrderStatusBadge, { status: row.getValue('status') })
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => h(OrderRowActions, { order: row.original })
  }
]

const filteredOrders = computed(() => {
  return store.getOrdersByType(props.saleType)
})

const table = useVueTable({
  data: filteredOrders.value,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value }
  }
})

onMounted(async () => {
  await store.fetchOrders()
})
</script>