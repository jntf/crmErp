<template>
    <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
        <DialogContent :class="{
            'sm:max-w-[800px] max-h-[90vh] overflow-y-auto': currentStep !== 3,
            'max-w-[98vw] max-h-[90vh] overflow-y-auto mx-2': currentStep === 3
        }">
            <DialogHeader>
                <DialogTitle>Import de véhicules</DialogTitle>
                <DialogDescription>
                    Importez vos véhicules depuis un fichier ou du texte
                </DialogDescription>
            </DialogHeader>

            <div class="flex flex-col space-y-4" :class="{ 'w-full': currentStep === 3 }">
                <!-- Étape 1: Sélection de la source et upload -->
                <div v-if="currentStep === 1" class="flex flex-col space-y-6">
                    <!-- Sélection du type de source -->
                    <div class="space-y-2">
                        <Label>Source de données</Label>
                        <div class="flex space-x-2">
                            <ToggleGroup type="single" v-model="sourceType" class="w-full">
                                <ToggleGroupItem value="excel" class="flex-1">
                                    <FileSpreadsheet class="h-4 w-4 mr-2" />
                                    Excel
                                </ToggleGroupItem>
                                <ToggleGroupItem value="pdf" class="flex-1">
                                    <FileText class="h-4 w-4 mr-2" />
                                    PDF
                                </ToggleGroupItem>
                                <ToggleGroupItem value="text" class="flex-1">
                                    <AlignLeft class="h-4 w-4 mr-2" />
                                    Texte
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </div>

                    <!-- Utiliser l'IA pour le traitement -->
                    <div class="flex items-center space-x-2">
                        <div class="flex-1">
                            <Switch id="use-ia" v-model="useIA" class="data-[state=checked]:bg-primary" />
                            <Label for="use-ia" class="ml-2 inline-flex items-center cursor-pointer">
                                <Sparkles class="h-4 w-4 mr-2 text-yellow-500" />
                                Utiliser l'IA pour optimiser l'import
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info class="h-4 w-4 ml-2 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent class="max-w-sm">
                                            <p>Analyse et standardise automatiquement les données selon les normes
                                                automobiles françaises. Détecte les marques, modèles, versions et
                                                enrichit les informations manquantes.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                        </div>
                    </div>

                    <!-- Zone de dépôt pour fichiers Excel ou PDF -->
                    <div v-if="sourceType === 'excel' || sourceType === 'pdf'"
                        class="flex flex-col items-center justify-center w-full h-48 px-4 transition bg-background border-2 border-dashed rounded-xl appearance-none cursor-pointer hover:border-primary/50 focus:outline-none"
                        @dragover.prevent @drop.prevent="handleFileDrop" @click="triggerFileInput">
                        <span class="flex items-center space-x-2">
                            <Upload class="w-6 h-6 text-muted-foreground" />
                            <span class="font-medium text-muted-foreground">
                                Déposez votre fichier {{ sourceType === 'excel' ? 'Excel' : 'PDF' }} ici ou cliquez pour
                                parcourir
                            </span>
                        </span>
                        <span class="text-xs text-muted-foreground mt-2">
                            Formats acceptés: {{ sourceType === 'excel' ? 'XLS, XLSX' : 'PDF' }}
                        </span>
                        <input ref="fileInput" type="file" class="hidden"
                            :accept="sourceType === 'excel' ? '.xls,.xlsx' : '.pdf'" @change="handleFileSelect" />
                    </div>

                    <!-- Zone de texte pour source texte -->
                    <div v-if="sourceType === 'text'" class="space-y-2">
                        <Label>Collez votre texte</Label>
                        <Textarea v-model="inputText"
                            placeholder="Collez ici les informations des véhicules (e-mail, description, liste, etc.)"
                            class="min-h-[200px]" />
                    </div>

                    <div v-if="selectedFile" class="flex items-center space-x-2 text-sm">
                        <Badge variant="outline" class="px-2 py-1">
                            <FileIcon class="h-4 w-4 mr-2" />
                            {{ selectedFile.name }}
                        </Badge>
                        <Button variant="ghost" size="sm" @click="resetFile">
                            <X class="h-4 w-4" />
                        </Button>
                    </div>

                    <div v-if="processingData" class="flex flex-col items-center py-4">
                        <Progress class="h-2 w-full mb-4" :value="processingProgress" />
                        <p class="text-sm text-muted-foreground">{{ processingMessage }}</p>
                    </div>
                    
                    <!-- NOUVEAU: Message et bouton pour continuer après traitement IA -->
                    <div v-if="dataProcessedByIA" class="flex flex-col space-y-2 p-4 border rounded-md bg-green-50 dark:bg-green-950">
                        <p class="text-sm font-medium text-green-700 dark:text-green-300">
                            Données traitées par IA avec succès! 
                        </p>
                        <p class="text-xs text-green-600 dark:text-green-400">
                            Vérifiez les logs dans la console du navigateur pour examiner les données.
                        </p>
                        <Button class="mt-2" variant="default" @click="proceedAfterIA">
                            Continuer vers {{ currentStepDirection }}
                        </Button>
                    </div>
                </div>

                <!-- Étape 2: Mapping des colonnes -->
                <ColumnMappingStep v-if="currentStep === 2" :columns="fileColumns" :data-examples="dataExamples"
                    v-model:column-mapping="columnMapping" />

                <!-- Étape 3: Validation des données -->
                <DataValidationStep v-if="currentStep === 3" :mapped-data="mappedData"
                    @validation-complete="handleValidationComplete" />
            </div>

            <DialogFooter>
                <div class="flex justify-between w-full">
                    <Button v-if="currentStep > 1" variant="outline" @click="currentStep--">
                        Retour
                    </Button>
                    <div class="flex space-x-2">
                        <Button variant="outline" @click="$emit('update:modelValue', false)">
                            Annuler
                        </Button>
                        <Button v-if="currentStep < 3" :disabled="!canProceed || processingData" @click="nextStep">
                            {{ processingData ? 'Traitement...' : 'Continuer' }}
                        </Button>
                        <Button v-else :disabled="!canProceed" @click="handleImport">
                            Importer
                        </Button>
                    </div>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Upload, FileSpreadsheet, FileText, AlignLeft, Info, X, FileIcon, Sparkles } from 'lucide-vue-next'
