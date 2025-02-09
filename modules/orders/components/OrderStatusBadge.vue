<template>
  <Badge :variant="variant">
    {{ statusLabel }}
  </Badge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OrderStatus } from '../types'
import { Badge } from '#components'

const props = defineProps<{
  status: OrderStatus
}>()

const statusConfig = {
  DRAFT: {
    label: 'Brouillon',
    variant: 'secondary'
  },
  PENDING: {
    label: 'En attente',
    variant: 'outline'
  },
  VALIDATED: {
    label: 'Validée',
    variant: 'default'
  },
  CANCELLED: {
    label: 'Annulée',
    variant: 'destructive'
  },
  COMPLETED: {
    label: 'Terminée',
    variant: 'default'
  }
} as const

const statusLabel = computed(() => statusConfig[props.status].label)
const variant = computed(() => statusConfig[props.status].variant)
</script> 