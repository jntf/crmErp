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
            :display-margin="displayMargin"
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
import type { 
  Order, 
  OrderItem, 
  VehicleCommission, 
  SaleType, 
  OrderStatus,
  OrderFormData, 
  OrderWithRelations,
  Vehicle 
} from '../../types'
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
const form = ref<OrderFormData>({
  saleType: saleTypeFromQuery.value as SaleType || '' as SaleType,
  items: [] as OrderItem[],
  commissions: [] as VehicleCommission[],
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
  { value: 'B2B2B', label: 'Intermediation' },
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
    const data = await store.fetchOrderById(orderId.value) as OrderWithRelations
    if (data) {
      order.value = data
      // Remplir le formulaire avec les données de la commande
      form.value = {
        saleType: data.saleType,
        contactId: data.contactId,
        buyerCompanyId: data.buyerCompanyId,
        sellerCompanyId: data.sellerCompanyId,
        items: data.items || [],
        commissions: data.items?.flatMap(item => item.commissions || []) || [],
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

// Ajout des interfaces pour les logs
interface TvaLog {
  message: string
}

interface CreateOrderResponse {
  success: boolean
  orderId: number
  orderNumber: string
  message: string
  logs?: TvaLog[]
  error?: string
}

const saveOrder = async () => {
  saving.value = true
  try {
    console.log('----------- DÉBUT CRÉATION COMMANDE -----------')
    console.log('TYPE DE VENTE:', form.value.saleType)
    console.log('ENTREPRISE ACHETEUSE:', form.value.buyerCompanyId)
    console.log('ENTREPRISE VENDEUSE:', form.value.sellerCompanyId)

    const orderData = {
      saleType: form.value.saleType,
      contactId: form.value.contactId,
      buyerCompanyId: form.value.buyerCompanyId,
      sellerCompanyId: form.value.sellerCompanyId,
      items: form.value.items.map(item => ({
        vehicleId: item.vehicleId,
        vehicleInternalId: item.vehicleInternalId,
        quantity: item.quantity,
        purchasePriceHt: item.purchasePriceHt,
        unitPriceHt: item.unitPriceHt,
        sellingPriceHt: item.sellingPriceHt,
        tvaRate: item.tvaRate,
        totalHt: item.totalHt,
        totalTva: item.totalTva,
        totalTtc: item.totalTtc
      })),
      commissions: form.value.commissions.map(commission => ({
        orderItemId: commission.order_item_id,
        commissionTypeId: commission.commission_type_id,
        amount: commission.amount,
        rate: commission.rate,
        recipientType: commission.recipient_type,
        recipientId: commission.recipient_id,
        metadata: commission.metadata || {}
      })),
      comments: form.value.comments,
      orderDate: new Date().toISOString()
    }

    console.log('DONNÉES ENVOYÉES:', JSON.stringify(orderData, null, 2))

    const result = await store.createOrderWithFunction(orderData) as CreateOrderResponse
    
    console.log('----------- RÉSULTAT -----------')
    if (result?.success) {
      console.log('✅ CRÉATION RÉUSSIE')
      console.log('ID:', result.orderId)
      console.log('NUMÉRO:', result.orderNumber)
      
      if (result.logs?.length) {
        console.log('----------- LOGS TVA -----------')
        result.logs.forEach((log) => {
          console.log('🔍', log.message)
        })
      } else {
        console.log('❌ Pas de logs TVA disponibles')
      }

      router.push('/orders')
    } else {
      console.error('❌ ÉCHEC DE LA CRÉATION')
      console.error('Erreur:', result?.error)
      throw new Error(result?.error || 'Erreur lors de la création de la commande')
    }
    console.log('----------- FIN CRÉATION COMMANDE -----------')
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error)
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

const displayMargin = computed(() => {
  // Afficher la marge uniquement pour les ventes directes (B2B et B2P)
  return form.value.saleType === 'B2B' || form.value.saleType === 'B2P'
})

onMounted(async () => {
  try {
    await ownerStore.chargerDonneesOwner()
    await commissionStore.fetchCommissionTypes()
    await Promise.all([
      fetchOrder(),
      fetchReferences()
    ])

    if (isNew.value && vehicleIdsFromQuery.value.length > 0) {
      const selectedVehicles = vehicles.value.filter(v =>
        vehicleIdsFromQuery.value.includes(v.id.toString())
      )
      if (selectedVehicles.length > 0) {
        form.value.items = selectedVehicles.map(vehicle => {
          const vehicleWithNullableVin: Vehicle = {
            ...vehicle,
            vin: vehicle.vin || null
          }
          
          const item: OrderItem = {
            id: 0,
            orderId: 0,
            vehicleId: vehicle.id.toString(),
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
            vehicle: vehicleWithNullableVin
          }
          return item
        })
      }
    }
  } catch (error) {
    console.error('Erreur de chargement initial :', error)
  }
})
</script>