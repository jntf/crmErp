// modules/webStock/components/ConfirmationDialog.vue
<template>
  <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          {{ description }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex items-center space-x-2 justify-end">
        <Button variant="outline" @click="$emit('update:isOpen', false)">
          Annuler
        </Button>
        <Button variant="default" @click="handleConfirm">
          <slot name="confirm-button">Confirmer</slot>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

defineProps<{
  isOpen: boolean
  title: string
  description: string
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'confirm': []
}>()

const handleConfirm = () => {
  emit('confirm')
  emit('update:isOpen', false)
}
</script>