import * as ExcelJS from 'exceljs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/toast/use-toast'
import { ColumnMappingStep, DataValidationStep } from './import'
import { VehicleStockStatus } from '../types/stock'
import { useVehicleStockStore } from '../stores/useVehicleStockStore'
import Progress from '~/components/ui/progress/Progress.vue'

const props = defineProps<{
    modelValue: boolean
}>()

interface ValidationData {
    data: any[]
    supplier: any
    importType: string
}

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'import-complete', data: any[]): void
}>()

const { toast } = useToast()

// État du composant
const currentStep = ref(1)
const sourceType = ref('excel')
const useIA = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const inputText = ref('')
const processingData = ref(false)
const processingMessage = ref('Traitement des données en cours...')
// NOUVEAU: Indicateur pour savoir si les données ont été traitées par l'IA
const dataProcessedByIA = ref(false)
const nextStepAfterIA = ref<number | null>(null)

// Données pour les étapes
const fileColumns = ref<string[]>([])
const dataExamples = ref<Record<string, any[]>>({})
const columnMapping = ref<Record<string, string>>({})
const mappedData = ref<any[]>([])
const workbook = ref<ExcelJS.Workbook | null>(null)
const rawData = ref<any[]>([])
const selectedSupplier = ref<any | null>(null)
const importType = ref<string>('vehicles_only')

const supabase = useSupabaseClient()
const stockStore = useVehicleStockStore()

// Peut-on passer à l'étape suivante?
const canProceed = computed(() => {
    switch (currentStep.value) {
        case 1:
            if (sourceType.value === 'excel' || sourceType.value === 'pdf') {
                return selectedFile.value !== null && !processingData.value
            } else if (sourceType.value === 'text') {
                return inputText.value.trim().length > 0 && !processingData.value
            }
            return false
        case 2:
            return Object.keys(columnMapping.value).length > 0
        case 3:
            return true
        default:
            return false
    }
})

// Méthodes pour la gestion des fichiers
const triggerFileInput = () => {
    fileInput.value?.click()
}

const handleFileDrop = (e: DragEvent) => {
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
        handleFile(files[0])
    }
}

const handleFileSelect = (e: Event) => {
    const files = (e.target as HTMLInputElement).files
    if (files && files.length > 0) {
        handleFile(files[0])
    }
}

const resetFile = () => {
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
}

// Gestion des fichiers
const handleFile = async (file: File) => {
    console.log("[FICHIER] Traitement du fichier", {
        name: file.name,
        type: file.type,
        size: file.size,
        sourceType: sourceType.value
    })

    if (sourceType.value === 'excel' && !file.name.match(/\.(xls|xlsx)$/)) {
        console.log("[FICHIER] Format de fichier Excel non supporté")
        toast({
            title: "Format non supporté",
            description: "Veuillez sélectionner un fichier Excel (.xls ou .xlsx)",
            variant: "destructive"
        })
        return
    }

    if (sourceType.value === 'pdf' && !file.name.match(/\.pdf$/i)) {
        console.log("[FICHIER] Format de fichier PDF non supporté")
        toast({
            title: "Format non supporté",
            description: "Veuillez sélectionner un fichier PDF",
            variant: "destructive"
        })
        return
    }

    selectedFile.value = file
    console.log("[FICHIER] Fichier sélectionné", {
        useIA: useIA.value,
        sourceType: sourceType.value
    })

    if (useIA.value) {
        console.log("[FICHIER] Traitement avec IA")
        // Si IA est activée, on traite directement avec l'API
        await processWithIA(file)
    } else if (sourceType.value === 'excel') {
        console.log("[FICHIER] Traitement Excel standard")
        // Sinon, pour Excel on utilise le traitement standard
        await processExcelFile(file)
    } else {
        console.log("[FICHIER] Type de source non supporté sans IA")
        toast({
            title: "Option IA nécessaire",
            description: `Le traitement de fichiers ${sourceType.value.toUpperCase()} nécessite l'option IA.`,
            variant: "destructive"
        })
        useIA.value = true
        await processWithIA(file)
    }
}

