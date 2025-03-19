<template>
  <div class="container mx-auto p-6">
    <header class="space-y-2 mb-6">
      <h1 class="text-3xl font-bold tracking-tight">Centre de notifications</h1>
      <p class="text-muted-foreground">
        Consultez et gérez toutes vos notifications
      </p>
    </header>

    <!-- Filtres et tri -->
    <Card class="mb-6">
      <CardContent class="pt-6">
        <div class="flex flex-col md:flex-row gap-4 justify-between">
          <div class="flex flex-wrap gap-4">
            <div>
              <Select v-model="filters.entityType">
                <SelectTrigger class="w-[180px]">
                  <SelectValue placeholder="Type d'entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entités</SelectItem>
                  <SelectItem value="contacts_staging">Contacts</SelectItem>
                  <SelectItem value="order">Commandes</SelectItem>
                  <SelectItem value="commission">Commissions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select v-model="filters.isRead">
                <SelectTrigger class="w-[180px]">
                  <SelectValue placeholder="Statut de lecture" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="unread">Non lues</SelectItem>
                  <SelectItem value="read">Lues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select v-model="filters.actionRequired">
                <SelectTrigger class="w-[180px]">
                  <SelectValue placeholder="Action requise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="required">Action requise</SelectItem>
                  <SelectItem value="nonrequired">Sans action</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex gap-2 items-center">
            <span class="text-sm text-muted-foreground mr-2">Trier par:</span>
            <Button 
              variant="outline" 
              size="sm" 
              class="gap-1"
              @click="toggleSortOrder"
            >
              Date 
              <ChevronUpIcon v-if="sortDirection === 'asc'" class="h-4 w-4" />
              <ChevronDownIcon v-else class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Contenu principal -->
    <Card>
      <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Notifications</CardTitle>
        <div class="flex gap-2">
          <Badge v-if="totalNotifications > 0">{{ totalNotifications }} au total</Badge>
          <Badge v-if="totalUnread > 0" variant="destructive">{{ totalUnread }} non lues</Badge>
          <Button 
            v-if="totalUnread > 0" 
            variant="ghost" 
            size="sm"
            @click="handleMarkAllAsRead"
          >
            Tout marquer comme lu
          </Button>
          
          <!-- Bouton de test pour créer une notification -->
          <Button 
            variant="outline" 
            size="sm"
            @click="createTestNotification"
            :disabled="isCreatingTest"
          >
            <span v-if="isCreatingTest" class="flex items-center">
              <Loader2Icon class="h-3 w-3 mr-1 animate-spin" />
              Création...
            </span>
            <span v-else>Créer notification test</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Liste des notifications avec actions améliorées -->
        <div class="space-y-3">
          <div v-for="notification in notificationsList" :key="notification.id" 
            class="p-4 border rounded-lg transition-colors"
            :class="{ 'bg-muted/50': !notification.is_read }">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
              <div class="flex-1 space-y-2">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-medium" :class="{ 'font-bold': !notification.is_read }">
                      {{ notification.message }}
                    </h3>
                    <div class="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Badge variant="outline" class="text-xs">
                        {{ formatEntityType(notification.entity_type) }}
                      </Badge>
                      <span>{{ formatDate(notification.created_at) }}</span>
                    </div>
                  </div>
                  <Button 
                    v-if="!notification.is_read" 
                    variant="ghost" 
                    size="sm"
                    @click="markAsRead(notification.id)"
                  >
                    <CheckIcon class="h-4 w-4" />
                  </Button>
                </div>
                
                <!-- Actions pour les notifications qui le nécessitent -->
                <div v-if="notification.action_required" class="flex flex-wrap gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    @click="() => navigateTo(getNotificationUrl(notification))"
                  >
                    <EyeIcon class="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  
                  <!-- Actions spécifiques aux contacts -->
                  <template v-if="notification.entity_type === 'contacts_staging'">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      class="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                      @click="() => handleApproveContact(notification.entity_id, notification.id)"
                    >
                      <CheckIcon class="h-4 w-4 mr-1" />
                      Approuver
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      size="sm"
                      @click="() => handleRejectContact(notification.entity_id, notification.id)"
                    >
                      <XIcon class="h-4 w-4 mr-1" />
                      Rejeter
                    </Button>
                  </template>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Message si aucune notification -->
          <div v-if="notificationsList.length === 0" class="text-center py-8 text-muted-foreground">
            Aucune notification avec les filtres actuels
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronUpIcon, ChevronDownIcon, Loader2Icon, CheckIcon, XIcon, EyeIcon } from 'lucide-vue-next'
import { useNotifications } from '@/composables/notifications/useNotifications'
import { useContactsImport } from '~/modules/contacts-import/composables/useContactsImport'
import { useToast } from '@/components/ui/toast/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { NotificationWithEntity } from '@/types/notifications'

definePageMeta({
  middleware: ['auth']
})

