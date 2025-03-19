<template>
  <Dialog :open="isOpen" @update:open="(value) => isOpen = value">
    <DialogContent 
      class="sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] 2xl:max-w-[55%] h-[85vh] p-0 border dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800 transition-all duration-300 flex flex-col"
    >
      <DialogHeader class="px-6 pt-6 pb-4 border-b dark:border-gray-700 sticky top-0 z-10 bg-white dark:bg-gray-800">
        <DialogTitle class="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Approbation du contact
        </DialogTitle>
        <DialogDescription class="text-base text-gray-600 dark:text-gray-300">
          Validez les informations du contact importé avant de l'ajouter à la base de données
        </DialogDescription>
      </DialogHeader>

      <div class="overflow-y-auto flex-1 min-h-0 pb-6">
        <div v-if="loading" class="flex flex-col items-center justify-center p-12 space-y-4">
          <div class="relative h-16 w-16">
            <div class="absolute inset-0 animate-spin-slow rounded-full border-t-2 border-b-2 border-primary"></div>
            <div class="absolute inset-[6px] animate-spin rounded-full border-t-2 border-primary"></div>
          </div>
          <p class="text-gray-700 dark:text-gray-300 text-lg">Chargement des données...</p>
        </div>
        <div v-else-if="contactId" class="flex-1">
          <ApprovalStepper 
            :contact-id="contactId" 
            @approval-complete="handleApprovalComplete" 
            @cancel="isOpen = false"
          />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog'
import ApprovalStepper from './ApprovalStepper.vue'

const props = defineProps<{
  modelValue: boolean
  contactId?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'approval-complete', success: boolean): void
}>()

const { toast } = useToast()
const isOpen = ref(props.modelValue)
const loading = ref(false)

// Suivre les changements du modelValue
watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue
})

// Suivre les changements de isOpen pour mettre à jour modelValue
watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue)
})

// Gérer la fin du processus d'approbation
const handleApprovalComplete = (success: boolean) => {
  emit('approval-complete', success)
  if (success) {
    toast({
      title: "Contact approuvé",
      description: "Le contact a été ajouté avec succès",
      variant: "success",
    })
  } else {
    toast({
      title: "Erreur d'approbation",
      description: "Une erreur est survenue lors de l'approbation du contact",
      variant: "destructive",
    })
  }
  isOpen.value = false
}
</script>

<style scoped>
.animate-spin-slow {
  animation-duration: 3s;
  animation-name: spin;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 