<template>
  <div class="pdf-preview-container">
    <div class="pdf-toolbar">
      <button
        class="btn-close"
        @click="$emit('close')"
      >
        <XIcon class="w-4 h-4" />
      </button>
    </div>
    <div class="pdf-preview">
      <div v-if="!pdfUrl" class="loading">
        Chargement du PDF en cours...
      </div>
      <iframe v-else :src="pdfUrl" class="pdf-frame"></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { downloadPdf } from '@/utils/pdf-templates'
import { XIcon } from 'lucide-vue-next'
// Props
const props = defineProps<{
  pdfBlob: Uint8Array | null
  filename?: string
}>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
}>()

// État local
const pdfUrl = ref<string>('')

// Gestion du téléchargement
function handleDownload() {
  if (props.pdfBlob) {
    const filename = props.filename || 'document.pdf'
    downloadPdf(props.pdfBlob, filename)
  }
}

// Mise à jour de l'URL du PDF quand le blob change
watch(() => props.pdfBlob, (newBlob) => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value)
  }
  
  if (newBlob) {
    const blob = new Blob([newBlob], { type: 'application/pdf' })
    pdfUrl.value = URL.createObjectURL(blob)
  } else {
    pdfUrl.value = ''
  }
}, { immediate: true })

// Nettoyage de l'URL à la destruction du composant
onUnmounted(() => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value)
  }
})
</script>

<style scoped>
.pdf-preview-container {
  @apply flex flex-col w-full h-full;
}

.pdf-toolbar {
  @apply flex items-center justify-end gap-4 p-4 bg-white border-b;
}

.btn-download {
  @apply px-4 py-2 text-white bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-close {
  @apply px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md;
}

.pdf-preview {
  @apply flex-1 min-h-[600px];
}

.pdf-frame {
  @apply w-full h-full border-0;
}

.loading {
  @apply flex items-center justify-center h-full text-gray-500;
}
</style> 