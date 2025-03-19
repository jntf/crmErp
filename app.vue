<template>
  <Toaster />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  
  <!-- Notifications toasts -->
  <client-only>
    <div v-if="$notificationToasts && $notificationToasts.length > 0" class="notification-toasts-container">
      <NotificationToast 
        v-for="toast in $notificationToasts" 
        :key="toast.id" 
        :notification="toast"
        @close="$removeNotificationToast(toast.id)"
      />
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { Toaster } from '@/components/ui/toast'
import { onMounted } from 'vue'
import { defineAsyncComponent } from 'vue'
import { useNuxtApp } from '#app'

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

// Lazy loading du composant des toasts de notification
const NotificationToast = defineAsyncComponent(() => 
  import('~/components/notifications/NotificationToast.vue')
)

// Accès aux fonctions fournies par le plugin
const { $notificationToasts, $removeNotificationToast } = useNuxtApp()
</script>

<style>
.notification-toasts-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 400px;
}
</style>