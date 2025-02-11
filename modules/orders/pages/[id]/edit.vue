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
          <Card>
            <CardHeader class="flex justify-between items-center">
              <CardTitle class="text-base font-semibold">Voitures</CardTitle>
              <Button type="button" variant="outline" size="sm" @click="showVehicleSelector">
                <PlusIcon class="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent class="p-0">
              <Table>
                <TableHeader>
                  <TableRow class="bg-muted/50 hover:bg-muted/50">
                    <TableHead class="text-xs font-medium">Référence</TableHead>
                    <TableHead class="text-xs font-medium">Désignation</TableHead>
                    <TableHead class="text-xs font-medium w-24 text-center">Quantité</TableHead>
                    <TableHead class="text-xs font-medium w-32 text-right">Prix d'achat HT</TableHead>
                    <TableHead class="text-xs font-medium w-32 text-right">Prix de vente HT</TableHead>
                    <TableHead class="text-xs font-medium w-24 text-center">TVA</TableHead>
                    <TableHead class="text-xs font-medium w-32 text-right">Total TTC</TableHead>
                    <TableHead class="text-xs font-medium w-32 text-right">Marge</TableHead>
                    <TableHead class="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="(item, index) in form.items" :key="item.vehicleId" class="text-xs">
                    <TableCell>{{ item.vehicle?.internal_id }}</TableCell>
                    <TableCell>
                      {{ item.vehicle?.brand }} {{ item.vehicle?.model }} {{ item.vehicle?.version }}
                      <div class="text-xs text-muted-foreground">
                        {{ item.vehicle?.color }} - {{ item.vehicle?.vin }}
                      </div>
                    </TableCell>
                    <TableCell class="text-center">
                      <Input v-model.number="item.quantity" type="number" min="1" class="w-16 h-8 text-xs text-center"
                        @input="updateItemTotals(index)" />
                    </TableCell>
                    <TableCell class="text-right font-medium">
                      {{ formatCurrency(item.purchasePriceHt) }}
                    </TableCell>
                    <TableCell class="text-right">
                      <Input v-model.number="item.sellingPriceHt" type="number" min="0" step="0.01"
                        class="w-24 h-8 text-xs text-right" @input="updateItemTotals(index)" />
                    </TableCell>
                    <TableCell class="text-center">
                      <Input v-model.number="item.tvaRate" type="number" min="0" max="100" step="0.1"
                        class="w-16 h-8 text-xs text-center" @input="updateItemTotals(index)" />
                    </TableCell>
                    <TableCell class="text-right font-medium">{{ formatCurrency(item.totalTtc) }}</TableCell>
                    <TableCell class="text-right font-medium">{{ formatCurrency(getItemMargin(item)) }}</TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" @click="removeItem(index)">
                        <Trash2Icon class="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <!-- Notes -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea v-model="form.comments" placeholder="Ajoutez des notes à la commande..." rows="4" />
            </CardContent>
          </Card>

          <!-- Commission List -->
          <Card v-if="['B2B2B', 'B2P', 'P2P'].includes(form.saleType)">
            <CommissionList
              v-model="form.commissions"
              :sale-type="form.saleType"
              :total-ht="form.totalHt"
              :contacts="contacts"
              :companies="companies"
            />
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

          <!-- Totaux -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base font-semibold">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex justify-between items-center text-sm">
                <span class="text-muted-foreground">Total HT</span>
                <span class="font-medium">{{ formatCurrency(form.totalHt) }}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-muted-foreground">TVA</span>
                <span class="font-medium">{{ formatCurrency(form.totalTva) }}</span>
              </div>
              <Separator />
              <div class="flex justify-between items-center">
                <span class="font-medium">Total TTC</span>
                <span class="text-lg font-bold">{{ formatCurrency(form.totalTtc) }}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-muted-foreground">Marge totale</span>
                <span class="font-medium">{{ formatCurrency(totalMargin) }}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <VehicleSelector v-model="showVehicleSelectorDialog" :vehicles="vehicles" @select="addVehicles" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, PlusIcon, Trash2Icon, DownloadIcon } from 'lucide-vue-next'
import { useOrderStore } from '../../stores/useOrderStore'
import { formatCurrency, formatDate1 } from '~/utils/formatter'
import type { Order, OrderItem, VehicleCommission, SaleType, OrderFormData, Vehicle } from '../../types'
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
  Input,
  Label,
  Textarea,
  Badge,
  Separator
} from '#components'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useReferenceData } from '../../composables/useReferenceData'
import SearchableSelect from '../../components/ui/SearchableSelect.vue'
import VehicleSelector from '../../components/VehicleSelector.vue'
import CommissionList from '../../components/CommissionList.vue'

