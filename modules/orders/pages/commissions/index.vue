<!--
/**
 * Page de gestion des commissions
 * 
 * Cette page affiche la liste complète des commissions dans l'application
 * et permet de les filtrer par statut de facturation. Elle sert de point
 * d'entrée pour la gestion des commissions et factures.
 * 
 * Fonctionnalités:
 * - Affichage des commissions dans un tableau détaillé
 * - Filtrage par statut de facture (toutes, en attente, payées, annulées)
 * - Recherche textuelle
 * - Affichage des détails des véhicules associés
 * - Gestion des statuts de facturation
 * - Navigation vers les commandes associées
 */
-->

<template>
    <div class="container mx-auto p-6 space-y-8">
        <header class="flex justify-between items-center">
            <div>
                <div class="flex items-center gap-4">
                    <NuxtLink
                        to="/orders"
                        class="text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft class="h-5 w-5" />
                    </NuxtLink>
                    <h1 class="text-2xl font-bold">Gestion des Commissions</h1>
                </div>
                <p class="text-gray-500 mt-1">Suivi des commissions et factures</p>
            </div>
        </header>

        <!-- Tableau des commissions -->
        <Card>
            <CardHeader>
                <CardTitle>Commissions par statut</CardTitle>
            </CardHeader>
            <CardContent>
                <TabGroup as="div" v-model="activeTab">
                    <TabList class="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                        <Tab v-for="tab in tabs" :key="tab.value" as="template" v-slot="{ selected }">
                            <button :class="[
                                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                                selected
                                    ? 'bg-white shadow text-blue-700'
                                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                            ]">
                                {{ tab.label }}
                                <span v-if="tab.count !== undefined" class="ml-2 px-2 py-0.5 text-xs rounded-full"
                                    :class="selected ? 'bg-blue-100 text-blue-700' : 'bg-blue-800 text-white'">
                                    {{ tab.count }}
                                </span>
                            </button>
                        </Tab>
                    </TabList>
                    <TabPanels class="mt-4">
                        <TabPanel v-for="tab in tabs" :key="tab.value">
                            <CommissionsTable :status="tab.value" />
                        </TabPanel>
                    </TabPanels>
                </TabGroup>
            </CardContent>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from '#imports'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import { ArrowLeft } from 'lucide-vue-next'
import CommissionsTable from '../../components/CommissionsTable.vue'
import { useCommissionStore } from '../../stores/useCommissionStoreModule'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '#components'

const activeTab = ref(0)
const commissionStore = useCommissionStore()

// Types pour les statuts de facture
type InvoiceStatus = 'all' | 'pending' | 'paid' | 'cancelled'

interface TabDefinition {
    label: string
    value: InvoiceStatus
    count?: number
}

// Définition des onglets avec leurs labels
const tabs = computed<TabDefinition[]>(() => [
    {
        label: 'Toutes les commissions',
        value: 'all',
        count: commissionStore.totalCommissions
    },
    {
        label: 'En attente',
        value: 'pending',
        count: commissionStore.pendingCommissions
    },
    {
        label: 'Payées',
        value: 'paid',
        count: commissionStore.paidCommissions
    },
    {
        label: 'Annulées',
        value: 'cancelled',
        count: commissionStore.cancelledCommissions
    }
])
</script> 