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
              :model-value="form.amount.toString()"
              type="number" 
              :min="currentCommissionSettings?.hasMinAmount ? currentCommissionSettings.minAmount : 0"
              :max="currentCommissionSettings?.hasMaxAmount ? currentCommissionSettings.maxAmount : undefined"
              step="0.01"
              @input="(e: InputEvent) => form.amount = parseFloat(e.target.value) || 0"
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
              :model-value="form.rate.toString()"
              type="number" 
              min="0" 
              max="100" 
              step="0.01"
              @input="(e: InputEvent) => {
                form.rate = parseFloat(e.target.value) || 0
                calculateAmount()
              }"
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
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <Label>Destinataire de la facture</Label>
            <div class="flex items-center gap-2">
              <Label class="text-sm text-muted-foreground">Voir tous les destinataires</Label>
              <Switch
                v-model="showAllRecipients"
                class="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          <!-- Mode simplifié : affichage des parties sélectionnées -->
          <div v-if="!showAllRecipients" class="space-y-4">
            <!-- Liste des contacts sélectionnés -->
            <div v-if="contacts.length > 0" class="space-y-2">
              <Label class="text-sm text-muted-foreground">Contacts</Label>
              <RadioGroup 
                :model-value="form.recipientId?.toString()"
                class="space-y-2" 
                @update:model-value="value => handleRecipientSelect(value, 'contact')"
              >
                <div v-for="contact in contacts" :key="contact.id" class="flex items-center space-x-2">
                  <RadioGroupItem :value="contact.id.toString()" />
                  <Label>{{ contact.name }}</Label>
                </div>
              </RadioGroup>
            </div>

            <!-- Liste des entreprises sélectionnées -->
            <div v-if="companies.length > 0" class="space-y-2">
              <Label class="text-sm text-muted-foreground">Entreprises</Label>
              <RadioGroup 
                :model-value="form.recipientId?.toString()"
                class="space-y-2" 
                @update:model-value="value => handleRecipientSelect(value, 'company')"
              >
                <div v-for="company in companies" :key="company.id" class="flex items-center space-x-2">
                  <RadioGroupItem :value="company.id.toString()" />
                  <Label>{{ company.name }}</Label>
                </div>
              </RadioGroup>
            </div>

            <!-- Ma société -->
            <div v-if="ownerId" class="space-y-2">
              <Label class="text-sm text-muted-foreground">Ma société</Label>
              <RadioGroup 
                :model-value="form.recipientId?.toString()"
                class="space-y-2" 
                @update:model-value="value => handleRecipientSelect(value, 'owner')"
              >
                <div class="flex items-center space-x-2">
                  <RadioGroupItem :value="ownerId.toString()" />
                  <Label>Ma société</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <!-- Mode avancé : sélection complète -->
          <div v-else class="space-y-4">
            <Select 
              :model-value="form.recipientType || ''"
              @update:model-value="value => {
                if (value === 'owner' || value === 'contact' || value === 'company' || value === null) {
                  form.recipientType = value
                  form.recipientId = null
                }
              }"
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type de destinataire" />
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
        </div>
      </form>

      <DialogFooter>
        <Button variant="ghost" type="button" @click="closeDialog">
          Annuler
        </Button>
        <Button type="submit" @click="handleSubmit" :disabled="!isValid || !hasRecipients">
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
  Switch,
  RadioGroup,
  RadioGroupItem,
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

interface FormState {
  applyToAll: boolean
  order_item_id: number | null
  commission_type_id: number | null
  rate: number
  amount: number
  recipientType: 'owner' | 'contact' | 'company' | null
  recipientId: number | null
}

interface RadioValue {
  value: string
  type: 'owner' | 'contact' | 'company'
}

// État du formulaire
const form = ref<FormState>({
  applyToAll: true,
  order_item_id: null,
  commission_type_id: null,
  rate: 0,
  amount: 0,
  recipientType: null,
  recipientId: null
})

// État pour le switch d'affichage de tous les destinataires
const showAllRecipients = ref(false)

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

// Vérifier si des destinataires sont disponibles
const hasRecipients = computed(() => {
  return (props.contacts && props.contacts.length > 0) || 
         (props.companies && props.companies.length > 0) ||
         props.ownerId !== undefined
})

