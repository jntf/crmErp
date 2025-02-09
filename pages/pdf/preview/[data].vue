<template>
    <div class="pdf-preview">
        <Suspense>
            <template #default>
                <component 
                    v-if="pdfData && templateComponent"
                    :is="templateComponent"
                    v-bind="pdfData"
                    @ready="onPdfReady"
                    class="min-h-screen w-screen"
                />
                <div v-else-if="error" class="error-message">
                    {{ error }}
                </div>
                <div v-else class="no-data-message">
                    Aucune donnée disponible pour la génération du PDF
                </div>
            </template>
            <template #fallback>
                <div class="loading">
                    Chargement du PDF en cours...
                </div>
            </template>
        </Suspense>
    </div>
</template>

<script setup lang="ts">
import { isPdfTemplate, getPdfTemplateComponent, type PdfTemplateData } from '~/utils/pdf-templates'

const route = useRoute()
const pdfData = ref<PdfTemplateData | null>(null)
const templateComponent = ref<string | null>(null)
const error = ref<string | null>(null)

// Fonction pour décoder les données UTF-8 depuis base64
const b64_to_utf8 = (str: string): string => {
    try {
        return decodeURIComponent(atob(str))
    } catch (error) {
        console.error('Erreur lors du décodage UTF-8:', error)
        throw error
    }
}

// Fonction pour décoder les données de l'URL
const decodePdfData = async () => {
    try {
        const base64Data = route.params.data as string
        if (!base64Data) {
            error.value = 'Aucune donnée trouvée dans l\'URL'
            return null
        }

        const jsonStr = b64_to_utf8(base64Data)
        const data = JSON.parse(jsonStr)
        
        // Vérifier si le template existe dans le registre
        if (!data.template || !isPdfTemplate(data.template)) {
            error.value = 'Template PDF non valide ou non trouvé'
            return null
        }

        // Récupérer le nom du composant depuis le registre
        templateComponent.value = getPdfTemplateComponent(data.template)
        
        console.log('📄 Preview - Données décodées:', {
            template: data.template,
            component: templateComponent.value,
            dataLength: data.data?.length,
            columnsLength: data.columns?.length,
            options: data.options
        })

        return data
    } catch (err: unknown) {
        console.error('Erreur lors du décodage des données:', err)
        error.value = err instanceof Error ? err.message : 'Erreur lors du décodage des données'
        return null
    }
}

// Définir le layout PDF
definePageMeta({
    layout: 'pdf'
})

// Charger les données au montage
onMounted(async () => {
    pdfData.value = await decodePdfData()
})

// Gestion des événements
const onPdfReady = () => {
    console.log('📄 Preview - PDF généré avec succès')
}
</script>

<style scoped>
.pdf-preview {
    @apply flex items-center justify-center min-h-screen w-screen;
}

.no-data-message, .loading, .error-message {
    @apply text-gray-400 text-lg p-4;
}

.error-message {
    @apply text-red-500;
}
</style>