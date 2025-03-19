<template>
  <HoverCard>
    <HoverCardTrigger class="truncate w-full inline-block text-xs cursor-help">
      {{ displayText }}
      <span v-if="isTruncated" class="ml-1 text-gray-500 inline-block">(…)</span>
    </HoverCardTrigger>
    <HoverCardContent class="hover-card-content z-[9999] w-80 max-w-md p-2">
      <div class="text-xs whitespace-pre-wrap max-h-[300px] overflow-auto">
        {{ formattedContent }}
      </div>
    </HoverCardContent>
  </HoverCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

const props = defineProps<{
  text: string
  maxLength?: number
}>()

// Valeurs par défaut
const maxLength = props.maxLength || 50

// Vérifier si le texte doit être tronqué
const isTruncated = computed(() => {
  return props.text && props.text.length > maxLength
})

// Texte à afficher (tronqué ou complet)
const displayText = computed(() => {
  if (!props.text || props.text.length <= maxLength) {
    return props.text || ''
  }
  return props.text.substring(0, maxLength)
})

// Contenu formaté pour l'hover card
const formattedContent = computed(() => {
  return props.text ? props.text.split(',').join(',\n') : ''
})
</script>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* Style spécifique pour garantir que la carte apparaît au-dessus de tout */
:deep(.hover-card-content) {
  z-index: 9999 !important;
  position: relative;
}

/* Animation pour améliorer l'expérience utilisateur */
:deep(.hover-card-trigger:hover) {
  opacity: 0.8;
  transition: opacity 0.2s ease-in-out;
}
</style> 