<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center px-3 py-2">
      <h4 class="text-sm font-medium">Notifications</h4>
      <div class="flex items-center gap-2">
        <Badge v-if="totalUnread > 0" variant="destructive">{{ totalUnread }}</Badge>
        <Button v-if="totalUnread > 0" variant="ghost" size="sm" @click="handleMarkAllAsRead">
          Tout lire
        </Button>
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-center p-4">
      <Loader2Icon class="h-5 w-5 animate-spin" />
      <span class="ml-2">Chargement...</span>
    </div>
    
    <ScrollArea :class="[compact ? 'h-[300px]' : 'h-[500px]']">
      <div v-if="notifications.length === 0" class="text-sm text-muted-foreground py-4 px-3">
        Aucune notification
      </div>
      
      <div v-else class="space-y-2 px-3">
        <NuxtLink
          v-for="notification in notifications" 
          :key="notification.id"
          :to="getNotificationUrl(notification)"
          class="block p-3 rounded-md border transition-colors"
          :class="{
            'bg-muted/50': !notification.is_read,
            'hover:bg-muted/70': true
          }"
          @click="notification.is_read ? null : markAsRead(notification.id)"
        >
          <div class="flex-1 space-y-1">
            <div class="flex justify-between w-full">
              <p 
                class="text-sm font-medium line-clamp-2" 
                :class="{ 'font-bold': !notification.is_read }"
              >
                {{ notification.message }}
              </p>
              <span class="text-xs text-muted-foreground ml-2 shrink-0">
                {{ formatDate(notification.created_at) }}
              </span>
            </div>
            
            <div v-if="notification.entity_type" class="flex gap-2 items-center">
              <Badge variant="outline" class="text-xs">
                {{ formatEntityType(notification.entity_type) }}
              </Badge>
              <span v-if="notification.action_required" class="text-xs text-orange-500 dark:text-orange-400">
                Action requise
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </ScrollArea>
    
    <div v-if="!compact" class="pt-2 px-2 border-t">
      <Button variant="outline" size="sm" class="w-full" as-child>
        <NuxtLink to="/notifications">
          Voir toutes les notifications
        </NuxtLink>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import type { NotificationWithEntity } from '@/types/notifications'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2Icon } from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNotifications } from '@/composables/notifications/useNotifications'

// Props et emits
const props = defineProps({
  compact: {
    type: Boolean,
    default: false
  },
  maxItems: {
    type: Number,
    default: 0 // 0 pour illimité
  },
  filter: {
    type: Object,
    default: () => ({ unreadOnly: false })
  }
})

const emit = defineEmits(['close', 'refresh'])

// Composables
const { notifications, loading, totalUnread, fetchNotifications, markAsRead, markAllAsRead, countUnreadNotifications } = useNotifications()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

// Variables pour les rôles utilisateur
const isAdmin = ref(false)
const isSuperAdmin = ref(false)

// Vérifier les rôles de l'utilisateur
const checkUserRoles = async () => {
  if (!user.value) return

  try {
    const { data: adminStatus } = await supabase
      .rpc('is_admin_v2', { user_uuid: user.value.id })
    
    const { data: superAdminStatus } = await supabase
      .rpc('is_superadmin_v2', { user_uuid: user.value.id })
    
    isAdmin.value = !!adminStatus
    isSuperAdmin.value = !!superAdminStatus
  } catch (error) {
    console.error("Erreur lors de la vérification des rôles:", error)
  }
}

// Fonctions
const formatDate = (date: string) => {
  const now = new Date()
  const dateObj = new Date(date)
  
  // Si c'est aujourd'hui, afficher l'heure
  if (dateObj.toDateString() === now.toDateString()) {
    return format(dateObj, 'HH:mm', { locale: fr })
  }
  
  // Si c'est cette année mais pas aujourd'hui
  if (dateObj.getFullYear() === now.getFullYear()) {
    return format(dateObj, 'dd MMM', { locale: fr })
  }
  
  // Sinon afficher la date complète
  return format(dateObj, 'dd MMM yyyy', { locale: fr })
}

const formatEntityType = (entityType: string) => {
  switch (entityType) {
    case 'contacts_staging':
      return 'Contact'
    case 'order':
      return 'Commande'
    case 'commission':
      return 'Commission'
    case 'test':
      return 'Test'
    default:
      return entityType
  }
}

// Déterminer l'URL de redirection pour une notification
const getNotificationUrl = (notification: NotificationWithEntity): string => {
  // Si l'URL d'action est spécifiée, l'utiliser
  if (notification.action_url) {
    return notification.action_url
  }
  
  // Sinon, rediriger en fonction du type d'entité
  switch (notification.entity_type) {
    case 'contacts_staging':
      return `/contacts/import/${notification.entity_id}`
    case 'order':
      return `/orders/${notification.entity_id}`
    case 'commission':
      return `/commissions/${notification.entity_id}`
    default:
      return '/notifications'
  }
}

// Recharger les notifications manuellement
const reloadNotifications = async () => {
  if (user.value) {
    await fetchNotifications(user.value.email || '', props.filter)
    await countUnreadNotifications(user.value.email || '')
    emit('refresh')
  }
}

const handleMarkAllAsRead = async () => {
  if (!user.value) return
  
  await markAllAsRead(user.value.email || '')
  emit('refresh')
}

// Chargement initial
onMounted(async () => {
  if (user.value) {
    // Vérifier les rôles utilisateur
    await checkUserRoles()
    // Charger les notifications avec les filtres
    await fetchNotifications(user.value.email || '', props.filter)
    // Compter les notifications non lues avec prise en compte des rôles
    await countUnreadNotifications(user.value.email || '')
    // Si maxItems est défini, limiter le nombre de notifications
    if (props.maxItems > 0 && notifications.value.length > props.maxItems) {
      notifications.value = notifications.value.slice(0, props.maxItems)
    }
    
    // Ajouter une classe pour identifier le composant
    nextTick(() => {
      const el = document.querySelector('.space-y-4')
      if (el) el.classList.add('NotificationsList')
    })
    
    // Ajouter un écouteur d'événement pour recharger les notifications
    document.addEventListener('refresh-notifications', () => reloadNotifications())
  }
})

// Supprimer l'écouteur d'événement lors du démontage du composant
onUnmounted(() => {
  document.removeEventListener('refresh-notifications', () => reloadNotifications())
})
</script> 