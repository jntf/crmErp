<template>
    <div class="pdf-preview">
        <ClientOnly>
            <div v-if="!pdfData" class="text-center text-gray-500 text-lg p-4">
                Aucune donnée disponible pour la génération du PDF
            </div>
            <template v-else>
                <div class="preview-container">
                    <PdfVehiclePdfTemplate
                        v-if="pdfData"
                        v-bind="pdfData"
                        @ready="onPdfReady"
                        class="h-full w-full"
                    />
                </div>
            </template>
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// État
const pdfData = ref<any>(null)

// Charger les données du localStorage
onMounted(() => {
    try {
        const storedData = localStorage.getItem('pdf_export_data')
        if (storedData) {
            pdfData.value = JSON.parse(storedData)
            console.log('📄 Preview - Données chargées:', pdfData.value)
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
    }
})

// Gestion des événements
const onPdfReady = (blob: string) => {
    console.log('📄 Preview - PDF généré')
}

// Nettoyer au démontage
onUnmounted(() => {
    localStorage.removeItem('pdf_export_data')
})

// Définir le layout PDF
definePageMeta({
    layout: 'pdf'
})
</script>

<style scoped>
.pdf-preview {
    @apply h-screen w-screen;
}

.preview-container {
    @apply h-full w-full;
}
</style> 