// Traitement d'un fichier Excel standard
const processExcelFile = async (file: File, advanceToNextStep = true) => {
    try {
        processingData.value = true
        processingMessage.value = "Analyse du fichier Excel..."

        const arrayBuffer = await file.arrayBuffer()
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load(arrayBuffer)
        workbook.value = wb

        const worksheet = wb.worksheets[0]
        if (!worksheet) {
            throw new Error("Aucune feuille de calcul trouvée dans le fichier")
        }

        // Récupérer les en-têtes (première ligne)
        const headers: string[] = []
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            const value = cell.value?.toString().trim() || `Colonne ${colNumber}`
            headers[colNumber - 1] = value
        })
        fileColumns.value = headers

        // Récupérer toutes les données
        const data: any[] = []
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber)
            const rowData: any = {}

            headers.forEach((header, index) => {
                const cell = row.getCell(index + 1)
                let value = cell.value

                // Convertir les dates en chaînes de caractères
                if (value instanceof Date) {
                    value = value.toLocaleDateString('fr-FR')
                }
                // Convertir les nombres en chaînes de caractères
                else if (typeof value === 'number') {
                    value = value.toString()
                }
                // Gérer les objets RichText d'Excel
                else if (value && typeof value === 'object' && 'richText' in value) {
                    value = value.richText.map((rt: any) => rt.text).join('')
                }
                // Convertir les autres types en chaînes de caractères
                else if (value !== null && value !== undefined) {
                    value = value.toString().trim()
                }

                rowData[header] = value
            })

            if (Object.values(rowData).some(v => v !== null && v !== undefined && v !== '')) {
                data.push(rowData)
            }
        }

        // Récupérer les exemples pour le mapping
        const examples: Record<string, any[]> = {}
        headers.forEach((header) => {
            examples[header] = data.slice(0, 3).map(row => row[header])
        })
        dataExamples.value = examples

        // Stocker les données brutes
        rawData.value = data

        processingData.value = false

        // Uniquement passer à l'étape suivante si demandé
        if (advanceToNextStep) {
            currentStep.value++
        }

    } catch (error) {
        processingData.value = false
        console.error('Erreur lors de la lecture du fichier Excel:', error)
        toast({
            title: "Erreur de lecture",
            description: "Impossible de lire le fichier Excel. Vérifiez que le fichier n'est pas corrompu.",
            variant: "destructive"
        })
    }
}

// Computed pour déterminer le texte du bouton de continuation
const currentStepDirection = computed(() => {
    if (nextStepAfterIA.value === 2) return "l'étape de mapping";
    if (nextStepAfterIA.value === 3) return "l'étape de validation";
    return "l'étape suivante";
})

// Fonction pour continuer après le traitement IA
const proceedAfterIA = () => {
    if (nextStepAfterIA.value) {
        currentStep.value = nextStepAfterIA.value;
        dataProcessedByIA.value = false;
        nextStepAfterIA.value = null;
    }
}

// Extraction des données de PDF
const extractPdfText = async (file: File) => {
    try {
        console.log("[PDF] Début extraction PDF", { fileName: file.name, fileSize: file.size })
        processingMessage.value = "Extraction du texte du PDF..."

        // Utiliser pdfjs pour extraire le texte
        console.log("[PDF] Import de pdfjs-dist")
        const pdfjsLib = await import('pdfjs-dist')
        console.log("[PDF] pdfjs importé:", pdfjsLib)
        
        // Configurer l'emplacement du worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        
        console.log("[PDF] Worker configuré:", pdfjsLib.GlobalWorkerOptions.workerSrc)

        console.log("[PDF] Conversion du fichier en ArrayBuffer")
        const arrayBuffer = await file.arrayBuffer()
        console.log("[PDF] ArrayBuffer créé", { byteLength: arrayBuffer.byteLength })

        console.log("[PDF] Chargement du document PDF")
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        console.log("[PDF] Document chargé", { numPages: pdf.numPages })

        let extractedText = ''
        console.log("[PDF] Extraction du texte page par page")

        for (let i = 1; i <= pdf.numPages; i++) {
            console.log(`[PDF] Traitement page ${i}/${pdf.numPages}`)
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            const textItems = textContent.items.map((item: any) => item.str)
            const pageText = textItems.join(' ')
            console.log(`[PDF] Page ${i}: ${pageText.length} caractères extraits`)
            extractedText += pageText + '\n'
        }

        console.log("[PDF] Extraction terminée", {
            totalLength: extractedText.length,
            preview: extractedText.substring(0, 150) + '...'
        })

        return extractedText
    } catch (error: unknown) {
        console.error('[PDF] Erreur détaillée lors de l\'extraction:', error)
        if (error instanceof Error) {
            console.log('[PDF] Stack trace:', error.stack)
            throw new Error(`Impossible d'extraire le texte du PDF: ${error.message}`)
        } else {
            console.log('[PDF] Erreur non standard')
            throw new Error(`Impossible d'extraire le texte du PDF: erreur inconnue`)
        }
    }
}

