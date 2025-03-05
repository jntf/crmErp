<!--
/**
 * Page de modification de commande
 * 
 * Cette page permet de modifier une commande existante.
 * Elle se concentre sur la modification des véhicules, des commissions et des commentaires,
 * sans permettre de changer les parties impliquées (acheteur/vendeur).
 * 
 * Fonctionnalités:
 * - Modification des véhicules (ajout, suppression, quantités)
 * - Modification des commissions (si applicable)
 * - Modification des commentaires
 * - Enregistrement des modifications
 * - Téléchargement de PDF
 * 
 * Statut: Prêt à l'emploi
 * Date de création: 04/03/2024
 */
-->

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="border-b px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink :to="`/orders/${orderId}`" class="text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon class="h-5 w-5" />
          </NuxtLink>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-semibold">
                Modification de la commande {{ order?.orderNumber }}
              </h1>
              <Badge v-if="order" :variant="getStatusVariant(order.status)">
                {{ getStatusLabel(order.status) }}
              </Badge>
            </div>
            <p class="text-sm text-muted-foreground mt-1">
              Modifiée le {{ formatDate1(new Date()) }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <Button variant="outline" @click="downloadPdf" :disabled="saving">
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

    <div v-else-if="order && order.status !== 'DRAFT'" class="container mx-auto py-8 px-4">
      <Card class="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle class="text-xl font-semibold text-center">Modification impossible</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-center mb-4">
            Cette commande ne peut pas être modifiée car elle n'est plus en statut brouillon.
          </p>
          <p class="text-center text-sm text-muted-foreground mb-6">
            Statut actuel: <Badge :variant="getStatusVariant(order.status)">{{ getStatusLabel(order.status) }}</Badge>
          </p>
          <div class="flex justify-center">
            <Button @click="router.push(`/orders/${orderId}`)">
              Retour aux détails
            </Button>
          </div>
        </CardContent>
      </Card>
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
              <Textarea id="notes" v-model="form.comments" placeholder="Notes sur la commande..." :rows="4"
                class="resize-none" />
            </CardContent>
          </Card>
        </div>

        <!-- Colonne latérale -->
        <div class="space-y-6">
          <!-- Type de vente (en lecture seule) -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base font-semibold">Type de vente</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="flex items-center space-x-2">
                <Badge variant="outline">
                  {{ getSaleTypeLabel(form.saleType) }}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <!-- Parties impliquées (en lecture seule) -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base font-semibold">Parties impliquées</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <!-- Acheteur -->
                <div v-if="form.contactId || form.buyerCompanyId" class="space-y-1">
                  <p class="text-sm font-medium">Acheteur</p>
                  <p v-if="form.contactId && buyerContact" class="text-sm text-muted-foreground">
                    {{ buyerContact.first_name }} {{ buyerContact.last_name }}
                  </p>
                  <p v-if="form.buyerCompanyId && buyerCompany" class="text-sm text-muted-foreground">
                    {{ buyerCompany.name }}
                  </p>
                </div>

                <!-- Vendeur (si applicable) -->
                <div v-if="form.sellerCompanyId || form.sellerContactId" class="space-y-1">
                  <p class="text-sm font-medium">Vendeur</p>
                  <p v-if="form.sellerContactId && sellerContact" class="text-sm text-muted-foreground">
                    {{ sellerContact.first_name }} {{ sellerContact.last_name }}
                  </p>
                  <p v-if="form.sellerCompanyId && sellerCompany" class="text-sm text-muted-foreground">
                    {{ sellerCompany.name }}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Commissions -->
          <CommissionList v-if="isIntermediationType(form.saleType) && canAddCommissions" v-model="form.commissions"
            :order-items="form.items.map(item => ({
              id: item.id,
              vehicle: item.vehicle ? {
                id: item.vehicle.id,
                internal_id: item.vehicleInternalId,
                model: item.vehicle.model,
                vin: item.vehicle.vin || ''
              } : undefined
            })) as any" :contacts="selectedContacts" :companies="selectedCompanies" :owner-id="currentOwnerId" />

          <!-- Totaux -->
          <OrderSummary :items="form.items" :commissions="form.commissions" :display-margin="displayMargin" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, DownloadIcon } from 'lucide-vue-next'
