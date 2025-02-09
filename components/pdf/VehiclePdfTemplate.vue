//VehiclePdfTemplate.vue
<template>
    <div class="pdf-container">
        <div v-if="pdfBlob" class="pdf-viewer">
            <object class="w-full h-full" :data="pdfBlob"></object>
        </div>

        <ClientOnly>
            <pdfFrame
                :id="id"
                type="pdf"
                :width="842"
                :height="595"
                :config="configObj"
                @on-ready="onPdfReady">
                <i-page>
                    <i-group
                        ref="tableGroup"
                        class="tableParent"
                        :transform="
                            (_: any) => {
                                return 'translate(0,0)';
                            }
                        ">
                        <!-- En-tête -->
                        <i-group class="header" :transform="{ translate: [30, 15] }">
                            <!-- Logo -->
                            <i-image
                                src="/logo.png"
                                :x="0"
                                :y="0"
                                :width="80"
                                :height="40">
                            </i-image>

                            <!-- Titre et informations -->
                            <i-text 
                                text="Liste des Véhicules à Marchand"
                                :width="400"
                                :x="200"
                                :y="25"
                                :style="{ font: 'bold 20px Helvetica', textAlign: 'center', fillStyle: '#1a2b3c' }">
                            </i-text>
                            <i-text 
                                :text="'Date d\'édition: ' + formatDate(new Date())"
                                :width="400"
                                :x="200"
                                :y="45"
                                :style="{ font: '10px Helvetica', textAlign: 'center', fillStyle: '#4a5568' }">
                            </i-text>

                            <!-- Informations vendeur -->
                            <i-text 
                                text="Votre vendeur:"
                                :x="650"
                                :y="15"
                                :style="{ font: 'bold 10px Helvetica', fillStyle: '#1a2b3c' }">
                            </i-text>
                            <i-text 
                                :text="`${user?.name || 'Utilisateur'}`"
                                :x="650"
                                :y="30"
                                :style="{ font: '10px Helvetica', fillStyle: '#4a5568' }">
                            </i-text>
                            <i-text 
                                text="Mobile: 06-07-62-67-13"
                                :x="650"
                                :y="45"
                                :style="{ font: '10px Helvetica', fillStyle: '#4a5568' }">
                            </i-text>
                            <i-text 
                                :text="`Mail: ${email || 'julien@njiauto.com'}`"
                                :x="650"
                                :y="60"
                                :style="{ font: '10px Helvetica', fillStyle: '#4a5568' }">
                            </i-text>

                            <!-- Ligne de séparation -->
                            <i-line
                                :x1="0"
                                :y1="80"
                                :x2="782"
                                :y2="80"
                                :style="{ strokeStyle: '#e2e8f0' }">
                            </i-line>
                        </i-group>

                        <!-- En-têtes des colonnes -->
                        <i-group class="header" :transform="{ translate: [30, 100] }">
                            <template v-for="header in tableHeaders" :key="header.id">
                                <i-group
                                    class="cell"
                                    :transform="{ translate: [header.x, 0] }">
                                    <i-rect
                                        :width="header.width"
                                        :height="25"
                                        :style="{ fillStyle: '#1a2b3c' }">
                                    </i-rect>
                                    <i-text
                                        :text="header.title"
                                        :width="header.width - 10"
                                        :x="5"
                                        :y="15"
                                        :style="{
                                            fillStyle: '#ffffff',
                                            font: 'bold 9px Helvetica',
                                            textAlign: header.align || 'left',
                                            baseline: 'middle'
                                        }">
                                    </i-text>
                                </i-group>
                            </template>
                        </i-group>

                        <!-- Lignes de données -->
                        <i-group
                            v-for="(item, index) in data"
                            :key="index"
                            :transform="{ translate: [30, 125 + index * 45] }">
                            <!-- Fond de ligne -->
                            <i-rect
                                :width="782"
                                :height="45"
                                :style="{ 
                                    fillStyle: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                                    strokeStyle: '#e2e8f0',
                                    lineWidth: 0.5,
                                    strokeWidth: 0.5,
                                    strokeOpacity: 0.5,
                                    strokeLinecap: 'round'
                                }">
                            </i-rect>

                            <!-- Cellules -->
                            <template v-for="header in tableHeaders" :key="header.id">
                                <i-group
                                    class="cell"
                                    :transform="{ translate: [header.x, 0] }">
                                    <i-text
                                        :text="formatCellValue(item[header.id], header.id, item)"
                                        :width="header.width - 10"
                                        :x="5"
                                        :y="15"
                                        :style="{
                                            fillStyle: header.id === 'vehicle_selling_price_ht' || header.id === 'vehicle_frevo' ? '#1a2b3c' : '#4a5568',
                                            font: header.id === 'vehicle_selling_price_ht' ? 'bold 9px Helvetica' : '8px Helvetica',
                                            textAlign: header.align || 'left',
                                            baseline: 'middle'
                                        }">
                                    </i-text>
                                </i-group>
                            </template>

                            <!-- Options -->
                            <i-text
                                :text="formatOptions(item.vehicle_options)"
                                :x="5"
                                :y="30"
                                :width="772"
                                :style="{
                                    fillStyle: '#64748b',
                                    font: 'italic 8px Helvetica',
                                    textAlign: 'left',
                                    baseline: 'middle'
                                }">
                            </i-text>
                        </i-group>
                    </i-group>
                </i-page>
            </pdfFrame>
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Column {
    id: string
    title: string
}