// Traitement avec l'IA (via Edge Function Supabase)
const processWithIA = async (file: File | null = null, preProcessedData: { headers: string[], rows: Record<string, string>[] } | null = null) => {
    try {
        processingData.value = true;
        dataProcessedByIA.value = false;
        processingMessage.value = "Préparation des données...";
        
        // Initialiser le progress pour l'affichage
        processingProgress.value = 10;
        
        console.log("[IA] Début du traitement avec IA", { 
            sourceType: sourceType.value,
            hasPreProcessedData: !!preProcessedData 
        });

        // Préparer les données à envoyer à Claude
        let extractedText = '';
        let extractedData = null;

        // Simulation d'avancement pour l'UI
        setTimeout(() => { processingProgress.value = 20; }, 500);

        // Obtenir le texte brut selon le type de source
        if (sourceType.value === 'text') {
            console.log("[IA] Traitement du texte brut", { length: inputText.value.length });
            extractedText = inputText.value;
            
            // Si des données prétraitées sont disponibles, les utiliser
            if (preProcessedData) {
                extractedData = preProcessedData;
                console.log("[IA] Utilisation des données tabulées prétraitées", {
                    headers: preProcessedData.headers,
                    rowCount: preProcessedData.rows.length
                });
            }
            processingProgress.value = 30;
        } else if (sourceType.value === 'pdf' && file) {
            console.log("[IA] Traitement du PDF", { fileName: file.name, size: file.size });
            try {
                extractedText = await extractPdfText(file);
                console.log("[IA] Texte extrait du PDF", {
                    textLength: extractedText.length,
                    preview: extractedText.substring(0, 100) + '...'
                });
                processingProgress.value = 40;
            } catch (pdfError) {
                console.error("[IA] Erreur extraction PDF:", pdfError);
                toast({
                    title: "Erreur PDF",
                    description: "Problème lors de l'extraction du texte du PDF",
                    variant: "destructive"
                });
                throw pdfError;
            }
        } else if (sourceType.value === 'excel' && file) {
            console.log("[IA] Traitement du fichier Excel", { fileName: file.name, size: file.size });
            // Extraire les données Excel directement ici plutôt que dans l'Edge Function
            await processExcelFile(file, false); // False pour ne pas passer à l'étape suivante
            processingProgress.value = 35;

            // Convertir les données extraites en format CSV
            const headers = fileColumns.value.join(',');
            const rows = rawData.value.map(row =>
                fileColumns.value.map(col => `"${(row[col] || '').replace(/"/g, '""')}"`).join(',')
            ).join('\n');

            console.log("[IA] Données Excel extraites", {
                headers: fileColumns.value,
                rowCount: rawData.value.length,
                sampleRow: rawData.value[0]
            });

            extractedText = headers + '\n' + rows;
            extractedData = {
                headers: fileColumns.value,
                rows: rawData.value
            };
            processingProgress.value = 50;
        } else {
            console.error("[IA] Type de source ou fichier non valide", { sourceType: sourceType.value, hasFile: !!file });
            throw new Error("Type de source ou fichier non valide");
        }

        // Création du prompt pour Claude
        processingMessage.value = "Optimisation des données avec IA...";
        processingProgress.value = 60;
        
        // Log détaillé des données à envoyer
        console.log("[IA-DEBUG] Données à envoyer à l'Edge Function:", {
            sourceType: sourceType.value,
            textLength: extractedText.length,
            textPreview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''),
            extractedDataHeaders: extractedData?.headers,
            extractedDataRowCount: extractedData?.rows?.length,
            extractedDataSample: extractedData?.rows?.slice(0, 2)
        });

        const requestBody = {
            text: extractedText,
            data: extractedData,
            source_type: sourceType.value
        };
        
        console.log("[IA] Appel de l'Edge Function");
        processingProgress.value = 70;

        // Appel à l'Edge Function uniquement pour l'interaction avec l'API Claude
        try {
            const { data, error } = await supabase.functions.invoke('process-vehicle-data', {
                body: requestBody
            });

            processingProgress.value = 90;
            console.log("[IA] Réponse reçue de l'Edge Function");
            
            // Log détaillé de la réponse
            console.log("[IA-DEBUG] Réponse de l'Edge Function (résumé):", {
                hasError: !!error,
                dataStructure: data?.structure,
                hasMappingSuggestions: !!data?.mappingSuggestions,
                dataCount: data?.data?.length,
                errorMessage: error?.message
            });
            
            console.log("[IA-DEBUG] Données brutes reçues:", data);

            if (error) {
                console.error("[IA] Erreur Edge Function:", error);
                throw error;
            }

            // Traiter la réponse
            processingProgress.value = 95;
            if (data && data.data) {
                console.log("[IA] Structure de la réponse:", data.structure);
                
                // Bloquer temporairement le passage automatique à l'étape suivante
                processingData.value = false;
                processingProgress.value = 100;
                
                // Préparer les données pour l'étape suivante mais ne pas y aller automatiquement
                if (data.structure === 'mapped') {
                    console.log("[IA] Données mappées reçues", { count: data.data.length });
                    console.log("[IA] Échantillon de données brutes:", data.data.slice(0, 2));
                    
                    // Mappage des champs de l'API Claude vers les champs attendus par l'application
                    const fieldMapping = {
                        // Claude → Application 
                        brand: 'brand',
                        model: 'model',
                        version: 'version',
                        year: 'year',
                        mileage: 'mileage',
                        fuel_type: 'fuel_type',
                        transmission: 'transmission',
                        color: 'color',
                        co2_emissions: 'co2_emissions',
                        power_hp: 'power_hp',
                        power_fiscal: 'power_fiscal',
                        doors: 'doors',
                        seats: 'seats',
                        vehicle_price_ht: 'vehicle_price_ht',
                        vehicle_selling_price_ht: 'vehicle_selling_price_ht',
                        vehicle_repair_cost: 'vehicle_repair_cost',
                        vehicle_frevo: 'vehicle_frevo',
                        vehicle_vat_rate: 'vehicle_vat_rate',
                        vehicle_location: 'vehicle_location',
                        serie_equipments: 'serie_equipments',
                        option_equipments: 'option_equipments',
                        vin: 'vin',
                        registration_number: 'registration_number',
                        registration_date: 'registration_date',
                        qty: 'qty'
                    };

                    // Définir l'interface pour les véhicules reçus de Claude
                    interface VehicleData {
                        vin?: string;
                        registration_number?: string;
                        registration_date?: string;
                        brand?: string;
                        model?: string;
                        version?: string;
                        year?: number | string;
                        mileage?: number | string;
                        fuel_type?: string;
                        transmission?: string;
                        color?: string;
                        co2_emissions?: string | number;
                        power_hp?: string | number;
                        power_fiscal?: string | number;
                        doors?: string | number;
                        seats?: string | number;
                        vehicle_price_ht?: number | string;
                        vehicle_selling_price_ht?: number | string;
                        vehicle_repair_cost?: number | string;
                        vehicle_frevo?: number | string;
                        vehicle_vat_rate?: number | string;
                        vehicle_location?: string;
                        serie_equipments?: string;
                        option_equipments?: string;
                        qty?: number | string;
                        [key: string]: any;
                    }

                    // Fonction pour valider et convertir les types des champs
                    const validateAndConvertField = (fieldName: string, value: any): any => {
                        // Valeurs par défaut pour les champs obligatoires
                        const defaults = {
                            brand: '',
                            model: '',
                            year: 2000,
                            mileage: 10,
                            fuel_type: '',
                            transmission: '',
                            color: '',
                            vehicle_price_ht: 0,
                            vehicle_selling_price_ht: 0,
                            vehicle_vat_rate: 20,
                            vehicle_frevo: 0,
                            registration_date: '01/01/1900',
                            qty: 1
                        };

                        // Conversion des chaînes vides en valeurs par défaut pour les champs obligatoires
                        if ((value === '' || value === null || value === undefined) && fieldName in defaults) {
                            return defaults[fieldName as keyof typeof defaults];
                        }

                        // Conversion des types selon le champ
                        switch (fieldName) {
                            case 'year':
                            case 'mileage':
                            case 'power_hp':
                            case 'power_fiscal':
                            case 'doors':
                            case 'seats':
                            case 'vehicle_price_ht':
                            case 'vehicle_selling_price_ht':
                            case 'vehicle_repair_cost':
                            case 'vehicle_frevo':
                            case 'vehicle_vat_rate':
                            case 'qty':
                                // Conversion en nombre
                                const num = Number(value);
                                return isNaN(num) ? defaults[fieldName as keyof typeof defaults] || 0 : num;
                            
                            case 'registration_date':
                                // S'assurer que la date est au bon format
                                return value || '01/01/1900';
                            
                            default:
                                // Les autres champs restent tels quels
                                return value !== undefined ? value : '';
                        }
                    };

                    // Adapter les données reçues si nécessaire
                    mappedData.value = data.data.map((vehicle: VehicleData) => {
                        // Créer un nouvel objet mappé avec les champs attendus
                        const mappedVehicle: Record<string, any> = {};
                        
                        // Parcourir le mappage de champs et construire le véhicule
                        Object.entries(fieldMapping).forEach(([apiField, appField]) => {
                            // Récupérer la valeur du champ (ou null si absent)
                            const value = vehicle[apiField];
                            
                            // Valider et convertir la valeur selon le type attendu
                            mappedVehicle[appField] = validateAndConvertField(appField, value);
                        });
                        
                        // Ajouter le statut par défaut
                        mappedVehicle.status = 'disponible';
                        
                        console.log("[IA] Véhicule mappé:", mappedVehicle);
                        
                        return mappedVehicle;
                    });
                    
                    // Indiquer quelle sera la prochaine étape mais ne pas y aller automatiquement
                    nextStepAfterIA.value = 3;
                    dataProcessedByIA.value = true;
                    
                    // Afficher un toast pour informer l'utilisateur que les données sont prêtes
                    toast({
                        title: "Données traitées avec succès",
                        description: `${mappedData.value.length} véhicules importés. Cliquez sur Continuer pour passer à l'étape de validation.`,
                        variant: "default",
                        duration: 10000
                    });
                }
                // Sinon, on utilise les données pour l'étape 2
                else {
                    if (sourceType.value !== 'excel') {
                        // Pour PDF et text, utiliser les données traitées
                        console.log("[IA] Préparation des données pour l'étape 2", {
                            headers: data.data.headers,
                            rowCount: data.data.rows?.length
                        });
                        rawData.value = data.data.rows || [];
                        fileColumns.value = data.data.headers || [];

                        // Préparer les exemples
                        const examples: Record<string, any[]> = {};
                        fileColumns.value.forEach((header) => {
                            examples[header] = rawData.value.slice(0, 3).map(row => row[header] || '');
                        });
                        dataExamples.value = examples;
                    } else {
                        console.log("[IA] Utilisation des données Excel existantes");
                    }

                    // Si l'IA a suggéré un mapping, l'utiliser
                    if (data.mappingSuggestions) {
                        console.log("[IA] Mapping suggéré", data.mappingSuggestions);
                        columnMapping.value = data.mappingSuggestions;
                    }
                    
                    // Indiquer quelle sera la prochaine étape mais ne pas y aller automatiquement
                    nextStepAfterIA.value = 2;
                    dataProcessedByIA.value = true;
                    
                    // Afficher un toast pour informer l'utilisateur que les données sont prêtes
                    toast({
                        title: "Données traitées avec succès",
                        description: "Les données ont été traitées par l'IA. Cliquez sur Continuer pour passer à l'étape de mapping.",
                        variant: "default",
                        duration: 10000
                    });
                }
            } else {
                console.error("[IA] Format de réponse invalide", data);
                throw new Error("Format de réponse invalide");
            }
        } catch (edgeFunctionError: any) {
            // Gestion spécifique des erreurs Edge Function
            console.error("[IA] Erreur détaillée Edge Function:", edgeFunctionError);
            
            // Tenter de récupérer les détails d'erreur dans le corps de la réponse
            let errorMessage = "Erreur lors de l'appel à l'Edge Function";
            let errorDetails = "";
            
            try {
                if (edgeFunctionError.context && edgeFunctionError.context.response) {
                    const statusCode = edgeFunctionError.context.response.status;
                    console.log("[IA-ERROR] Code d'erreur HTTP:", statusCode);
                    
                    // Si la réponse contient un corps JSON
                    const responseText = await edgeFunctionError.context.response.text();
                    console.log("[IA-ERROR] Texte de réponse brut:", responseText);
                    
                    if (responseText) {
                        try {
                            const responseJson = JSON.parse(responseText);
                            console.log("[IA-ERROR] Détails de l'erreur:", responseJson);
                            
                            if (responseJson.error) {
                                errorMessage = responseJson.error;
                                errorDetails = responseJson.details || responseJson.stack || "";
                            }
                        } catch (jsonError) {
                            console.error("[IA-ERROR] Impossible de parser la réponse d'erreur:", jsonError);
                        }
                    }
                }
            } catch (responseError) {
                console.error("[IA-ERROR] Erreur lors de l'extraction des détails:", responseError);
            }
            
            // Afficher un toast avec les détails de l'erreur
            toast({
                title: "Erreur de traitement Edge Function",
                description: errorMessage + (errorDetails ? ` (${errorDetails})` : ""),
                variant: "destructive",
                duration: 10000
            });
            
            throw new Error(`Erreur Edge Function: ${errorMessage}`);
        }

        processingData.value = false
        console.log("[IA] Traitement IA terminé avec succès")

    } catch (error: unknown) {
        processingData.value = false
        dataProcessedByIA.value = false
        console.error('[IA] Erreur finale lors du traitement avec IA:', error)
        toast({
            title: "Erreur de traitement",
            description: error instanceof Error ? error.message : "Impossible de traiter les données avec l'IA. Veuillez réessayer ou désactiver l'option IA.",
            variant: "destructive"
        })
    }
}

