<template>
  <div class="flex items-center gap-2">
    <Button variant="outline" size="sm" @click="exportData">
      <Icon name="heroicons:arrow-down-tray" class="mr-2 h-4 w-4" />
      Exporter
    </Button>
    <Button variant="outline" size="sm" @click="printSelected">
      <Icon name="heroicons:printer" class="mr-2 h-4 w-4" />
      Imprimer
    </Button>
    <Button variant="outline" size="sm" @click="showFilters">
      <Icon name="heroicons:funnel" class="mr-2 h-4 w-4" />
      Filtres
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '#components'

const exportData = () => {
  // TODO: Implémenter l'export des données
}

const printSelected = () => {
  // TODO: Implémenter l'impression des commandes sélectionnées
}

const showFilters = () => {
  // TODO: Implémenter l'affichage des filtres avancés
}
</script> 