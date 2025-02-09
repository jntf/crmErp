<template>
  <div class="p-4 space-y-6">
    <header class="flex justify-between items-center">
      <div>
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/orders"
            class="text-gray-500 hover:text-gray-700"
          >
            <Icon name="heroicons:arrow-left" class="h-5 w-5" />
          </NuxtLink>
          <h1 class="text-2xl font-bold">
            Commande {{ order?.orderNumber }}
          </h1>
        </div>
        <p class="text-gray-500 mt-1">
          {{ formatDate(order?.orderDate) }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="downloadPdf">
          <Icon name="heroicons:document-arrow-down" class="mr-2 h-4 w-4" />
          Télécharger PDF
        </Button>
        <Button v-if="canEdit" @click="editOrder">
          <Icon name="heroicons:pencil-square" class="mr-2 h-4 w-4" />
          Modifier
        </Button>
      </div>
    </header>

    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>

    <template v-else-if="order">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Informations générales -->
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">Statut</dt>
                <dd class="mt-1">
                  <OrderStatusBadge :status="order.status" />
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Type de vente</dt>
                <dd class="mt-1">{{ getSaleTypeLabel(order.saleType) }}</dd>
              </div>
              <div v-if="order.contactId">
                <dt class="text-sm font-medium text-gray-500">Contact</dt>
                <dd class="mt-1">{{ order.contact?.name || 'N/A' }}</dd>
              </div>
              <div v-if="order.buyerCompanyId">
                <dt class="text-sm font-medium text-gray-500">Acheteur</dt>
                <dd class="mt-1">{{ order.buyerCompany?.name || 'N/A' }}</dd>
              </div>
              <div v-if="order.sellerCompanyId">
                <dt class="text-sm font-medium text-gray-500">Vendeur</dt>
                <dd class="mt-1">{{ order.sellerCompany?.name || 'N/A' }}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <!-- Totaux -->
        <Card>
          <CardHeader>
            <CardTitle>Montants</CardTitle>
          </CardHeader>
          <CardContent>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">Total HT</dt>
                <dd class="mt-1 text-2xl font-semibold">
                  {{ formatCurrency(order.totalHt) }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">TVA</dt>
                <dd class="mt-1 text-2xl font-semibold">
                  {{ formatCurrency(order.totalTva) }}
                </dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm font-medium text-gray-500">Total TTC</dt>
                <dd class="mt-1 text-3xl font-bold text-primary">
                  {{ formatCurrency(order.totalTtc) }}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <!-- Liste des véhicules -->
      <Card>
        <CardHeader>
          <CardTitle>Véhicules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Prix unitaire HT</TableHead>
                <TableHead>TVA</TableHead>
                <TableHead>Total TTC</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="item in order.items"
                :key="item.id"
              >
                <TableCell>{{ item.vehicleInternalId }}</TableCell>
                <TableCell>{{ item.vehicle?.name || 'N/A' }}</TableCell>
                <TableCell>{{ item.quantity }}</TableCell>
                <TableCell>{{ formatCurrency(item.unitPriceHt) }}</TableCell>
                <TableCell>{{ item.tvaRate }}%</TableCell>
                <TableCell>{{ formatCurrency(item.totalTtc) }}</TableCell>
                <TableCell>
                  <OrderStatusBadge :status="item.status" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- Commissions (si B2B2B) -->
      <Card v-if="order.saleType === 'B2B2B'">
        <CardHeader>
          <CardTitle>Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Taux</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date de paiement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="commission in commissions"
                :key="commission.id"
              >
                <TableCell>{{ commission.beneficiary?.name || 'N/A' }}</TableCell>
                <TableCell>{{ formatCurrency(commission.amount) }}</TableCell>
                <TableCell>{{ commission.rate }}%</TableCell>
                <TableCell>
                  <Badge :variant="commission.isPaid ? 'default' : 'secondary'">
                    {{ commission.isPaid ? 'Payée' : 'En attente' }}
                  </Badge>
                </TableCell>
                <TableCell>
                  {{ commission.paymentDate ? formatDate(commission.paymentDate) : 'Non payée' }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </template>

    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-500">{{ error }}</p>
      <Button variant="outline" class="mt-4" @click="fetchOrder">
        Réessayer
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '../stores/useOrderStore'
import { formatDate, formatCurrency } from '~/utils/format'
import type { OrderWithRelations, SaleType } from '../types'
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
  Badge
} from '#components'

const route = useRoute()
const router = useRouter()
const store = useOrderStore()

const order = ref<OrderWithRelations | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const orderId = computed(() => Number(route.params.id))

const canEdit = computed(() => {
  return order.value?.status === 'DRAFT'
})

const commissions = computed(() => {
  return order.value?.items?.flatMap(item => item.commissions || []) || []
})

const getSaleTypeLabel = (type: SaleType) => {
  const types = {
    B2C: 'Particulier',
    B2B: 'Professionnel',
    B2B2B: 'Inter-professionnel'
  }
  return types[type]
}

const fetchOrder = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await store.fetchOrderById(orderId.value)
    if (data) {
      order.value = data
    } else {
      error.value = 'Commande introuvable'
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement de la commande'
  } finally {
    loading.value = false
  }
}

const editOrder = () => {
  router.push('/orders/' + orderId.value + '/edit')
}

const downloadPdf = async () => {
  // TODO: Implémenter la génération et le téléchargement du PDF
}

onMounted(fetchOrder)
</script> 