// Traitement du texte brut
const processTextInput = async () => {
    console.log("[TEXTE] Traitement du texte brut", {
        length: inputText.value.length,
        preview: inputText.value.substring(0, 100) + '...',
        useIA: useIA.value
    })

    if (!inputText.value.trim()) {
        console.log("[TEXTE] Texte vide")
        toast({
            title: "Texte vide",
            description: "Veuillez saisir du texte à analyser",
            variant: "destructive"
        })
        return
    }

    // Données structurées extraites du texte
    let structuredData: { headers: string[], rows: Record<string, string>[] } | null = null

    // NOUVEAU: Détection du format tabulé pour pré-traitement
    if (inputText.value.includes('\t')) {
        console.log("[TEXTE] Détection de données tabulées (avec tabulations)")
        
        // Analyser les données tabulées
        try {
            const lines = inputText.value.split('\n').filter(line => line.trim().length > 0)
            console.log("[TEXTE] Nombre de lignes:", lines.length)
            
            if (lines.length > 1) {
                // Extraire les en-têtes (première ligne)
                const headers = lines[0].split('\t').map(header => header.trim())
                console.log("[TEXTE] En-têtes détectés:", headers)
                
                // Extraire les données (lignes suivantes)
                const rows: Record<string, string>[] = []
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split('\t')
                    if (values.length === headers.length) {
                        const row: Record<string, string> = {}
                        headers.forEach((header, index) => {
                            row[header] = values[index].trim()
                        })
                        rows.push(row)
                    } else {
                        console.log(`[TEXTE] Avertissement: La ligne ${i+1} a ${values.length} colonnes, attendu ${headers.length}`)
                    }
                }
                
                console.log("[TEXTE] Données tabulées analysées:", {
                    headerCount: headers.length,
                    rowCount: rows.length,
                    sampleRow: rows.length > 0 ? rows[0] : null
                })
                
                // Pré-remplir les données structurées pour aider l'IA
                if (rows.length > 0) {
                    console.log("[TEXTE] Conversion en format structuré pour aider l'IA")
                    structuredData = {
                        headers,
                        rows
                    }
                }
            }
        } catch (tabulationError) {
            console.error("[TEXTE] Erreur lors de l'analyse des données tabulées:", tabulationError)
        }
    }

    // Ajout d'un log pour mieux suivre le flux
    console.log("[TEXTE] useIA:", useIA.value, "structuredData:", !!structuredData);

    if (useIA.value) {
        console.log("[TEXTE] Traitement avec IA", {
            hasStructuredData: !!structuredData,
            structureHeaders: structuredData?.headers,
            rowCount: structuredData?.rows?.length
        })
        // Utiliser l'IA pour traiter le texte
        await processWithIA(null, structuredData);
        
        // Ajouter un log pour voir l'état après le traitement
        console.log("[TEXTE] État après processWithIA:", {
            currentStep: currentStep.value,
            dataProcessedByIA: dataProcessedByIA.value,
            nextStepAfterIA: nextStepAfterIA.value,
            mappedDataLength: mappedData.value.length
        });
    } else {
        console.log("[TEXTE] Traitement manuel requis, activation automatique de l'IA")
        toast({
            title: "Traitement manuel requis",
            description: "Le traitement de texte brut nécessite l'option IA. Veuillez l'activer.",
            variant: "destructive"
        })
        useIA.value = true  // Active automatiquement l'IA
        await processWithIA(null, structuredData)
    }
}

