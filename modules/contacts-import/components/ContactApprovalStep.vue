<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { User as UserIcon, Mail as MailIcon, PlusCircle as PlusCircleIcon, ChevronRight as ChevronRightIcon, UserCircle as UserCircleIcon, X as XIcon } from 'lucide-vue-next'
import type { ContactStaging } from '../types'
import type { SimilarContact } from '../types/approval.types'

// Form spécifique pour les contacts
const ContactForm = defineAsyncComponent(() => 
  import('~/modules/contacts-import/components/forms/ContactImportForm.vue')
)

// Props et émetteurs
const props = defineProps<{
  contact?: ContactStaging | null
  similarContacts?: SimilarContact[]
  selectedContact: string | null
  contactFormData: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:selectedContact', value: string | null): void
  (e: 'update:contactFormData', value: Record<string, any>): void
  (e: 'next'): void
  (e: 'cancel'): void
}>()

// État local
const contactChoice = ref<string>('new')

// Modifier le choix de contact
watch(contactChoice, (newValue) => {
  emit('update:selectedContact', newValue === 'new' ? 'new' : newValue)
})

// Initialiser le choix de contact en fonction des données de similarité
watch(() => props.similarContacts, (newValue) => {
  if (newValue && newValue.length > 0) {
    // Si un contact a une similarité très élevée (> 0.9), le sélectionner par défaut
    const bestMatch = newValue.reduce((prev, current) => 
      prev.similarity > current.similarity ? prev : current
    )
    
    if (bestMatch.similarity > 0.9) {
      contactChoice.value = bestMatch.id
      emit('update:selectedContact', bestMatch.id)
    } else {
      contactChoice.value = 'new'
      emit('update:selectedContact', 'new')
    }
  } else {
    contactChoice.value = 'new'
    emit('update:selectedContact', 'new')
  }
}, { immediate: true })

// Initialiser les données du formulaire pour le contact
const initialContactData = computed(() => {
  if (!props.contact) return {}
  
  return {
    first_name: props.contact.first_name || '',
    last_name: props.contact.last_name || '',
    email: props.contact.email || '',
    phone: props.contact.phone || '',
    job_title: props.contact.job_title || '',
    notes: props.contact.notes || '',
    status: 'active'
  }
})

// Obtenir le nom complet du contact sélectionné
const getSelectedContactName = () => {
  if (contactChoice.value === 'new') return ''
  
  const contact = props.similarContacts?.find(c => c.id === contactChoice.value)
  if (!contact) return ''
  
  return `${contact.first_name} ${contact.last_name}`
}

// Obtenir l'email du contact sélectionné
const getSelectedContactEmail = () => {
  if (contactChoice.value === 'new') return ''
  
  const contact = props.similarContacts?.find(c => c.id === contactChoice.value)
  return contact?.email || ''
}

// Mettre à jour les données du formulaire
const updateFormData = (data: Record<string, any>) => {
  emit('update:contactFormData', data)
}
</script>

<template>
  <div class="space-y-6">
    <Card v-if="similarContacts && similarContacts.length > 0" class="border shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader class="bg-slate-50 dark:bg-slate-800/40">
        <CardTitle class="flex items-center">
          <UserCircleIcon class="h-5 w-5 mr-2 text-primary" />
          Contact
        </CardTitle>
        <CardDescription>Choisissez d'utiliser un contact existant ou d'en créer un nouveau</CardDescription>
      </CardHeader>
      <CardContent class="pt-4">
        <RadioGroup v-model="contactChoice" class="space-y-4">
          <div class="space-y-4">
            <Label class="mb-2 block text-gray-700 dark:text-gray-300">Contacts similaires trouvés :</Label>
            <div v-for="contact in similarContacts" :key="contact.id" 
                 class="flex items-start space-x-3 p-3 border rounded-md hover:border-primary/40 hover:bg-primary/5 transition-colors duration-200">
              <RadioGroupItem :value="contact.id" :id="`contact-${contact.id}`" />
              <div class="grid gap-1">
                <Label :for="`contact-${contact.id}`" class="font-medium text-gray-900 dark:text-gray-50">
                  {{ contact.first_name }} {{ contact.last_name }}
                </Label>
                <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <MailIcon class="h-3.5 w-3.5 mr-1 opacity-70" />
                  {{ contact.email }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">
                    Similarité: {{ Math.round(contact.similarity * 100) }}%
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div class="flex items-start space-x-3 p-3 border rounded-md hover:border-primary/40 hover:bg-primary/5 transition-colors duration-200">
            <RadioGroupItem value="new" id="contact-new" />
            <div>
              <Label for="contact-new" class="font-medium text-gray-900 dark:text-gray-50">Créer un nouveau contact</Label>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Utiliser les données d'importation pour créer une nouvelle fiche contact
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>

    <!-- Récapitulatif du contact sélectionné -->
    <div v-if="contactChoice !== 'new'" 
         class="p-4 border rounded-md bg-primary/5 dark:bg-primary/10 shadow-sm border-primary/20">
      <p class="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contact existant sélectionné :</p>
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-sm">
          <UserIcon class="w-5 h-5 text-primary" />
        </div>
        <div>
          <p class="font-medium text-gray-900 dark:text-gray-50">{{ getSelectedContactName() }}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            <MailIcon class="h-3.5 w-3.5 mr-1 opacity-70" />
            {{ getSelectedContactEmail() }}
          </p>
        </div>
      </div>
    </div>

    <!-- Formulaire de création de contact -->
    <div v-if="contactChoice === 'new'" class="transition-all duration-300">
      <Card class="border shadow-sm">
        <CardHeader class="bg-slate-50 dark:bg-slate-800/40">
          <CardTitle class="flex items-center">
            <PlusCircleIcon class="h-5 w-5 mr-2 text-primary" />
            Nouveau contact
          </CardTitle>
          <CardDescription>Informations du contact à créer</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm 
            :initial-data="initialContactData" 
            @update:model-value="updateFormData"
          />
        </CardContent>
      </Card>
    </div>

    <!-- Boutons d'action -->
    <div class="flex justify-between gap-4 pt-5 mt-6 border-t dark:border-gray-700">
      <Button variant="outline" @click="$emit('cancel')" class="hover:bg-gray-100 dark:hover:bg-gray-700">
        <XIcon class="h-4 w-4 mr-2" />
        Annuler
      </Button>
      <Button @click="$emit('next')" class="shadow-sm hover:shadow-md transition-shadow">
        Continuer
        <ChevronRightIcon class="h-4 w-4 ml-2" />
      </Button>
    </div>
  </div>
</template>

<style scoped>
.card-appear-enter-active,
.card-appear-leave-active {
  transition: all 0.3s ease;
}

.card-appear-enter-from,
.card-appear-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style> 