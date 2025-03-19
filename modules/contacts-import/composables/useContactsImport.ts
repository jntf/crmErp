import { ref } from 'vue'
import type { ContactStaging } from '../types'
import { useToast } from '@/components/ui/toast/use-toast'

export function useContactsImport() {
  const supabase = useSupabaseClient()
  const { toast } = useToast()
  
  const pendingContacts = ref<ContactStaging[]>([])
  const loading = ref(false)
  const totalPending = ref(0)
  
  // Récupérer les contacts en attente
  const fetchPendingContacts = async () => {
    try {
      loading.value = true
      
      const { data, error, count } = await supabase
        .from('contacts_staging')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      pendingContacts.value = data || []
      totalPending.value = count || 0
      
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts en attente:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les contacts en attente',
        variant: 'destructive'
      })
    } finally {
      loading.value = false
    }
  }
  
  // Approuver un contact
  const approveContact = async (contactId: string, userEmail: string) => {
    try {
      const now = new Date().toISOString()
      
      // Mise à jour du statut du contact
      const { error } = await supabase
        .from('contacts_staging')
        .update({
          status: 'approved',
          approved_at: now,
          approved_by: userEmail
        })
        .eq('id', contactId)
      
      if (error) throw error
      
      // Mettre à jour l'état local des contacts
      const index = pendingContacts.value.findIndex(c => c.id === contactId)
      if (index !== -1) {
        pendingContacts.value.splice(index, 1)
        totalPending.value = Math.max(0, totalPending.value - 1)
      }
      
      // Mettre à jour les notifications associées
      await supabase
        .from('notifications')
        .update({
          entity_status: 'approved',
          action_required: false
        })
        .eq('entity_id', contactId)
        .eq('entity_type', 'contacts_staging')
      
      toast({
        title: 'Succès',
        description: 'Le contact a été approuvé'
      })
      
      return true
      
    } catch (error) {
      console.error('Erreur lors de l\'approbation du contact:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'approuver le contact',
        variant: 'destructive'
      })
      return false
    }
  }
  
  // Rejeter un contact
  const rejectContact = async (contactId: string) => {
    try {
      // Mise à jour du statut du contact
      const { error } = await supabase
        .from('contacts_staging')
        .update({
          status: 'rejected'
        })
        .eq('id', contactId)
      
      if (error) throw error
      
      // Mettre à jour l'état local des contacts
      const index = pendingContacts.value.findIndex(c => c.id === contactId)
      if (index !== -1) {
        pendingContacts.value.splice(index, 1)
        totalPending.value = Math.max(0, totalPending.value - 1)
      }
      
      // Mettre à jour les notifications associées
      await supabase
        .from('notifications')
        .update({
          entity_status: 'rejected',
          action_required: false
        })
        .eq('entity_id', contactId)
        .eq('entity_type', 'contacts_staging')
      
      toast({
        title: 'Succès',
        description: 'Le contact a été rejeté'
      })
      
      return true
      
    } catch (error) {
      console.error('Erreur lors du rejet du contact:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter le contact',
        variant: 'destructive'
      })
      return false
    }
  }
  
  // Obtenir un contact spécifique
  const getContact = async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from('contacts_staging')
        .select('*')
        .eq('id', contactId)
        .single()
      
      if (error) throw error
      
      return data
      
    } catch (error) {
      console.error('Erreur lors de la récupération du contact:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les informations du contact',
        variant: 'destructive'
      })
      return null
    }
  }
  
  return {
    pendingContacts,
    loading,
    totalPending,
    fetchPendingContacts,
    approveContact,
    rejectContact,
    getContact
  }
} 