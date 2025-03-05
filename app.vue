<template>
  <Toaster />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Toaster } from '@/components/ui/toast'
import { onMounted } from 'vue'

// Utiliser onMounted pour ajouter les scripts uniquement côté client
onMounted(() => {
  // Vérifier si les scripts sont déjà chargés
  const isPdfMakeLoaded = document.querySelector('script[src*="pdfmake.min.js"]');
  const isVfsFontsLoaded = document.querySelector('script[src*="vfs_fonts.js"]');

  if (!isPdfMakeLoaded) {
    // Charger pdfMake.min.js
    const pdfMakeScript = document.createElement('script');
    pdfMakeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js';
    pdfMakeScript.async = false; // Charger de manière synchrone pour s'assurer qu'il est chargé avant vfs_fonts
    document.head.appendChild(pdfMakeScript);
  }

  if (!isVfsFontsLoaded) {
    // Charger vfs_fonts.js après pdfMake
    const vfsFontsScript = document.createElement('script');
    vfsFontsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js';
    vfsFontsScript.async = false;
    document.head.appendChild(vfsFontsScript);
  }
})
</script>