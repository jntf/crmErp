<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold">Validation des contacts importés</h2>
      <div class="flex items-center gap-2">
        <Button 
          @click="refreshData" 
          variant="outline" 
          size="sm"
        >
          <RefreshCwIcon v-if="!loading" class="h-4 w-4 mr-2" />
          <Loader2Icon v-else class="h-4 w-4 mr-2 animate-spin" />
          Actualiser
        </Button>
      </div>
    </div>
    
    <!-- Statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">En attente</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ pendingCount }}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Approuvés</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ approvedCount }}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Rejetés</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ rejectedCount }}</div>
        </CardContent>
      </Card>
    </div>
    
    <!-- Tableau des contacts à approuver -->
    <Card>
      <CardHeader class="pb-2">
        <CardTitle>Contacts à valider</CardTitle>
        <CardDescription>
          Vérifiez et approuvez les contacts importés
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex justify-center py-8">
          <Loader2Icon class="h-8 w-8 animate-spin text-primary" />
        </div>
        
        <div v-else-if="pendingContacts.length === 0" class="text-center py-8 text-muted-foreground">
          <CheckCircleIcon class="h-12 w-12 mx-auto mb-2 text-primary" />
          <p class="text-lg">Tous les contacts ont été validés</p>
        </div>
        
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead class="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="contact in pendingContacts" :key="contact.id">
              <TableCell>
                <div class="font-medium">{{ contact.first_name }} {{ contact.last_name }}</div>
              </TableCell>
              <TableCell>{{ contact.email }}</TableCell>
              <TableCell>{{ contact.company }}</TableCell>
              <TableCell>
                <div class="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    @click="viewContact(contact.id)"
                    :disabled="loadingContact === contact.id"
                  >
                    <EyeIcon class="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    @click="startApproval(contact.id)"
                    :disabled="loadingContact === contact.id"
                  >
                    <Loader2Icon v-if="loadingContact === contact.id" class="h-4 w-4 animate-spin" />
                    <CheckIcon v-else class="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    @click="rejectContact(contact.id)"
                    :disabled="loadingContact === contact.id"
                  >
                    <XIcon class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    
    <!-- Dialog d'approbation -->
    <ContactsImportApprovalDialog
      v-model:open="isApprovalDialogOpen"
      :contact-id="selectedContactId"
      @approved="handleContactApproved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from '@/components/ui/toast'
import { useContactApproval } from '../composables/useContactApproval'
import ContactsImportApprovalDialog from './ContactsImportApprovalDialog.vue'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import {
  RefreshCwIcon,
  Loader2Icon,
  CheckIcon,
  XIcon,
  CheckCircleIcon,
  EyeIcon
} from 'lucide-vue-next'
import type { ContactStaging } from '../types'

const { toast } = useToast()
const contactApproval = useContactApproval()

// État
const loading = ref(false)
const loadingContact = ref<string | null>(null)
const pendingContacts = ref<ContactStaging[]>([])
const approvedCount = ref(0)
const rejectedCount = ref(0)
const selectedContactId = ref<string>('')
const isApprovalDialogOpen = ref(false)

// Valeurs liées au composable
const {
  stagingContact,
  similarCompanies,
  similarContacts,
  selectedCompany,
  selectedContact,
  initApproval,
  finalizeApproval: finalize,
  cancelApproval,
  resetState,
  showConfirmationDialog
} = contactApproval

// Statistiques
const pendingCount = computed(() => pendingContacts.value.length)

// Charger les données
const fetchData = async () => {
  loading.value = true
  
  try {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('contacts_staging')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    pendingContacts.value = data as ContactStaging[]
    
    // Récupérer les compteurs
    const [approvedResult, rejectedResult] = await Promise.all([
      supabase
        .from('contacts_staging')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved'),
      supabase
        .from('contacts_staging')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'rejected')
    ])
    
    approvedCount.value = approvedResult.count || 0
    rejectedCount.value = rejectedResult.count || 0
  } catch (error) {
    console.error('Erreur lors du chargement des contacts:', error)
    toast({
      title: 'Erreur',
      description: 'Impossible de charger les contacts en attente',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

// Initialiser le processus d'approbation
const startApproval = async (contactId: string) => {
  loadingContact.value = contactId
  selectedContactId.value = contactId
  console.log("Début de l'approbation pour le contact:", contactId);
  
  try {
    const result = await initApproval(contactId)
    console.log("Résultat de initApproval:", result);
    console.log("similarCompanies:", similarCompanies.value);
    console.log("similarContacts:", similarContacts.value);
    
    isApprovalDialogOpen.value = true;
    
    if (!result) {
      console.log("Erreur lors de l'initialisation de l'approbation");
      toast({
        title: 'Information',
        description: 'Aucune correspondance trouvée, le contact peut être créé directement',
      })
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'approbation:', error)
    toast({
      title: 'Erreur',
      description: 'Impossible d\'initialiser le processus d\'approbation',
      variant: 'destructive'
    })
  } finally {
    loadingContact.value = null
  }
}

// Rejeter un contact
const rejectContact = async (contactId: string) => {
  loadingContact.value = contactId
  
  try {
    const supabase = useSupabaseClient()
    const { error } = await supabase
      .from('contacts_staging')
      .update({ status: 'rejected' })
      .eq('id', contactId)
    
    if (error) throw error
    
    toast({
      title: 'Contact rejeté',
      description: 'Le contact a été marqué comme rejeté'
    })
    
    // Actualiser les données
    await fetchData()
  } catch (error) {
    console.error('Erreur lors du rejet du contact:', error)
    toast({
      title: 'Erreur',
      description: 'Impossible de rejeter le contact',
      variant: 'destructive'
    })
  } finally {
    loadingContact.value = null
  }
}

// Finaliser l'approbation
const handleFinalizeApproval = async () => {
  isApprovalDialogOpen.value = true
  
  try {
    const result = await finalize()
    
    if (result.success) {
      isApprovalDialogOpen.value = false
      resetState()
      
      toast({
        title: 'Contact approuvé',
        description: result.message
      })
      
      // Actualiser les données
      await fetchData()
    } else {
      toast({
        title: 'Erreur',
        description: result.message,
        variant: 'destructive'
      })
    }
  } catch (error) {
    console.error('Erreur lors de la finalisation de l\'approbation:', error)
    toast({
      title: 'Erreur',
      description: 'Une erreur est survenue lors de l\'approbation',
      variant: 'destructive'
    })
  }
}

// Annuler l'approbation
const handleCancelApproval = () => {
  isApprovalDialogOpen.value = false
  cancelApproval()
}

// Actualiser les données
const refreshData = () => {
  fetchData()
}

// Initialiser
onMounted(() => {
  fetchData()
})

// Exposer les méthodes pour utilisation externe
defineExpose({
  initApproval: startApproval,
  finalizeApproval: handleFinalizeApproval,
  cancelApproval: handleCancelApproval,
  refreshData
})

// Voir les détails d'un contact
const viewContact = (contactId: string) => {
  navigateTo(`/contacts/import/${contactId}`)
}

// Handle approved contact
const handleContactApproved = async (result: any) => {
  toast({
    title: 'Contact approuvé',
    description: 'Le contact a été approuvé avec succès'
  })
  
  // Actualiser les données
  await fetchData()
}
</script> 