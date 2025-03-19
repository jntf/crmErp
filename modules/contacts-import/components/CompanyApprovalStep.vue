<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Building as BuildingIcon,
  PlusCircle as PlusCircleIcon,
  Globe as GlobeIcon,
  ChevronRight as ChevronRightIcon, 
  ChevronLeft as ChevronLeftIcon, 
  X as XIcon, 
  AlertCircle as AlertCircleIcon 
} from 'lucide-vue-next'

import type { ContactStaging } from '../types'
import type { SimilarCompany } from '../types/approval.types'

// Form spécifique pour les entreprises
const CompanyForm = defineAsyncComponent(() => 
  import('~/modules/contacts-import/components/forms/CompanyImportForm.vue')
)

// Props et émetteurs
const props = defineProps<{
  contact?: ContactStaging | null
  similarCompanies?: SimilarCompany[]
  selectedCompany: string | null
  companyFormData: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:selectedCompany', value: string | null): void
  (e: 'update:companyFormData', value: Record<string, any>): void
  (e: 'next'): void
  (e: 'previous'): void
  (e: 'cancel'): void
}>()

// État local
const companyChoice = ref<string | null>(null)

// Vérifier si l'entreprise est définie
const hasCompany = computed(() => Boolean(props.contact?.company))

// Modifier le choix d'entreprise
watch(companyChoice, (newValue) => {
  emit('update:selectedCompany', newValue)
})

// Initialiser le choix d'entreprise en fonction des données de similarité
watch(() => props.similarCompanies, (newValue) => {
  if (newValue && newValue.length > 0) {
    // Si une entreprise a une similarité très élevée (> 0.9), la sélectionner par défaut
    const bestMatch = newValue.reduce((prev, current) => 
      prev.similarity > current.similarity ? prev : current
    )
    
    if (bestMatch.similarity > 0.9) {
      companyChoice.value = bestMatch.id
    } else if (!props.contact?.company) {
      companyChoice.value = null
    } else {
      companyChoice.value = 'new'
    }
  } else if (props.contact?.company) {
    companyChoice.value = 'new'
  } else {
    companyChoice.value = null
  }
  
  emit('update:selectedCompany', companyChoice.value)
}, { immediate: true })

// Initialiser les données du formulaire pour l'entreprise
const initialCompanyData = computed(() => {
  if (!props.contact?.company) return {}
  
  return {
    name: props.contact.company,
    status: 'active',
    is_customer: true
  }
})

// Obtenir le nom de l'entreprise sélectionnée
const getSelectedCompanyName = () => {
  if (!companyChoice.value || companyChoice.value === 'new') return ''
  
  const company = props.similarCompanies?.find(c => c.id === companyChoice.value)
  return company?.name || ''
}

// Obtenir le domaine de l'entreprise sélectionnée
const getSelectedCompanyDomain = () => {
  if (!companyChoice.value || companyChoice.value === 'new') return ''
  
  const company = props.similarCompanies?.find(c => c.id === companyChoice.value)
  return company?.domain || ''
}

// Obtenir l'industrie de l'entreprise sélectionnée
const getSelectedCompanyIndustry = () => {
  if (!companyChoice.value || companyChoice.value === 'new') return ''
  
  const company = props.similarCompanies?.find(c => c.id === companyChoice.value)
  return company?.industry || ''
}

// Mettre à jour les données du formulaire
const updateFormData = (data: Record<string, any>) => {
  emit('update:companyFormData', data)
}
</script>

<template>
  <div class="space-y-6">
    <Card v-if="similarCompanies && similarCompanies.length > 0" class="border shadow-sm hover:shadow-md transition-shadow duration-300">
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
                <Label :for="`company-${company.id}`" class="font-medium text-gray-900 dark:text-gray-50">
                  {{ company.name }}
                </Label>
                <p class="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
                  <span v-if="company.domain" class="flex items-center">
                    <GlobeIcon class="h-3.5 w-3.5 mr-1 opacity-70" />
                    {{ company.domain }}
                  </span>
                  <span v-if="company.industry" class="flex items-center">
                    <BuildingIcon class="h-3.5 w-3.5 mr-1 opacity-70" />
                    {{ company.industry }}
                  </span>
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
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
    <div v-if="companyChoice !== 'new' && companyChoice !== null" 
         class="p-4 border rounded-md bg-primary/5 dark:bg-primary/10 shadow-sm border-primary/20">
      <p class="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Entreprise existante sélectionnée :</p>
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-sm">
          <BuildingIcon class="w-5 h-5 text-primary" />
        </div>
        <div>
          <p class="font-medium text-gray-900 dark:text-gray-50">{{ getSelectedCompanyName() }}</p>
          <div class="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span v-if="getSelectedCompanyDomain()" class="flex items-center">
              <GlobeIcon class="h-3.5 w-3.5 mr-1 opacity-70" />
              {{ getSelectedCompanyDomain() }}
            </span>
            <span v-if="getSelectedCompanyIndustry()" class="flex items-center">
              <BuildingIcon class="h-3.5 w-3.5 mr-1 opacity-70" />
              {{ getSelectedCompanyIndustry() }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Formulaire de création d'entreprise -->
    <div v-if="companyChoice === 'new'" class="transition-all duration-300">
      <Card class="border shadow-sm">
        <CardHeader class="bg-slate-50 dark:bg-slate-800/40">
          <CardTitle class="flex items-center">
            <PlusCircleIcon class="h-5 w-5 mr-2 text-primary" />
            Nouvelle entreprise
          </CardTitle>
          <CardDescription>Informations de l'entreprise à créer</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyForm 
            :initial-data="initialCompanyData" 
            @update:model-value="updateFormData"
          />
        </CardContent>
      </Card>
    </div>

    <!-- Message si aucune entreprise n'est associée -->
    <div v-if="!contact?.company" class="p-4 border rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/30">
      <div class="flex items-start space-x-3">
        <AlertCircleIcon class="h-5 w-5 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div>
          <h4 class="text-sm font-medium mb-1">Aucune entreprise associée</h4>
          <p class="text-sm opacity-90">Ce contact n'a pas d'entreprise associée. Vous pouvez continuer sans associer d'entreprise ou en créer une nouvelle.</p>
        </div>
      </div>
    </div>

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
        <Button @click="$emit('next')" class="shadow-sm hover:shadow-md transition-shadow">
          Continuer
          <ChevronRightIcon class="h-4 w-4 ml-2" />
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