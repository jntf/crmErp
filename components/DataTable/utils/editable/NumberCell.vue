<template>
  <div>
    <!-- Mode édition -->
    <input
      v-if="isEditing"
      ref="inputRef"
      type="number"
      :step="step"
      :min="min"
      :max="max"
      class="w-full p-0.5 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-blue-700 text-xs text-right"
      :value="modelValue"
      @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value) || null)"
      @blur="handleBlur"
      @keydown.enter="handleBlur"
      @keydown.esc="handleCancel"
    />
    <!-- Mode lecture -->
    <div 
      v-else 
      @click="startEditing"
      class="w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer text-right"
      :class="{ 'modified-indicator': isModified }"
    >
      {{ displayValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'

interface Props {
  modelValue: number | null
  isEditable?: boolean
  isModified?: boolean
  min?: number
  max?: number
  step?: number
  formatDisplay?: (value: number | null) => string
  cellId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isEditable: true,
  isModified: false,
  min: undefined,
  max: undefined,
  step: 1
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'edit-complete': [value: number | null]
  'edit-cancel': []
}>()

// État local
const isEditing = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

// Valeur formatée pour l'affichage
const displayValue = computed(() => {
  if (props.formatDisplay && props.modelValue !== null) {
    return props.formatDisplay(props.modelValue)
  }
  // Par défaut, formater avec 2 décimales pour les nombres à virgule
  if (props.modelValue !== null) {
    if (Number.isInteger(props.modelValue)) {
      return props.modelValue.toString()
    }
    return props.modelValue.toFixed(2)
  }
  return ''
})

// Démarrer l'édition
const startEditing = () => {
  if (!props.isEditable) return
  isEditing.value = true
  
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

// Terminer l'édition
const handleBlur = () => {
  if (!isEditing.value) return
  isEditing.value = false
  
  // Convertir en nombre ou null si vide
  const numValue = inputRef.value?.value ? Number(inputRef.value.value) : null
  
  // Vérifier les limites min/max
  let finalValue = numValue
  if (finalValue !== null) {
    if (props.min !== undefined && finalValue < props.min) finalValue = props.min
    if (props.max !== undefined && finalValue > props.max) finalValue = props.max
  }
  
  emit('edit-complete', finalValue)
}

// Annuler l'édition
const handleCancel = () => {
  isEditing.value = false
  emit('edit-cancel')
}

// Arrêter l'édition si la cellule devient non-éditable
watch(() => props.isEditable, (newValue) => {
  if (!newValue && isEditing.value) {
    isEditing.value = false
  }
})
</script>

<style scoped>
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

/* Cacher les flèches du champ numérique */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
input[type=number] {
  -moz-appearance: textfield;
}
</style> 