const nextStep = async () => {
    console.log("[ETAPE] Tentative de passer à l'étape suivante", {
        currentStep: currentStep.value,
        sourceType: sourceType.value,
        hasText: !!inputText.value,
        hasFile: !!selectedFile.value,
        processingData: processingData.value,
        dataProcessedByIA: dataProcessedByIA.value
    });

    if (currentStep.value === 1) {
        // À l'étape 1, on effectue différentes actions selon la source
        if (sourceType.value === 'text' && inputText.value) {
            console.log("[ETAPE] Traitement du texte avant de passer à l'étape suivante");
            await processTextInput();
            
            // Si les données ont été traitées par l'IA, ne pas avancer automatiquement
            // car le bouton "Continuer" sera affiché pour l'utilisateur
            if (dataProcessedByIA.value) {
                console.log("[ETAPE] Données texte traitées par IA, attente de l'action utilisateur");
                return;
            }
        } else if (sourceType.value !== 'excel' && !useIA.value) {
            console.log("[ETAPE] Type de source nécessitant l'IA");
            toast({
                title: "Option IA requise",
                description: `Le traitement de ${sourceType.value.toUpperCase()} nécessite l'activation de l'IA.`,
                variant: "warning"
            });
            useIA.value = true;
            return;
        }

        // Pour les fichiers déjà traités ou si on n'utilise pas l'IA
        if (!processingData.value && !dataProcessedByIA.value) {
            console.log("[ETAPE] Passage à l'étape suivante", { de: currentStep.value, vers: currentStep.value + 1 });
            currentStep.value++;
        } else {
            console.log("[ETAPE] Traitement en cours ou données traitées par IA, attente de l'action utilisateur");
        }
    } else if (currentStep.value < 3) {
        console.log("[ETAPE] Passage à l'étape suivante", { de: currentStep.value, vers: currentStep.value + 1 });
        currentStep.value++;
    } else {
        console.log("[ETAPE] Dernière étape atteinte, impossible d'avancer");
    }
};

