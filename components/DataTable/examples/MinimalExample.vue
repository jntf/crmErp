<template>
  <div>
    <DataTable
      :columns="tanstackColumns"
      :data="vehicles"
      :loading-state="loading"
      :pagination="true"
      :row-selection="true"
      @selection="handleSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { DataTable, convertHandsontableColumns, type HandsontableColumn } from '../index'
import type { Vehicle } from '@/modules/stock/types'

// État
const loading = ref(true)
const vehicles = ref<Vehicle[]>([])
const selectedVehicles = ref<Vehicle[]>([])

// Anciennes définitions de colonnes Handsontable
const handsontableColumns: HandsontableColumn[] = [
  {
    data: 'brand',
    title: 'Marque',
    type: 'text',
    className: 'htLeft'
  },
  {
    data: 'model',
    title: 'Modèle',
    type: 'text',
    className: 'htLeft'
  },
  {
    data: 'year',
    title: 'Année',
    type: 'numeric',
    className: 'htCenter',
    width: 80
  },
  {
    data: 'mileage',
    title: 'Kilométrage',
    type: 'numeric',
    format: '0,0',
    suffix: ' km',
    className: 'htRight',
    width: 100
  },
  {
    data: 'fuel_type',
    title: 'Carburant',
    type: 'text',
    className: 'htCenter',
    width: 90
  }
]

// Conversion vers le format TanStack Table
const tanstackColumns = computed(() => {
  return convertHandsontableColumns<Vehicle>(handsontableColumns)
})

// Fonction pour récupérer les données
async function fetchData() {
  loading.value = true
  try {
    // Simuler un appel API ou utiliser votre vrai service
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Données fictives - remplacez par votre propre source de données
    vehicles.value = [
      { id: '1', brand: 'Toyota', model: 'Corolla', year: 2020, mileage: 25000, fuel_type: 'Essence' },
      { id: '2', brand: 'Honda', model: 'Civic', year: 2019, mileage: 22000, fuel_type: 'Diesel' },
      { id: '3', brand: 'Renault', model: 'Clio', year: 2021, mileage: 18000, fuel_type: 'Essence' },
      { id: '4', brand: 'Peugeot', model: '208', year: 2020, mileage: 19000, fuel_type: 'Diesel' },
      { id: '5', brand: 'Volkswagen', model: 'Golf', year: 2018, mileage: 20000, fuel_type: 'Essence' }
    ]
  } catch (error) {
    console.error('Erreur lors de la récupération des données', error)
  } finally {
    loading.value = false
  }
}

// Gestion des événements
function handleSelection(rows: Vehicle[]) {
  selectedVehicles.value = rows
  console.log('Véhicules sélectionnés:', selectedVehicles.value)
}

// Chargement initial
onMounted(fetchData)
</script> 