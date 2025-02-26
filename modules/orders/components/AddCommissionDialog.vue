<!--
/**
 * Composant de dialogue pour l'ajout de commissions
 * 
 * Ce composant permet d'ajouter des commissions à un ou plusieurs articles de commande.
 * Il gère la sélection du type de commission, du bénéficiaire et le calcul du montant
 * selon les règles définies pour chaque type de commission.
 * 
 * @component
 * 
 * Props:
 * - open: Contrôle l'affichage du dialogue
 * - ownerId: ID du propriétaire actuel
 * - orderItems: Liste des articles de commande disponibles pour l'ajout de commissions
 * - contacts: Liste des contacts disponibles comme bénéficiaires
 * - companies: Liste des entreprises disponibles comme bénéficiaires
 * 
 * Events:
 * - update:open: Émis lorsque l'état d'ouverture du dialogue change
 * - add: Émis lorsqu'une commission est ajoutée, avec les données de la commission
 * 
 * Fonctionnalités:
 * - Sélection du type de commission
 * - Sélection du bénéficiaire (propriétaire, contact ou entreprise)
 * - Calcul automatique du montant selon le type (pourcentage ou montant fixe)
 * - Validation des montants min/max
 * - Application à un ou plusieurs véhicules
 */
-->

<template>
  <Dialog :open="open" modal>
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Ajouter une commission</DialogTitle>
        <DialogDescription>
          Configurez la commission pour un véhicule spécifique ou pour tous les véhicules.
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">

        <!-- Type de commission -->
        <div class="space-y-2">
          <Label>Type de commission</Label>
          <Select 
            :model-value="form.commission_type_id ? form.commission_type_id.toString() : ''"
            @update:model-value="value => {
              form.commission_type_id = value ? parseInt(value) : null
              onCommissionTypeSelect()
            }"
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem 
                  v-for="type in commissionTypes" 
                  :key="type.id" 
                  :value="type.id.toString()"
                >
                  {{ type.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <!-- Taux ou Montant fixe selon le type -->
        <div class="space-y-2">
          <template v-if="currentCommissionSettings?.calculationType === 'fixed_amount'">
            <div class="flex justify-between items-center">
              <Label>Montant fixe</Label>
              <span class="text-sm text-muted-foreground">
                Min: {{ formatCurrency(currentCommissionSettings.minAmount) }} - 
                Max: {{ formatCurrency(currentCommissionSettings.maxAmount) }}
              </span>
            </div>
            <Input 
              v-model.number="form.amount" 
              type="number" 
              :min="currentCommissionSettings.hasMinAmount ? currentCommissionSettings.minAmount : 0"
              :max="currentCommissionSettings.hasMaxAmount ? currentCommissionSettings.maxAmount : null"
              step="0.01"
            />
          </template>
          
          <template v-if="currentCommissionSettings?.calculationType === 'percentage'">
            <div class="flex justify-between items-center">
              <Label>Taux (%)</Label>
              <span class="text-sm text-muted-foreground">
                {{ currentCommissionSettings?.hasMinAmount ? `Min: ${formatCurrency(currentCommissionSettings.minAmount)}` : '' }}
                {{ currentCommissionSettings?.hasMaxAmount ? ` - Max: ${formatCurrency(currentCommissionSettings.maxAmount)}` : '' }}
              </span>
            </div>
            <Input 
              v-model.number="form.rate" 
              type="number" 
              min="0" 
              max="100" 
              step="0.01"
              @input="calculateAmount"
            />
          </template>
        </div>

        <!-- Montant calculé (affiché uniquement pour le mode pourcentage) -->
        <div v-if="currentCommissionSettings?.calculationType !== 'fixed_amount'" class="space-y-2">
          <Label>Montant calculé {{ form.applyToAll ? '(par véhicule)' : '' }}</Label>
          <div class="flex flex-col gap-1">
            <div class="text-lg font-bold">
              {{ formatCurrency(form.amount) }}
            </div>
            <div v-if="form.applyToAll" class="text-sm text-muted-foreground">
              Total pour {{ orderItems.length }} véhicules : {{ formatCurrency(form.amount * orderItems.length) }}
            </div>
            <div v-if="form.amount > 0" class="text-sm" :class="{
              'text-yellow-600': isNearLimits,
              'text-red-600': isOutsideLimits,
              'text-green-600': isWithinLimits
            }">
              {{ getAmountValidationMessage }}
            </div>
          </div>
        </div>

        <!-- Destinataire de la facture -->
        <div class="space-y-2">
          <Label>Destinataire de la facture</Label>
          <Select 
            :model-value="form.recipientType || ''"
            @update:model-value="value => {
              if (value === 'owner' || value === 'contact' || value === 'company' || value === null) {
                form.recipientType = value
              }
            }"
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez le destinataire" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-if="ownerId" value="owner">Ma société</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="company">Entreprise</SelectItem>
            </SelectContent>
          </Select>

          <div v-if="form.recipientType" class="mt-2">
            <Label>{{ recipientTypeLabel }}</Label>
            <Select 
              :model-value="form.recipientId ? form.recipientId.toString() : ''"
              @update:model-value="value => form.recipientId = value ? parseInt(value) : null"
            >
              <SelectTrigger>
                <SelectValue :placeholder="`Sélectionnez ${recipientTypeLabel.toLowerCase()}`" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem 
                    v-for="item in recipientList" 
                    :key="item.id" 
                    :value="item.id.toString()"
                  >
                    {{ item.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>

      <DialogFooter>
        <Button variant="ghost" type="button" @click="closeDialog">
          Annuler
        </Button>
        <Button type="submit" @click="handleSubmit" :disabled="!isValid">
          Ajouter
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatCurrency } from '~/utils/formatter'
import { useCommissionStore } from '@/stores/useCommissionStore'
import { useOwnerStore } from '@/stores/useOwnerStore'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Button,
  Label,
  Input,
  Checkbox,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components'

const props = defineProps<{
  open: boolean
  orderItems: any[]
  contacts: any[]
  companies: any[]
  ownerId?: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'add': [commission: any | any[]]
}>()

const commissionStore = useCommissionStore()
const ownerStore = useOwnerStore()

// État du formulaire
const form = ref({
  applyToAll: true,
  order_item_id: null as number | null,
  commission_type_id: null as number | null,
  rate: 0,
  amount: 0,
  recipientType: null as 'owner' | 'contact' | 'company' | null,
  recipientId: null as number | null
})

// Récupération des settings de l'owner
const ownerSettings = computed(() => ownerStore.commissionSettings)

// Types de commission actifs (maintenant basés sur les settings de l'owner)
const commissionTypes = computed(() => {
  if (!ownerSettings.value) return []
  return ownerSettings.value.map((setting: any) => ({
    id: setting.commission_type_id,
    name: setting.commission_type.name,
    description: setting.commission_type.description,
    settings: setting.settings
  }))
})

// Récupération des settings pour le type de commission sélectionné
const currentCommissionSettings = computed(() => {
  if (!form.value.commission_type_id || !ownerSettings.value) return null
  return ownerSettings.value.find((setting: any) => 
    setting.commission_type_id === form.value.commission_type_id
  )?.settings
})

// Label du type de destinataire
const recipientTypeLabel = computed(() => {
  switch (form.value.recipientType) {
    case 'owner':
      return 'Société'
    case 'contact':
      return 'Contact'
    case 'company':
      return 'Entreprise'
    default:
      return ''
  }
})

// Liste des destinataires selon le type
const recipientList = computed(() => {
  switch (form.value.recipientType) {
    case 'owner':
      return props.ownerId ? [{ id: props.ownerId, name: 'Ma société' }] : []
    case 'contact':
      return props.contacts
    case 'company':
      return props.companies
    default:
      return []
  }
})

// Validation du formulaire avec les règles de l'owner
const isValid = computed(() => {
  if (!form.value.applyToAll && !form.value.order_item_id) return false
  if (!form.value.commission_type_id) return false
  if (!form.value.recipientType || !form.value.recipientId) return false

  const settings = currentCommissionSettings.value
  if (!settings) return false

  // Validation du montant selon les settings
  if (settings.hasMinAmount && form.value.amount < settings.minAmount) {
    return false
  }
  if (settings.hasMaxAmount && form.value.amount > settings.maxAmount) {
    return false
  }

  return true
})

// Sélection du type de commission
const onCommissionTypeSelect = () => {
  const settings = currentCommissionSettings.value
  if (!settings) return

  // Réinitialiser le montant
  form.value.amount = 0
  
  // Si c'est un montant fixe, on applique directement le montant fixe
  if (settings.calculationType === 'fixed_amount') {
    form.value.rate = 0
    form.value.amount = settings.fixedAmount
  } else {
    // Sinon on applique le pourcentage par défaut
    form.value.rate = settings.percentage || 0
    calculateAmount()
  }
}

// Calcul du montant de la commission en tenant compte des settings
const calculateAmount = () => {
  const settings = currentCommissionSettings.value
  if (!settings) return

  let baseAmount = 0
  
  // Calcul du montant de base
  if (!form.value.applyToAll && form.value.order_item_id) {
    const selectedItem = props.orderItems.find(item => item.id === form.value.order_item_id)
    if (selectedItem) {
      baseAmount = selectedItem.sellingPriceHt
    }
  } else if (form.value.applyToAll) {
    if (props.orderItems.length > 0) {
      baseAmount = props.orderItems.reduce((sum, item) => sum + item.sellingPriceHt, 0) / props.orderItems.length
    }
  }

  // Application des règles de calcul selon les settings
  if (settings.calculationType === 'fixed_amount') {
    form.value.amount = settings.fixedAmount
  } else {
    // Calcul basé sur le pourcentage
    let calculatedAmount = baseAmount * (form.value.rate / 100)
    
    // Application des limites min/max
    if (settings.hasMinAmount && calculatedAmount < settings.minAmount) {
      calculatedAmount = settings.minAmount
    }
    if (settings.hasMaxAmount && calculatedAmount > settings.maxAmount) {
      calculatedAmount = settings.maxAmount
    }
    
    form.value.amount = calculatedAmount
  }
}

// Soumission du formulaire avec validation des règles de l'owner
const handleSubmit = () => {
  if (!isValid.value) {
    // Message d'erreur plus précis selon la règle non respectée
    if (ownerSettings.value) {
      const settings = ownerSettings.value.settings
      if (settings.hasMinAmount && form.value.amount < settings.minAmount) {
        toast.error(`Le montant minimum de la commission doit être de ${formatCurrency(settings.minAmount)}`)
        return
      }
      if (settings.hasMaxAmount && form.value.amount > settings.maxAmount) {
        toast.error(`Le montant maximum de la commission ne peut pas dépasser ${formatCurrency(settings.maxAmount)}`)
        return
      }
    }
    toast.error('Veuillez remplir tous les champs requis')
    return
  }

  if (form.value.applyToAll) {
    const commissions = props.orderItems.map(item => ({
      order_item_id: item.id,
      commission_type_id: form.value.commission_type_id,
      rate: form.value.rate,
      amount: form.value.amount,
      recipient_type: form.value.recipientType,
      recipient_id: form.value.recipientId
    }))
    emit('add', commissions)
  } else {
    const commission = {
      order_item_id: form.value.order_item_id,
      commission_type_id: form.value.commission_type_id,
      rate: form.value.rate,
      amount: form.value.amount,
      recipient_type: form.value.recipientType,
      recipient_id: form.value.recipientId
    }
    emit('add', commission)
  }

  emit('update:open', false)
  resetForm()
}

// Fonction utilitaire pour calculer le montant de la commission pour un véhicule
const calculateCommissionAmount = (baseAmount: number) => {
  const settings = currentCommissionSettings.value
  if (!settings) return 0

  if (settings.calculationType === 'fixed_amount') {
    return settings.fixedAmount
  }

  let amount = baseAmount * (form.value.rate / 100)
  
  if (settings.hasMinAmount && amount < settings.minAmount) {
    return settings.minAmount
  }
  if (settings.hasMaxAmount && amount > settings.maxAmount) {
    return settings.maxAmount
  }
  
  return amount
}

// Réinitialisation du formulaire
const resetForm = () => {
  form.value = {
    applyToAll: true,
    order_item_id: null,
    commission_type_id: null,
    rate: 0,
    amount: 0,
    recipientType: null,
    recipientId: null
  }
}

// Watcher pour l'ouverture du dialog
watch(() => props.open, (newValue) => {
  if (newValue) {
    resetForm()
  }
}, { immediate: true })

// Watcher pour applyToAll
watch(() => form.value.applyToAll, (newValue) => {
  if (newValue) {
    form.value.order_item_id = null
    calculateAmount()
  }
})

const closeDialog = () => {
  emit('update:open', false)
}

// Validation des limites de montant
const isWithinLimits = computed(() => {
  const settings = currentCommissionSettings.value
  if (!settings || !form.value.amount) return false
  
  if (settings.hasMinAmount && form.value.amount < settings.minAmount) return false
  if (settings.hasMaxAmount && form.value.amount > settings.maxAmount) return false
  
  return true
})

const isOutsideLimits = computed(() => {
  const settings = currentCommissionSettings.value
  if (!settings || !form.value.amount) return false
  
  if (settings.hasMinAmount && form.value.amount < settings.minAmount) return true
  if (settings.hasMaxAmount && form.value.amount > settings.maxAmount) return true
  
  return false
})

const isNearLimits = computed(() => {
  const settings = currentCommissionSettings.value
  if (!settings || !form.value.amount) return false
  
  const margin = 100 // Marge de 100€ pour l'avertissement
  
  if (settings.hasMinAmount && form.value.amount < settings.minAmount + margin) return true
  if (settings.hasMaxAmount && form.value.amount > settings.maxAmount - margin) return true
  
  return false
})

const getAmountValidationMessage = computed(() => {
  const settings = currentCommissionSettings.value
  if (!settings || !form.value.amount) return ''
  
  if (isOutsideLimits.value) {
    if (settings.hasMinAmount && form.value.amount < settings.minAmount) {
      return `Le montant est inférieur au minimum requis (${formatCurrency(settings.minAmount)})`
    }
    if (settings.hasMaxAmount && form.value.amount > settings.maxAmount) {
      return `Le montant dépasse le maximum autorisé (${formatCurrency(settings.maxAmount)})`
    }
  }
  
  if (isNearLimits.value) {
    if (settings.hasMinAmount && form.value.amount < settings.minAmount + 100) {
      return `Attention : Vous approchez du montant minimum`
    }
    if (settings.hasMaxAmount && form.value.amount > settings.maxAmount - 100) {
      return `Attention : Vous approchez du montant maximum`
    }
  }
  
  return 'Le montant est valide'
})
</script> 