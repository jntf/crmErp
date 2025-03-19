<template>
  <Dialog 
    v-model:open="dialogOpen" 
    @update:open="handleDialogChange" 
    class="w-[95%] max-w-5xl"
  >
    <DialogContent class="p-0 max-h-[90vh] overflow-y-auto">
      <ContactApprovalForm
        :contact-id="contactId || ''"
        :similar-companies="similarCompanies"
        :similar-contacts="similarContacts"
        :staging-contact="stagingContact || {} as ContactStaging"
        :loading="loading"
        v-model:selected-company="selectedCompany"
        v-model:selected-contact="selectedContact"
        @approve="onApprove"
        @cancel="onCancel"
      />
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { useContactApproval } from '../composables/useContactApproval'
import ContactApprovalForm from './ContactApprovalForm.vue'
import type { ContactStaging } from '../types'

const props = defineProps<{
  open: boolean
  contactId?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'approved', data: any): void
}>()

const { toast } = useToast()

// Utiliser le composable
const {
  loading,
  stagingContact,
  similarCompanies,
  similarContacts,
  selectedCompany,
  selectedContact,
  companyFormData,
  contactFormData,
  approvalDialogState,
  
  finalizeApproval,
  cancelApproval,
  initApproval
} = useContactApproval()

// Propriété calculée pour gérer l'état du dialogue
const dialogOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// Gérer le changement de l'état du dialogue
const handleDialogChange = (isOpen: boolean) => {
  if (!isOpen) {
    cancelApproval()
  }
}

// Approuver le contact
const onApprove = async () => {
  const result = await finalizeApproval()
  
  if (result.success) {
    toast({
      title: 'Succès',
      description: 'Contact approuvé avec succès',
    })
    dialogOpen.value = false
    emit('approved', result)
  } else {
    toast({
      title: 'Erreur',
      description: result.message,
      variant: 'destructive'
    })
  }
}

// Annuler l'approbation
const onCancel = () => {
  cancelApproval()
  dialogOpen.value = false
}
</script> 