<!--
/**
 * Page de visualisation de commande
 * 
 * Cette page permet de visualiser tous les détails d'une commande existante.
 * Elle affiche les informations en lecture seule.
 * 
 * Fonctionnalités:
 * - Affichage des informations de la commande
 * - Affichage des parties impliquées (acheteur, vendeur)
 * - Liste des véhicules commandés
 * - Affichage des commissions (si applicable)
 * - Affichage des totaux
 * - Téléchargement de PDF
 */
-->

<template>
    <div>
        <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>

        <div v-else-if="error" class="p-4 bg-destructive/10 text-destructive rounded-md">
            <p>{{ error }}</p>
        </div>

        <div v-else-if="!order" class="p-4 bg-muted rounded-md">
            <p>Commande non trouvée</p>
        </div>

        <div v-else class="space-y-6">
            <!-- En-tête -->
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <Button variant="outline" size="icon" @click="router.back()">
                        <ArrowLeftIcon class="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 class="text-2xl font-bold">Commande {{ order.orderNumber }}</h1>
                        <p class="text-muted-foreground">{{ formatDate1(order.orderDate) }}</p>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <Button v-if="order.status === 'DRAFT'" variant="default" size="sm" @click="validateOrder">
                        <CheckCircleIcon class="h-4 w-4" />
                    </Button>
                    <Button v-if="order.status === 'VALIDATED'" variant="default" size="sm" @click="markAsPaid">
                        <CheckCircleIcon class="h-4 w-4" />
                    </Button>
                    <Button v-if="order.status !== 'CANCELLED'" variant="outline" size="sm" @click="cancelOrder">
                        <XCircleIcon class="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" @click="downloadPdf" :disabled="actionInProgress">
                        <DownloadIcon v-if="!actionInProgress" class="h-4 w-4 mr-2" />
                        <div v-else
                            class="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent">
                        </div>
                        PDF
                    </Button>
                </div>
            </div>

            <!-- Statut et Type -->
            <div class="flex items-center space-x-2">
                <Badge :variant="getStatusVariant(order.status)">
                    {{ getStatusLabel(order.status) }}
                </Badge>
                <Badge variant="outline">
                    {{ getSaleTypeLabel(order.saleType) }}
                </Badge>
            </div>

            <!-- Parties impliquées (Acheteur/Vendeur) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Informations acheteur -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-base font-semibold">
                            {{ order.saleType === 'B2C' ? 'Acheteur - Particulier' : 'Acheteur - Professionnel' }}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div v-if="order.saleType === 'B2C' && order.contact" class="space-y-2">
                            <p class="font-medium">{{ order.contact.name }}</p>
                            <p v-if="order.contact.first_name" class="text-sm text-muted-foreground">
                                {{ order.contact.first_name }} {{ order.contact.last_name }}
                            </p>
                            <p v-if="order.contact.country" class="text-sm text-muted-foreground">
                                {{ order.contact.country.name }}
                            </p>
                        </div>
                        <div v-else-if="order.buyerCompany" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Informations de l'entreprise -->
                            <div class="space-y-2">
                                <p class="font-medium">{{ order.buyerCompany.name }}</p>
                                <p v-if="order.buyerCompany.domain" class="text-sm text-muted-foreground">
                                    Activité : {{ order.buyerCompany.domain }}
                                </p>
                                <p v-if="order.buyerCompany.vat_number" class="text-sm text-muted-foreground">
                                    N° TVA : {{ order.buyerCompany.vat_number }}
                                </p>
                                <p v-if="order.buyerCompany.email" class="text-sm text-muted-foreground">
                                    Email : {{ order.buyerCompany.email }}
                                </p>
                                <p v-if="order.buyerCompany.phone" class="text-sm text-muted-foreground">
                                    Tél : {{ order.buyerCompany.phone }}
                                </p>
                            </div>

                            <!-- Adresse -->
                            <div v-if="buyerAddress" class="space-y-2 md:border-l md:pl-4">
                                <p class="font-medium">Adresse</p>
                                <div class="text-sm text-muted-foreground space-y-1">
                                    <p>{{ buyerAddress.street_number }} {{ buyerAddress.street_name }}</p>
                                    <p v-if="buyerAddress.address_line2">{{ buyerAddress.address_line2 }}</p>
                                    <p>{{ buyerAddress.postal_code }} {{ buyerAddress.city }}</p>
                                    <p v-if="buyerCountry">
                                        {{ buyerCountry.name }}
                                        <span v-if="buyerCountry.flag_emoji" class="ml-1">{{ buyerCountry.flag_emoji
                                        }}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Informations vendeur -->
                <Card v-if="order.sellerCompany">
                    <CardHeader>
                        <CardTitle class="text-base font-semibold">Vendeur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Informations de l'entreprise -->
                            <div class="space-y-2">
                                <p class="font-medium">{{ order.sellerCompany.name }}</p>
                                <p v-if="order.sellerCompany.domain" class="text-sm text-muted-foreground">
                                    Activité : {{ order.sellerCompany.domain }}
                                </p>
                                <p v-if="order.sellerCompany.vat_number" class="text-sm text-muted-foreground">
                                    N° TVA : {{ order.sellerCompany.vat_number }}
                                </p>
                                <p v-if="order.sellerCompany.email" class="text-sm text-muted-foreground">
                                    Email : {{ order.sellerCompany.email }}
                                </p>
                                <p v-if="order.sellerCompany.phone" class="text-sm text-muted-foreground">
                                    Tél : {{ order.sellerCompany.phone }}
                                </p>
                            </div>

                            <!-- Adresse -->
                            <div v-if="sellerAddress" class="space-y-2 md:border-l md:pl-4">
                                <p class="font-medium">Adresse</p>
                                <div class="text-sm text-muted-foreground space-y-1">
                                    <p>{{ sellerAddress.street_number }} {{ sellerAddress.street_name }}</p>
                                    <p v-if="sellerAddress.address_line2">{{ sellerAddress.address_line2 }}</p>
                                    <p>{{ sellerAddress.postal_code }} {{ sellerAddress.city }}</p>
                                    <p v-if="sellerCountry">
                                        {{ sellerCountry.name }}
                                        <span v-if="sellerCountry.flag_emoji" class="ml-1">{{ sellerCountry.flag_emoji
                                        }}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Contenu principal -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Liste des véhicules -->
                <div class="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Véhicules</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Référence</TableHead>
                                        <TableHead>Véhicule</TableHead>
                                        <TableHead>VIN</TableHead>
                                        <TableHead class="text-right">Prix HT</TableHead>
                                        <TableHead v-if="isIntermediationSaleType" class="text-right">Commissions
                                        </TableHead>
                                        <TableHead v-if="isIntermediationSaleType" class="text-right">Détail</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow v-for="item in order.items" :key="item.id">
                                        <TableCell class="font-medium">{{ item.vehicleInternalId }}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p>{{ item.vehicle?.brand }} {{ item.vehicle?.model }}</p>
                                                <p v-if="item.vehicle?.version" class="text-sm text-muted-foreground">
                                                    {{ item.vehicle.version }}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{{ item.vehicle?.vin || 'N/A' }}</TableCell>
                                        <TableCell class="text-right">{{ formatCurrency(item.totalHt) }}</TableCell>
                                        <TableCell v-if="isIntermediationSaleType" class="text-right">
                                            {{ formatCurrency(getTotalCommissionsForItem(item)) }}
                                        </TableCell>
                                        <TableCell v-if="isIntermediationSaleType" class="text-right">
                                            <div v-for="commission in item.commissions" :key="commission.id"
                                                class="text-xs">
                                                <span class="ml-2">{{ commission.metadata?.recipient_name }}</span>
                                                <span class="ml-2 font-medium">{{ formatCurrency(commission.amount)
                                                }}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <!-- Notes -->
                    <Card v-if="order.comments">
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="whitespace-pre-wrap">{{ order.comments }}</p>
                        </CardContent>
                    </Card>
                </div>

                <!-- Sidebar -->
                <div class="space-y-4 md:sticky md:top-24 md:self-start">
                    <!-- Commissions -->
                    <Card v-if="isIntermediationSaleType">
                        <CardHeader>
                            <CardTitle class="text-base font-semibold">Récapitulatif des commissions</CardTitle>
                            <p class="text-sm text-muted-foreground">
                                Payées par : {{ commissionPayer === 'seller' ? 'Vendeur' : 'Acheteur' }}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div class="space-y-4">
                                <div v-for="(total, recipientName) in commissionsByRecipient" :key="recipientName"
                                    class="space-y-2 py-2 border-b last:border-b-0">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="text-sm font-medium mt-1">
                                                {{ total.name }}
                                            </p>
                                        </div>
                                        <span class="font-medium">{{ formatCurrency(total.amount) }}</span>
                                    </div>
                                </div>

                                <!-- Total des commissions -->
                                <div class="flex justify-between items-center font-semibold">
                                    <span>Total Commissions</span>
                                    <span>{{ formatCurrency(totalCommissions) }}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Totaux -->
                    <Card>
                        <CardHeader>
                            <CardTitle class="text-base font-semibold">Totaux</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-sm">Total HT</span>
                                    <span class="font-medium">{{ formatCurrency(order.totalHt) }}</span>
                                </div>
                                <div class="flex justify-between text-muted-foreground">
                                    <span class="text-sm">TVA</span>
                                    <span>{{ formatCurrency(order.totalTva) }}</span>
                                </div>
                                <div class="flex justify-between font-bold">
                                    <span>Total TTC</span>
                                    <span>{{ formatCurrency(order.totalTtc) }}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <Dialog v-if="showPdfPreview" :open="showPdfPreview">
            <DialogContent class="min-w-[95vw] h-[95vh]">
                <PdfPreview :pdf-blob="pdfBuffer" :filename="`bon_commande_${order?.orderNumber}.pdf`"
                    @close="showPdfPreview = false" />
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, DownloadIcon, CheckCircleIcon, XCircleIcon, FileDownIcon } from 'lucide-vue-next'
import { useOrderDetailStore } from '@/modules/orders/stores/useOrderDetailStore'
import { useOrderOperations } from '@/modules/orders/composables/useOrderOperations'
import { formatDate1, formatCurrency } from '~/utils/formatter'
import type { OrderWithRelations, OrderItemWithRelations, VehicleCommission, Company, CountryInfo } from '../../types/index'
import { useOrderIntermediation } from '../../composables/useOrderIntermediation'
import { useToast } from '@/components/ui/toast/use-toast'
import { exportToPdf } from '~/utils/pdf'
import PdfPreview from '@/components/PdfPreview.vue'
import {
    Dialog,
    DialogContent
} from '@/components/ui/dialog'

