<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="border-b px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink :to="'/orders'" class="text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon class="h-5 w-5" />
          </NuxtLink>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-semibold">
                {{ isNew ? 'Nouvelle commande' : `Commande ${order?.orderNumber}` }}
              </h1>
              <Badge v-if="!isNew" :variant="getStatusVariant(order?.status)">
                {{ getStatusLabel(order?.status) }}
              </Badge>
            </div>
            <p class="text-sm text-muted-foreground mt-1">
              {{ isNew ? 'Créée le ' + formatDate1(new Date()) : 'Modifiée le ' + formatDate1(order?.updatedAt) }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <Button v-if="!isNew" variant="outline" @click="downloadPdf">
            <DownloadIcon class="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
          <Button type="submit" :disabled="saving" @click="saveOrder">
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </Button>
        </div>
      </div>
    </header>

    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>

    <div v-else class="container mx-auto py-6 px-4">
      <div class="grid grid-cols-3 gap-6">
        <!-- Colonne principale -->
        <div class="col-span-2 space-y-6">
          <!-- Order Items -->
          <OrderItems
            v-model="form.items"
            :vehicles="vehicles"
          />

          <!-- Notes -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea v-model="form.comments" placeholder="Ajoutez des notes à la commande..." rows="4" />
            </CardContent>
          </Card>
        </div>

        <!-- Colonne latérale -->
        <div class="space-y-6">
          <!-- Type de vente -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base font-semibold">Type de vente</CardTitle>
            </CardHeader>
            <CardContent>
              <Select v-model="form.saleType" :disabled="!isNew">
                <SelectTrigger>
                  <SelectValue :placeholder="'Sélectionnez un type'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem v-for="type in saleTypes" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <!-- Contact ou Entreprises -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base font-semibold">{{ getPartyTitle }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <template v-if="form.saleType === 'B2C'">
                <div class="space-y-2">
                  <Label>Contact</Label>
                  <Select v-model="contactIdStr">
                    <SelectTrigger>
                      <SelectValue :placeholder="'Sélectionnez un contact'" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem v-for="contact in contacts" :key="contact.id" :value="contact.id.toString()">
                          {{ contact.name }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </template>

              <template v-else-if="form.saleType === 'B2B'">
                <div class="space-y-2">
                  <Label>Entreprise acheteuse</Label>
                  <SearchableSelect v-model="buyerCompanyIdStr" :options="companies.map(company => ({
                    value: company.id.toString(),
                    label: company.name
                  }))" placeholder="Sélectionnez une entreprise" />
                </div>
              </template>

              <template v-else-if="form.saleType === 'B2B2B'">
                <div class="space-y-4">
                  <div class="space-y-2">
                    <Label>Entreprise acheteuse</Label>
                    <SearchableSelect v-model="buyerCompanyIdStr" :options="companies.map(company => ({
                      value: company.id.toString(),
                      label: company.name
                    }))" placeholder="Sélectionnez une entreprise" />
                  </div>
                  <div class="space-y-2">
                    <Label>Entreprise vendeuse</Label>
                    <SearchableSelect v-model="sellerCompanyIdStr" :options="companies.map(company => ({
                      value: company.id.toString(),
                      label: company.name
                    }))" placeholder="Sélectionnez une entreprise" />
                  </div>
                </div>
              </template>
            </CardContent>
          </Card>

          <!-- Commissions -->
          <CommissionList
            v-if="['B2B2B', 'B2P', 'P2P'].includes(form.saleType)"
            v-model="form.commissions"
            :order-items="form.items"
            :contacts="contacts"
            :companies="companies"
            :owner-id="currentOwnerId"
          />

          <!-- Totaux -->
          <OrderSummary
            :items="form.items"
            :commissions="form.commissions"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, DownloadIcon } from 'lucide-vue-next'
import { useOrderStore } from '../../stores/useOrderStore'
import { formatDate1 } from '~/utils/formatter'
import type { Order, OrderItem, VehicleCommission, SaleType } from '../../types'
import { useReferenceData } from '../../composables/useReferenceData'
import SearchableSelect from '../../components/ui/SearchableSelect.vue'
import OrderItems from '../../components/OrderItems.vue'
import OrderSummary from '../../components/OrderSummary.vue'
import CommissionList from '../../components/CommissionList.vue'
import { useOwnerStore } from '@/stores/useOwnerStore'
import { useCommissionStore } from '@/stores/useCommissionStore'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Label,
  Textarea,
  Badge,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '#components'

const route = useRoute()
const router = useRouter()
const store = useOrderStore()
const ownerStore = useOwnerStore()
const commissionStore = useCommissionStore()
// Récupérer le type de vente depuis la query si nouvelle commande
const saleTypeFromQuery = computed(() => route.query.type as SaleType | undefined)
const vehicleIdsFromQuery = computed(() => {
    const ids = route.query.vehicles as string
    return ids ? ids.split(',') : []
})

const orderId = computed(() => route.params.id === 'new' ? null : Number(route.params.id))
const isNew = computed(() => !orderId.value)

const loading = ref(true)
const saving = ref(false)
const order = ref<Order | null>(null)

