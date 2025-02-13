<template>
  <div class="container mx-auto p-6">
    <header class="mb-6">
      <h1 class="text-3xl font-bold">Configuration des commissions</h1>
      <p class="text-muted-foreground">Gérez les paramètres des commissions pour votre entreprise</p>
    </header>

    <div class="space-y-6">
      <Card v-for="type in commissionTypes" :key="type.id">
        <CardHeader>
          <CardTitle>{{ type.name }}</CardTitle>
          <CardDescription>
            {{ type.description }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- Activation/Désactivation -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Statut</Label>
                <p class="text-sm text-muted-foreground">
                  Activez ou désactivez ce type de commission
                </p>
              </div>
              <Switch
                :model-value="isTypeActive(type.id)"
                @update:model-value="toggleTypeStatus(type.id, $event)"
              />
            </div>

            <Separator />

            <!-- Configuration des paramètres -->
            <div v-if="isTypeActive(type.id)" class="space-y-4">
              <!-- Type de calcul -->
              <div class="space-y-2">
                <Label>Mode de calcul</Label>
                <Select 
                  :model-value="getTypeSettings(type.id)?.calculation_type || 'percentage'"
                  @update:model-value="(value: string) => updateCalculationType(type.id, value)"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le mode de calcul" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-if="type.settings_schema.percentage" value="percentage">
                      Pourcentage (%)
                    </SelectItem>
                    <SelectItem v-if="type.settings_schema.fixed_amount" value="fixed">
                      Montant fixe (€)
                    </SelectItem>
                    <SelectItem 
                      v-if="type.settings_schema.percentage && type.settings_schema.fixed_amount" 
                      value="mixed"
                    >
                      Mixte (% + Montant fixe)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Configuration selon le type -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Pourcentage -->
                <div 
                  v-if="['percentage', 'mixed'].includes(getTypeSettings(type.id)?.calculation_type || '') && type.settings_schema.percentage" 
                  class="space-y-2"
                >
                  <Label>Pourcentage</Label>
                  <div class="flex items-center gap-2">
                    <Input 
                      :model-value="getTypeSettings(type.id)?.percentage"
                      @update:model-value="updatePercentage(type.id, $event)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      class="w-32"
                    />
                    <span class="text-muted-foreground">%</span>
                  </div>
                </div>

                <!-- Montant fixe -->
                <div 
                  v-if="['fixed', 'mixed'].includes(getTypeSettings(type.id)?.calculation_type || '') && type.settings_schema.fixed_amount" 
                  class="space-y-2"
                >
                  <Label>Montant fixe</Label>
                  <div class="flex items-center gap-2">
                    <Input 
                      :model-value="getTypeSettings(type.id)?.fixed_amount"
                      @update:model-value="updateFixedAmount(type.id, $event)"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-32"
                    />
                    <span class="text-muted-foreground">€</span>
                  </div>
                </div>
              </div>

              <!-- Limites -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Montant minimum -->
                <div v-if="type.settings_schema.min_amount" class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Checkbox 
                      :model-value="getTypeSettings(type.id)?.has_min_amount"
                      :id="`min-amount-${type.id}`"
                      @update:model-value="toggleMinAmount(type.id, $event)"
                    />
                    <Label :for="`min-amount-${type.id}`">Montant minimum</Label>
                  </div>
                  <div v-if="getTypeSettings(type.id)?.has_min_amount" class="flex items-center gap-2">
                    <Input 
                      :model-value="getTypeSettings(type.id)?.min_amount"
                      @update:model-value="updateMinAmount(type.id, $event)"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-32"
                    />
                    <span class="text-muted-foreground">€</span>
                  </div>
                </div>

                <!-- Montant maximum -->
                <div v-if="type.settings_schema.max_amount" class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Checkbox 
                      :model-value="getTypeSettings(type.id)?.has_max_amount"
                      :id="`max-amount-${type.id}`"
                      @update:model-value="toggleMaxAmount(type.id, $event)"
                    />
                    <Label :for="`max-amount-${type.id}`">Montant maximum</Label>
                  </div>
                  <div v-if="getTypeSettings(type.id)?.has_max_amount" class="flex items-center gap-2">
                    <Input 
                      :model-value="getTypeSettings(type.id)?.max_amount"
                      @update:model-value="updateMaxAmount(type.id, $event)"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-32"
                    />
                    <span class="text-muted-foreground">€</span>
                  </div>
                </div>
              </div>

              <!-- Prévisualisation -->
              <div class="mt-4 p-4 bg-muted rounded-lg">
                <h4 class="font-medium mb-2">Prévisualisation du calcul</h4>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pour 10 000 €</Label>
                    <div class="font-medium">
                      {{ calculatePreview(type.id, 10000) }} €
                    </div>
                  </div>
                  <div>
                    <Label>Pour 50 000 €</Label>
                    <div class="font-medium">
                      {{ calculatePreview(type.id, 50000) }} €
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bouton de sauvegarde -->
              <div class="flex justify-end">
                <Button 
                  @click="saveSettings(type.id)"
                  :disabled="saving === type.id"
                >
                  <Loader2Icon v-if="saving === type.id" class="mr-2 h-4 w-4 animate-spin" />
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Loader2Icon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useCommissionStore } from '@/stores/useCommissionStore'

