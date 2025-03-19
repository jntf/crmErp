<template>
  <div class="p-6 space-y-6">
    <!-- En-tête -->
    <div class="mb-6">
      <h3 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Validation du contact</h3>
      <p class="text-gray-600 dark:text-gray-300 mt-2" v-if="similarCompanies.length > 0 || similarContacts.length > 0">
        Des correspondances potentielles ont été trouvées. Veuillez vérifier les informations et choisir comment procéder.
      </p>
      <p class="text-gray-600 dark:text-gray-300 mt-2" v-else>
        Veuillez compléter les informations pour créer le contact et son entreprise.
      </p>
    </div>

    <!-- Données importées -->
    <Card class="mb-6 border shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader class="pb-2 bg-slate-50 dark:bg-slate-800/40">
        <CardTitle class="text-primary flex items-center">
          <FileTextIcon class="h-5 w-5 mr-2" />
          Données importées
        </CardTitle>
      </CardHeader>
      <CardContent class="text-sm space-y-2 p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="flex items-center">
            <span class="font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">Nom:</span> 
            <span class="text-gray-900 dark:text-gray-50">{{ stagingContact.first_name }} {{ stagingContact.last_name }}</span>
          </div>
          <div class="flex items-center">
            <span class="font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">Email:</span> 
            <span class="text-gray-900 dark:text-gray-50">{{ stagingContact.email }}</span>
          </div>
          <div class="flex items-center" v-if="stagingContact.phone">
            <span class="font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">Téléphone:</span> 
            <span class="text-gray-900 dark:text-gray-50">{{ stagingContact.phone }}</span>
          </div>
          <div class="flex items-center" v-if="stagingContact.company">
            <span class="font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">Entreprise:</span> 
            <span class="text-gray-900 dark:text-gray-50">{{ stagingContact.company }}</span>
          </div>
          <div class="flex items-center" v-if="stagingContact.job_title">
            <span class="font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">Fonction:</span> 
            <span class="text-gray-900 dark:text-gray-50">{{ stagingContact.job_title }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Indicateur d'étape -->
    <div class="flex items-center mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
      <div class="flex items-center">
        <div class="flex items-center justify-center w-10 h-10 rounded-full shadow-sm transition-all duration-300" 
             :class="currentStep >= 1 ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted'">
          <UserIcon v-if="currentStep !== 1" class="h-4 w-4" />
          <span v-else>1</span>
        </div>
        <span class="ml-3 font-medium" :class="currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'">Contact</span>
      </div>
      <div class="flex-1 h-1 mx-4 rounded transition-all duration-500" 
           :class="currentStep >= 2 ? 'bg-primary' : 'bg-muted'"></div>
      <div class="flex items-center">
        <div class="flex items-center justify-center w-10 h-10 rounded-full shadow-sm transition-all duration-300" 
             :class="currentStep >= 2 ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted'">
          <BuildingIcon v-if="currentStep !== 2" class="h-4 w-4" />
          <span v-else>2</span>
        </div>
        <span class="ml-3 font-medium" :class="currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'">Entreprise</span>
      </div>
    </div>

    <!-- Étape 1: Contact -->
    <div v-if="currentStep === 1" class="space-y-6 transition-all duration-300">
      <!-- Sélection de contact existant ou nouveau -->
      <Card class="mb-4 border shadow-sm" v-if="similarContacts.length > 0">
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
                    <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">
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
           class="mt-2 p-4 border rounded-md bg-primary/5 dark:bg-primary/10 shadow-sm border-primary/20">
        <p class="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contact existant sélectionné :</p>
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-sm">
            <UserIcon class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-gray-50">
              {{ getSelectedContactName() }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <MailIcon class="h-3.5 w-3.5 mr-1 opacity-70" />
              {{ getSelectedContactEmail() }}
            </p>
          </div>
        </div>
      </div>

      <!-- Formulaire de contact (affiché seulement si "créer un nouveau contact" est sélectionné) -->
      <div v-if="contactChoice === 'new'" class="border rounded-md shadow-sm p-4 bg-white dark:bg-gray-800">
        <ContactForm 
          v-model="contactFormData"
          :initial-data="initialContactData"
          :loading="loading"
          :show-actions="false"
          :show-address="false"
        />
      </div>

      <!-- Boutons d'actions pour l'étape 1 -->
      <div class="flex justify-end gap-4 pt-5 mt-6 border-t dark:border-gray-700">
        <Button variant="outline" @click="onCancel" class="hover:bg-gray-100 dark:hover:bg-gray-700">
          Annuler
        </Button>
        <Button @click="nextStep" :disabled="loading" class="shadow-sm hover:shadow-md transition-shadow">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          Continuer
          <ChevronRightIcon class="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Étape 2: Entreprise -->
    <div v-if="currentStep === 2" class="space-y-6 transition-all duration-300">
      <!-- Sélection d'entreprise existante ou nouvelle -->
      <Card class="mb-4 border shadow-sm" v-if="similarCompanies.length > 0">
        <CardHeader class="bg-slate-50 dark:bg-slate-800/40">
          <CardTitle class="flex items-center">
            <BuildingIcon class="h-5 w-5 mr-2 text-primary" />
            Entreprise
          </CardTitle>
          <CardDescription>Choisissez d'utiliser une entreprise existante ou d'en créer une nouvelle</CardDescription>
        </CardHeader>
        <CardContent class="pt-4">
          <RadioGroup v-model="companyChoice" class="space-y-4">
            <div class="space-y-4">
              <Label class="mb-2 block text-gray-700 dark:text-gray-300">Entreprises similaires trouvées :</Label>
              <div v-for="company in similarCompanies" :key="company.id" 
                   class="flex items-start space-x-3 p-3 border rounded-md hover:border-primary/40 hover:bg-primary/5 transition-colors duration-200">
                <RadioGroupItem :value="company.id" :id="`company-${company.id}`" />
                <div class="grid gap-1">
                  <Label :for="`company-${company.id}`" class="font-medium text-gray-900 dark:text-gray-50">{{ company.name }}</Label>
                  <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">
                      Similarité: {{ Math.round(company.similarity * 100) }}%
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div class="flex items-start space-x-3 p-3 border rounded-md hover:border-primary/40 hover:bg-primary/5 transition-colors duration-200">
              <RadioGroupItem value="new" id="company-new" />
              <div>
                <Label for="company-new" class="font-medium text-gray-900 dark:text-gray-50">Créer une nouvelle entreprise</Label>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Utiliser les données d'importation pour créer une nouvelle fiche entreprise
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <!-- Récapitulatif de l'entreprise sélectionnée -->
      <div v-if="companyChoice !== 'new'" 
           class="mt-2 p-4 border rounded-md bg-primary/5 dark:bg-primary/10 shadow-sm border-primary/20">
        <p class="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Entreprise existante sélectionnée :</p>
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-sm">
            <BuildingIcon class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-gray-50">
              {{ getSelectedCompanyName() }}
            </p>
          </div>
        </div>
      </div>

      <!-- Formulaire d'entreprise (affiché seulement si "créer une nouvelle entreprise" est sélectionné) -->
      <div v-if="companyChoice === 'new'" class="border rounded-md shadow-sm p-4 bg-white dark:bg-gray-800">
        <CompanyForm 
          v-model="companyFormData"
          :initial-data="initialCompanyData"
          :loading="loading"
          :show-actions="false"
        />
      </div>

      <!-- Boutons d'actions pour l'étape 2 -->
      <div class="flex justify-between gap-4 pt-5 mt-6 border-t dark:border-gray-700">
        <Button variant="outline" @click="previousStep" class="hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronLeftIcon class="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button @click="onSubmit" :disabled="loading" class="shadow-sm hover:shadow-md transition-shadow">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          Valider
          <CheckIcon class="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Loader2, User as UserIcon, Building as BuildingIcon, Check as CheckIcon, ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon, UserCircle as UserCircleIcon, Mail as MailIcon, FileText as FileTextIcon } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group'

import CompanyForm from '~/modules/entity/components/forms/CompanyForm.vue'
import ContactForm from '~/modules/entity/components/forms/ContactForm.vue'
import { useContactApproval } from '../composables/useContactApproval'
import type { SimilarCompany, SimilarContact } from '../types/approval.types'
import type { ContactStaging } from '../types'

const props = defineProps<{
  contactId: string
  similarCompanies: SimilarCompany[]
  similarContacts: SimilarContact[]
  stagingContact: ContactStaging
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'approve'): void
  (e: 'cancel'): void
  (e: 'update:selectedCompany', value: string | null): void
  (e: 'update:selectedContact', value: string): void
}>()

const { toast } = useToast()

// Gestion des étapes
const currentStep = ref(1)

// États des formulaires
const companyChoice = ref<string>('new')
const contactChoice = ref<string>('new')
const companyFormData = ref({})
const contactFormData = ref({})

// Observer les changements de choix d'entreprise
watch(companyChoice, (newValue) => {
  emit('update:selectedCompany', newValue)
})

// Observer les changements de choix de contact
watch(contactChoice, (newValue) => {
  emit('update:selectedContact', newValue)
})

// Initialiser les valeurs par défaut pour les formulaires
const initialCompanyData = computed(() => {
  if (companyChoice.value !== 'new') {
    const chosen = props.similarCompanies.find(c => c.id === companyChoice.value);
    if (chosen) {
      // Nous ne connaissons pas toutes les propriétés de l'entreprise similaire trouvée
      // donc nous utilisons principalement le nom et conservons les valeurs par défaut
      return {
        name: chosen.name || '',
        status: 'active',
        is_customer: true,
        domain: '',
        industry: '',
        description: ''
      };
    }
  }
  
  // Utiliser les données de staging par défaut
  return {
    name: props.stagingContact?.company || '',
    status: 'active',
    is_customer: true,
    domain: '',
    industry: '',
    description: ''
  };
})

const initialContactData = computed(() => {
  if (contactChoice.value !== 'new') {
    const chosen = props.similarContacts.find(c => c.id === contactChoice.value);
    if (chosen) {
      return {
        first_name: chosen.first_name || '',
        last_name: chosen.last_name || '',
        email: chosen.email || '',
        phone: props.stagingContact?.phone || '',
        job_title: props.stagingContact?.job_title || '',
        status: 'active'
      };
    }
  }
  
  // Utiliser les données de staging par défaut
  return {
    first_name: props.stagingContact?.first_name || '',
    last_name: props.stagingContact?.last_name || '',
    email: props.stagingContact?.email || '',
    phone: props.stagingContact?.phone || '',
    job_title: props.stagingContact?.job_title || '',
    status: 'active'
  };
});

// Définir les choix par défaut en fonction des similarités
watch(() => props.similarCompanies, (companies) => {
  if (companies && companies.length > 0) {
    // Trouver l'entreprise avec la plus grande similarité
    const bestMatch = companies.reduce((prev, current) => 
      prev.similarity > current.similarity ? prev : current
    )
    
    // Si la similarité est très élevée (> 0.8), on la sélectionne automatiquement
    if (bestMatch.similarity > 0.8) {
      companyChoice.value = bestMatch.id
    } else {
      companyChoice.value = 'new' // Par défaut, on crée une nouvelle entreprise
    }
  } else {
    companyChoice.value = 'new'
  }
}, { immediate: true })

watch(() => props.similarContacts, (contacts) => {
  if (contacts && contacts.length > 0) {
    // Trouver le contact avec la plus grande similarité
    const bestMatch = contacts.reduce((prev, current) => 
      prev.similarity > current.similarity ? prev : current
    )
    
    // Si la similarité est très élevée (> 0.8), on le sélectionne automatiquement
    if (bestMatch.similarity > 0.8) {
      contactChoice.value = bestMatch.id
    } else {
      contactChoice.value = 'new' // Par défaut, on crée un nouveau contact
    }
  } else {
    contactChoice.value = 'new'
  }
}, { immediate: true })

// Navigation entre les étapes
const nextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++
    
    // Notifier l'utilisateur de l'étape en cours
    toast({
      title: 'Étape suivante',
      description: `Veuillez compléter les informations de l'entreprise.`,
    })
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Soumission finale du formulaire
const onSubmit = () => {
  // Mettre à jour les données du composable avec les valeurs des formulaires
  if (companyChoice.value === 'new') {
    console.log('Nouvelles données entreprise:', companyFormData.value)
  }
  
  if (contactChoice.value === 'new') {
    console.log('Nouvelles données contact:', contactFormData.value)
  }
  
  emit('approve')
}

// Annuler la validation
const onCancel = () => {
  emit('cancel')
}

// Méthodes utilitaires pour récupérer les informations des entités sélectionnées
const getSelectedContactName = () => {
  if (contactChoice.value === 'new') return '';
  const contact = props.similarContacts.find(c => c.id === contactChoice.value);
  return contact ? `${contact.first_name} ${contact.last_name}` : 'N/A';
};

const getSelectedContactEmail = () => {
  if (contactChoice.value === 'new') return '';
  const contact = props.similarContacts.find(c => c.id === contactChoice.value);
  return contact ? contact.email : 'N/A';
};

const getSelectedCompanyName = () => {
  if (companyChoice.value === 'new') return '';
  const company = props.similarCompanies.find(c => c.id === companyChoice.value);
  return company ? company.name : 'N/A';
};
</script>

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