<template>
  <div>
    <!-- Mode édition -->
    <div v-if="isEditing" class="relative">
      <div
        ref="inputRef"
        class="w-full p-0.5 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-blue-700 text-xs flex items-center justify-between cursor-pointer"
        @click="isCalendarOpen = !isCalendarOpen"
      >
        <span>{{ formattedModelValue }}</span>
        <CalendarIcon class="h-3 w-3 text-gray-500" />
      </div>
      
      <div v-if="isCalendarOpen" class="absolute z-50 mt-1">
        <Popover open>
          <PopoverContent class="p-0" align="start">
            <Calendar
              v-if="isCalendarOpen"
              :initialFocus="true"
              mode="single"
              :selected="modelValueAsDate"
              @update:selected="handleDateSelect"
              :disabled="isDisabled"
              :min="minDate"
              :max="maxDate"
              :class="calendarContainerClass"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
    
    <!-- Mode lecture -->
    <div 
      v-else 
      @click="startEditing"
      class="w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
      :class="{ 'modified-indicator': isModified }"
    >
      {{ displayValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { format, isValid, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
} from '@/components/ui/popover'

interface Props {
  modelValue: string | Date | null // Peut être une chaîne ISO, un objet Date ou null
  isEditable?: boolean
  isModified?: boolean
  min?: string | Date // Date minimum sélectionnable
  max?: string | Date // Date maximum sélectionnable
  displayFormat?: string // Format d'affichage de la date
  inputFormat?: string // Format d'entrée de la date
  calendarContainerClass?: string // Classe CSS pour le conteneur du calendrier
  formatDisplay?: (value: any) => string
  cellId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isEditable: true,
  isModified: false,
  displayFormat: 'dd/MM/yyyy',
  inputFormat: 'yyyy-MM-dd',
  calendarContainerClass: 'w-auto', // Classe par défaut pour le calendrier
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'edit-complete': [value: string | null]
  'edit-cancel': []
}>()

// État local
const isEditing = ref(false)
const isCalendarOpen = ref(false)
const inputRef = ref<HTMLDivElement | null>(null)

// Convertir la valeur du modèle en Date
const modelValueAsDate = computed(() => {
  if (!props.modelValue) return undefined

  if (props.modelValue instanceof Date) {
    return isValid(props.modelValue) ? props.modelValue : undefined
  }

  const date = parseISO(props.modelValue)
  return isValid(date) ? date : undefined
})

// Formater la valeur du modèle pour l'affichage dans l'input
const formattedModelValue = computed(() => {
  if (!modelValueAsDate.value) return ''
  return format(modelValueAsDate.value, props.displayFormat, { locale: fr })
})

// Formater la date pour l'affichage en mode lecture
const displayValue = computed(() => {
  if (!modelValueAsDate.value) return ''
  return format(modelValueAsDate.value, props.displayFormat, { locale: fr })
})

// Convertir les dates min et max en objets Date
const minDate = computed(() => {
  if (!props.min) return undefined
  return props.min instanceof Date ? props.min : parseISO(props.min)
})

const maxDate = computed(() => {
  if (!props.max) return undefined
  return props.max instanceof Date ? props.max : parseISO(props.max)
})

// Fonction pour vérifier si une date est désactivée
const isDisabled = (date: Date) => {
  if (minDate.value && date < minDate.value) return true
  if (maxDate.value && date > maxDate.value) return true
  return false
}

// Commencer l'édition
const startEditing = () => {
  if (!props.isEditable) return
  isEditing.value = true
  
  // Ouvrir le calendrier au prochain cycle
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Gérer la sélection d'une date
const handleDateSelect = (date: Date | undefined) => {
  isCalendarOpen.value = false
  
  if (!date) {
    emit('update:modelValue', null)
    return
  }
  
  // Formater la date au format ISO pour l'émission
  const formattedDate = format(date, 'yyyy-MM-dd')
  emit('update:modelValue', formattedDate)
  emit('edit-complete', formattedDate)
  
  // Fermer le mode édition après sélection
  isEditing.value = false
}

// Fonction pour gérer le clic à l'extérieur
const handleClickOutside = (event: MouseEvent) => {
  if (
    isCalendarOpen.value && 
    inputRef.value && 
    !inputRef.value.contains(event.target as Node) &&
    !event.composedPath().some(el => 
      (el as HTMLElement)?.classList?.contains('vc-container') || 
      (el as HTMLElement)?.classList?.contains('popover-content')
    )
  ) {
    isCalendarOpen.value = false
    isEditing.value = false
    
    // Si une date est déjà sélectionnée, émettre edit-complete
    if (modelValueAsDate.value) {
      const formattedDate = format(modelValueAsDate.value, 'yyyy-MM-dd')
      emit('edit-complete', formattedDate)
    } else {
      emit('edit-cancel')
    }
  }
}

// Annuler l'édition avec la touche Echap
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isEditing.value) {
    isCalendarOpen.value = false
    isEditing.value = false
    emit('edit-cancel')
  }
}

// Arrêter l'édition si la cellule devient non-éditable
watch(() => props.isEditable, (newValue) => {
  if (!newValue && isEditing.value) {
    isEditing.value = false
    isCalendarOpen.value = false
  }
})

// Ajouter les écouteurs d'événements
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

// Nettoyer les écouteurs d'événements
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
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