// Initialisation du formulaire avec le type de vente de la query
const form = ref<{
  saleType: SaleType
  contactId?: number
  buyerCompanyId?: number
  sellerCompanyId?: number
  items: OrderItem[]
  commissions: VehicleCommission[]
  comments: string
  totalHt: number
  totalTva: number
  totalTtc: number
  status?: string
}>({
  saleType: saleTypeFromQuery.value || '' as SaleType,
  items: [],
  commissions: [],
  comments: '',
  totalHt: 0,
  totalTva: 0,
  totalTtc: 0
})

// Remplacer les refs contacts et companies par :
const {
  contacts,
  companies,
  vehicles,
  loading: referencesLoading,
  error: referencesError,
  fetchAll: fetchReferences
} = useReferenceData()

const saleTypes = [
  { value: 'B2C', label: 'Particulier' },
  { value: 'B2B', label: 'Professionnel' },
  { value: 'B2B2B', label: 'Inter-professionnel' },
  { value: 'B2P', label: 'Pro vers Particulier' },
  { value: 'P2P', label: 'Particulier à Particulier' }
]

const getPartyTitle = computed(() => {
  switch (form.value.saleType) {
    case 'B2C':
      return 'Contact'
    case 'B2B':
      return 'Entreprise'
    case 'B2B2B':
      return 'Entreprises'
    default:
      return ''
  }
})

// Dans la partie script, ajouter les computed properties pour la conversion
const contactIdStr = computed({
  get: () => form.value.contactId?.toString() || '',
  set: (value: string) => {
    form.value.contactId = value ? Number(value) : undefined
  }
})

const buyerCompanyIdStr = computed({
  get: () => form.value.buyerCompanyId?.toString() || '',
  set: (value: string) => {
    form.value.buyerCompanyId = value ? Number(value) : undefined
  }
})

const sellerCompanyIdStr = computed({
  get: () => form.value.sellerCompanyId?.toString() || '',
  set: (value: string) => {
    form.value.sellerCompanyId = value ? Number(value) : undefined
  }
})

// Méthodes
const fetchOrder = async () => {
  if (!orderId.value) {
    loading.value = false
    return
  }

  try {
    const data = await store.fetchOrderById(orderId.value)
    if (data) {
      order.value = data
      // Remplir le formulaire avec les données de la commande
      form.value = {
        saleType: data.saleType,
        contactId: data.contactId,
        buyerCompanyId: data.buyerCompanyId,
        sellerCompanyId: data.sellerCompanyId,
        items: data.items || [],
        commissions: data.commissions || [],
        comments: data.comments || '',
        totalHt: data.totalHt,
        totalTva: data.totalTva,
        totalTtc: data.totalTtc,
        status: data.status
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la commande:', error)
  } finally {
    loading.value = false
  }
}

const saveOrder = async () => {
  saving.value = true
  try {
    const orderData = {
      ...form.value,
      status: isNew.value ? 'DRAFT' : order.value?.status
    }

    if (isNew.value) {
      await store.createOrder(orderData)
    } else if (orderId.value) {
      await store.updateOrder(orderId.value, orderData)
    }

    router.push('/orders')
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error)
  } finally {
    saving.value = false
  }
}

// Ajout des fonctions utilitaires pour le statut
const getStatusVariant = (status?: string) => {
  switch (status) {
    case 'DRAFT':
      return 'secondary'
    case 'PENDING':
      return 'outline'
    case 'PAID':
      return 'default'
    case 'CANCELLED':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'DRAFT':
      return 'Brouillon'
    case 'PENDING':
      return 'En attente'
    case 'PAID':
      return 'Payée'
    case 'CANCELLED':
      return 'Annulée'
    default:
      return 'Brouillon'
  }
}

// Fonction pour télécharger le PDF
const downloadPdf = async () => {
  if (!orderId.value) return
  
  try {
    // TODO: Implémenter la génération et le téléchargement du PDF
    console.log('Téléchargement du PDF pour la commande:', orderId.value)
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error)
  }
}

const currentOwnerId = computed(() => ownerStore.idOwnerActuel)
console.log('currentOwnerId', currentOwnerId.value)

onMounted(async () => {
    try {
        console.log('Starting to fetch data...')
        // Charger les données owner en premier
        await ownerStore.chargerDonneesOwner()

        // Charger les settings de commission
        await commissionStore.fetchCommissionTypes()
        console.log('Commission types loaded:', commissionStore)
        
        // Puis charger le reste des données en parallèle
        await Promise.all([
            fetchOrder(),
            fetchReferences()
        ])
        
        console.log('Owner data loaded:', ownerStore.donneesOwner)
        console.log('References loaded:', {
            contacts: contacts.value,
            companies: companies.value,
            vehicles: vehicles.value
        })

        // Si on a des véhicules en paramètre, les ajouter automatiquement
        if (isNew.value && vehicleIdsFromQuery.value.length > 0) {
            const selectedVehicles = vehicles.value.filter(v => 
                vehicleIdsFromQuery.value.includes(v.id)
            )
            if (selectedVehicles.length > 0) {
                form.value.items = selectedVehicles.map(vehicle => ({
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
                }))
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
    }
})
</script>