interface Commission extends VehicleCommission {
    metadata: {
        recipient_type: string
        recipient_id: number
        recipient_name?: string
    }
}

interface OrderItemWithCommissions extends OrderItemWithRelations {
    commissions?: Commission[]
}

interface ExtendedOrder extends OrderWithRelations {
    items: OrderItemWithCommissions[]
    metadata?: {
        commission_payer?: 'seller' | 'buyer'
    }
}

// Import des composants UI
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '~/components/ui/table'

const route = useRoute()
const router = useRouter()
const store = useOrderDetailStore()
const { isIntermediationType } = useOrderIntermediation()
const { downloadOrderPdf, cancelOrder: cancelOrderAction, validateOrder: validateOrderAction, markOrderAsPaid } = useOrderOperations()
const { toast } = useToast()

const orderId = computed(() => Number(route.params.id))
const loading = computed(() => store.loading)
const order = computed<OrderWithAddresses | null>(() => {
    const orderData = store.order as OrderWithRelations | null
    if (!orderData) return null

    return {
        ...orderData,
        sellerCompany: orderData.sellerCompany ? {
            ...orderData.sellerCompany,
            address: (orderData.sellerCompany as any).address as Address | undefined
        } : undefined,
        buyerCompany: orderData.buyerCompany ? {
            ...orderData.buyerCompany,
            address: (orderData.buyerCompany as any).address as Address | undefined
        } : undefined
    } as OrderWithAddresses
})
const error = computed(() => store.error)
const actionInProgress = ref(false)

