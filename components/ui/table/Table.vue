<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  tableLayout?: 'auto' | 'fixed'
}>()

// Valeur par défaut: table-layout: fixed
const tableLayoutClass = props.tableLayout === 'auto' ? '' : 'table-fixed'
</script>

<template>
  <div class="relative w-full overflow-auto">
    <table :class="cn('w-full caption-bottom text-sm', tableLayoutClass, props.class)">
      <slot />
    </table>
  </div>
</template>