// Mise à jour de la validation du formulaire
const isValid = computed(() => {
  if (!form.value.commission_type_id) return false
  if (!form.value.recipientId) return false

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

// Fonction pour soumettre le formulaire
const handleSubmit = () => {
  if (!form.value.commission_type_id || !form.value.recipientType || !form.value.recipientId) {
    return
  }

  // Validation du montant de la commission
  const settings = currentCommissionSettings.value
  if (settings) {
    if (settings.hasMinAmount && form.value.amount < settings.minAmount) {
      form.value.amount = settings.minAmount
    }
    if (settings.hasMaxAmount && form.value.amount > settings.maxAmount) {
      form.value.amount = settings.maxAmount
    }
  }

  if (form.value.applyToAll) {
    // Créer une commission pour chaque article
    const commissions = props.orderItems.map(item => {
      // Utiliser directement l'UUID du véhicule sans tenter de le convertir en nombre
      const vehicleId = item.vehicle?.id;
      
      // Vérifier que l'article a un vehicleId valide (peut être un UUID ou un nombre)
      const isValidVehicleId = vehicleId !== undefined && vehicleId !== null;
      
      if (!isValidVehicleId) {
        // Aucun log ici
      }
      
      const commission = {
        id: Math.floor(Math.random() * -1000), // ID temporaire négatif pour les nouvelles commissions
        order_item_id: item.id || 0,
        vehicleId: vehicleId, // Conserver le format d'origine (UUID ou nombre)
        vehicleUuid: typeof vehicleId === 'string' ? vehicleId : null, // Stocker l'UUID séparément si c'est une chaîne
        commission_type_id: form.value.commission_type_id,
        rate: form.value.rate,
        amount: form.value.amount,
        recipient_type: form.value.recipientType,
        recipient_id: form.value.recipientId,
        metadata: {}
      }
      return commission
    })
    
    // Filtrer les commissions sans vehicleId valide
    const validCommissions = commissions.filter(c => c.vehicleId !== null && c.vehicleId !== undefined)
    if (validCommissions.length < commissions.length) {
      if (validCommissions.length === 0) {
        toast.error('Impossible de créer des commissions: aucun véhicule valide')
        return
      }
    }
    
    emit('add', validCommissions)
  } else {
    // Créer une commission pour l'article sélectionné
    const selectedItem = props.orderItems.find(item => item.id === form.value.order_item_id)
    
    // Utiliser directement l'UUID du véhicule sans tenter de le convertir en nombre
    const vehicleId = selectedItem?.vehicle?.id;
    
    // Vérifier que l'article a un vehicleId valide (peut être un UUID ou un nombre)
    const isValidVehicleId = vehicleId !== undefined && vehicleId !== null;
    
    if (!isValidVehicleId) {
      toast.error('Impossible de créer la commission: véhicule non défini ou invalide')
      return
    }
    
    const commission = {
      id: Math.floor(Math.random() * -1000), // ID temporaire négatif pour les nouvelles commissions
      order_item_id: form.value.order_item_id || 0,
      vehicleId: vehicleId, // Conserver le format d'origine (UUID ou nombre)
      vehicleUuid: typeof vehicleId === 'string' ? vehicleId : null, // Stocker l'UUID séparément si c'est une chaîne
      commission_type_id: form.value.commission_type_id,
      rate: form.value.rate,
      amount: form.value.amount,
      recipient_type: form.value.recipientType,
      recipient_id: form.value.recipientId,
      metadata: {}
    }
    
    emit('add', commission)
  }

  emit('update:open', false)
  resetForm()
}

// Reset du formulaire
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
  showAllRecipients.value = false
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

// Fonction de gestion de la sélection du destinataire
const handleRecipientSelect = (value: string | null, type: 'owner' | 'contact' | 'company') => {
  if (value === null) {
    form.value.recipientId = null
    form.value.recipientType = null
    return
  }

  form.value.recipientId = parseInt(value)
  form.value.recipientType = type
}

interface InputEvent extends Event {
  target: HTMLInputElement;
}
</script> 