<template>
  <div class="container mx-auto p-6">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Commissions</h1>
        <p class="text-muted-foreground">
          Gérez les paramètres de commissions de votre société
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="refreshData">
          <RefreshCwIcon class="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>
    </header>

    <div class="space-y-6">
      <!-- Configuration des types de commissions -->
      <Card>
        <CardHeader>
          <CardTitle>Types de commissions actifs</CardTitle>
          <CardDescription>
            Configurez les types de commissions disponibles pour votre société
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-if="isLoading" class="flex justify-center p-4">
              <Loader2Icon class="h-6 w-6 animate-spin" />
            </div>
            
            <div v-else-if="commissionTypes.length === 0" class="text-center py-6">
              <div class="space-y-2">
                <PercentIcon class="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 class="font-medium">Aucun type de commission configuré</h3>
                <p class="text-sm text-muted-foreground">
                  Commencez par activer et configurer les types de commissions
                </p>
              </div>
            </div>

            <div v-else-if="!currentOwnerId" class="text-center py-6">
              <div class="space-y-2">
                <BuildingIcon class="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 class="font-medium">Aucune société associée</h3>
                <p class="text-sm text-muted-foreground">
                  Votre compte n'est pas associé à une société
                </p>
              </div>
            </div>

            <div v-else class="divide-y">
              <div v-for="type in commissionTypes" :key="type.id" class="py-4">
                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <h3 class="font-medium">{{ type.name }}</h3>
                    <div class="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Switch 
                        :id="'switch-' + type.id" 
                        :checked="getTypeSettings(type.id)?.is_active" 
                        @update:checked="toggleTypeStatus(type)" 
                      />
                      <span>{{ getTypeSettings(type.id)?.is_active ? 'Actif' : 'Inactif' }}</span>
                      <span>·</span>
                      <span>{{ type.description }}</span>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" @click="configureCommission(type)">
                    <WrenchIcon class="h-4 w-4" />
                  </Button>
                </div>

                <div v-if="getTypeSettings(type.id)?.settings" class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div class="space-y-1">
                    <h4 class="font-medium">Type de calcul</h4>
                    <p class="text-muted-foreground">{{ formatCalculationType(getTypeSettings(type.id)?.settings.calculationType) }}</p>
                  </div>
                  <div v-if="getTypeSettings(type.id)?.settings.calculationType === 'percentage' || getTypeSettings(type.id)?.settings.calculationType === 'mixed'" class="space-y-1">
                    <h4 class="font-medium">Pourcentage</h4>
                    <p class="text-muted-foreground">{{ getTypeSettings(type.id)?.settings.percentage ?? 0 }}%</p>
                  </div>
                  <div v-if="getTypeSettings(type.id)?.settings.calculationType === 'fixed_amount' || getTypeSettings(type.id)?.settings.calculationType === 'mixed'" class="space-y-1">
                    <h4 class="font-medium">Montant fixe</h4>
                    <p class="text-muted-foreground">{{ formatMoneyValue(getTypeSettings(type.id)?.settings.fixedAmount ?? 0) }}</p>
                  </div>
                  <div v-if="getTypeSettings(type.id)?.settings.hasMinAmount" class="space-y-1">
                    <h4 class="font-medium">Montant minimum</h4>
                    <p class="text-muted-foreground">{{ formatMoneyValue(getTypeSettings(type.id)?.settings.minAmount ?? 0) }}</p>
                  </div>
                  <div v-if="getTypeSettings(type.id)?.settings.hasMaxAmount" class="space-y-1">
                    <h4 class="font-medium">Montant maximum</h4>
                    <p class="text-muted-foreground">{{ formatMoneyValue(getTypeSettings(type.id)?.settings.maxAmount ?? 0) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Dialog de configuration -->
    <Dialog :open="showConfigDialog" @update:open="showConfigDialog = false">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configuration de la commission</DialogTitle>
          <DialogDescription>
            {{ selectedType?.description }}
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="saveConfiguration" class="space-y-6">
          <div class="space-y-6">
            <div v-if="selectedType" class="grid grid-cols-2 gap-6">
              <div v-if="selectedType?.settings_schema.percentage" class="space-y-2">
                <Label>Pourcentage</Label>
                <div class="relative">
                  <Input 
                    v-model="formState.percentageInput"
                    type="text"
                    placeholder="0.00"
                    class="pr-8"
                    :class="{ 'border-destructive': percentageError }"
                    @input="validatePercentage"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                <p v-if="percentageError" class="text-sm text-destructive">
                  {{ percentageError }}
                </p>
              </div>

              <div v-if="selectedType?.settings_schema.fixed_amount" class="space-y-2">
                <Label>Montant fixe</Label>
                <div class="relative">
                  <Input 
                    v-model="formState.fixedAmountInput"
                    type="text"
                    placeholder="0.00"
                    class="pl-6"
                    :class="{ 'border-destructive': fixedAmountError }"
                    @input="validateFixedAmount"
                  />
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                </div>
                <p v-if="fixedAmountError" class="text-sm text-destructive">
                  {{ fixedAmountError }}
                </p>
              </div>

              <div v-if="selectedType?.settings_schema.min_amount" class="space-y-2">
                <Label>Montant minimum</Label>
                <div class="relative">
                  <Input 
                    v-model="formState.minAmountInput"
                    type="text"
                    placeholder="0.00"
                    class="pl-6"
                    :class="{ 'border-destructive': minAmountError }"
                    @input="validateMinAmount"
                  />
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                </div>
                <p v-if="minAmountError" class="text-sm text-destructive">
                  {{ minAmountError }}
                </p>
              </div>

              <div v-if="selectedType?.settings_schema.max_amount" class="space-y-2">
                <Label>Montant maximum</Label>
                <div class="relative">
                  <Input 
                    v-model="formState.maxAmountInput"
                    type="text"
                    placeholder="0.00"
                    class="pl-6"
                    :class="{ 'border-destructive': maxAmountError }"
                    @input="validateMaxAmount"
                  />
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                </div>
                <p v-if="maxAmountError" class="text-sm text-destructive">
                  {{ maxAmountError }}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="ghost"
              @click="showConfigDialog = false"
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              :disabled="isLoading || hasErrors"
            >
              <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { 
  Loader2Icon,
  PercentIcon,
  WrenchIcon,
  RefreshCwIcon,
  BuildingIcon
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import type { 
  CommissionType, 
  CommissionSettings, 
  CommissionFormState
} from '@/types/commission'
import { useCommissionStore } from '@/stores/useCommissionStore'
import { useOwnerStore } from '@/stores/useOwnerStore'

definePageMeta({
  middleware: ['admin']
})

// État
const supabase = useSupabaseClient()
const commissionStore = useCommissionStore()
const ownerStore = useOwnerStore()
const isLoading = computed(() => commissionStore.isLoading)
const showConfigDialog = ref(false)
const commissionTypes = computed(() => commissionStore.types)
const selectedType = ref<CommissionType | null>(null)
const currentOwnerId = computed(() => ownerStore.idOwnerActuel)

// État pour la validation
const percentageError = ref('')
const fixedAmountError = ref('')
const minAmountError = ref('')
const maxAmountError = ref('')

// État du formulaire modifié
const formState = reactive({
  percentageInput: '',
  fixedAmountInput: '',
  minAmountInput: '',
  maxAmountInput: '',
  percentage: 0,
  fixedAmount: 0,
  minAmount: 0,
  maxAmount: 0,
  is_active: false
})

// Computed pour vérifier s'il y a des erreurs
const hasErrors = computed(() => {
  return Boolean(
    percentageError.value ||
    fixedAmountError.value ||
    minAmountError.value ||
    maxAmountError.value
  )
})

// Fonctions de validation
const validateNumber = (value: string): number | null => {
  if (!value) return 0
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.')
  const number = parseFloat(cleaned)
  return isNaN(number) ? null : number
}

const validatePercentage = () => {
  const value = validateNumber(formState.percentageInput)
  if (value === null) {
    percentageError.value = 'Veuillez entrer un nombre valide'
  } else if (value < 0 || value > 100) {
    percentageError.value = 'Le pourcentage doit être entre 0 et 100'
  } else {
    percentageError.value = ''
    formState.percentage = value
  }
}

const validateFixedAmount = () => {
  const value = validateNumber(formState.fixedAmountInput)
  if (value === null) {
    fixedAmountError.value = 'Veuillez entrer un montant valide'
  } else if (value < 0) {
    fixedAmountError.value = 'Le montant ne peut pas être négatif'
  } else {
    fixedAmountError.value = ''
    formState.fixedAmount = value
  }
}

const validateMinAmount = () => {
  const value = validateNumber(formState.minAmountInput)
  if (value === null) {
    minAmountError.value = 'Veuillez entrer un montant valide'
  } else if (value < 0) {
    minAmountError.value = 'Le montant ne peut pas être négatif'
  } else {
    minAmountError.value = ''
    formState.minAmount = value
  }
}

const validateMaxAmount = () => {
  const value = validateNumber(formState.maxAmountInput)
  if (value === null) {
    maxAmountError.value = 'Veuillez entrer un montant valide'
  } else if (value < 0) {
    maxAmountError.value = 'Le montant ne peut pas être négatif'
  } else if (value < formState.minAmount) {
    maxAmountError.value = 'Le montant maximum doit être supérieur au montant minimum'
  } else {
    maxAmountError.value = ''
    formState.maxAmount = value
  }
}

// Configuration d'une commission
const configureCommission = (type: CommissionType) => {
  selectedType.value = type
  const typeSettings = commissionStore.getTypeSettings(type.id)
  
  // Réinitialiser les erreurs
  percentageError.value = ''
  fixedAmountError.value = ''
  minAmountError.value = ''
  maxAmountError.value = ''

  // Formater les nombres pour l'affichage
  const formatNumberForDisplay = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return ''
    return value.toString().replace('.', ',')
  }

  if (typeSettings) {
    // Initialiser avec les valeurs existantes
    formState.percentageInput = formatNumberForDisplay(typeSettings.settings.percentage)
    formState.fixedAmountInput = formatNumberForDisplay(typeSettings.settings.fixedAmount)
    formState.minAmountInput = formatNumberForDisplay(typeSettings.settings.minAmount)
    formState.maxAmountInput = formatNumberForDisplay(typeSettings.settings.maxAmount)
    
    // Initialiser les valeurs numériques
    formState.percentage = typeSettings.settings.percentage || 0
    formState.fixedAmount = typeSettings.settings.fixedAmount || 0
    formState.minAmount = typeSettings.settings.minAmount || 0
    formState.maxAmount = typeSettings.settings.maxAmount || 0
    
    // Initialiser l'état actif
    formState.is_active = Boolean(typeSettings.is_active)
  } else {
    // Réinitialiser à zéro si pas de configuration existante
    Object.assign(formState, {
      percentageInput: '',
      fixedAmountInput: '',
      minAmountInput: '',
      maxAmountInput: '',
      percentage: 0,
      fixedAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      is_active: false
    })
  }
  
  showConfigDialog.value = true
}

// Sauvegarde de la configuration
const saveConfiguration = async () => {
  if (!selectedType.value) return

  try {
    const schema = selectedType.value.settings_schema
    const settings = {
      percentage: schema.percentage ? formState.percentage : undefined,
      fixedAmount: schema.fixed_amount ? formState.fixedAmount : undefined,
      minAmount: schema.min_amount ? formState.minAmount : undefined,
      maxAmount: schema.max_amount ? formState.maxAmount : undefined,
      hasMinAmount: schema.min_amount ? (formState.minAmount > 0) : false,
      hasMaxAmount: schema.max_amount ? (formState.maxAmount > 0) : false
    }
    
    await commissionStore.updateCommissionSettings(
      selectedType.value.id,
      settings,
      formState.is_active
    )

    showConfigDialog.value = false
    toast.success('Configuration enregistrée')
    await refreshData()
  } catch (error) {
    console.error('Error saving commission configuration:', error)
    toast.error('Impossible de sauvegarder la configuration')
  }
}

// Rafraîchissement des données
const refreshData = async () => {
  await commissionStore.fetchCommissionTypes()
}

// Initialisation
onMounted(async () => {
  // D'abord charger les données owner
  await ownerStore.chargerDonneesOwner()
  
  // Ensuite initialiser le store des commissions
  await commissionStore.initialize()
  
  if (ownerStore.idOwnerActuel) {
    await refreshData()
  }
})

// Formatage des valeurs
const formatMoneyValue = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const formatCalculationType = (type: string | undefined) => {
  const types = {
    percentage: 'Pourcentage',
    fixed_amount: 'Montant fixe',
    mixed: 'Mixte'
  }
  return types[type as keyof typeof types] || type
}

const getTypeSettings = (typeId: number) => {
  const settings = commissionStore.getTypeSettings(typeId)
  return settings
}

const toggleTypeStatus = async (type: CommissionType) => {
  try {
    await commissionStore.toggleTypeStatus(type.id)
    toast.success(`Le type ${type.name} a été ${!getTypeSettings(type.id)?.is_active ? 'activé' : 'désactivé'} pour votre société`)
  } catch (error) {
    toast.error('Impossible de modifier le statut du type')
  }
}
</script> 