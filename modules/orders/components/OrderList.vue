<!--
/**
 * Composant d'affichage de la liste des commandes
 * 
 * Ce composant affiche la liste des commandes sous forme de tableau avec pagination,
 * filtrage et tri. Il permet également d'accéder aux actions disponibles pour chaque commande.
 * 
 * @component
 * 
 * Props:
 * - saleType: Type de vente à filtrer (optionnel, 'ALL' pour toutes les ventes)
 * 
 * Fonctionnalités:
 * - Affichage des commandes dans un tableau paginé
 * - Filtrage par type de vente
 * - Recherche textuelle
 * - Tri par colonnes
 * - Actions contextuelles par commande (voir, modifier, supprimer)
 * - Affichage des statuts avec badges colorés
 * - Formatage des montants et dates
 */
-->

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

    <div v-if="loading" class="h-24 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
    <div v-else-if="error" class="h-24 flex items-center justify-center text-red-600">
      {{ error }}
    </div>
    <div v-else class="rounded-md border">
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
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import type { SaleType, Order, OrderWithRelations, OrderStatus } from '../types'
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
  useVueTable
} from '@tanstack/vue-table'
import { useOrderStore } from '../stores/useOrderStore'
import { formatCurrency, formatDate1 } from '~/utils/formatter'
import { valueUpdater } from '~/utils'
import OrderStatusBadge from './OrderStatusBadge.vue'
import OrderRowActions from './actions/OrderRowActions.vue'
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
import { ChevronDownIcon, ArrowUpDown } from 'lucide-vue-next'

type OrderListProps = {
  saleType: SaleType | 'ALL'
}

const props = defineProps<OrderListProps>()

const store = useOrderStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => h(Button, {
      variant: 'ghost',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    }, () => [ 'N° Commande', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' }) ]),
    cell: ({ row }) => {
      const order = row.original as OrderWithRelations
      return order.orderNumber
    }
  },
  {
    accessorKey: 'orderDate',
    header: ({ column }) => h(Button, {
      variant: 'ghost',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    }, () => [ 'Date', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' }) ]),
    cell: ({ row }) => {
      const order = row.original as OrderWithRelations
      return formatDate1(order.orderDate)
    }
  },
  {
    accessorKey: 'client',
    header: 'Client',
    cell: ({ row }) => {
      const order = row.original as OrderWithRelations
      if (order.saleType === 'B2C' && order.contact) {
        return order.contact.name
      } else if (order.buyerCompany) {
        return order.buyerCompany.name
      }
      return '-'
    }
  },
  {
    accessorKey: 'articles',
    header: 'Articles',
    cell: ({ row }) => {
      const order = row.original as OrderWithRelations
      const items = order.items || []
      const count = items.length
      return count > 0 ? `${count} article${count > 1 ? 's' : ''}` : '-'
    }
  },
  {
    accessorKey: 'totalHt',
    header: () => h('div', { class: 'text-right' }, 'Total HT'),
    cell: ({ row }) => {
      const order = row.original as OrderWithRelations
      return h('div', { class: 'text-right font-medium' }, formatCurrency(order.totalHt || 0))
    }
  },
  {
    accessorKey: 'totalTva',
    header: () => h('div', { class: 'text-right' }, 'TVA'),
    cell: ({ row }) => {
      const order = row.original as OrderWithRelations
      return h('div', { class: 'text-right text-gray-600' }, formatCurrency(order.totalTva || 0))
    }
  },
  {
    accessorKey: 'totalTtc',
    header: () => h('div', { class: 'text-right font-bold' }, 'Total TTC'),
    cell: ({ row }) => {
      const order = row.original as OrderWithRelations
      return h('div', { class: 'text-right' }, formatCurrency(order.totalTtc || 0))
    }
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const order = row.original as OrderWithRelations
      return h(OrderStatusBadge, { status: order.status })
    }
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => h(OrderRowActions, { order: row.original })
  }
]

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})

const table = useVueTable({
  data: computed(() => {
    console.log('Computed data appelé')
    const orders = store.getOrdersByType(props.saleType)
    console.log('Orders filtrés:', orders)
    return orders
  }),
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

const loadOrders = async () => {
  console.log('loadOrders appelé')
  try {
    await store.fetchOrders()
    console.log('Orders chargés:', store.orders)
  } catch (e) {
    console.error('Erreur dans loadOrders:', e)
  }
}

let refreshTimer: any

onMounted(async () => {
  console.log('OrderList monté')
  await loadOrders()
  refreshTimer = setInterval(loadOrders, 30000)
})

onUnmounted(() => {
  console.log('OrderList démonté')
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>