interface PdfOptions {
    title?: string
    subtitle?: string
}

// Props
const props = defineProps<{
    data: any[]
    columns: Column[]
    options?: PdfOptions
}>()

const authStore = useAuthStore()
const user = authStore.user
const email = authStore.user?.email

// État local
const id = "vehicle-export-pdf"
const pdfBlob = ref("")

// Configuration des colonnes du tableau
const tableHeaders = [
    { id: 'ref', title: 'Réf', x: 0, width: 50, align: 'center' },
    { id: 'brand', title: 'Marque', x: 50, width: 70 },
    { id: 'model', title: 'Modèle/Version', x: 120, width: 230 },
    { id: 'fuel_type', title: 'Energie', x: 350, width: 70, align: 'center' },
    { id: 'transmission', title: 'Boite', x: 420, width: 60, align: 'center' },
    { id: 'co2_emissions', title: 'CO2', x: 480, width: 40, align: 'center' },
    { id: 'color', title: 'Couleur', x: 520, width: 70 },
    { id: 'registration_date', title: '1ère MEC', x: 590, width: 60, align: 'center' },
    { id: 'mileage', title: 'Km', x: 650, width: 40, align: 'right' },
    { id: 'vehicle_frevo', title: 'FREVO', x: 690, width: 40, align: 'right' },
    { id: 'vehicle_selling_price_ht', title: 'Prix March.', x: 730, width: 72, align: 'right' }
]

// Modification de la configuration
const configObj = {
    margins: {
        top: 15,
        bottom: 15,
        left: 30,
        right: 30
    }
}

// Date formatée pour le sous-titre
const subtitle = computed(() => {
    return `État au ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`
})

// Fonctions utilitaires
function formatDate(date: Date): string {
    return format(date, 'dd/MM/yyyy', { locale: fr })
}

function formatCellValue(value: any, columnId: string, item?: any): string {
    if (value === null || value === undefined) return '-'
    
    switch(columnId) {
        case 'model':
            return `${value}${item.version ? ` - ${item.version}` : ''}`
        case 'vehicle_selling_price_ht':
            const priceHT = Number(value)
            const priceTTC = priceHT * 1.2 // Calcul du TTC (TVA 20%)
            return `${priceTTC}€ TTC (${priceHT}€ HT)`
        case 'vehicle_frevo':
            const frevo = Number(value)
            return frevo ? `${frevo.toLocaleString('fr-FR')}€` : '-'
        case 'registration_date':
            return format(new Date(value), 'dd/MM/yyyy', { locale: fr })
        case 'mileage':
            return value.toLocaleString('fr-FR')
        case 'co2_emissions':
            return value ? `${value}g` : '-'
        default:
            return String(value)
    }
}

function formatOptions(options: string | null): string {
    if (!options) return '-'
    const optionsArray = options.split(',')
    return optionsArray.length > 0 ? 'Options: ' + optionsArray.join(', ') : '-'
}

// Événements
function onPdfReady() {
    console.log('PDF prêt à être généré')
}

function onPdfUpdated(blob: string) {
    pdfBlob.value = blob
    emit('ready', blob)
}

// Émissions
const emit = defineEmits<{
    (e: 'ready', blob: string): void
}>()
</script>

<style scoped>
.pdf-container {
    @apply w-full h-full;
}

.pdf-viewer {
    @apply w-full h-full;
}
</style>