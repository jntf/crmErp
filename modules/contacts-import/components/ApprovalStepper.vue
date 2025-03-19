<script setup lang="ts">
import { Stepper, StepperDescription, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from '@/components/ui/stepper'
import { ref, watch, computed, onMounted } from 'vue'
import { CheckIcon, BuildingIcon, UserIcon, CheckSquareIcon, Loader2 } from 'lucide-vue-next'
import { useContactApproval } from '../composables/useContactApproval'
import type { ContactStaging } from '../types'
import type { SimilarCompany, SimilarContact } from '../types/approval.types'
import ContactApprovalStep from './ContactApprovalStep.vue'
import CompanyApprovalStep from './CompanyApprovalStep.vue'
import ConfirmationStep from './ConfirmationStep.vue'

// Props de base
const props = defineProps<{
  contactId: string
}>()

const emit = defineEmits<{
  (e: 'approval-complete', success: boolean): void
  (e: 'cancel'): void
}>()

// État du stepper
const currentStep = ref(1)
const steps = [
  {
    step: 1,
    title: 'Contact',
    description: 'Vérifier les informations du contact',
    icon: UserIcon,
  },
  {
    step: 2,
    title: 'Entreprise',
    description: 'Vérifier les informations de l\'entreprise',
    icon: BuildingIcon,
  },
  {
    step: 3,
    title: 'Confirmation',
    description: 'Valider les informations',
    icon: CheckSquareIcon,
  }
]

// Utilisation du composable d'approbation
const {
  stagingContact,
  loading,
  similarContacts,
  similarCompanies,
  selectedContact,
  selectedCompany,
  contactFormData,
  companyFormData,
  initApproval,
  finalizeApproval,
  resetState,
  cancelApproval
} = useContactApproval()

// Détermine si les étapes sont complètes
const isStepComplete = computed(() => ({
  step1: !!selectedContact.value || Object.keys(contactFormData.value).length > 0,
  step2: (!stagingContact.value?.company || !!selectedCompany.value || Object.keys(companyFormData.value).length > 0),
  step3: true
}))

// Initialiser le processus d'approbation
onMounted(async () => {
  if (props.contactId) {
    const success = await initApproval(props.contactId)
    if (!success) {
      emit('approval-complete', false)
    }
  }
})

// Navigation entre les étapes
const nextStep = () => {
  if (currentStep.value < steps.length) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Gestion de l'annulation
const handleCancel = () => {
  resetState()
  emit('cancel')
}

// Soumission finale
const handleSubmit = async () => {
  const result = await finalizeApproval()
  emit('approval-complete', result.success)
}
</script>

<template>
  <div class="space-y-8 pb-4">
    <!-- Stepper de navigation -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border sticky top-0 z-10">
      <Stepper v-model="currentStep" class="mb-2">
        <StepperItem
          v-for="item in steps"
          :key="item.step"
          :step="item.step"
          :disabled="loading"
          class="transition-all duration-300"
        >
          <StepperTrigger class="group hover:bg-primary/5 dark:hover:bg-primary/10 focus:bg-primary/5 dark:focus:bg-primary/10 transition-colors">
            <StepperIndicator class="transition-all duration-300" :class="{
              'bg-primary dark:bg-primary text-white shadow-md': currentStep >= item.step, 
              'group-hover:scale-110': currentStep !== item.step,
              'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-800': currentStep === item.step
            }">
              <component :is="item.icon" v-if="currentStep !== item.step" class="h-4 w-4" />
              <CheckIcon v-else class="h-4 w-4" />
            </StepperIndicator>
            <div class="flex flex-col">
              <StepperTitle class="font-medium">
                {{ item.title }}
              </StepperTitle>
              <StepperDescription class="text-sm">
                {{ item.description }}
              </StepperDescription>
            </div>
          </StepperTrigger>
          <StepperSeparator v-if="item.step !== steps.length" :class="{
            'bg-primary': currentStep > item.step,
            'scale-y-100': currentStep === item.step
          }" />
        </StepperItem>
      </Stepper>
    </div>

    <!-- Contenu des étapes -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border transition-all duration-300 overflow-y-auto">
      <!-- Chargement -->
      <div v-if="loading" class="flex flex-col justify-center items-center py-12 gap-3">
        <Loader2 class="h-10 w-10 animate-spin text-primary" />
        <span class="text-lg font-medium text-gray-700 dark:text-gray-300">Chargement des données...</span>
      </div>

      <!-- Contenu dynamique selon l'étape actuelle -->
      <template v-else>
        <!-- Étape 1: Vérification du contact -->
        <ContactApprovalStep 
          v-if="currentStep === 1" 
          :contact="stagingContact"
          :similar-contacts="similarContacts"
          v-model:selected-contact="selectedContact"
          v-model:contact-form-data="contactFormData"
          @next="nextStep"
          @cancel="handleCancel"
        />

        <!-- Étape 2: Vérification de l'entreprise -->
        <CompanyApprovalStep 
          v-if="currentStep === 2" 
          :contact="stagingContact"
          :similar-companies="similarCompanies"
          v-model:selected-company="selectedCompany"
          v-model:company-form-data="companyFormData"
          @next="nextStep"
          @previous="previousStep"
          @cancel="handleCancel"
        />

        <!-- Étape 3: Confirmation -->
        <ConfirmationStep 
          v-if="currentStep === 3"
          :contact="stagingContact"
          :selected-contact="selectedContact"
          :selected-company="selectedCompany"
          :contact-form-data="contactFormData"
          :company-form-data="companyFormData"
          :similar-contacts="similarContacts"
          :similar-companies="similarCompanies"
          @previous="previousStep"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.stepper-content-enter-active,
.stepper-content-leave-active {
  transition: all 0.3s ease;
}

.stepper-content-enter-from,
.stepper-content-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style> 