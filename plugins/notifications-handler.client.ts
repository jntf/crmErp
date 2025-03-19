import { defineNuxtPlugin } from 'nuxt/app'
import { ref, watch, h, createApp, onUnmounted } from 'vue'
import { createSharedComposable } from '@vueuse/core'
import { useNotifications } from '~/composables/notifications/useNotifications'
import NotificationToast from '~/components/notifications/NotificationToast.vue'

export default defineNuxtPlugin({
  name: 'notifications-handler',
  enforce: 'post',
  async setup() {
    // Utilisation de useVueuse pour partager l'état entre les composants
    const sharedNotifications = createSharedComposable(useNotifications)
    const { countUnreadNotifications } = sharedNotifications()
    const user = useSupabaseUser()
    
    let unsubscribe: (() => void) | null = null
    
    // Fonction pour afficher une notification toast
    function showNotificationToast(notificationId: string) {
      const { notifications } = sharedNotifications()
      const notification = notifications.value.find(n => n.id === notificationId)
      
      if (!notification) return
      
      // Créer un conteneur pour le toast
      const container = document.createElement('div')
      document.body.appendChild(container)
      
      // Créer une application Vue pour le toast
      const app = createApp({
        render() {
          return h(NotificationToast, {
            notification,
            onClose: () => {
              // Nettoyer le composant
              app.unmount()
              document.body.removeChild(container)
            }
          })
        }
      })
      
      // Monter le composant
      app.mount(container)
    }
    
    // S'abonner aux changements de la table notifications
    async function subscribeToNotifications() {
      if (!user.value) return
      
      // Se désabonner d'abord si déjà abonné
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
      
      const supabase = useSupabaseClient()
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_email=eq.${user.value.email}`
          },
          async (payload) => {
            // Actualiser le compteur de notifications
            await countUnreadNotifications(user.value!.email || '')
            
            // Afficher une notification toast pour les nouvelles notifications
            if (payload.new && payload.new.id) {
              showNotificationToast(payload.new.id)
            }
            
            // Déclencher un événement pour actualiser les listes de notifications
            document.dispatchEvent(new CustomEvent('refresh-notifications'))
          }
        )
        .subscribe()
      
      unsubscribe = () => channel.unsubscribe()
    }
    
    // S'abonner aux changements quand l'utilisateur se connecte
    watch(user, (newUser) => {
      if (newUser) {
        subscribeToNotifications()
      } else if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
    }, { immediate: true })
    
    // Nettoyer à la fin
    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
    })
  }
}) 