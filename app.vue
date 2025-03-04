<template>
  <Toaster />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Toaster } from '@/components/ui/toast'
import { onMounted } from 'vue'

// Utiliser useHead pour ajouter des scripts uniquement côté client
onMounted(() => {
  useHead({
    script: [
      {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js',
        async: true
      },
      {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js',
        async: true
      }
    ]
  })
})
</script>