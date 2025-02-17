<template>
  <Card class="w-full">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="text-base font-semibold">Commissions</CardTitle>
        <Button variant="outline" size="sm" @click="openAddCommissionDialog">
          <PlusIcon class="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="groupedCommissions.length > 0" class="space-y-4">
        <div v-for="group in groupedCommissions" :key="group.recipientKey" class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <h3 class="text-lg font-semibold">{{ group.recipientName }}</h3>
              <Badge>{{ formatCurrency(group.total) }}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              @click="removeCommissionGroup(group.commissions)"
            >
              <Trash2Icon class="w-4 h-4" />
            </Button>
          </div>
          <div class="pl-4 space-y-1">
            <div v-for="(commission, index) in group.commissions" :key="commission.id" class="text-sm text-gray-600">
              {{ getVehicleReference(commission.order_item_id, index) }} - {{ formatCurrency(commission.amount) }}
            </div>
          </div>
          <Separator />
        </div>
      </div>
      <div v-else class="text-center text-gray-500">
        Aucune commission
      </div>
    </CardContent>
  </Card>

  <AddCommissionDialog
    v-model:open="showAddCommissionDialog"
    :owner-id="ownerId"
    :order-items="orderItems"
    :contacts="contacts"
    :companies="companies"
    @update:open="(value) => showAddCommissionDialog = value"
    @add="handleAddCommission"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from '#imports'
import { PlusIcon, Trash2Icon } from 'lucide-vue-next'
import { formatCurrency } from '~/utils/formatter'
import { useCommissionStore } from '@/stores/useCommissionStore'
import { toast } from 'vue-sonner'
import AddCommissionDialog from './AddCommissionDialog.vue'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Separator
} from '#components'

interface Vehicle {
  id: number
  internal_id: string
  model: string
  vin: string
}

interface OrderItem {
  id: number
  vehicle?: Vehicle
}

interface Recipient {
  id: number
  name: string
}

interface VehicleCommission {
  id: number
  recipient_type: 'owner' | 'contact' | 'company'
  recipient_id: number
  order_item_id: number | null
  amount: number
  recipient?: Recipient
  order_item?: {
    id: number
    vehicle_id: number
    vehicle: Vehicle
  }
}

const props = defineProps<{
  modelValue: VehicleCommission[]
  orderItems: OrderItem[]
  contacts: Recipient[]
  companies: Recipient[]
  ownerId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: VehicleCommission[]]
}>()

const commissionStore = useCommissionStore()
const showAddCommissionDialog = ref(false)

// Calcul du total des commissions
const totalCommissions = computed(() => 
  props.modelValue.reduce((sum, commission) => sum + commission.amount, 0)
)

interface CommissionGroup {
  recipientKey: string
  recipientType: VehicleCommission['recipient_type']
  recipientId: number
  recipientName: string
  commissions: VehicleCommission[]
  total: number
}

// Dans la partie script, ajouter le computed pour grouper les commissions
const groupedCommissions = computed(() => {
  const groups = props.modelValue.reduce((acc, commission) => {
    const recipientKey = `${commission.recipient_type}-${commission.recipient_id}`
    if (!acc[recipientKey]) {
      acc[recipientKey] = {
        recipientKey,
        recipientType: commission.recipient_type,
        recipientId: commission.recipient_id,
        recipientName: getRecipientName(commission),
        commissions: [],
        total: 0
      }
    }
    acc[recipientKey].commissions.push(commission)
    acc[recipientKey].total += commission.amount
    return acc
  }, {} as Record<string, CommissionGroup>)

  return Object.values(groups)
})

// Fonction pour obtenir le nom du destinataire
const getRecipientName = (commission: VehicleCommission) => {
  switch (commission.recipient_type) {
    case 'owner':
      return 'Ma société'
    case 'contact':
      const contact = props.contacts.find(c => c.id === commission.recipient_id)
      return contact?.name || ''
    case 'company':
      const company = props.companies.find(c => c.id === commission.recipient_id)
      return company?.name || ''
    default:
      return ''
  }
}

// Helpers pour l'affichage
const getVehicleReference = (orderItemId: number | null, index: number) => {
  if (orderItemId === null || orderItemId === undefined) return ''
  
  // Si order_item_id vaut 0, on utilise l'index pour retrouver le bon véhicule
  if (orderItemId === 0 && props.orderItems.length > index) {
    return props.orderItems[index].vehicle?.internal_id || 'Référence introuvable'
  }
  
  const item = props.orderItems.find(i => i.id === orderItemId)
  return item?.vehicle?.internal_id || 'Référence introuvable'
}

// Actions
const openAddCommissionDialog = () => {
  if (!props.ownerId) {
    toast.error('Veuillez sélectionner une société avant d\'ajouter une commission')
    return
  }
  showAddCommissionDialog.value = true
}

const handleAddCommission = (commission: VehicleCommission | VehicleCommission[]) => {
  const newCommissions = Array.isArray(commission) ? commission : [commission]
  const commissions = [...props.modelValue, ...newCommissions]
  emit('update:modelValue', commissions)
  showAddCommissionDialog.value = false
}

// Modifier la fonction removeCommission pour gérer la suppression d'un groupe
const removeCommissionGroup = (commissionsToRemove: VehicleCommission[]) => {
  const orderItemIds = commissionsToRemove.map(c => c.order_item_id)
  const commissions = props.modelValue.filter(c => !orderItemIds.includes(c.order_item_id))
  emit('update:modelValue', commissions)
}
</script> 