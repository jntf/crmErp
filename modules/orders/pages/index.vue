<!--
/**
 * Page principale du module Orders
 * 
 * Cette page affiche la liste des commandes avec un système d'onglets
 * permettant de filtrer par type de vente. Elle sert de point d'entrée
 * pour la gestion des commandes dans l'application.
 * 
 * Fonctionnalités:
 * - Affichage des commandes dans un tableau paginé
 * - Filtrage par type de vente via des onglets
 * - Bouton de création de nouvelle commande
 * - Navigation vers les détails et l'édition des commandes
 */
-->

<template>
  <div class="p-4 space-y-6">
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">Gestion des Commandes</h1>
        <p class="text-gray-500">Gérez vos commandes et factures</p>
      </div>
      <CreateOrderButton />
    </header>

    <Card class="p-4">
      <TabGroup as="div" v-model="activeTab">
        <TabList class="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          <Tab v-for="tab in tabs" :key="tab.value" as="template" v-slot="{ selected }">
            <button
              :class="[
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white shadow text-blue-700'
                  : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
              ]"
            >
              {{ tab.label }}
            </button>
          </Tab>
        </TabList>

        <TabPanels class="mt-4">
          <TabPanel v-for="tab in tabs" :key="tab.value" as="div">
            <OrderList :sale-type="tab.value" />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import type { SaleType } from '../types'
import OrderList from '@/modules/orders/components/OrderList.vue'
import CreateOrderButton from '@/modules/orders/components/actions/CreateOrderButton.vue'
import { Card } from '@/components/ui/card'

const activeTab = ref(0)

type TabValue = SaleType | 'ALL'

const tabs: Array<{ label: string; value: TabValue }> = [
  { label: 'Toutes les ventes', value: 'ALL' },
  { label: 'Particuliers', value: 'B2C' },
  { label: 'Professionnels', value: 'B2B' },
  { label: 'Inter-professionnels', value: 'B2B2B' },
  { label: 'B2P', value: 'B2P' },
  { label: 'P2P', value: 'P2P' }
]
</script> 