// Filtres et tri
const sortDirection = ref<'asc' | 'desc'>('desc') // Plus récent d'abord par défaut
const filters = ref({
  entityType: 'all',
  isRead: 'all',
  actionRequired: 'all'
})

// État
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { totalUnread, markAsRead, markAllAsRead, notifications, fetchNotifications } = useNotifications()
const { approveContact, rejectContact } = useContactsImport()
const totalNotifications = ref(0)
const isCreatingTest = ref(false)
const { toast } = useToast()

// Formater le type d'entité
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

// Formater la date
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

// Obtenir l'URL d'une notification
const getNotificationUrl = (notification: NotificationWithEntity): string => {
  if (notification.action_url) {
    return notification.action_url
  }
  
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

// Liste filtrée des notifications
const notificationsList = computed(() => {
  return notifications.value || []
})

// Filtre calculé pour le composant NotificationsList
const notificationsFilter = computed(() => {
  const filter: Record<string, any> = {
    sortDirection: sortDirection.value
  }
  
  if (filters.value.entityType && filters.value.entityType !== 'all') {
    filter.entityType = filters.value.entityType
  }
  
  if (filters.value.isRead === 'unread') {
    filter.unreadOnly = true
  } else if (filters.value.isRead === 'read') {
    filter.readOnly = true
  }
  
  if (filters.value.actionRequired === 'required') {
    filter.actionRequired = true
  } else if (filters.value.actionRequired === 'nonrequired') {
    filter.actionRequired = false
  }
  
  return filter
})

// Inverser l'ordre de tri
const toggleSortOrder = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

// Récupérer le nombre total de notifications
const refreshNotificationCount = async () => {
  if (!user.value) return
  
  try {
    // Vérifier si l'utilisateur est superadmin ou admin
    const { data: isSuperAdmin } = await supabase
      .rpc('is_superadmin_v2', { user_uuid: user.value.id })
      
    const { data: isAdmin } = await supabase
      .rpc('is_admin_v2', { user_uuid: user.value.id })
    
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
    
    // Si l'utilisateur n'est pas superadmin ou admin, filtrer par email
    if (!isSuperAdmin && !isAdmin) {
      query = query.eq('user_email', user.value.email || '')
    }
    
    const { count } = await query
    
    totalNotifications.value = count || 0
  } catch (error) {
    console.error('Erreur lors du comptage des notifications:', error)
  }
}

// Créer une notification de test
const createTestNotification = async () => {
  if (!user.value) return
  
  try {
    isCreatingTest.value = true
    const now = new Date().toISOString()
    
    // Créer une notification test
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_email: user.value.email,
        message: `Notification de test créée le ${now}`,
        entity_type: 'test',
        entity_id: '00000000-0000-0000-0000-000000000000',
        action_required: false,
        is_read: false,
        created_at: now
      })
    
    if (error) throw error
    
    toast({
      title: 'Succès',
      description: 'Notification de test créée avec succès'
    })
    
    // Rafraîchir la liste
    refreshNotificationCount()
    loadNotifications()
    
    // Recharger les notifications pour voir la notification de test
    if (document.querySelector('.NotificationsList')) {
      const event = new CustomEvent('refresh-notifications')
      document.dispatchEvent(event)
    }
  } catch (error) {
    console.error('Erreur lors de la création de la notification de test:', error)
    toast({
      title: 'Erreur',
      description: 'Impossible de créer la notification de test',
      variant: 'destructive'
    })
  } finally {
    isCreatingTest.value = false
  }
}

// Marquer toutes les notifications comme lues
const handleMarkAllAsRead = async () => {
  if (!user.value) return
  
  try {
    const success = await markAllAsRead(user.value.email || '')
    if (success) {
      // Rafraîchir la liste
      refreshNotificationCount()
      loadNotifications()
    }
  } catch (error) {
    console.error('Erreur lors du marquage des notifications:', error)
  }
}

// Approuver un contact
const handleApproveContact = async (contactId: string, notificationId: string) => {
  if (!user.value) return
  
  const success = await approveContact(contactId, user.value.email || '')
  if (success) {
    // Marquer la notification comme lue
    await markAsRead(notificationId)
    // Rafraîchir la liste
    loadNotifications()
    toast({
      title: 'Succès',
      description: 'Contact approuvé avec succès'
    })
  }
}

// Rejeter un contact
const handleRejectContact = async (contactId: string, notificationId: string) => {
  const success = await rejectContact(contactId)
  if (success) {
    // Marquer la notification comme lue
    await markAsRead(notificationId)
    // Rafraîchir la liste
    loadNotifications()
    toast({
      title: 'Succès',
      description: 'Contact rejeté avec succès'
    })
  }
}

// Charger les notifications
const loadNotifications = async () => {
  if (user.value) {
    await fetchNotifications(user.value.email || '', notificationsFilter.value)
  }
}

// Surveiller les changements de filtres
watch([filters, sortDirection], () => {
  loadNotifications()
}, { deep: true })

// Charger les données initiales
onMounted(() => {
  refreshNotificationCount()
  loadNotifications()
})
</script> 