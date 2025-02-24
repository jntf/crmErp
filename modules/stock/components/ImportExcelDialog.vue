<template>
    <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
        <DialogContent :class="{
            'sm:max-w-[800px] max-h-[90vh] overflow-y-auto': currentStep !== 3,
            'max-w-[98vw] max-h-[90vh] overflow-y-auto mx-2': currentStep === 3
        }">
            <DialogHeader>
                <DialogTitle>Import de véhicules</DialogTitle>
                <DialogDescription>
                    Importez vos véhicules depuis un fichier Excel
                </DialogDescription>
            </DialogHeader>

            <div class="flex flex-col space-y-4" :class="{ 'w-full': currentStep === 3 }">
                <!-- Étape 1: Upload du fichier -->
                <div v-if="currentStep === 1" class="flex flex-col items-center justify-center py-12">
                    <div
                        class="flex flex-col items-center justify-center w-full h-48 px-4 transition bg-background border-2 border-dashed rounded-xl appearance-none cursor-pointer hover:border-primary/50 focus:outline-none"
                        @dragover.prevent
                        @drop.prevent="handleDrop"
                        @click="triggerFileInput"
                    >
                        <span class="flex items-center space-x-2">
                            <Upload class="w-6 h-6 text-muted-foreground" />
                            <span class="font-medium text-muted-foreground">
                                Déposez votre fichier ici ou cliquez pour parcourir
                            </span>
                        </span>
                        <span class="text-xs text-muted-foreground mt-2">
                            Formats acceptés: XLS, XLSX
                        </span>
                        <input
                            ref="fileInput"
                            type="file"
                            class="hidden"
                            accept=".xls,.xlsx"
                            @change="handleFileSelect"
                        />
                    </div>
                    <p v-if="selectedFile" class="mt-4 text-sm text-muted-foreground">
                        Fichier sélectionné: {{ selectedFile.name }}
                    </p>
                </div>

                <!-- Étape 2: Mapping des colonnes -->
                <ColumnMappingStep
                    v-if="currentStep === 2"
                    :columns="fileColumns"
                    :data-examples="dataExamples"
                    v-model:column-mapping="columnMapping"
                />

                <!-- Étape 3: Validation des données -->
                <DataValidationStep
                    v-if="currentStep === 3"
                    :mapped-data="mappedData"
                    @validation-complete="handleValidationComplete"
                />
            </div>

            <DialogFooter>
                <div class="flex justify-between w-full">
                    <Button
                        v-if="currentStep > 1"
                        variant="outline"
                        @click="currentStep--"
                    >
                        Retour
                    </Button>
                    <div class="flex space-x-2">
                        <Button
                            variant="outline"
                            @click="$emit('update:modelValue', false)"
                        >
                            Annuler
                        </Button>
                        <Button
                            v-if="currentStep < 3"
                            :disabled="!canProceed"
                            @click="nextStep"
                        >
                            Continuer
                        </Button>
                        <Button
                            v-else
                            :disabled="!canProceed"
                            @click="handleImport"
                        >
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
import { Upload } from 'lucide-vue-next'
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
import { useToast } from '@/components/ui/toast/use-toast'
import { ColumnMappingStep, DataValidationStep } from './import'
import { VehicleStatusEnum } from '../types'
import { useVehicleStore } from '../stores/useVehicleStore'
import { useSupabaseClient } from '#imports'

const props = defineProps<{
    modelValue: boolean
}>()

interface ValidationData {
    data: any[]
    supplier: any
    importType: string
}

interface OwnershipData {
    vehicle_id: string
    company_id: number
    ownership_type: string
    start_date: string
    is_primary: boolean
    notes: string
    created_by: string
    updated_by: string
}

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'import-complete', data: any[]): void
}>()

const { toast } = useToast()

const currentStep = ref(1)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const fileColumns = ref<string[]>([])
const dataExamples = ref<Record<string, any[]>>({})
const columnMapping = ref<Record<string, string>>({})
const mappedData = ref<any[]>([])
const workbook = ref<ExcelJS.Workbook | null>(null)
const rawData = ref<any[]>([])
const selectedSupplier = ref<any | null>(null)
const importType = ref<string>('vehicles_only')

const supabase = useSupabaseClient()

const canProceed = computed(() => {
    switch (currentStep.value) {
        case 1:
            return selectedFile.value !== null
        case 2:
            return Object.keys(columnMapping.value).length > 0
        case 3:
            return true
        default:
            return false
    }
})

