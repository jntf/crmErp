<template>
  <div
    v-if="show"
    class="fixed top-20 right-4 z-50 max-w-md animate-in slide-in-from-right-10 fade-in"
  >
    <div
      class="p-4 rounded-lg border shadow-md bg-background flex items-start gap-3"
      :class="{'border-primary': !notification.is_read}"
    >
      <BellIcon v-if="notification.action_required" class="h-5 w-5 text-orange-500 flex-shrink-0" />
      <InfoIcon v-else class="h-5 w-5 text-primary flex-shrink-0" />
      
      <div class="flex-1 space-y-2">
        <div class="flex justify-between">
          <p class="font-medium text-sm">{{ notification.message }}</p>
          <button @click="close" class="text-muted-foreground hover:text-foreground">
            <XIcon class="h-4 w-4" />
          </button>
        </div>
        
        <div v-if="notification.entity_type" class="text-xs text-muted-foreground">
          {{ formatDate(notification.created_at) }}
        </div>
        
        <div v-if="notification.action_required" class="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            class="h-7 text-xs px-2"
            @click="view"
          >
            <EyeIcon class="mr-1 h-3 w-3" />
            Voir
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Button } from '@/components/ui/button'
import { BellIcon, InfoIcon, XIcon, EyeIcon } from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { NotificationWithEntity } from '@/types/notifications'
import { useNotifications } from '@/composables/notifications/useNotifications'

// Props
const props = defineProps<{
  notification: NotificationWithEntity
}>()

// Emits
const emit = defineEmits(['close'])

// Composables
const { markAsRead } = useNotifications()

// État
const show = ref(true)
let closeTimeout: NodeJS.Timeout | null = null

// Formater la date
const formatDate = (date: string) => {
  const now = new Date()
  const dateObj = new Date(date)
  
  return format(dateObj, 'HH:mm', { locale: fr })
}

// Fermer la notification
const close = () => {
  show.value = false
  if (closeTimeout) {
    clearTimeout(closeTimeout)
  }
  emit('close')
}

// Voir les détails
const view = () => {
  markAsRead(props.notification.id)
  if (props.notification.action_url) {
    navigateTo(props.notification.action_url)
  } else {
    // Redirection en fonction du type d'entité
    switch (props.notification.entity_type) {
      case 'contacts_staging':
        navigateTo(`/contacts/import/${props.notification.entity_id}`)
        break
      case 'order':
        navigateTo(`/orders/${props.notification.entity_id}`)
        break
      case 'commission':
        navigateTo(`/commissions/${props.notification.entity_id}`)
        break
      default:
        navigateTo('/notifications')
    }
  }
  close()
}

// Fermeture automatique après un délai
onMounted(() => {
  closeTimeout = setTimeout(() => {
    show.value = false
    emit('close')
  }, 8000) // 8 secondes avant fermeture automatique
})

// Nettoyer le timeout
onBeforeUnmount(() => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
  }
})
</script> 