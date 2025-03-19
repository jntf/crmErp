<template>
  <div class="container mx-auto p-6">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Contacts importés</h1>
        <p class="text-muted-foreground">Validez les contacts importés depuis votre messagerie</p>
      </div>
    </header>

    <div class="space-y-6">
      <!-- Section Approbation -->
      <Card>
        <CardHeader>
          <CardTitle>Approbation des contacts</CardTitle>
          <CardDescription>
            Vérifiez et approuvez les contacts importés, en gérant les doublons potentiels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactsImportApproval ref="approvalComponent" />
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import ContactsImportApproval from '../components/ContactsImportApproval.vue'

definePageMeta({
  middleware: ['auth']
})

// Référence au composant d'approbation
const approvalComponent = ref()

// Chargement initial
onMounted(async () => {
  // Si nécessaire, on peut appeler des méthodes sur le composant
  // approvalComponent.value?.refreshData()
})
</script> 