// Récupérer les commissions à partir du store
const orderCommissions = computed(() => store.getAllCommissions)

// Récupérer les adresses et pays
const buyerAddress = computed(() => store.buyerAddress)
const sellerAddress = computed(() => store.sellerAddress)
const buyerCountry = computed(() => store.buyerCountry)
const sellerCountry = computed(() => store.sellerCountry)
const formattedBuyerAddress = computed(() => store.formattedBuyerAddress)
const formattedSellerAddress = computed(() => store.formattedSellerAddress)

// Vérifier si la commande est de type intermédiation
const isIntermediationSaleType = computed(() => {
    if (!order.value) return false
    return isIntermediationType(order.value.saleType)
})

// Déterminer qui paie les commissions
const commissionPayer = computed(() => {
    if (!order.value?.sellerCompany || !order.value.items?.[0]?.commissions?.[0]) {
        console.log("Données manquantes pour commissionPayer")
        return null
    }

    const firstCommission = order.value.items[0].commissions[0]
    const sellerName = order.value.sellerCompany.name

    console.log("firstCommission", firstCommission)
    console.log("sellerName", sellerName)
    console.log("recipient_name", firstCommission.metadata?.recipient_name)

    const result = firstCommission.metadata?.recipient_name === sellerName ? 'seller' : 'buyer'
    console.log("commissionPayer result:", result)
    return result
})

