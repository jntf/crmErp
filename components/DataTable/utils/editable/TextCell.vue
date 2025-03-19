<template>
  <div class="relative w-full group text-cell" :class="{ 'is-modified': isModified }">
    <template v-if="isEditable">
      <input
        type="text"
        class="w-full p-1 border border-input rounded-md focus:ring-1 focus:ring-ring focus:outline-none text-sm bg-background"
        :value="modelValue"
        @input="handleInput"
        @keydown.enter="handleEnter"
        @keydown.escape="handleEscape"
        autofocus
        :id="cellId"
      />
    </template>
    <template v-else>
      <div class="py-1 px-0.5">
        {{ displayValue }}
      </div>
    </template>
    
    <!-- Indicateur de modification -->
    <div v-if="isModified" class="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string | null
  isEditable?: boolean
  isModified?: boolean
  cellId?: string
  formatDisplay?: (value: any) => string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'edit-complete', value: string | null): void
}>()

// Gérer la saisie
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

// Valider la saisie avec Enter
const handleEnter = (e: KeyboardEvent) => {
  const target = e.target as HTMLInputElement
  emit('edit-complete', target.value)
}

// Annuler avec Escape
const handleEscape = () => {
  emit('edit-complete', props.modelValue)
}

// Formater la valeur pour l'affichage
const displayValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return ''
  }
  
  if (props.formatDisplay) {
    return props.formatDisplay(props.modelValue)
  }
  
  return props.modelValue
})
</script>

<style scoped>
.text-cell.is-modified {
  @apply text-amber-700 dark:text-amber-300;
}

.modified-indicator {
  position: relative;
}

.modified-indicator::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 4px 4px 0;
  border-color: transparent rgba(202, 138, 4, 0.5) transparent transparent;
}
</style> 