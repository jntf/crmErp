<!--
/**
 * Composant d'affichage et de gestion des commissions
 * 
 * Ce composant permet d'afficher la liste des commissions regroupées par bénéficiaire,
 * d'ajouter de nouvelles commissions et de supprimer des commissions existantes.
 * 
 * @component
 * 
 * Props:
 * - modelValue: Liste des commissions à afficher
 * - orderItems: Liste des articles de commande associés aux commissions
 * - ownerId: ID du propriétaire actuel
 * - contacts: Liste des contacts disponibles comme bénéficiaires
 * - companies: Liste des entreprises disponibles comme bénéficiaires
 * 
 * Events:
 * - update:modelValue: Émis lorsque la liste des commissions est modifiée
 * 
 * Fonctionnalités:
 * - Affichage des commissions regroupées par bénéficiaire
 * - Calcul des totaux par bénéficiaire
 * - Ajout de nouvelles commissions via un dialogue
 * - Suppression de commissions individuelles ou par groupe
 */
-->

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
import { ref, computed, watch, nextTick } from '#imports'
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
import type { VehicleCommission } from '../types'

interface Vehicle {
  id: number
  internal_id: string
  model: string
  vin: string | null
}

interface OrderItem {
  id: number
  vehicle?: Vehicle
}

interface Recipient {
  id: number
  name: string
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

// Computed pour les commissions groupées par bénéficiaire
const groupedCommissions = computed(() => {
  // Grouper les commissions par type et ID de bénéficiaire
  const groups: Record<string, VehicleCommission[]> = {}
  
  props.modelValue.forEach(commission => {
    const key = `${commission.recipient_type}-${commission.recipient_id}`
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(commission)
  })
  
  // Convertir en tableau pour l'affichage
  const result = Object.entries(groups).map(([key, commissions]) => {
    const [recipientType, recipientId] = key.split('-')
    const total = commissions.reduce((sum, c) => sum + c.amount, 0)
    
    return {
      recipientKey: key,
      recipientType: recipientType as VehicleCommission['recipient_type'],
      recipientId: Number(recipientId),
      recipientName: getRecipientName(recipientType as VehicleCommission['recipient_type'], Number(recipientId)),
      commissions,
      total
    }
  })
  
  return result
})

// Fonction pour obtenir le nom du destinataire
const getRecipientName = (recipientType: VehicleCommission['recipient_type'], recipientId: number) => {
  switch (recipientType) {
    case 'owner':
      return 'Ma société'
    case 'contact':
      const contact = props.contacts.find(c => c.id === recipientId)
      return contact?.name || ''
    case 'company':
      const company = props.companies.find(c => c.id === recipientId)
      return company?.name || ''
    default:
      return ''
  }
}

// Helpers pour l'affichage
const getVehicleReference = (orderItemId: number | null, index: number) => {
  if (orderItemId === null || orderItemId === undefined) return 'Référence introuvable'
  
  // Si order_item_id vaut 0, on cherche d'abord par vehicleId
  if (orderItemId === 0) {
    // Récupérer la commission correspondante
    const commission = props.modelValue[index]
    if (commission?.vehicleId) {
      // Chercher l'article par vehicleId
      const matchingItem = props.orderItems.find(item => {
        // Comparer les vehicleId en tenant compte des différents formats possibles
        if (typeof commission.vehicleId === 'string' && typeof item.vehicle?.id === 'string') {
          // Si les deux sont des chaînes, comparaison directe
          return commission.vehicleId === item.vehicle.id;
        } else if (typeof commission.vehicleId === 'number' && typeof item.vehicle?.id === 'number') {
          // Si les deux sont des nombres, comparaison directe
          return commission.vehicleId === item.vehicle.id;
        } else if (commission.vehicleUuid && typeof item.vehicle?.id === 'string') {
          // Si on a un UUID stocké séparément, l'utiliser pour la comparaison
          return commission.vehicleUuid === item.vehicle.id;
        }
        
        // Fallback: convertir en chaînes pour la comparaison
        return String(commission.vehicleId) === String(item.vehicle?.id);
      });
      
      if (matchingItem?.vehicle?.internal_id) {
        return matchingItem.vehicle.internal_id
      }
    }
    
    // Fallback: utiliser l'index pour trouver un article
    if (props.orderItems.length > 0) {
      const orderItemIndex = index % props.orderItems.length
      return props.orderItems[orderItemIndex]?.vehicle?.internal_id || 'Référence introuvable'
    }
  }
  
  // Recherche par ID d'article
  const item = props.orderItems.find(i => i.id === orderItemId)
  if (item?.vehicle?.internal_id) {
    return item.vehicle.internal_id
  }
  
  // Fallback: si l'item n'est pas trouvé, on utilise l'index pour trouver un article
  if (props.orderItems.length > 0) {
    const orderItemIndex = index % props.orderItems.length
    return props.orderItems[orderItemIndex]?.vehicle?.internal_id || 'Référence introuvable'
  }
  
  return 'Référence introuvable'
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
  
  // Vérifier que chaque commission a un ID et un vehicleId
  const validatedCommissions = newCommissions.map(comm => {
    if (!comm.id) {
      return { ...comm, id: Math.floor(Math.random() * -1000) }
    }
    
    // Vérifier que vehicleId est valide (peut être un UUID ou un nombre)
    const hasValidVehicleId = comm.vehicleId !== null && comm.vehicleId !== undefined;
    
    if (!hasValidVehicleId) {
      // Essayer de trouver un vehicleId via order_item_id
      if (comm.order_item_id) {
        const matchingItem = props.orderItems.find(item => item.id === comm.order_item_id);
        if (matchingItem?.vehicle?.id) {
          return { 
            ...comm, 
            vehicleId: matchingItem.vehicle.id,
            vehicleUuid: typeof matchingItem.vehicle.id === 'string' ? matchingItem.vehicle.id : null
          };
        }
      }
    }
    
    return comm
  })
  
  // Filtrer les commissions sans vehicleId valide
  const filteredCommissions = validatedCommissions.filter(comm => {
    const hasValidVehicleId = comm.vehicleId !== null && comm.vehicleId !== undefined;
    
    if (!hasValidVehicleId) {
      return false;
    }
    
    return true;
  });
  
  if (filteredCommissions.length === 0) {
    toast.error('Impossible d\'ajouter des commissions: données invalides');
    return;
  }
  
  const commissions = [...props.modelValue, ...filteredCommissions]
  
  emit('update:modelValue', commissions)
  showAddCommissionDialog.value = false
  
  // Forcer une mise à jour du composant
  nextTick(() => {
    // Mise à jour forcée
  })
}

// Modifier la fonction removeCommission pour gérer la suppression d'un groupe
const removeCommissionGroup = (commissionsToRemove: VehicleCommission[]) => {
  // Créer un identifiant unique pour chaque commission (combinaison de order_item_id et vehicleId)
  const getCommissionKey = (commission: VehicleCommission) => {
    return `${commission.order_item_id}-${commission.vehicleId || 'null'}`
  }
  
  // Créer un ensemble de clés à supprimer
  const keysToRemove = new Set(commissionsToRemove.map(getCommissionKey))
  
  // Filtrer les commissions qui ne sont pas dans l'ensemble à supprimer
  const commissions = props.modelValue.filter(commission => 
    !keysToRemove.has(getCommissionKey(commission))
  )
  
  emit('update:modelValue', commissions)
}
</script> 