const handleValidationComplete = (validatedData: ValidationData) => {
    mappedData.value = validatedData.data
    selectedSupplier.value = validatedData.supplier
    importType.value = validatedData.importType
}

const handleImport = async () => {
    console.log("[IMPORT] Début de l'import", {
        hasData: !!mappedData.value.length,
        vehicleCount: mappedData.value.length
    });
    
    if (!mappedData.value.length) {
        console.error("[IMPORT] Aucune donnée à importer");
        toast({
            title: 'Erreur d\'import',
            description: 'Aucun véhicule à importer. Veuillez d\'abord charger des données.',
            variant: 'destructive'
        });
        return;
    }

    try {
        // Vérifier que les champs obligatoires sont présents pour chaque véhicule
        const requiredFields = ['brand', 'model', 'year', 'mileage', 'fuel_type', 'transmission', 'color', 'vehicle_price_ht'];
        const missingFieldsMap = mappedData.value.map((vehicle, index) => {
            const missing = requiredFields.filter(field => !vehicle[field]);
            return missing.length ? { index, vehicle, missing } : null;
        }).filter(Boolean);
        
        if (missingFieldsMap.length > 0) {
            console.error("[IMPORT] Certains véhicules ont des champs obligatoires manquants:", missingFieldsMap);
            
            // Afficher une erreur pour l'utilisateur
            toast({
                title: 'Validation échouée',
                description: `${missingFieldsMap.length} véhicule(s) ont des champs obligatoires manquants. Consultez la console pour plus de détails.`,
                variant: 'destructive'
            });
            return;
        }
        
        // Préparer les données des véhicules
        const vehiclesData = mappedData.value.map(vehicleData => {
            // S'assurer que toutes les propriétés numériques sont bien des nombres
            const ensureNumber = (value: any) => !isNaN(Number(value)) ? Number(value) : 0;
            
            return {
                ...vehicleData,
                qty: ensureNumber(vehicleData.qty) || 1,
                year: ensureNumber(vehicleData.year),
                mileage: ensureNumber(vehicleData.mileage),
                details: {
                    price_details: {
                        purchase_price_ht: ensureNumber(vehicleData.vehicle_price_ht) || 0,
                        selling_price_ht: ensureNumber(vehicleData.vehicle_selling_price_ht) || 0,
                        vat_rate: ensureNumber(vehicleData.vehicle_vat_rate) || 20,
                        repair_cost: ensureNumber(vehicleData.vehicle_repair_cost) || 0,
                        frevo: ensureNumber(vehicleData.vehicle_frevo) || 0
                    },
                    status_details: vehicleData.details?.status_details || {
                        status: vehicleData.status,
                        location: vehicleData.vehicle_location || '',
                        is_online: false,
                        exposed_id: null
                    },
                    features: {
                        serie: vehicleData.serie_equipments ?
                            (vehicleData.serie_equipments as string).split('|').map((s: string) => s.trim()) : [],
                        options: vehicleData.option_equipments ?
                            (vehicleData.option_equipments as string).split('|').map((s: string) => s.trim()) : []
                    },
                    ownership: vehicleData.details?.ownership || (selectedSupplier.value ? [{
                        company_id: parseInt(selectedSupplier.value.id),
                        ownership_type: 'supplier',
                        start_date: new Date().toISOString(),
                        is_primary: true,
                        notes: '',
                        created_by: 'system',
                        updated_by: 'system'
                    }] : [])
                }
            }
        });

        console.log("[IMPORT] Données préparées pour l'enregistrement:", vehiclesData.length, "véhicules");

        // Sauvegarder les véhicules
        const { data: savedVehicles, error: vehicleError } = await supabase.rpc('save_vehicles', {
            vehicles_data: vehiclesData
        } as any);

        if (vehicleError) {
            console.error("[IMPORT] Erreur lors de l'enregistrement des véhicules:", vehicleError);
            throw vehicleError;
        }

        console.log("[IMPORT] Véhicules enregistrés avec succès:", savedVehicles?.length || 0);

        // Si l'option "vehicles_and_stock" est sélectionnée, créer les entrées en stock
        if (importType.value === 'vehicles_and_stock' && savedVehicles) {
            const stockEntries = savedVehicles.flatMap((vehicle: any) => {
                const entries = [];
                const qty = vehicle.qty || 1;

                // Déterminer le statut initial en stock
                // Si le véhicule a un VIN, on considère qu'il est disponible
                // Sinon, c'est une commande usine
                const initialStatus = vehicle.vin && vehicle.vin !== 'en attente'
                    ? VehicleStockStatus.AVAILABLE
                    : VehicleStockStatus.FACTORY_ORDER;

                // Créer une entrée en stock pour chaque unité
                for (let i = 0; i < qty; i++) {
                    entries.push({
                        vehicle_id: vehicle.id,
                        status: initialStatus,
                        vin: (vehicle.vin && vehicle.vin !== 'en attente') ? vehicle.vin : null,
                        location: vehicle.details.status_details.location || '',
                        notes: ''
                    });
                }
                return entries;
            });

            console.log("[IMPORT] Création des entrées de stock:", stockEntries.length);
            await Promise.all(stockEntries.map((entry: any) => stockStore.createStockItem(entry)));
        }

        const totalVehicles = vehiclesData.reduce((total, vehicle) => total + (vehicle.qty || 1), 0);

        toast({
            title: 'Import réussi',
            description: `${vehiclesData.length} modèle(s) (${totalVehicles} véhicule(s)) ont été importés avec succès${importType.value === 'vehicles_and_stock' ? ' et ajoutés au stock' : ''}`
        });

        emit('import-complete', savedVehicles);
        emit('update:modelValue', false);
    } catch (error: any) {
        console.error("[IMPORT] Erreur lors de l'import:", error);
        toast({
            title: 'Erreur d\'import',
            description: error.message || 'Une erreur est survenue lors de l\'import',
            variant: 'destructive'
        });
    }
}

