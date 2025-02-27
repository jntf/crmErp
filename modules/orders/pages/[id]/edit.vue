<!--
/**
 * Page d'édition et de création de commande
 * 
 * Cette page sert à la fois pour la création d'une nouvelle commande et pour
 * l'édition d'une commande existante. Elle contient un formulaire complet
 * permettant de configurer tous les aspects d'une commande.
 * 
 * Fonctionnalités:
 * - Création de nouvelle commande
 * - Édition de commande existante
 * - Sélection du type de vente
 * - Sélection des parties impliquées (acheteur, vendeur)
 * - Ajout et configuration des véhicules
 * - Gestion des commissions
 * - Calcul automatique des totaux
 * - Enregistrement et téléchargement de PDF
 * 
 * URL:
 * - /orders/new : Création d'une nouvelle commande
 * - /orders/:id/edit : Édition d'une commande existante
 */
-->

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
          <OrderItems v-model="form.items" :vehicles="vehicles" />

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
          <SaleTypeSelector v-model="form.saleType" :disabled="!isNew" />

          <!-- Contact ou Entreprises -->
          <PartySelector 
            :sale-type="form.saleType"
            :contact-id="form.contactId"
            :buyer-company-id="form.buyerCompanyId"
            :seller-company-id="form.sellerCompanyId"
            :seller-contact-id="form.sellerContactId"
            :contacts="contacts"
            :companies="companies"
            @update:contact-id="form.contactId = $event"
            @update:buyer-company-id="form.buyerCompanyId = $event"
            @update:seller-company-id="form.sellerCompanyId = $event"
            @update:seller-contact-id="form.sellerContactId = $event"
          />

          <!-- Commissions -->
          <CommissionList 
            v-if="isIntermediationType(form.saleType)" 
            v-model="form.commissions"
            :order-items="form.items.map(item => ({
              id: item.id,
              vehicle: item.vehicle ? {
                id: Number(item.vehicleId),
                internal_id: item.vehicleInternalId,
                model: item.vehicle.model,
                vin: item.vehicle.vin || ''
              } : undefined
            }))" 
            :contacts="contacts" 
            :companies="companies" 
            :owner-id="currentOwnerId" 
          />

          <!-- Totaux -->
          <OrderSummary :items="form.items" :commissions="form.commissions" :display-margin="displayMargin" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, DownloadIcon } from 'lucide-vue-next'
import { useOrderStore } from '@/modules/orders/stores/useOrderStore'
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
import { useOrderIntermediation } from '../../composables/useOrderIntermediation'
import OrderItems from '../../components/OrderItems.vue'
import OrderSummary from '../../components/OrderSummary.vue'
import CommissionList from '../../components/CommissionList.vue'
import SaleTypeSelector from '../../components/SaleTypeSelector.vue'
import PartySelector from '../../components/PartySelector.vue'
import { useOwnerStore } from '@/stores/useOwnerStore'
import { useCommissionStore } from '@/stores/useCommissionStore'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Textarea,
  Badge
} from '#components'

const route = useRoute()
const router = useRouter()
const store = useOrderStore()
const ownerStore = useOwnerStore()
const commissionStore = useCommissionStore()
const { isIntermediationType } = useOrderIntermediation()

// Récupérer le type de vente depuis la query si nouvelle commande
const saleTypeFromQuery = computed(() => route.query.type as SaleType | undefined)

// Récupérer les véhicules depuis la query si nouvelle commande
const vehicleIdsFromQuery = computed(() => {
  const ids = route.query.vehicles as string
  return ids ? ids.split(',') : []
})

// Récupérer les véhicules avec quantités depuis la query si nouvelle commande
const vehiclesWithQtyFromQuery = computed(() => {
  const vehiclesWithQty = route.query.vehicles_with_qty as string
  if (!vehiclesWithQty) return []

  return vehiclesWithQty.split(',').map(item => {
    const [id, qty] = item.split(':')
    return {
      id: id,
      qty: parseInt(qty, 10) || 1
    }
  })
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
  totalTtc: 0,
  metadata: {}
})

