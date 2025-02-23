<template>
  <div class="space-y-4">
    <!-- Filtres et options -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Input
          placeholder="Filtrer par n° de commande..."
          class="max-w-sm"
          :model-value="table.getColumn('order_number')?.getFilterValue() as string"
          @update:model-value="table.getColumn('order_number')?.setFilterValue($event)"
        />
      </div>
      <div class="flex items-center gap-2">
        <div class="flex-1 text-sm text-muted-foreground">
          {{ table.getFilteredSelectedRowModel().rows.length }} sur {{ table.getFilteredRowModel().rows.length }} ligne(s) sélectionnée(s)
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="ml-auto">
              Colonnes
              <ChevronDown class="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel>Affichage des colonnes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              v-for="column in table.getAllColumns().filter(col => col.getCanHide())"
              :key="column.id"
              :checked="column.getIsVisible()"
              @update:checked="column.toggleVisibility"
              class="capitalize"
            >
              {{ getColumnLabel(column.id) }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border">
      <Table class="text-sm">
        <TableHeader>
          <TableRow>
            <TableHead v-for="column in table.getVisibleLeafColumns()" :key="column.id" class="p-2 whitespace-nowrap">
              <FlexRender
                :render="column.columnDef.header"
                :props="{
                  header: column.columnDef,
                  column: column,
                  table: table
                }"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading" class="h-24">
            <TableCell :colspan="columns.length" class="text-center">
              <div class="flex items-center justify-center">
                <Loader2Icon class="h-6 w-6 animate-spin" />
                <span class="ml-2">Chargement des commissions...</span>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-else-if="error" class="h-24">
            <TableCell :colspan="columns.length" class="text-center text-red-500">
              {{ error }}
            </TableCell>
          </TableRow>
          <template v-else>
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() && 'selected'"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="p-2 text-sm whitespace-nowrap">
                <div class="max-w-[200px] truncate">
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </div>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between space-x-2 py-4">
      <div class="flex-1 text-sm text-muted-foreground">
        {{ table.getFilteredRowModel().rows.length }} commission(s)
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          Suivant
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type Column,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useVueTable,
  type Table as TableType,
  FlexRender,
} from '@tanstack/vue-table'
import { ChevronDown, MoreHorizontal, ArrowUpDown } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/formatter'
import { useCommissionStore } from '../stores/useCommissionStoreModule'
import {
  Loader2Icon,
  CheckIcon,
  XIcon,
  HistoryIcon
} from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '#components'
import { Button } from '#components'
import { Input } from '#components'
import { Badge } from '#components'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components'
import { Checkbox } from '#components'

const props = defineProps<{
  status: string
}>()

// Store et états
const commissionStore = useCommissionStore()
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({
  select: true,
  order_number: true,
  commission_id: true,
  commission_amount: true,
  recipient_name: true,
  invoice_status: true,
  invoice_external_id: true,
  actions: true,
  // Colonnes masquées par défaut
  vehicle_internal_id: true,
  vehicle_vin: true,
  vehicle_registration_number: true,
  vehicle_brand: false,
  vehicle_model: false,
})
const rowSelection = ref({})
const { isLoading, error } = commissionStore

// Colonnes
type ColumnId = 'select' | 'order_number' | 'commission_id' | 'commission_amount' | 
  'recipient_name' | 'invoice_status' | 'invoice_external_id' | 'vehicle_internal_id' | 
  'vehicle_vin' | 'vehicle_registration_number' | 'vehicle_brand' | 'vehicle_model' | 'actions'

const columnLabels: Record<ColumnId, string> = {
  select: 'Sélection',
  order_number: 'N° Commande',
  commission_id: 'ID Commission',
  commission_amount: 'Montant',
  recipient_name: 'Destinataire',
  invoice_status: 'Statut Facture',
  invoice_external_id: 'N° Facture',
  vehicle_internal_id: 'ID Interne Véhicule',
  vehicle_vin: 'N° de série (VIN)',
  vehicle_registration_number: 'N° d\'immatriculation',
  vehicle_brand: 'Marque',
  vehicle_model: 'Modèle',
  actions: 'Actions'
}

