<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User as UserIcon, 
  UserCircle as UserCircleIcon,
  Building as BuildingIcon, 
  Check as CheckIcon, 
  AlertTriangle, 
  ChevronLeft as ChevronLeftIcon, 
  Mail as MailIcon, 
  Phone as PhoneIcon,
  Briefcase as BriefcaseIcon,
  Globe as GlobeIcon,
  X as XIcon,
  AlertCircle as AlertCircleIcon
} from 'lucide-vue-next'
import type { ContactStaging } from '../types'
import type { SimilarContact, SimilarCompany } from '../types/approval.types'

// Props et émetteurs
const props = defineProps<{
  contact?: ContactStaging | null
  selectedContact: string | null
  selectedCompany: string | null
  contactFormData: Record<string, any>
  companyFormData: Record<string, any>
  similarContacts?: SimilarContact[]
  similarCompanies?: SimilarCompany[]
}>()

const emit = defineEmits<{
  (e: 'previous'): void
  (e: 'submit'): void
  (e: 'cancel'): void
}>()

// Données de contact formatées pour l'affichage
const contactData = computed(() => {
  if (props.selectedContact === 'new') {
    return props.contactFormData
  } else if (props.selectedContact) {
    const selectedContact = props.similarContacts?.find(c => c.id === props.selectedContact)
    if (selectedContact) {
      return {
        first_name: selectedContact.first_name,
        last_name: selectedContact.last_name,
        email: selectedContact.email,
        phone: selectedContact.phone || '',
        job_title: selectedContact.job_title || ''
      }
    }
  }
  return {}
})

// Données d'entreprise formatées pour l'affichage
const companyData = computed(() => {
  if (!props.contact?.company) {
    return null
  }
  
  if (props.selectedCompany === 'new') {
    return props.companyFormData
  } else if (props.selectedCompany) {
    const selectedCompany = props.similarCompanies?.find(c => c.id === props.selectedCompany)
    if (selectedCompany) {
      return {
        name: selectedCompany.name,
        industry: selectedCompany.industry || '',
        domain: selectedCompany.domain || ''
      }
    }
  }
  return {}
})

// L'entreprise est-elle définie?
const hasCompany = computed(() => Boolean(props.contact?.company))

// Type de contact (nouveau ou existant)
const contactType = computed(() => {
  if (props.selectedContact === 'new') {
    return { 
      label: 'Nouveau contact', 
      isNew: true 
    }
  } else {
    return { 
      label: 'Contact existant', 
      isNew: false 
    }
  }
})

// Type d'entreprise (nouvelle ou existante)
const companyType = computed(() => {
  if (!hasCompany.value) {
    return { 
      label: 'Aucune entreprise associée', 
      isNew: false,
      isNone: true
    }
  }
  
  if (props.selectedCompany === 'new') {
    return { 
      label: 'Nouvelle entreprise', 
      isNew: true,
      isNone: false
    }
  } else {
    return { 
      label: 'Entreprise existante', 
      isNew: false,
      isNone: false
    }
  }
})
</script>

<template>
  <div class="space-y-6">
    <Alert class="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/30">
      <AlertTriangle class="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <AlertDescription class="text-amber-800 dark:text-amber-200">
        Veuillez vérifier les informations ci-dessous avant de valider l'opération. Cette action est irréversible.
      </AlertDescription>
    </Alert>

    <!-- Récapitulatif du contact -->
    <Card class="border shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader class="bg-slate-50 dark:bg-slate-800/40">
        <div class="flex items-center justify-between">
          <CardTitle class="flex items-center">
            <UserCircleIcon class="h-5 w-5 mr-2 text-primary" />
            Informations du contact
          </CardTitle>
          <div class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" 
               :class="contactType.isNew ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400'">
            {{ contactType.label }}
          </div>
        </div>
        <CardDescription>Vérifiez les données du contact qui seront utilisées</CardDescription>
      </CardHeader>
      <CardContent class="p-5">
        <div class="grid gap-3">
          <div class="flex items-center space-x-4">
            <div class="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center shadow-sm">
              <UserIcon class="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-50">{{ contactData.first_name }} {{ contactData.last_name }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                <MailIcon class="h-3.5 w-3.5 mr-1 opacity-70" />
                {{ contactData.email }}
              </p>
            </div>
          </div>
          <div class="grid md:grid-cols-2 gap-4 mt-4 p-4 rounded-md bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</p>
              <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                <PhoneIcon class="h-3.5 w-3.5 mr-1 opacity-70" />
                {{ contactData.phone || 'Non spécifié' }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Poste</p>
              <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                <BriefcaseIcon class="h-3.5 w-3.5 mr-1 opacity-70" />
                {{ contactData.job_title || 'Non spécifié' }}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Récapitulatif de l'entreprise -->
    <Card v-if="!companyType.isNone" class="border shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader class="bg-slate-50 dark:bg-slate-800/40">
        <div class="flex items-center justify-between">
          <CardTitle class="flex items-center">
            <BuildingIcon class="h-5 w-5 mr-2 text-primary" />
            Informations de l'entreprise
          </CardTitle>
          <div class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" 
               :class="companyType.isNew ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400'">
            {{ companyType.label }}
          </div>
        </div>
        <CardDescription>Vérifiez les données de l'entreprise qui seront utilisées</CardDescription>
      </CardHeader>
      <CardContent class="p-5">
        <div class="grid gap-3">
          <div class="flex items-center space-x-4">
            <div class="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center shadow-sm">
              <BuildingIcon class="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-50">{{ companyData?.name }}</h3>
              <div class="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span v-if="companyData?.industry" class="flex items-center">
                  <BuildingIcon class="h-3.5 w-3.5 mr-1 opacity-70" />
                  {{ companyData.industry }}
                </span>
                <span v-if="companyData?.domain" class="flex items-center">
                  <GlobeIcon class="h-3.5 w-3.5 mr-1 opacity-70" />
                  {{ companyData.domain }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Message si pas d'entreprise -->
    <Card v-else class="border shadow-sm bg-slate-50 dark:bg-slate-800/40">
      <CardHeader>
        <CardTitle class="flex items-center">
          <BuildingIcon class="h-5 w-5 mr-2 text-primary" />
          Aucune entreprise associée
        </CardTitle>
        <CardDescription>Ce contact sera créé sans être associé à une entreprise</CardDescription>
      </CardHeader>
    </Card>

    <!-- Boutons d'action -->
    <div class="flex justify-between gap-4 pt-5 mt-6 border-t dark:border-gray-700">
      <Button variant="outline" @click="$emit('previous')" class="hover:bg-gray-100 dark:hover:bg-gray-700">
        <ChevronLeftIcon class="h-4 w-4 mr-2" />
        Retour
      </Button>
      <div class="flex gap-3">
        <Button variant="outline" @click="$emit('cancel')" class="hover:bg-gray-100 dark:hover:bg-gray-700">
          <XIcon class="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button @click="$emit('submit')" class="shadow-sm hover:shadow-md transition-shadow">
          <CheckIcon class="h-4 w-4 mr-2" />
          Valider
        </Button>
      </div>
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