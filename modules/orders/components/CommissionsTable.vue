<template>
  <div class="space-y-4">
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° Commande</TableHead>
            <TableHead>ID Commission</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Taux</TableHead>
            <TableHead>Destinataire</TableHead>
            <TableHead>Statut Facture</TableHead>
            <TableHead>N° Facture</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading" class="h-24">
            <TableCell colspan="8" class="text-center">
              <div class="flex items-center justify-center">
                <Loader2Icon class="h-6 w-6 animate-spin" />
                <span class="ml-2">Chargement des commissions...</span>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-else-if="error" class="h-24">
            <TableCell colspan="8" class="text-center text-red-500">
              {{ error }}
            </TableCell>
          </TableRow>
          <TableRow v-else-if="!filteredCommissions.length" class="h-24">
            <TableCell colspan="8" class="text-center text-muted-foreground">
              Aucune commission trouvée
            </TableCell>
          </TableRow>
          <TableRow v-for="commission in filteredCommissions" :key="commission.id">
            <TableCell>{{ commission.order_item?.order?.order_number || 'N/A' }}</TableCell>
            <TableCell>{{ commission.id }}</TableCell>
            <TableCell>{{ formatCurrency(commission.amount) }}</TableCell>
            <TableCell>{{ commission.rate ? `${commission.rate}%` : 'N/A' }}</TableCell>
            <TableCell>
              <span class="flex items-center gap-2">
                <Badge variant="outline">{{ getRecipientType(commission.metadata?.recipientType) }}</Badge>
                {{ commission.invoice?.[0]?.recipient?.name || 'Non défini' }}
              </span>
            </TableCell>
            <TableCell>
              <Badge :variant="getStatusVariant(commission.invoice?.[0]?.status)">
                {{ getStatusLabel(commission.invoice?.[0]?.status) }}
              </Badge>
            </TableCell>
            <TableCell>
              {{ commission.invoice?.[0]?.external_invoice_id || 'Non facturé' }}
            </TableCell>
            <TableCell>
              <DropdownMenu v-if="commission.invoice?.[0]">
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontalIcon class="h-4 w-4" />
                    <span class="sr-only">Ouvrir le menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    v-if="commission.invoice[0].status === 'pending'"
                    @click="updateStatus(commission.invoice[0].id, 'paid')"
                  >
                    <CheckIcon class="mr-2 h-4 w-4" />
                    Marquer comme payée
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="commission.invoice[0].status === 'pending'"
                    @click="updateStatus(commission.invoice[0].id, 'cancelled')"
                  >
                    <XIcon class="mr-2 h-4 w-4" />
                    Annuler
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="commission.invoice[0].status === 'cancelled'"
                    @click="updateStatus(commission.invoice[0].id, 'pending')"
                  >
                    <HistoryIcon class="mr-2 h-4 w-4" />
                    Remettre en attente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from '#imports'
import { formatCurrency } from '@/utils/formatter'
import { useCommissionStore } from '../stores/useCommissionStore'
import type { InvoiceStatus } from '../types'
import {
  Loader2Icon,
  MoreHorizontalIcon,
  CheckIcon,
  XIcon,
  HistoryIcon
} from 'lucide-vue-next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '#components'

const props = defineProps<{
  status: InvoiceStatus
}>()

const commissionStore = useCommissionStore()
const { isLoading, error } = commissionStore

// Charger les commissions au montage du composant
onMounted(() => {
  commissionStore.fetchCommissions()
})

// Filtrer les commissions selon le statut sélectionné
const filteredCommissions = computed(() => 
  commissionStore.getCommissionsByStatus(props.status)
)

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'pending': return 'En attente'
    case 'paid': return 'Payée'
    case 'cancelled': return 'Annulée'
    default: return 'N/A'
  }
}

const getStatusVariant = (status?: string): 'default' | 'secondary' | 'destructive' => {
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

// Action pour mettre à jour le statut d'une facture
const updateStatus = (invoiceId: number, status: string) => {
  commissionStore.updateInvoiceStatus(invoiceId, status)
}
</script>