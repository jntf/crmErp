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
                      <Badge :variant="getTypeSettings(type.id)?.is_active ? 'default' : 'secondary'">
                        {{ getTypeSettings(type.id)?.is_active ? 'Actif' : 'Inactif' }}
                      </Badge>
                      <span>·</span>
                      <span>{{ type.description }}</span>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" @click="configureCommission(type)">
                    <WrenchIcon class="h-4 w-4 mr-2" />
                    Configurer
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
        
        <form @submit.prevent="saveConfiguration" class="space-y-4">
          <div class="space-y-4">
            <div v-if="selectedType">
              <div v-if="selectedType?.settings_schema.percentage" class="space-y-2">
                <Label>Pourcentage</Label>
                <Input v-model.number="formState.percentage" type="number" step="0.01" min="0" max="100" />
              </div>
              <div v-if="selectedType?.settings_schema.fixed_amount" class="space-y-2">
                <Label>Montant fixe</Label>
                <Input v-model.number="formState.fixedAmount" type="number" step="0.01" min="0" />
              </div>
              <div v-if="selectedType?.settings_schema.min_amount" class="space-y-2">
                <Label>Montant minimum</Label>
                <Input v-model.number="formState.minAmount" type="number" step="0.01" min="0" />
              </div>
              <div v-if="selectedType?.settings_schema.max_amount" class="space-y-2">
                <Label>Montant maximum</Label>
                <Input v-model.number="formState.maxAmount" type="number" step="0.01" min="0" />
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <Switch v-model="formState.is_active" id="is-active" />
                <Label for="is-active">Activer ce type de commission</Label>
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
              :disabled="isLoading"
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

import type { 
  CommissionType, 
  CommissionSettings, 
  CommissionFormState
} from '@/types/commission'
import { useCommissionStore } from '@/stores/useCommissionStore'

definePageMeta({
  middleware: ['admin']
})

// État
const supabase = useSupabaseClient()
const commissionStore = useCommissionStore()
const isLoading = computed(() => commissionStore.isLoading)
const showConfigDialog = ref(false)
const commissionTypes = computed(() => commissionStore.types)
const selectedType = ref<CommissionType | null>(null)
const currentOwnerId = computed(() => commissionStore.currentOwnerId)

// Ajout des watches pour suivre les changements
watch(commissionTypes, (newTypes) => {
  console.log('commissionTypes changed:', newTypes)
}, { deep: true })

watch(() => commissionStore.settings, (newSettings) => {
  console.log('settings changed in store:', newSettings)
}, { deep: true })

// État du formulaire
const formState = reactive({
  percentage: 0,
  fixedAmount: 0,
  minAmount: 0,
  maxAmount: 0,
  is_active: false
})

// Configuration d'une commission
const configureCommission = (type: CommissionType) => {
  console.log('configureCommission called with type:', type)
  selectedType.value = type
  const typeSettings = commissionStore.getTypeSettings(type.id)
  console.log('typeSettings fetched:', typeSettings)
  
  const defaultState = {
    percentage: 0,
    fixedAmount: 0,
    minAmount: 0,
    maxAmount: 0,
    is_active: false
  }

  if (typeSettings) {
    console.log('Applying existing settings:', typeSettings.settings)
    Object.assign(formState, {
      ...defaultState,
      ...typeSettings.settings,
      is_active: typeSettings.is_active
    })
  } else {
    console.log('Using default state')
    Object.assign(formState, defaultState)
  }
  
  console.log('Final formState:', formState)
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
  console.log('Component mounted')
  await commissionStore.initialize()
  console.log('Store initialized, currentOwnerId:', commissionStore.currentOwnerId)
  if (commissionStore.currentOwnerId) {
    await refreshData()
    console.log('Data refreshed')
  } else {
    console.warn('No owner ID available, skipping data refresh')
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
  console.log('getTypeSettings called in component for typeId:', typeId)
  const settings = commissionStore.getTypeSettings(typeId)
  console.log('settings returned for typeId:', typeId, settings)
  return settings
}
</script> 