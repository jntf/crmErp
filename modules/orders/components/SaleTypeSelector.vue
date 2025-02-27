<!--
/**
 * Composant de sélection du type de vente
 * 
 * Ce composant permet de sélectionner le type de vente en deux étapes :
 * 1. Sélection de la catégorie (vente directe ou intermédiation)
 * 2. Sélection du type spécifique selon la catégorie choisie
 */
-->

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-base font-semibold">Type de vente</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <!-- Premier niveau : Catégorie principale -->
        <div class="space-y-2">
          <Label>Catégorie</Label>
          <Select v-model="selectedCategory" :disabled="disabled">
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="direct">Vente directe</SelectItem>
                <SelectItem value="intermediation">Intermédiation</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        <!-- Second niveau : Type spécifique -->
        <div class="space-y-2">
          <Label>Type spécifique</Label>
          <Select 
            :value="modelValue" 
            @update:modelValue="updateSaleType" 
            :disabled="disabled"
          >
            <SelectTrigger>
              <SelectValue :placeholder="'Sélectionnez un type'" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup v-if="selectedCategory === 'direct'">
                <SelectItem value="B2C">Particulier (B2C)</SelectItem>
                <SelectItem value="B2B">Professionnel (B2B)</SelectItem>
              </SelectGroup>
              <SelectGroup v-else-if="selectedCategory === 'intermediation'">
                <SelectItem value="B2B2B">Entreprise à Entreprise (B2B2B)</SelectItem>
                <SelectItem value="B2B2C">Entreprise à Particulier (B2B2C)</SelectItem>
                <SelectItem value="C2B2C">Particulier à Particulier (C2B2C)</SelectItem>
                <SelectItem value="C2B2B">Particulier à Entreprise (C2B2B)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Card, CardHeader, CardTitle, CardContent, Label, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '#components'
import type { SaleType } from '../types'

const props = defineProps<{
  modelValue: SaleType
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SaleType): void
}>()

// Fonction pour mettre à jour le type de vente avec typage correct
const updateSaleType = (value: string) => {
  // Vérifier que la valeur est bien un type de vente valide
  if (['B2C', 'B2B', 'B2B2B', 'B2B2C', 'C2B2C', 'C2B2B'].includes(value)) {
    emit('update:modelValue', value as SaleType)
  }
}

// Catégorie sélectionnée (directe ou intermédiation)
const selectedCategory = computed({
  get: () => {
    if (['B2C', 'B2B'].includes(props.modelValue)) {
      return 'direct'
    } else if (['B2B2B', 'B2B2C', 'C2B2C', 'C2B2B'].includes(props.modelValue)) {
      return 'intermediation'
    }
    return ''
  },
  set: (value: string) => {
    // Quand la catégorie change, on sélectionne le premier type de cette catégorie
    if (value === 'direct') {
      emit('update:modelValue', 'B2C')
    } else if (value === 'intermediation') {
      emit('update:modelValue', 'B2B2B')
    }
  }
})

// Surveiller les changements de modelValue pour mettre à jour la catégorie si nécessaire
watch(() => props.modelValue, (newValue) => {
  // Si le type change mais ne correspond pas à la catégorie actuelle, mettre à jour la catégorie
  if (['B2C', 'B2B'].includes(newValue) && selectedCategory.value !== 'direct') {
    selectedCategory.value = 'direct'
  } else if (['B2B2B', 'B2B2C', 'C2B2C', 'C2B2B'].includes(newValue) && selectedCategory.value !== 'intermediation') {
    selectedCategory.value = 'intermediation'
  }
})
</script> 