// Watch pour mettre à jour les données mappées quand le mapping change
watch([columnMapping, rawData], ([newMapping, newRawData]) => {
    if (Object.keys(newMapping).length === 0 || newRawData.length === 0) {
        mappedData.value = []
        return
    }

    mappedData.value = newRawData.map(row => {
        const mappedRow: any = {}
        Object.entries(newMapping).forEach(([excelColumn, fieldName]) => {
            mappedRow[fieldName] = row[excelColumn]
        })
        return mappedRow
    })
})

// Watch pour la source type
watch(sourceType, (newSourceType) => {
    // Réinitialiser certaines valeurs quand on change de source
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''

    // Réinitialiser le texte seulement si on change de text à autre chose
    if (newSourceType !== 'text') {
        inputText.value = ''
    }
})

// Reset when dialog closes
watch(() => props.modelValue, (newValue) => {
    if (!newValue) {
        currentStep.value = 1
        sourceType.value = 'excel'
        useIA.value = false
        selectedFile.value = null
        inputText.value = ''
        fileColumns.value = []
        dataExamples.value = {}
        columnMapping.value = {}
        mappedData.value = []
        workbook.value = null
        rawData.value = []
        selectedSupplier.value = null
        importType.value = 'vehicles_only'
        processingData.value = false
    }
})

// Ajouter la variable de progression en haut du script, près de processingData et processingMessage
const processingProgress = ref(0);
</script>

<style scoped>
:deep(.dialog-content) {
    transition: max-width 0.3s ease-in-out;
    background-color: hsl(var(--background));
    border: 1px solid hsl(var(--border));
}

:deep(.dialog-overlay) {
    background-color: rgba(0, 0, 0, 0.4);
}

:deep(.dialog-header) {
    background-color: hsl(var(--background));
    border-bottom: 1px solid hsl(var(--border));
}

:deep(.dialog-footer) {
    background-color: hsl(var(--background));
    border-top: 1px solid hsl(var(--border));
}
</style>