import { useOrderStore } from '@/modules/orders/stores/useOrderStore'
import { useOrderDetailStore } from '@/modules/orders/stores/useOrderDetailStore'
import { formatDate1 } from '~/utils/formatter'
import type {
  Order,
  OrderItem,
  VehicleCommission,
  SaleType,
  OrderStatus,
  OrderFormData,
  OrderWithRelations,
  Vehicle,
  Contact,
  Company
} from '../../types'
import { useReferenceData } from '../../composables/useReferenceData'
import { useOrderIntermediation } from '../../composables/useOrderIntermediation'
import { calculateOrderTotals } from '../../composables/useOrderCalculations'
import { useReferenceStore } from '../../stores/useReferenceStore'
import { useOrderOperations } from '../../composables/useOrderOperations'
import OrderItems from '../../components/OrderItems.vue'
import OrderSummary from '../../components/OrderSummary.vue'
import CommissionList from '../../components/CommissionList.vue'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Textarea,
  Badge
} from '#components'
import { useOwnerStore } from '@/stores/useOwnerStore'
import { useCommissionStore } from '@/stores/useCommissionStore'
import { useToast } from '@/components/ui/toast/use-toast'

const route = useRoute()
const router = useRouter()
const store = useOrderStore()
const detailStore = useOrderDetailStore()
const { downloadOrderPdf } = useOrderOperations()
const {
  isIntermediationType,
  validateIntermediationParties,
  prepareIntermediationOrderData,
  associateCommissionsWithItems
} = useOrderIntermediation()

const orderId = computed(() => Number(route.params.id))
const loading = ref(true)
const saving = ref(false)
const order = ref<Order | null>(null)

// Initialisation du formulaire
const form = ref<OrderFormData>({
  saleType: '' as SaleType,
  items: [] as OrderItem[],
  commissions: [] as VehicleCommission[],
  comments: '',
  totalHt: 0,
  totalTva: 0,
  totalTtc: 0,
  metadata: {},
  ownerCompanyId: undefined
})

// Récupérer les données de référence
const {
  contacts,
  companies,
  vehicles,
  loading: referencesLoading,
  error: referencesError,
  fetchAllData: fetchReferences
} = useReferenceData()

// Stores
const ownerStore = useOwnerStore()
const commissionStore = useCommissionStore()
const { toast } = useToast()
const supabase = useSupabaseClient()

// Contacts et entreprises sélectionnés
const buyerContact = computed(() => {
  if (!form.value.contactId) return null
  return contacts.value.find(c => c.id === form.value.contactId) || null
})

const buyerCompany = computed(() => {
  if (!form.value.buyerCompanyId) return null
  return companies.value.find(c => c.id === form.value.buyerCompanyId) || null
})

const sellerContact = computed(() => {
  if (!form.value.sellerContactId) return null
  return contacts.value.find(c => c.id === form.value.sellerContactId) || null
})

const sellerCompany = computed(() => {
  if (!form.value.sellerCompanyId) return null
  return companies.value.find(c => c.id === form.value.sellerCompanyId) || null
})

