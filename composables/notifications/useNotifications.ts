import { ref, computed } from 'vue'
import type { Notification, NotificationWithEntity, NotificationFilters } from '@/types/notifications'
import { useToast } from '@/components/ui/toast/use-toast'

export function useNotifications() {
  const supabase = useSupabaseClient()
  const { toast } = useToast()
  
  const notifications = ref<NotificationWithEntity[]>([])
  const loading = ref(false)
  const totalUnread = ref(0)
  
  // Récupère les notifications pour l'utilisateur courant
  const fetchNotifications = async (userEmail: string, filters: NotificationFilters = {}) => {
    try {
      loading.value = true
      
      // Vérifier si l'utilisateur est superadmin ou admin
      const { data: isSuperAdmin } = await supabase
        .rpc('is_superadmin_v2', { user_uuid: useSupabaseUser().value?.id })
        
      const { data: isAdmin } = await supabase
        .rpc('is_admin_v2', { user_uuid: useSupabaseUser().value?.id })
      
      let query = supabase
        .from('notifications')
        .select('*')
      
      // Si l'utilisateur est superadmin ou admin, ne pas filtrer par utilisateur
      if (!isSuperAdmin && !isAdmin) {
        query = query.eq('user_email', userEmail)
      }
      
      // Application des filtres
      if (filters.unreadOnly) {
        query = query.eq('is_read', false)
      } else if (filters.readOnly) {
        query = query.eq('is_read', true)
      }
      
      if (filters.entityType && filters.entityType !== 'all') {
        query = query.eq('entity_type', filters.entityType)
      }
      
      if (filters.actionRequired !== undefined) {
        query = query.eq('action_required', filters.actionRequired)
      }
      
      // Tri par date
      const sortDirection = filters.sortDirection || 'desc'
      query = query.order('created_at', { ascending: sortDirection === 'asc' })
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Récupération des entités associées aux notifications
      if (data && data.length > 0) {
        const notificationsWithEntity = [...data] as NotificationWithEntity[]
        
        // Grouper les notifications par type d'entité pour minimiser les requêtes
        const entityTypeGroups: Record<string, string[]> = {}
        
        data.forEach(notification => {
          if (!entityTypeGroups[notification.entity_type]) {
            entityTypeGroups[notification.entity_type] = []
          }
          entityTypeGroups[notification.entity_type].push(notification.entity_id)
        })
        
        // Charger les entités pour chaque type
        for (const [entityType, entityIds] of Object.entries(entityTypeGroups)) {
          if (entityType === 'contacts_staging' && entityIds.length > 0) {
            const { data: entitiesData, error: entitiesError } = await supabase
              .from(entityType)
              .select('*')
              .in('id', entityIds)
            
            if (!entitiesError && entitiesData) {
              // Associer chaque entité à sa notification
              notificationsWithEntity.forEach(notification => {
                if (notification.entity_type === entityType) {
                  notification.entity = entitiesData.find(e => e.id === notification.entity_id)
                }
              })
            }
          }
          // Ajouter d'autres types d'entités ici au besoin
        }
        
        notifications.value = notificationsWithEntity
      } else {
        notifications.value = []
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les notifications',
        variant: 'destructive'
      })
    } finally {
      loading.value = false
    }
  }
  
  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
      
      if (error) throw error
      
      // Mettre à jour l'état local
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        notifications.value[index].is_read = true
        totalUnread.value = Math.max(0, totalUnread.value - 1)
      }
      
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer la notification comme lue',
        variant: 'destructive'
      })
    }
  }
  
  // Marquer toutes les notifications comme lues
  const markAllAsRead = async (userEmail: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_email', userEmail)
        .eq('is_read', false)
      
      if (error) throw error
      
      // Mettre à jour l'état local
      notifications.value.forEach(notification => {
        notification.is_read = true
      })
      totalUnread.value = 0
      
      return true
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer toutes les notifications comme lues',
        variant: 'destructive'
      })
      return false
    }
  }
  
  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      
      if (error) throw error
      
      // Mettre à jour l'état local
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        const wasUnread = !notifications.value[index].is_read
        notifications.value.splice(index, 1)
        if (wasUnread) {
          totalUnread.value = Math.max(0, totalUnread.value - 1)
        }
      }
      
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la notification',
        variant: 'destructive'
      })
      return false
    }
  }
  
  // Filtres calculés
  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.is_read)
  })
  
  const actionRequiredNotifications = computed(() => {
    return notifications.value.filter(n => n.action_required)
  })
  
  // Compter le nombre total de notifications non lues, en tenant compte des rôles administratifs
  const countUnreadNotifications = async (userEmail: string) => {
    try {
      // Vérifier si l'utilisateur est superadmin ou admin
      const { data: isSuperAdmin } = await supabase
        .rpc('is_superadmin_v2', { user_uuid: useSupabaseUser().value?.id })
        
      const { data: isAdmin } = await supabase
        .rpc('is_admin_v2', { user_uuid: useSupabaseUser().value?.id })
      
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
      
      // Si l'utilisateur n'est pas superadmin ou admin, filtrer par email
      if (!isSuperAdmin && !isAdmin) {
        query = query.eq('user_email', userEmail)
      }
      
      const { count, error } = await query
      
      if (!error) {
        totalUnread.value = count || 0
      }
      
      return totalUnread.value
    } catch (error) {
      console.error('Erreur lors du comptage des notifications non lues:', error)
      return 0
    }
  }
  
  // Créer une nouvelle notification
  const createNotification = async (notification: Omit<Notification, 'id' | 'created_at'>) => {
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          created_at: now
        })
        .select()
      
      if (error) throw error
      
      return { success: true, data }
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la notification',
        variant: 'destructive'
      })
      return { success: false, error }
    }
  }
  
  return {
    notifications,
    loading,
    totalUnread,
    unreadNotifications,
    actionRequiredNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    countUnreadNotifications,
    createNotification
  }
} 