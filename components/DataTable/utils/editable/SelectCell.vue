<template>
  <div>
    <!-- Mode édition -->
    <div v-if="isEditing" class="relative w-full">
      <select
        ref="selectRef"
        class="w-full p-0.5 appearance-none border border-blue-300 rounded pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-blue-700 text-xs"
        :value="modelValue"
        @change="handleChange"
        @blur="handleBlur"
        @keydown.enter="handleBlur"
        @keydown.esc="handleCancel"
      >
        <option v-if="withEmptyOption" value="">{{ emptyOptionLabel }}</option>
        <option 
          v-for="option in options" 
          :key="getOptionValue(option)"
          :value="getOptionValue(option)"
        >
          {{ getOptionLabel(option) }}
        </option>
      </select>
      <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path d="M7 7l3 3 3-3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
    </div>
    
    <!-- Mode lecture -->
    <div 
      v-else 
      @click="startEditing"
      class="w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
      :class="{ 'modified-indicator': isModified }"
    >
      {{ displayLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'

// Type pour les options
type OptionValue = string | number | undefined
type OptionItem = {
  label: string
  value: OptionValue
} | string | number

interface Props {
  modelValue: OptionValue
  options: OptionItem[]
  isEditable?: boolean
  isModified?: boolean
  valueKey?: string
  labelKey?: string
  withEmptyOption?: boolean
  emptyOptionLabel?: string
  formatDisplay?: (value: any) => string
  cellId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isEditable: true,
  isModified: false,
  valueKey: 'value',
  labelKey: 'label',
  withEmptyOption: false,
  emptyOptionLabel: '-- Sélectionner --'
})

const emit = defineEmits<{
  'update:modelValue': [value: OptionValue]
  'edit-complete': [value: OptionValue]
  'edit-cancel': []
}>()

// État local
const isEditing = ref(false)
const selectRef = ref<HTMLSelectElement | null>(null)

// Utilitaires pour extraire les valeurs et les labels des options
const getOptionValue = (option: OptionItem): OptionValue => {
  if (typeof option === 'object' && option !== null) {
    return option[props.valueKey as keyof typeof option] as OptionValue
  }
  return option as OptionValue
}

const getOptionLabel = (option: OptionItem): string => {
  if (typeof option === 'object' && option !== null) {
    return String(option[props.labelKey as keyof typeof option] || '')
  }
  return String(option)
}

// Trouver le label correspondant à la valeur actuelle
const displayLabel = computed(() => {
  if (props.modelValue === undefined || props.modelValue === '') {
    return ''
  }
  
  const option = props.options.find(opt => getOptionValue(opt) === props.modelValue)
  if (option) {
    return getOptionLabel(option)
  }
  
  return String(props.modelValue)
})

// Démarrer l'édition
const startEditing = () => {
  if (!props.isEditable) return
  isEditing.value = true
  
  nextTick(() => {
    selectRef.value?.focus()
  })
}

// Gérer le changement de sélection
const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value === '' ? undefined : target.value)
}

// Terminer l'édition
const handleBlur = () => {
  if (!isEditing.value) return
  isEditing.value = false
  emit('edit-complete', props.modelValue)
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
</style> 