// Méthodes
const fetchOrder = async () => {
  if (!orderId.value) {
    loading.value = false
    return
  }

  try {
    // Charger les données de la commande depuis le store de détail
    await detailStore.fetchOrderById(orderId.value)
    const data = detailStore.order as OrderWithRelations
    
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
        metadata: data.metadata || {},
        ownerCompanyId: data.ownerCompanyId
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la commande:', error)
    toast({
      title: 'Erreur',
      description: 'Impossible de charger les données de la commande',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

const saveOrder = async () => {
  saving.value = true

  try {
    // 1. Vérifier les quantités disponibles
    const items = form.value.items.map(item => ({
      vehicleId: item.vehicleId,
      quantity: item.quantity
    }))

    console.log('Items:', items)

    const { data: qtyCheck, error: qtyError } = await supabase
      .rpc('check_vehicles_qty', { p_items: items })

    if (qtyError) throw new Error(`Erreur lors de la vérification des quantités: ${qtyError.message}`)

    if (!qtyCheck.success) {
      const insufficientItems = qtyCheck.insufficient_items
      const itemsDetails = insufficientItems
        .map((item: any) => `${item.internalId} (demandé: ${item.requested}, disponible: ${item.available})`)
        .join(', ')

      toast({
        title: "Stock insuffisant",
        description: `Les véhicules suivants n'ont pas assez de stock: ${itemsDetails}`,
        variant: "destructive"
      })
      return
    }

    // 2. S'assurer que toutes les références nécessaires sont chargées
    const referenceStore = useReferenceStore()
    if (referenceStore.contacts.length === 0 || referenceStore.companies.length === 0 || referenceStore.vehicles.length === 0) {
      console.log('Chargement des références pour le calcul de TVA...')
      await referenceStore.fetchAllReferences()
    }

    // 3. Déterminer le type de vente
    const isIntermediation = isIntermediationType(form.value.saleType)

    // 4. Préparation des données spécifique au type
    let orderData: any

    if (!currentOwnerId.value) {
      throw new Error("L'ID de l'entreprise propriétaire est requis pour modifier une commande")
    }

    if (isIntermediation) {
      orderData = prepareIntermediationOrderData(form.value)
      orderData.commissions = associateCommissionsWithItems(
        form.value.items,
        form.value.commissions
      )
      orderData.metadata = {
        ...orderData.metadata,
        intermediation_type: form.value.saleType,
        commission_payer: orderData.metadata?.commission_payer || 'seller'
      }
    } else {
      orderData = {
        ...form.value
      }
    }

    orderData.ownerCompanyId = currentOwnerId.value
    orderData.id = orderId.value // Ajouter l'ID de la commande pour la mise à jour

    // 5. Calculer les totaux
    console.log('Calcul des totaux avec application des règles de TVA...')
    const calculatedTotals = calculateOrderTotals(orderData)
    orderData.totalHt = calculatedTotals.totalHt
    orderData.totalTva = calculatedTotals.totalTva
    orderData.totalTtc = calculatedTotals.totalTtc
    orderData.items = calculatedTotals.items

    // 6. Mettre à jour la commande
    const { data: updateResult, error: updateError } = await supabase
      .from('orders')
      .update({
        comments: orderData.comments,
        total_ht: orderData.totalHt,
        total_tva: orderData.totalTva,
        total_ttc: orderData.totalTtc,
        metadata: orderData.metadata
      })
      .eq('id', orderId.value)
      .select()

    if (updateError) throw new Error(`Erreur lors de la mise à jour de la commande: ${updateError.message}`)

    // 7. Mettre à jour les articles de commande
    // D'abord, supprimer les articles existants
    const { error: deleteItemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId.value)

    if (deleteItemsError) throw new Error(`Erreur lors de la suppression des articles: ${deleteItemsError.message}`)

    // Ensuite, insérer les nouveaux articles
    const orderItems = orderData.items.map((item: any) => ({
      order_id: orderId.value,
      vehicle_id: item.vehicleId,
      vehicle_internal_id: item.vehicleInternalId,
      quantity: item.quantity,
      unit_price_ht: item.unitPriceHt,
      purchase_price_ht: item.purchasePriceHt,
      selling_price_ht: item.sellingPriceHt,
      tva_rate: item.tvaRate,
      total_ht: item.totalHt,
      total_tva: item.totalTva,
      total_ttc: item.totalTtc,
      is_paid: false,
      status: 'DRAFT',
      is_delivered: false,
      stock_type: item.stockType || 'existing'
    }))

    const { data: insertedItems, error: insertItemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select()

    if (insertItemsError) throw new Error(`Erreur lors de l'insertion des articles: ${insertItemsError.message}`)

    // 8. Mettre à jour les commissions si nécessaire
    if (isIntermediation && orderData.commissions && orderData.commissions.length > 0) {
      // Supprimer les commissions existantes
      const { error: deleteCommissionsError } = await supabase
        .from('vehicle_commissions')
        .delete()
        .in('order_item_id', insertedItems.map((item: any) => item.id))

      if (deleteCommissionsError) throw new Error(`Erreur lors de la suppression des commissions: ${deleteCommissionsError.message}`)

      // Insérer les nouvelles commissions
      const commissions = orderData.commissions.map((commission: any) => {
        // Trouver l'article correspondant
        const matchingItem = insertedItems.find((item: any) => 
          item.vehicle_id === commission.vehicleId?.toString() || 
          Number(item.vehicle_id) === commission.vehicleId
        )

        return {
          order_item_id: matchingItem?.id,
          amount: commission.amount,
          commission_type_id: commission.commissionTypeId,
          recipient_type: commission.recipientType,
          recipient_id: commission.recipientId,
          metadata: commission.metadata
        }
      }).filter((commission: any) => commission.order_item_id)

      if (commissions.length > 0) {
        const { error: insertCommissionsError } = await supabase
          .from('vehicle_commissions')
          .insert(commissions)

        if (insertCommissionsError) throw new Error(`Erreur lors de l'insertion des commissions: ${insertCommissionsError.message}`)
      }
    }

    // 9. Mettre à jour les stocks
    const itemsWithOrderIds = orderData.items.map((item: any) => {
      // Trouver l'ID correspondant dans les articles créés
      const createdItem = insertedItems.find((orderItem: any) =>
        orderItem.vehicle_id === item.vehicleId
      )

      return {
        vehicleId: item.vehicleId,
        quantity: item.quantity,
        orderItemId: createdItem?.id
      }
    }).filter((item: any) => item.orderItemId)

    const { data: stockUpdate, error: stockError } = await supabase
      .rpc('update_vehicles_qty_and_stock', {
        p_items: itemsWithOrderIds,
        p_order_id: orderId.value
      })

    if (stockError) {
      console.error('Erreur lors de la mise à jour des stocks:', stockError)
      toast({
        title: "Attention",
        description: "La commande a été modifiée mais une erreur est survenue lors de la mise à jour des stocks.",
        variant: "warning"
      })
    } else {
      console.log('Stocks mis à jour avec succès:', stockUpdate)
    }

    // 10. Redirection après succès
    toast({
      title: "Commande modifiée",
      description: `La commande ${order.value?.orderNumber} a été modifiée avec succès.`
    })

    router.push(`/orders/${orderId.value}`)
  } catch (error) {
    console.error('❌ ERREUR:', error)
    toast({
      title: "Erreur",
      description: (error as Error).message || 'Erreur inconnue',
      variant: "destructive"
    })
  } finally {
    saving.value = false
  }
}

// Fonction pour télécharger le PDF
const downloadPdf = async () => {
  if (!orderId.value) return
  await downloadOrderPdf(orderId.value)
}

const currentOwnerId = computed<number | undefined>(() => ownerStore.idOwnerActuel === null ? undefined : ownerStore.idOwnerActuel)

const displayMargin = computed(() => {
  // Afficher la marge uniquement pour les ventes directes (B2B)
  return form.value.saleType === 'B2B'
})

const selectedContacts = computed(() => {
  // Pour une vente avec intermédiaire, inclure les contacts sélectionnés
  if (isIntermediationType(form.value.saleType)) {
    const selectedIds = [form.value.contactId, form.value.sellerContactId].filter(Boolean)
    if (selectedIds.length === 0) return []
    return contacts.value.filter(c => selectedIds.includes(c.id))
  }
  // Pour une vente B2C, retourner uniquement le contact acheteur s'il existe
  if (form.value.saleType === 'B2C' && form.value.contactId) {
    const selectedContact = contacts.value.find(c => c.id === form.value.contactId)
    return selectedContact ? [selectedContact] : []
  }
  return []
})

const selectedCompanies = computed(() => {
  // Pour une vente avec intermédiaire, inclure les entreprises sélectionnées
  if (isIntermediationType(form.value.saleType)) {
    const selectedIds = [form.value.buyerCompanyId, form.value.sellerCompanyId].filter(Boolean)
    if (selectedIds.length === 0) return []
    return companies.value.filter(c => selectedIds.includes(c.id))
  }
  // Pour une vente B2B, retourner uniquement l'entreprise acheteuse si elle existe
  if (form.value.saleType === 'B2B' && form.value.buyerCompanyId) {
    const selectedCompany = companies.value.find(c => c.id === form.value.buyerCompanyId)
    return selectedCompany ? [selectedCompany] : []
  }
  return []
})

// Vérifier si on peut ajouter des commissions
const canAddCommissions = computed(() => {
  if (!isIntermediationType(form.value.saleType)) return false

  // Vérifier qu'au moins un contact ou une entreprise est sélectionné
  const hasContact = form.value.contactId || form.value.sellerContactId
  const hasCompany = form.value.buyerCompanyId || form.value.sellerCompanyId

  return hasContact || hasCompany
})

// Fonctions utilitaires pour le statut et le type de vente
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

const getSaleTypeLabel = (type?: string) => {
  switch (type) {
    case 'B2C':
      return 'Particulier'
    case 'B2B':
      return 'Professionnel'
    case 'B2B2B':
      return 'Intermédiation'
    case 'B2B2C':
      return 'Intermédiation B2B2C'
    case 'C2B2C':
      return 'Intermédiation C2B2C'
    case 'C2B2B':
      return 'Intermédiation C2B2B'
    default:
      return 'N/A'
  }
}

onMounted(async () => {
  try {
    await ownerStore.chargerDonneesOwner()
    await commissionStore.fetchCommissionTypes()
    await Promise.all([
      fetchReferences()
    ])

    // Définir l'ID de l'entreprise propriétaire après le chargement
    if (currentOwnerId.value) {
      form.value.ownerCompanyId = currentOwnerId.value
    }

    await fetchOrder()
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error)
    toast({
      title: 'Erreur',
      description: 'Erreur lors du chargement des données',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
})
</script> 