// Remplacer les refs contacts et companies par :
const {
  contacts,
  companies,
  vehicles,
  loading: referencesLoading,
  error: referencesError,
  fetchAllData: fetchReferences
} = useReferenceData()

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
        sellerContactId: data.metadata?.seller_contact_id, // Récupérer depuis les métadonnées
        items: data.items || [],
        commissions: data.items?.flatMap(item => item.commissions || []) || [],
        comments: data.comments || '',
        totalHt: data.totalHt,
        totalTva: data.totalTva,
        totalTtc: data.totalTtc,
        status: data.status,
        metadata: data.metadata || {}
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
    console.log('----------- DÉBUT CRÉATION COMMANDE SIMPLIFIÉE -----------')
    console.log('TYPE DE VENTE:', form.value.saleType)
    console.log('DONNÉES DU FORMULAIRE:', form.value)
    
    // Version simplifiée qui retourne un succès fictif
    const result = {
      success: true,
      orderId: 999,
      orderNumber: 'CMD-TEMP-' + Date.now(),
      message: 'Commande créée avec succès (simulation)'
    }
    
    console.log('----------- RÉSULTAT SIMULÉ -----------')
    console.log('✅ CRÉATION SIMULÉE')
    console.log('ID:', result.orderId)
    console.log('NUMÉRO:', result.orderNumber)
    
    router.push('/orders')
    
    console.log('----------- FIN CRÉATION COMMANDE SIMPLIFIÉE -----------')
    return result
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error)
    return {
      success: false,
      error: 'Erreur simulée'
    }
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

const currentOwnerId = computed<number | undefined>(() => ownerStore.idOwnerActuel === null ? undefined : ownerStore.idOwnerActuel)

const displayMargin = computed(() => {
  // Afficher la marge uniquement pour les ventes directes (B2B)
  return form.value.saleType === 'B2B'
})

onMounted(async () => {
  try {
    await ownerStore.chargerDonneesOwner()
    await commissionStore.fetchCommissionTypes()
    await Promise.all([
      fetchReferences()
    ])

    if (isNew.value) {
      if (vehiclesWithQtyFromQuery.value.length > 0) {
        const vehicleItems = vehiclesWithQtyFromQuery.value
          .map(item => {
            const vehicle = vehicles.value.find(v => v.id.toString() === item.id)
            if (!vehicle) return null

            return {
              id: 0,
              orderId: 0,
              vehicleId: vehicle.id.toString(),
              vehicleInternalId: vehicle.internal_id,
              quantity: item.qty,
              purchasePriceHt: vehicle.vehicle_prices?.purchase_price_ht || 0,
              unitPriceHt: vehicle.vehicle_prices?.selling_price_ht || 0,
              sellingPriceHt: vehicle.vehicle_prices?.selling_price_ht || 0,
              tvaRate: 20,
              totalHt: 0,
              totalTva: 0,
              totalTtc: 0,
              isPaid: false,
              status: 'DRAFT' as OrderStatus,
              isDelivered: false,
              vehicle
            }
          })
          .filter(Boolean) as OrderItem[]

        form.value.items = vehicleItems
      } else if (vehicleIdsFromQuery.value.length > 0) {
        const vehicleItems = vehicleIdsFromQuery.value
          .map(id => {
            const vehicle = vehicles.value.find(v => v.id.toString() === id)
            if (!vehicle) return null

            return {
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
              status: 'DRAFT' as OrderStatus,
              isDelivered: false,
              vehicle
            }
          })
          .filter(Boolean) as OrderItem[]

        form.value.items = vehicleItems
      }
    } else {
      await fetchOrder()
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error)
  } finally {
    loading.value = false
  }
})
</script>