// Définition du middleware
definePageMeta({
  middleware: ['auth']
})

const commissionStore = useCommissionStore()
const saving = ref<number | null>(null)

interface TypeSettings {
  calculation_type: 'percentage' | 'fixed' | 'mixed'
  percentage?: number
  fixed_amount?: number
  has_min_amount: boolean
  min_amount?: number
  has_max_amount: boolean
  max_amount?: number
}

// Computed properties pour accéder aux données du store
const commissionTypes = computed(() => commissionStore.types)
const typeSettings = computed(() => commissionStore.settings)
const isLoading = computed(() => commissionStore.isLoading)

// Helpers
const isTypeActive = (typeId: number): boolean => {
  return typeSettings.value[typeId]?.is_active || false
}

const getTypeSettings = (typeId: number): TypeSettings | undefined => {
  const settings = typeSettings.value[typeId]
  if (!settings) return undefined

  const { is_active, ...rest } = settings
  return rest as TypeSettings
}

// Gestion des modifications
const toggleTypeStatus = async (typeId: number, value: boolean) => {
  try {
    await commissionStore.updateCommissionSettings(
      typeId,
      { ...typeSettings.value[typeId], is_active: value },
      true
    )
    toast.success(`Type de commission ${value ? 'activé' : 'désactivé'}`)
  } catch (error) {
    console.error('Error toggling commission type status:', error)
    toast.error('Impossible de modifier le statut')
  }
}

const updateCalculationType = (typeId: number, value: string) => {
  const calcType = value as 'percentage' | 'fixed' | 'mixed'
  if (!typeSettings.value[typeId]) {
    typeSettings.value[typeId] = { calculation_type: calcType }
  } else {
    typeSettings.value[typeId].calculation_type = calcType
  }

  // Réinitialiser les valeurs non pertinentes
  if (calcType === 'percentage') {
    typeSettings.value[typeId].fixed_amount = undefined
  } else if (calcType === 'fixed') {
    typeSettings.value[typeId].percentage = undefined
  }
}

const updatePercentage = (typeId: number, value: string | number) => {
  const numValue = typeof value === 'string' ? Number(value) : value
  if (!typeSettings.value[typeId]) {
    typeSettings.value[typeId] = { percentage: numValue }
  } else {
    typeSettings.value[typeId].percentage = numValue
  }
}

const updateFixedAmount = (typeId: number, value: string | number) => {
  const numValue = typeof value === 'string' ? Number(value) : value
  if (!typeSettings.value[typeId]) {
    typeSettings.value[typeId] = { fixed_amount: numValue }
  } else {
    typeSettings.value[typeId].fixed_amount = numValue
  }
}

const toggleMinAmount = (typeId: number, value: boolean) => {
  if (!typeSettings.value[typeId]) {
    typeSettings.value[typeId] = {}
  }
  typeSettings.value[typeId].has_min_amount = value
  if (!value) {
    typeSettings.value[typeId].min_amount = undefined
  }
}

const updateMinAmount = (typeId: number, value: string | number) => {
  const numValue = typeof value === 'string' ? Number(value) : value
  if (typeSettings.value[typeId]) {
    typeSettings.value[typeId].min_amount = numValue
  }
}

const toggleMaxAmount = (typeId: number, value: boolean) => {
  if (!typeSettings.value[typeId]) {
    typeSettings.value[typeId] = {}
  }
  typeSettings.value[typeId].has_max_amount = value
  if (!value) {
    typeSettings.value[typeId].max_amount = undefined
  }
}

const updateMaxAmount = (typeId: number, value: string | number) => {
  const numValue = typeof value === 'string' ? Number(value) : value
  if (typeSettings.value[typeId]) {
    typeSettings.value[typeId].max_amount = numValue
  }
}

// Calcul de prévisualisation
const calculatePreview = (typeId: number, amount: number): string => {
  const settings = typeSettings.value[typeId]
  if (!settings) return '0.00'

  let commission = 0

  if (['percentage', 'mixed'].includes(settings.calculation_type || '')) {
    commission += amount * (settings.percentage || 0) / 100
  }

  if (['fixed', 'mixed'].includes(settings.calculation_type || '')) {
    commission += settings.fixed_amount || 0
  }

  if (settings.has_min_amount && settings.min_amount) {
    commission = Math.max(commission, settings.min_amount)
  }

  if (settings.has_max_amount && settings.max_amount) {
    commission = Math.min(commission, settings.max_amount)
  }

  return commission.toFixed(2)
}

// Sauvegarde des paramètres
const saveSettings = async (typeId: number) => {
  saving.value = typeId
  try {
    const settings = { ...typeSettings.value[typeId] }
    delete settings.is_active // On ne sauvegarde pas le statut dans les settings

    await commissionStore.updateCommissionSettings(typeId, settings)
    toast.success('Paramètres enregistrés')
  } catch (error) {
    console.error('Error saving settings:', error)
    toast.error('Impossible de sauvegarder les paramètres')
  } finally {
    saving.value = null
  }
}

// Chargement initial
onMounted(async () => {
  try {
    await commissionStore.fetchCommissionTypes()
  } catch (error) {
    console.error('Error loading commission types:', error)
    toast.error('Impossible de charger les types de commission')
  }
})
</script> 