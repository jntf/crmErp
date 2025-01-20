<!-- components/companies/KeyFigure.vue -->
<template>
  <div class="group relative space-y-1.5 p-3 rounded-lg border transition-colors hover:bg-muted/50">
    <!-- Label -->
    <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
      <component v-if="icon" :is="icon" class="h-4 w-4" />
      {{ label }}
    </div>

    <!-- Value -->
    <div class="flex items-baseline gap-1">
      <span class="text-2xl font-semibold text-center text-muted-foreground text-sm">
        {{ formattedValue }}
      </span>
      <Button v-if="!readonly" variant="ghost" size="icon"
        class="absolute right-2 top-2 hidden group-hover:flex hover:bg-muted" @click="$emit('edit')">
        <PencilIcon class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { PencilIcon } from 'lucide-vue-next'

interface Props {
  label: string
  value: number | null | undefined  // Ajout de undefined comme type possible
  format?: 'number' | 'currency' | 'percentage'
  icon?: any
  readonly?: boolean
  currency?: string
}

const props = withDefaults(defineProps<Props>(), {
  format: 'number',
  readonly: false,
  currency: 'EUR'
})

const emit = defineEmits<{
  edit: []
}>()

const formatValue = (val: number | null | undefined) => {
  if (val === null || val === undefined) return '—'

  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: props.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val)

    case 'percentage':
      return new Intl.NumberFormat('fr-FR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(val / 100)

    default:
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val)
  }
}

const formattedValue = computed(() => formatValue(props.value))
</script>

<style scoped>
@media (max-width: 640px) {
  .text-2xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }
}
</style>