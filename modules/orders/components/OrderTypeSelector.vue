<template>
  <div class="space-y-4">
    <div>
      <Label for="saleType">Type de vente</Label>
      <Select
        id="saleType"
        v-model="selectedType"
        :options="saleTypeOptions"
        placeholder="Sélectionner un type de vente"
        class="w-full"
      />
    </div>

    <div v-if="selectedType" class="bg-muted p-4 rounded-md">
      <h3 class="text-lg font-medium mb-2">Caractéristiques du type de vente</h3>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h4 class="font-medium text-sm mb-1">Fonctionnalités</h4>
          <ul class="text-sm space-y-1">
            <li v-for="feature in typeFeatures" :key="feature" class="flex items-center">
              <Icon name="lucide:check" class="h-4 w-4 text-green-500 mr-2" />
              {{ feature }}
            </li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-medium text-sm mb-1">Champs requis</h4>
          <ul class="text-sm space-y-1">
            <li v-for="field in requiredFields" :key="field" class="flex items-center">
              <Icon name="lucide:asterisk" class="h-3 w-3 text-red-500 mr-2" />
              {{ field }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SaleType } from '../types'

const props = defineProps<{
  modelValue: SaleType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SaleType]
}>()

// Options pour le select
const saleTypeOptions = [
  { value: 'B2B', label: 'B2B - Vente directe entreprise à entreprise' },
  { value: 'B2C', label: 'B2C - Vente directe entreprise à particulier' },
  { value: 'B2B2B', label: 'B2B2B - Intermédiation entre entreprises' },
  { value: 'P2P', label: 'P2P - Intermédiation entre particuliers' },
  { value: 'B2P', label: 'B2P - Intermédiation entreprise à particulier' },
  { value: 'P2B', label: 'P2B - Intermédiation particulier à entreprise' }
]

// Computed pour le v-model
const selectedType = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Fonctionnalités par type de vente
const typeFeatures = computed(() => {
  switch (selectedType.value) {
    case 'B2B':
      return [
        'Vente directe',
        'Calcul de TVA automatique',
        'Gestion du stock',
        'Facturation standard'
      ]
    case 'B2C':
      return [
        'Vente directe',
        'TVA incluse',
        'Gestion du stock',
        'Facturation particulier'
      ]
    case 'B2B2B':
      return [
        'Intermédiation',
        'Commissions',
        'Pas de TVA sur l\'intermédiation',
        'Facturation des commissions'
      ]
    case 'P2P':
      return [
        'Intermédiation entre particuliers',
        'Commissions',
        'Pas de TVA',
        'Facturation des commissions'
      ]
    case 'B2P':
      return [
        'Intermédiation entreprise à particulier',
        'Commissions',
        'Pas de TVA sur l\'intermédiation',
        'Facturation des commissions'
      ]
    case 'P2B':
      return [
        'Intermédiation particulier à entreprise',
        'Commissions',
        'Pas de TVA sur l\'intermédiation',
        'Facturation des commissions'
      ]
    default:
      return []
  }
})

// Champs requis par type de vente
const requiredFields = computed(() => {
  switch (selectedType.value) {
    case 'B2B':
      return [
        'Entreprise acheteuse',
        'Entreprise vendeuse',
        'Articles'
      ]
    case 'B2C':
      return [
        'Contact acheteur',
        'Entreprise vendeuse',
        'Articles'
      ]
    case 'B2B2B':
      return [
        'Entreprise acheteuse',
        'Entreprise vendeuse',
        'Articles',
        'Commissions'
      ]
    case 'P2P':
      return [
        'Contact acheteur',
        'Contact vendeur',
        'Articles',
        'Commissions'
      ]
    case 'B2P':
      return [
        'Entreprise vendeuse',
        'Contact acheteur',
        'Articles',
        'Commissions'
      ]
    case 'P2B':
      return [
        'Contact vendeur',
        'Entreprise acheteuse',
        'Articles',
        'Commissions'
      ]
    default:
      return []
  }
})
</script> 