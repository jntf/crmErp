<template>
  <div class="container mx-auto p-6">
    <div class="flex items-center gap-2 mb-4">
      <Button variant="outline" size="sm" asChild>
        <NuxtLink to="/contacts/import">
          <ArrowLeftIcon class="mr-2 h-4 w-4" />
          Retour
        </NuxtLink>
      </Button>
    </div>
    
    <div v-if="loading" class="flex justify-center py-16">
      <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
    
    <div v-else-if="!contact" class="text-center py-16">
      <div class="space-y-3">
        <AlertCircleIcon class="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 class="text-xl font-medium">Contact introuvable</h3>
        <p class="text-muted-foreground">
          Le contact que vous recherchez n'existe pas ou a déjà été traité
        </p>
        <Button asChild>
          <NuxtLink to="/contacts/import">
            Retour à la liste
          </NuxtLink>
        </Button>
      </div>
    </div>
    
    <div v-else class="space-y-6">
      <header class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold">
            {{ contact.first_name }} {{ contact.last_name }}
          </h1>
          <p class="text-lg text-muted-foreground">{{ contact.email }}</p>
        </div>
        
        <div class="flex gap-3">
          <Button 
            variant="outline" 
            size="sm"
            class="bg-green-100 hover:bg-green-200 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 dark:border-green-800/30"
            @click="handleApprove"
          >
            <CheckIcon class="mr-2 h-4 w-4" />
            Approuver
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            class="bg-red-100 hover:bg-red-200 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 dark:border-red-800/30"
            @click="handleReject"
          >
            <XIcon class="mr-2 h-4 w-4" />
            Rejeter
          </Button>
        </div>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Informations du contact</CardTitle>
          <CardDescription>
            Importé le {{ formatDate(contact.created_at) }} par {{ contact.created_by }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="saveContact" class="space-y-6">
            <!-- Informations personnelles -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="first_name">Prénom</Label>
                <Input id="first_name" v-model="form.first_name" placeholder="Prénom" />
              </div>
              
              <div class="space-y-2">
                <Label for="last_name">Nom</Label>
                <Input id="last_name" v-model="form.last_name" placeholder="Nom" />
              </div>
              
              <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input id="email" v-model="form.email" type="email" placeholder="Email" required />
              </div>
              
              <div class="space-y-2">
                <Label for="phone">Téléphone</Label>
                <Input id="phone" v-model="form.phone" placeholder="Téléphone" />
              </div>
            </div>
            
            <!-- Informations professionnelles -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="company">Société</Label>
                <Input id="company" v-model="form.company" placeholder="Société" />
              </div>
              
              <div class="space-y-2">
                <Label for="job_title">Fonction</Label>
                <Input id="job_title" v-model="form.job_title" placeholder="Fonction" />
              </div>
            </div>
            
            <!-- Type de contact -->
            <div class="space-y-2">
              <Label>Type de contact</Label>
              <div class="flex flex-wrap gap-2">
                <Badge 
                  v-for="type in form.contact_type[0]" 
                  :key="type" 
                  variant="outline"
                  class="px-3 py-1"
                >
                  {{ type }}
                </Badge>
              </div>
            </div>
            
            <!-- Notes -->
            <div class="space-y-2">
              <Label for="notes">Notes</Label>
              <Textarea id="notes" v-model="form.notes" placeholder="Notes supplémentaires" rows="4" />
            </div>
            
            <div class="flex justify-end">
              <Button type="submit" :disabled="isSaving">
                <SaveIcon v-if="!isSaving" class="mr-2 h-4 w-4" />
                <Loader2Icon v-else class="mr-2 h-4 w-4 animate-spin" />
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>

    <ContactApprovalDialog
      v-model:open="approvalDialogOpen"
      :contact-id="contactId"
      @approved="handleApprovalComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeftIcon, AlertCircleIcon, CheckIcon, XIcon, SaveIcon, Loader2Icon } from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useToast } from '@/components/ui/toast/use-toast'
import { useContactsImport } from '../composables/useContactsImport'
import type { ContactStaging } from '../types'
import ContactApprovalDialog from '../components/ContactApprovalDialog.vue'

definePageMeta({
  middleware: ['auth']
})

// Composables
const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { approveContact, rejectContact, getContact } = useContactsImport()

// État
const contactId = route.params.id as string
const contact = ref<ContactStaging | null>(null)
const loading = ref(true)
const isSaving = ref(false)
const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  company: '',
  job_title: '',
  contact_type: [['']],
  notes: ''
})
const approvalDialogOpen = ref(false)

// Fonctions
const formatDate = (date: string) => {
  return format(new Date(date), 'dd MMMM yyyy à HH:mm', { locale: fr })
}

const loadContact = async () => {
  try {
    loading.value = true
    const data = await getContact(contactId)
    
    if (data) {
      contact.value = data
      
      // Initialiser le formulaire
      form.value = {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email,
        phone: data.phone || '',
        company: data.company || '',
        job_title: data.job_title || '',
        contact_type: data.contact_type || [['']],
        notes: data.notes || ''
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement du contact:', error)
    toast({
      title: 'Erreur',
      description: 'Impossible de charger les informations du contact',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

const saveContact = async () => {
  try {
    isSaving.value = true
    
    const { error } = await supabase
      .from('contacts_staging')
      .update({
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        email: form.value.email,
        phone: form.value.phone,
        company: form.value.company,
        job_title: form.value.job_title,
        notes: form.value.notes
      })
      .eq('id', contactId)
    
    if (error) throw error
    
    // Mettre à jour l'état local
    if (contact.value) {
      contact.value = {
        ...contact.value,
        ...form.value
      }
    }
    
    toast({
      title: 'Succès',
      description: 'Les modifications ont été enregistrées'
    })
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du contact:', error)
    toast({
      title: 'Erreur',
      description: 'Impossible d\'enregistrer les modifications',
      variant: 'destructive'
    })
  } finally {
    isSaving.value = false
  }
}

const handleApprove = () => {
  approvalDialogOpen.value = true
}

const handleApprovalComplete = () => {
  toast({
    title: 'Succès',
    description: 'Le contact a été approuvé'
  })
  router.push('/contacts/import')
}

const handleReject = async () => {
  const success = await rejectContact(contactId)
  if (success) {
    toast({
      title: 'Succès',
      description: 'Le contact a été rejeté'
    })
    router.push('/contacts/import')
  }
}

// Chargement initial
onMounted(async () => {
  await loadContact()
})
</script> 