<template>
  <div class="flex items-center justify-center h-full w-full">
    <!-- Mode lecture ou édition (le même élément est utilisé pour les deux) -->
    <Checkbox
      :checked="modelValue === true"
      :disabled="!isEditable"
      @update:checked="handleChange"
      :class="{ 
        'modified-checkbox': isModified,
        'opacity-60': !isEditable
      }"
      data-cell-type="checkbox"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'

interface Props {
  modelValue: boolean | null
  isEditable?: boolean
  isModified?: boolean
  trueValue?: any // Valeur à considérer comme "true" (par défaut: true)
  falseValue?: any // Valeur à considérer comme "false" (par défaut: false)
  formatDisplay?: (value: any) => string
  cellId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isEditable: true,
  isModified: false,
  trueValue: true,
  falseValue: false,
  formatDisplay: () => '',
  cellId: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | null]
  'edit-complete': [value: boolean | null]
}>()

// Gérer le changement de valeur
const handleChange = (checked: boolean) => {
  if (!props.isEditable) return
  
  const newValue = checked ? props.trueValue : props.falseValue
  emit('update:modelValue', newValue)
  emit('edit-complete', newValue)
}
</script>

<style scoped>
.modified-checkbox {
  position: relative;
}

.modified-checkbox::after {
  content: '';
  position: absolute;
  top: -3px;
  right: -3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: rgba(202, 138, 4, 0.8);
}
</style> 