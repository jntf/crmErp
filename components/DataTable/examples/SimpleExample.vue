<template>
  <div class="container mx-auto p-6">
    <h2 class="text-3xl font-bold mb-4">Exemple DataTable</h2>
    
    <DataTable
      :columns="columns"
      :data="data"
      :loading-state="loading"
      :pagination="true"
      :searchable="true"
      search-field="brand"
      :column-toggle="true"
      :row-selection="true"
      @selection="handleSelection"
    />
    
    <div class="mt-4">
      <pre class="bg-gray-100 p-4 rounded">{{ JSON.stringify(selectedRows, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { DataTable } from '../index'
import { type ColumnDef } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import { h } from 'vue'

// Types
interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  price: number
  color: string
}

// État
const loading = ref(true)
const data = ref<Vehicle[]>([])
const selectedRows = ref<Vehicle[]>([])

// Définition des colonnes
const columns: ColumnDef<Vehicle, any>[] = [
  {
    id: 'select',
    header: ({ table }) => null,
    cell: ({ row }) => null,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'brand',
    header: 'Marque',
    cell: ({ row }) => h('div', {}, row.getValue('brand')),
  },
  {
    accessorKey: 'model',
    header: 'Modèle',
    cell: ({ row }) => h('div', {}, row.getValue('model')),
  },
  {
    accessorKey: 'year',
    header: 'Année',
    cell: ({ row }) => h('div', { class: 'text-center' }, row.getValue('year')),
  },
  {
    accessorKey: 'price',
    header: 'Prix',
    cell: ({ row }) => {
      const price = row.getValue<number>('price')
      return h('div', { class: 'text-right' }, `${new Intl.NumberFormat('fr-FR').format(price)} €`)
    },
  },
  {
    accessorKey: 'color',
    header: 'Couleur',
    cell: ({ row }) => h('div', {}, row.getValue('color')),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      return h('div', { class: 'flex justify-center gap-2' }, [
        h(Button, {
          variant: 'outline',
          size: 'sm',
          onClick: (e: MouseEvent) => {
            e.stopPropagation()
            console.log('Voir', row.original)
          }
        }, 'Voir'),
        h(Button, {
          variant: 'destructive',
          size: 'sm',
          onClick: (e: MouseEvent) => {
            e.stopPropagation()
            console.log('Supprimer', row.original)
          }
        }, 'Supprimer')
      ])
    },
  }
]

// Fonction pour récupérer les données
async function fetchData() {
  loading.value = true
  try {
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Données fictives
    data.value = [
      { id: '1', brand: 'Toyota', model: 'Corolla', year: 2020, price: 25000, color: 'Blanc' },
      { id: '2', brand: 'Honda', model: 'Civic', year: 2019, price: 22000, color: 'Noir' },
      { id: '3', brand: 'Renault', model: 'Clio', year: 2021, price: 18000, color: 'Rouge' },
      { id: '4', brand: 'Peugeot', model: '208', year: 2020, price: 19000, color: 'Gris' },
      { id: '5', brand: 'Volkswagen', model: 'Golf', year: 2018, price: 20000, color: 'Bleu' },
      { id: '6', brand: 'BMW', model: 'Serie 3', year: 2022, price: 45000, color: 'Noir' },
      { id: '7', brand: 'Mercedes', model: 'Classe A', year: 2021, price: 40000, color: 'Blanc' },
      { id: '8', brand: 'Audi', model: 'A3', year: 2019, price: 35000, color: 'Rouge' },
      { id: '9', brand: 'Ford', model: 'Focus', year: 2020, price: 22000, color: 'Gris' },
      { id: '10', brand: 'Opel', model: 'Astra', year: 2018, price: 18000, color: 'Bleu' },
      { id: '11', brand: 'Citroën', model: 'C3', year: 2022, price: 19000, color: 'Blanc' },
      { id: '12', brand: 'Fiat', model: '500', year: 2021, price: 17000, color: 'Noir' },
    ]
  } catch (error) {
    console.error('Erreur lors de la récupération des données', error)
  } finally {
    loading.value = false
  }
}

// Gestion des événements
function handleSelection(rows: Vehicle[]) {
  selectedRows.value = rows
}

// Chargement initial
onMounted(fetchData)
</script> 