// Calculer le total des commissions
const totalCommissions = computed(() => {
    if (!order.value?.items) return 0
    return order.value.items.reduce((total, item) => {
        if (!item.commissions) return total
        return total + item.commissions.reduce((itemTotal, commission) => {
            return itemTotal + (commission.amount || 0)
        }, 0)
    }, 0)
})

// Fonctions utilitaires
const getStatusLabel = (status?: string) => {
    switch (status) {
        case 'DRAFT':
            return 'Brouillon'
        case 'PENDING':
            return 'En attente'
        case 'VALIDATED':
            return 'Validée'
        case 'PAID':
            return 'Payée'
        case 'CANCELLED':
            return 'Annulée'
        default:
            return 'Brouillon'
    }
}

const getStatusVariant = (status?: string) => {
    switch (status) {
        case 'DRAFT':
            return 'secondary'
        case 'PENDING':
            return 'outline'
        case 'VALIDATED':
            return 'default'
        case 'PAID':
            return 'default'
        case 'CANCELLED':
            return 'destructive'
        default:
            return 'secondary'
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

const getRecipientType = (type?: string) => {
    switch (type) {
        case 'company':
            return 'Entreprise'
        case 'contact':
            return 'Contact'
        case 'owner':
            return 'Propriétaire'
        default:
            return 'N/A'
    }
}

const getTotalCommissionsForItem = (item: OrderItemWithRelations) => {
    if (!item.commissions) return 0
    return item.commissions.reduce((total, commission) => total + (commission.amount || 0), 0)
}

const commissionsByRecipient = computed(() => {
    if (!order.value?.items) {
        console.log("Pas d'items dans la commande")
        return {}
    }

    const totals: Record<string, { type: string; name: string; amount: number; details: Array<{ vehicleRef: string, amount: number }> }> = {}

    order.value.items.forEach(item => {
        console.log("Traitement de l'item", item.vehicleInternalId)
        if (!item.commissions) {
            console.log("Pas de commissions pour l'item", item.vehicleInternalId)
            return
        }

        console.log("Traitement des commissions pour l'item", item.vehicleInternalId, item.commissions)

        item.commissions.forEach(commission => {
            if (!commission.metadata?.recipient_name) {
                console.log("Métadonnées manquantes pour la commission", commission)
                return
            }

            const recipientName = commission.metadata.recipient_name
            if (!totals[recipientName]) {
                totals[recipientName] = {
                    type: commission.metadata.recipient_type,
                    name: recipientName,
                    amount: 0,
                    details: []
                }
            }
            totals[recipientName].amount += commission.amount || 0
            totals[recipientName].details.push({
                vehicleRef: item.vehicleInternalId,
                amount: commission.amount || 0
            })
            console.log("Commission traitée:", commission)
        })
    })

    console.log("Totaux calculés:", totals)

    // Trier par montant décroissant
    const sortedTotals = Object.fromEntries(
        Object.entries(totals)
            .sort(([, a], [, b]) => b.amount - a.amount)
    )

    console.log("Totaux triés:", sortedTotals)
    return sortedTotals
})

// Types
interface Address {
    street?: string
    street2?: string
    zip_code?: string
    city?: string
    country?: string
}

interface CompanyWithAddress extends Omit<Company, 'address'> {
    domain?: string
    email?: string
    phone?: string
    address?: Address
}

interface OrderWithAddresses extends Omit<OrderWithRelations, 'sellerCompany' | 'buyerCompany'> {
    sellerCompany?: CompanyWithAddress
    buyerCompany?: CompanyWithAddress
}

// Fonction pour formater l'adresse
function formatAddress(address?: Address): string {
    if (!address) return ''

    const parts = [
        address.street,
        address.street2,
        `${address.zip_code || ''} ${address.city || ''}`,
        address.country || ''
    ].filter(Boolean)

    return parts.join('\n')
}

// État local pour la prévisualisation PDF
const showPdfPreview = ref(false)
const pdfBuffer = ref<Uint8Array | null>(null)

// Fonction de téléchargement du PDF
async function downloadPdf() {  
    if (!order.value) {
        toast({
            title: 'Erreur',
            description: 'Données de commande non disponibles',
            variant: 'destructive'
        })
        return
    }

    console.log("sellerCountry", sellerCountry.value)
    const sellerAddress = formattedSellerAddress.value + ' - ' + sellerCountry.value?.name.toUpperCase()
    const buyerAddress = formattedBuyerAddress.value + ' - ' + buyerCountry.value?.name.toUpperCase()

    try {
        actionInProgress.value = true

        // Préparer les données pour le PDF
        const pdfData = {
            template: 'order' as const,
            data: {
                order: order.value,
                orderNumber: order.value.orderNumber,
                orderDate: order.value.orderDate,
                items: order.value.items || [],
                totalHt: order.value.totalHt || 0,
                totalTtc: order.value.totalTtc || 0,
                formattedSellerAddress: sellerAddress,
                formattedBuyerAddress: buyerAddress
            }
        }

        // Générer le PDF
        const buffer = await exportToPdf(pdfData)
        if (!buffer) {
            throw new Error('Erreur lors de la génération du PDF')
        }

        // Stocker le buffer et afficher la prévisualisation
        pdfBuffer.value = buffer
        showPdfPreview.value = true

    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error)
        toast({
            title: 'Erreur',
            description: 'Erreur lors de la génération du PDF',
            variant: 'destructive'
        })
    } finally {
        actionInProgress.value = false
    }
}

// Actions sur la commande
const cancelOrder = async () => {
    if (!orderId.value || actionInProgress.value) return

    if (confirm(`Êtes-vous sûr de vouloir annuler la commande ${order.value?.orderNumber} ?`)) {
        actionInProgress.value = true
        const success = await cancelOrderAction(orderId.value)
        if (success) {
            // Recharger les données de la commande
            await store.fetchOrderById(orderId.value)
        }
        actionInProgress.value = false
    }
}

const validateOrder = async () => {
    if (!orderId.value || actionInProgress.value) return

    actionInProgress.value = true
    const success = await validateOrderAction(orderId.value)
    if (success) {
        // Recharger les données de la commande
        await store.fetchOrderById(orderId.value)
    }
    actionInProgress.value = false
}

const markAsPaid = async () => {
    if (!orderId.value || actionInProgress.value) return

    actionInProgress.value = true
    const success = await markOrderAsPaid(orderId.value)
    if (success) {
        // Recharger les données de la commande
        await store.fetchOrderById(orderId.value)
    }
    actionInProgress.value = false
}

// Chargement des données
onMounted(async () => {
    if (orderId.value) {
        await store.fetchOrderById(orderId.value)
        if (store.error) {
            console.error('Erreur lors du chargement de la commande:', store.error)
        }
    }
})
</script>