const columns: ColumnDef<any>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      h('div', { class: 'px-1' }, [
        h(Checkbox, {
          checked: table.getIsAllPageRowsSelected(),
          'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
          'aria-label': 'Sélectionner tout',
          class: 'h-4 w-4'
        })
      ])
    ),
    cell: ({ row }) => (
      h('div', { class: 'px-1' }, [
        h(Checkbox, {
          checked: row.getIsSelected(),
          'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
          'aria-label': 'Sélectionner la ligne',
          class: 'h-4 w-4'
        })
      ])
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'order_number',
    header: ({ column }) => (
      h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['N° Commande', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
    ),
  },
  {
    accessorKey: 'vehicle_internal_id',
    header: 'ID Interne Véhicule',
    enableHiding: true,
  },
  {
    accessorKey: 'vehicle_vin',
    header: 'N° de série (VIN)',
    enableHiding: true,
  },
  {
    accessorKey: 'vehicle_registration_number',
    header: 'N° d\'immatriculation',
    enableHiding: true,
  },
  {
    accessorKey: 'vehicle_brand',
    header: 'Marque',
    enableHiding: true,
  },
  {
    accessorKey: 'vehicle_model',
    header: 'Modèle',
    enableHiding: true,
  },
  {
    accessorKey: 'commission_amount',
    header: ({ column }) => (
      h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['Montant', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
    ),
    cell: ({ row }) => formatCurrency(row.original.commission_amount),
  },
  {
    accessorKey: 'recipient_name',
    header: 'Destinataire',
    cell: ({ row }) => {
      return h('span', { class: 'flex items-center gap-2' }, [
        h(Badge, { variant: 'outline' }, () => getRecipientType(row.original.recipient_type)),
        row.original.recipient_name || 'Non défini'
      ])
    },
  },
  {
    accessorKey: 'invoice_status',
    header: 'Statut Facture',
    cell: ({ row }) => {
      return h(Badge, { variant: getStatusVariant(row.original.invoice_status) }, () => 
        getStatusLabel(row.original.invoice_status)
      )
    },
  },
  {
    accessorKey: 'invoice_external_id',
    header: 'N° Facture',
    cell: ({ row }) => row.original.invoice_external_id || 'Non facturé',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () => 
            h(Button, { variant: 'ghost', class: 'h-8 w-8 p-0' }, () => [
              h(MoreHorizontal, { class: 'h-4 w-4' }),
              h('span', { class: 'sr-only' }, 'Ouvrir le menu')
            ])
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuLabel, {}, () => 'Actions'),
            row.original.invoice_status === 'pending' && [
              h(DropdownMenuItem, {
                onClick: () => updateStatus(row.original.invoice_id, 'paid')
              }, () => 'Marquer comme payée'),
              h(DropdownMenuItem, {
                onClick: () => updateStatus(row.original.invoice_id, 'cancelled')
              }, () => 'Annuler')
            ],
            row.original.invoice_status === 'cancelled' &&
              h(DropdownMenuItem, {
                onClick: () => updateStatus(row.original.invoice_id, 'pending')
              }, () => 'Remettre en attente')
          ])
        ]
      })
    }
  }
]

// Table
const table = useVueTable({
  get data() { return commissionStore.getCommissionsByStatus(props.status) },
  get columns() { return columns },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  onSortingChange: (updaterOrValue) => {
    sorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue
  },
  onColumnFiltersChange: (updaterOrValue) => {
    columnFilters.value = typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters.value) : updaterOrValue
  },
  onColumnVisibilityChange: (updaterOrValue) => {
    columnVisibility.value = typeof updaterOrValue === 'function' ? updaterOrValue(columnVisibility.value) : updaterOrValue
  },
  onRowSelectionChange: (updaterOrValue) => {
    rowSelection.value = typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection.value) : updaterOrValue
  },
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
  },
})

// Fonctions utilitaires
const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'pending': return 'En attente'
    case 'paid': return 'Payée'
    case 'cancelled': return 'Annulée'
    default: return 'N/A'
  }
}

const getStatusVariant = (status?: string) => {
  switch (status) {
    case 'paid': return 'default'
    case 'pending': return 'secondary'
    case 'cancelled': return 'destructive'
    default: return 'secondary'
  }
}

const getRecipientType = (type?: string) => {
  switch (type) {
    case 'company': return 'Entreprise'
    case 'contact': return 'Contact'
    case 'owner': return 'Propriétaire'
    default: return 'N/A'
  }
}

// Actions
const updateStatus = (invoiceId: number, status: string) => {
  commissionStore.updateInvoiceStatus(invoiceId, status)
}

// Fonction utilitaire pour récupérer le label d'une colonne
const getColumnLabel = (columnId: string): string => {
  if (isColumnId(columnId)) {
    return columnLabels[columnId]
  }
  return columnId
}

// Type guard pour vérifier si une string est un ColumnId valide
const isColumnId = (id: string): id is ColumnId => {
  return id in columnLabels
}

onMounted(() => {
  commissionStore.fetchCommissions()
})
</script>