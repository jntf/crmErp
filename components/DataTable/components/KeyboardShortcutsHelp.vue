<template>
  <Dialog :open="visible" @update:open="$emit('update:visible', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Raccourcis clavier</DialogTitle>
        <DialogDescription>
          Utilisez ces raccourcis pour naviguer et interagir avec le tableau plus efficacement.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-2 items-center gap-4">
          <div class="text-sm font-medium">Shift + Clic</div>
          <div class="text-sm text-muted-foreground">Sélectionner plusieurs lignes consécutives</div>
        </div>
        <div class="grid grid-cols-2 items-center gap-4">
          <div class="text-sm font-medium">Ctrl/Cmd + Clic</div>
          <div class="text-sm text-muted-foreground">Sélectionner/désélectionner une ligne sans affecter les autres</div>
        </div>
        <div class="grid grid-cols-2 items-center gap-4">
          <div class="text-sm font-medium">Ctrl/Cmd + A</div>
          <div class="text-sm text-muted-foreground">Sélectionner toutes les lignes</div>
        </div>
        <div class="grid grid-cols-2 items-center gap-4">
          <div class="text-sm font-medium">Échap</div>
          <div class="text-sm text-muted-foreground">Désélectionner toutes les lignes</div>
        </div>
      </div>
      <DialogFooter>
        <Button @click="$emit('update:visible', false)">Fermer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog'

defineProps<{
  visible: boolean
}>()

defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()
</script> 