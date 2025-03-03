<template>
  <div class="flex items-center gap-2">
    <Button
      variant="ghost"
      size="icon"
      :to="`/orders/${order.id}`"
      title="Voir"
    >
      <EyeIcon class="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      :to="`/orders/${order.id}/edit`"
      title="Modifier"
    >
      <PencilIcon class="h-4 w-4" />
    </Button>
    <Button
      v-if="order.status !== 'CANCELLED'"
      variant="ghost"
      size="icon"
      @click="confirmCancel"
      title="Annuler"
    >
      <XIcon class="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      @click="downloadPdf"
      title="Télécharger PDF"
    >
      <FileDownIcon class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, PencilIcon, XIcon, FileDownIcon } from 'lucide-vue-next'
import { Button } from '#components'
import type { Order } from '../types'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  (e: 'cancel', id: number): void
  (e: 'download', id: number): void
}>()

const confirmCancel = () => {
  if (confirm(`Êtes-vous sûr de vouloir annuler la commande ${props.order.orderNumber} ?`)) {
    emit('cancel', props.order.id)
  }
}

const downloadPdf = () => {
  emit('download', props.order.id)
}
</script> 