const triggerFileInput = () => {
    fileInput.value?.click()
}

const handleDrop = (e: DragEvent) => {
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

const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xls|xlsx)$/)) {
        toast({
            title: "Format non supporté",
            description: "Veuillez sélectionner un fichier Excel (.xls ou .xlsx)",
            variant: "destructive"
        })
        return
    }

    try {
        selectedFile.value = file
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

        // Passer à l'étape suivante
        nextStep()

    } catch (error) {
        console.error('Erreur lors de la lecture du fichier Excel:', error)
        toast({
            title: "Erreur de lecture",
            description: "Impossible de lire le fichier Excel. Vérifiez que le fichier n'est pas corrompu.",
            variant: "destructive"
        })
    }
}

const nextStep = () => {
    if (currentStep.value < 3) {
        currentStep.value++
    }
}

const handleValidationComplete = (validatedData: ValidationData) => {
    mappedData.value = validatedData.data
    selectedSupplier.value = validatedData.supplier
    importType.value = validatedData.importType
}

const handleImport = async () => {
    if (!mappedData.value.length) return

    try {
        const vehiclesData = mappedData.value.map(vehicleData => ({
            ...vehicleData,
            qty: parseInt(vehicleData.qty) || 1,
            year: parseInt(vehicleData.year),
            mileage: parseInt(vehicleData.mileage),
            details: {
                price_details: {
                    purchase_price_ht: parseInt(vehicleData.vehicle_price_ht) || 0,
                    selling_price_ht: parseInt(vehicleData.vehicle_selling_price_ht) || 0,
                    vat_rate: parseInt(vehicleData.vehicle_vat_rate) || 20,
                    repair_cost: parseInt(vehicleData.vehicle_repair_cost) || 0,
                    frevo: parseInt(vehicleData.vehicle_frevo) || 0
                },
                status_details: vehicleData.details?.status_details || {
                    status: vehicleData.status,
                    location: vehicleData.vehicle_location || '',
                    is_online: false,
                    exposed_id: null
                },
                features: {
                    serie: vehicleData.serie_equipments ? 
                        (vehicleData.serie_equipments as string).split(',').map((s: string) => s.trim()) : [],
                    options: vehicleData.option_equipments ? 
                        (vehicleData.option_equipments as string).split(',').map((s: string) => s.trim()) : []
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
        }))

        // Sauvegarder les véhicules
        const { data: savedVehicles, error: vehicleError } = await supabase.rpc('save_vehicles', {
            vehicles_data: vehiclesData
        } as any)

        if (vehicleError) throw vehicleError

        // Si l'option "vehicles_and_stock" est sélectionnée, créer les entrées en stock
        if (importType.value === 'vehicles_and_stock' && savedVehicles) {
            const stockEntries = savedVehicles.flatMap(vehicle => {
                const entries = []
                const qty = vehicle.qty || 1
                
                // Créer une entrée en stock pour chaque unité
                for (let i = 0; i < qty; i++) {
                    entries.push({
                        vehicle_id: vehicle.id,
                        status: vehicle.details.status_details.status,
                        location: vehicle.details.status_details.location || '',
                        notes: ''
                    })
                }
                return entries
            })

            await Promise.all(stockEntries.map(entry => stockStore.createStockItem(entry)))
        }

        const totalVehicles = vehiclesData.reduce((total, vehicle) => total + (vehicle.qty || 1), 0)

        toast({
            title: 'Import réussi',
            description: `${vehiclesData.length} modèle(s) (${totalVehicles} véhicule(s)) ont été importés avec succès${
                importType.value === 'vehicles_and_stock' ? ' et ajoutés au stock' : ''
            }`
        })

        emit('import-complete', savedVehicles)
        emit('update:modelValue', false)
    } catch (error: any) {
        toast({
            title: 'Erreur d\'import',
            description: error.message || 'Une erreur est survenue lors de l\'import',
            variant: 'destructive'
        })
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

// Reset when dialog closes
watch(() => props.modelValue, (newValue) => {
    if (!newValue) {
        currentStep.value = 1
        selectedFile.value = null
        fileColumns.value = []
        dataExamples.value = {}
        columnMapping.value = {}
        mappedData.value = []
        workbook.value = null
        rawData.value = []
        selectedSupplier.value = null
        importType.value = 'vehicles_only'
    }
})
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