const route = useRoute()
const router = useRouter()
const store = useOrderStore()

// Récupérer le type de vente depuis la query si nouvelle commande
const saleTypeFromQuery = computed(() => route.query.type as SaleType | undefined)

const orderId = computed(() => route.params.id === 'new' ? null : Number(route.params.id))
const isNew = computed(() => !orderId.value)

const loading = ref(true)
const saving = ref(false)
const order = ref<Order | null>(null)

// Initialisation du formulaire avec le type de vente de la query
const form = ref<OrderFormData>({
  saleType: saleTypeFromQuery.value || '' as SaleType,
  contactId: undefined,
  buyerCompanyId: undefined,
  sellerCompanyId: undefined,
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

const getCommissionBeneficiaryIdStr = (commission: VehicleCommission) => ({
  get: () => commission.beneficiaryId?.toString() || '',
  set: (value: string) => {
    commission.beneficiaryId = value ? Number(value) : 0
  }
})

// Calcul de la marge
const getItemMargin = (item: OrderItem) => {
  return (item.sellingPriceHt - (item.purchasePriceHt || 0)) * item.quantity
}

const totalMargin = computed(() => {
  return form.value.items.reduce((sum, item) => sum + getItemMargin(item), 0)
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
        commissions: [], // À implémenter
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

const updateItemTotals = (index: number) => {
  const item = form.value.items[index]
  if (!item) return

  // Calcul des totaux de l'article
  item.totalHt = item.quantity * item.sellingPriceHt
  item.totalTva = item.totalHt * (item.tvaRate / 100)
  item.totalTtc = item.totalHt + item.totalTva

  // Mise à jour des totaux de la commande
  updateOrderTotals()
}

const updateOrderTotals = () => {
  // Calcul du total HT
  form.value.totalHt = form.value.items.reduce((sum: number, item: OrderItem) => {
    return sum + (item.quantity * item.sellingPriceHt)
  }, 0)

  // Calcul de la TVA totale
  form.value.totalTva = form.value.items.reduce((sum: number, item: OrderItem) => {
    const itemTotalHt = item.quantity * item.sellingPriceHt
    return sum + (itemTotalHt * (item.tvaRate / 100))
  }, 0)

  // Calcul du total TTC
  form.value.totalTtc = form.value.totalHt + form.value.totalTva
}

const updateCommissionAmount = (index: number) => {
  const commission = form.value.commissions[index]
  if (!commission) return

  commission.amount = form.value.totalHt * (commission.rate / 100)
}

const removeItem = (index: number) => {
  form.value.items.splice(index, 1)
  updateOrderTotals()
}

const addCommission = () => {
  form.value.commissions.push({
    id: 0,
    orderItemId: 0,
    beneficiaryId: 0,
    amount: 0,
    rate: 0,
    commissionType: 'MANDATE',
    isPaid: false
  })
}

const removeCommission = (index: number) => {
  form.value.commissions.splice(index, 1)
}

const showVehicleSelectorDialog = ref(false)

const showVehicleSelector = () => {
  console.log('Opening vehicle selector with vehicles:', vehicles.value)
  showVehicleSelectorDialog.value = true
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

const cancel = () => {
  router.back()
}

const updateCommissionBeneficiary = (commission: VehicleCommission, value: string) => {
  commission.beneficiaryId = value ? Number(value) : 0
}

const addVehicles = (vehicles: Vehicle[]) => {
  const items = [...form.value.items]

  vehicles.forEach(vehicle => {
    // Vérifier si le véhicule n'est pas déjà dans la liste
    if (!items.some(item => item.vehicleId === vehicle.id)) {
      items.push({
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
      })
    }
  })

  form.value.items = items
  
  // Calculer les totaux pour chaque article
  form.value.items.forEach((_, index) => {
    updateItemTotals(index)
  })
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

onMounted(async () => {
  try {
    console.log('Starting to fetch data...')
    await Promise.all([
      fetchOrder(),
      fetchReferences()
    ])
    console.log('References loaded:', {
      contacts: contacts.value,
      companies: companies.value,
      vehicles: vehicles.value
    })
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  }
})
</script>