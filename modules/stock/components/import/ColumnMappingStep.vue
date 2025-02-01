<template>
    <div class="space-y-4">
        <div class="text-sm text-muted-foreground mb-4">
            Associez les colonnes de votre fichier aux champs correspondants.
            <span class="text-destructive">*</span> champs obligatoires
        </div>

        <div class="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead class="w-[200px]">Colonne du fichier</TableHead>
                        <TableHead class="w-[200px]">Champ correspondant</TableHead>
                        <TableHead>Exemples de données</TableHead>
                        <TableHead class="w-[100px]">Validation</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-for="column in columns" :key="column">
                        <TableCell class="font-medium">{{ column }}</TableCell>
                        <TableCell>
                            <Select
                                v-model="localMapping[column]"
                                @update:modelValue="updateMapping"
                            >
                                <SelectTrigger>
                                    <SelectValue :placeholder="'Sélectionner un champ'" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Champs disponibles</SelectLabel>
                                        <SelectItem
                                            v-for="field in getAvailableFieldsForColumn(column)"
                                            :key="field.value"
                                            :value="field.value"
                                            class="flex items-center"
                                        >
                                            {{ field.label }}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell class="text-xs text-muted-foreground">
                            {{ formatExamples(dataExamples[column]) }}
                        </TableCell>
                        <TableCell>
                            <div v-if="localMapping[column]" class="flex items-center space-x-2">
                                <div
                                    class="w-2 h-2 rounded-full"
                                    :class="{
                                        'bg-green-500': getFieldValidationState(column) === 'success',
                                        'bg-destructive': getFieldValidationState(column) === 'error'
                                    }"
                                ></div>
                                <Tooltip v-if="getFieldValidationState(column) === 'error'">
                                    <TooltipTrigger>
                                        <AlertCircle class="h-4 w-4 text-destructive" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{{ getFieldValidationMessage(column) }}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>

        <!-- Résumé des erreurs -->
        <div v-if="hasValidationErrors" class="rounded-md bg-destructive/10 p-4">
            <div class="flex items-start">
                <AlertCircle class="h-5 w-5 text-destructive mt-0.5" />
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-destructive">Erreurs de validation</h3>
                    <div class="mt-2 text-sm text-destructive">
                        <ul class="list-disc space-y-1 pl-5">
                            <li v-for="(message, index) in validationErrors" :key="index">
                                {{ message }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface Props {
    columns: string[]
    dataExamples: Record<string, any[]>
    columnMapping: Record<string, string>
}

const props = defineProps<Props>()

const emit = defineEmits<{
    (e: 'update:columnMapping', value: Record<string, string>): void
}>()

const localMapping = ref<Record<string, string>>({ ...props.columnMapping })

// Fonction pour normaliser une chaîne
const normalizeString = (str: string) => {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
}

// Fonction pour trouver automatiquement les correspondances
const autoDetectMappings = () => {
    const newMapping: Record<string, string> = {}
    
    props.columns.forEach(column => {
        const normalizedColumn = normalizeString(column)
        
        // Chercher une correspondance dans les aliases
        const matchingField = availableFields.find(field => {
            const normalizedAliases = field.aliases?.map(normalizeString) || []
            const normalizedLabel = normalizeString(field.label)
            return normalizedAliases.includes(normalizedColumn) || normalizedLabel === normalizedColumn
        })
        
        if (matchingField) {
            newMapping[column] = matchingField.value
        } else {
            newMapping[column] = '_null' // Utiliser '_null' au lieu d'une chaîne vide
        }
    })
    
    localMapping.value = newMapping
    updateMapping()
}

// Appliquer l'auto-détection au montage du composant
onMounted(() => {
    autoDetectMappings()
})

const availableFields = [
    { value: 'vin', label: 'Numéro VIN', pattern: /^[A-HJ-NPR-Z0-9]{17}$/i, aliases: ['vin', 'numero_vin'] },
    { value: 'registration_number', label: 'Immatriculation', aliases: ['immat', 'immatriculation', 'plaque'] },
    { value: 'registration_date', label: 'Date d\'immatriculation', aliases: ['date_immatriculation', 'date_immat', 'mec'] },
    { value: 'brand', label: 'Marque', required: true, aliases: ['marque', 'brand', 'manufacturer'] },
    { value: 'model', label: 'Modèle', required: true, aliases: ['modele', 'model'] },
    { value: 'version', label: 'Version', aliases: ['version'] },
    { value: 'year', label: 'Année', pattern: /^\d{4}$/, required: true, aliases: ['annee', 'year'] },
    { value: 'mileage', label: 'Kilométrage', pattern: /^\d+$/, required: true, aliases: ['km', 'kilometrage', 'mileage', 'kms'] },
    { value: 'fuel_type', label: 'Carburant', options: ['diesel', 'essence', 'hybrid', 'electric'], required: true, aliases: ['carburant', 'fuel_type', 'energy', 'energie'] },
    { value: 'transmission', label: 'Boîte de vitesse', options: ['manual', 'automatic', 'bvm5', 'bvm6', 'bva5', 'bva6', 'bvm', 'bva', 'bvm5', 'bvm6', 'bva7', 'bva9'], required: true, aliases: ['boite', 'transmission', 'gear'] },
    { value: 'color', label: 'Couleur', required: true, aliases: ['couleur', 'color', 'colour'] },
    { value: 'co2_emissions', label: 'Émissions CO2', pattern: /^\d+$/, aliases: ['co2', 'emissions'] },
    { value: 'power_hp', label: 'Puissance (ch)', pattern: /^\d+$/, aliases: ['puissance', 'power'] },
    { value: 'power_fiscal', label: 'Puissance fiscale', pattern: /^\d+$/, aliases: ['puissance_fiscale', 'power_fiscal'] },
    { value: 'doors', label: 'Nombre de portes', pattern: /^\d+$/, aliases: ['nombre_de_portes', 'doors'] },
    { value: 'seats', label: 'Nombre de places', pattern: /^\d+$/, aliases: ['nombre_de_places', 'seats'] },
    { value: 'vehicle_price_ht', label: 'Prix d\'achat HT', pattern: /^\d+$/, required: true, aliases: ['prix_achat_ht', 'prixht', 'priceht'] },
    { value: 'vehicle_selling_price_ht', label: 'Prix de vente HT', pattern: /^\d+$/, aliases: ['prix_vente_ht', 'prixht', 'priceht'] },
    { value: 'vehicle_repair_cost', label: 'Frais de réparation', pattern: /^\d+$/, aliases: ['frais_de_reparation', 'repair_cost'] },
    { value: 'vehicle_frevo', label: 'FREVO', pattern: /^\d+$/, aliases: ['damages', 'frevo'] },
    { value: 'vehicle_vat_rate', label: 'Taux de TVA', pattern: /^\d+$/, aliases: ['taux_de_tva', 'vat_rate'] },
    { value: 'vehicle_location', label: 'Localisation', aliases: ['location', 'lieu', 'place'] },
    { value: 'serie_equipments', label: 'Équipements de série', aliases: ['equipements_serie', 'serie', 'standard_equipment'] },
    { value: 'option_equipments', label: 'Options', aliases: ['options', 'optional_equipment'] }
]

const formatExamples = (examples: any[] = []) => {
    return examples
        .filter(ex => ex !== undefined && ex !== null)
        .map(ex => String(ex))
        .join(', ')
}

const getFieldValidationState = (column: string) => {
    const mapping = localMapping.value[column]
    if (!mapping) return null

    const field = availableFields.find(f => f.value === mapping)
    if (!field) return null

    const examples = props.dataExamples[column] || []
    const hasInvalidValues = examples.some(value => {
        if (field.pattern && value) {
            return !field.pattern.test(String(value))
        }
        if (field.options && value) {
            return !field.options.includes(String(value).toLowerCase())
        }
        return false
    })

    return hasInvalidValues ? 'error' : 'success'
}

const getFieldValidationMessage = (column: string) => {
    const mapping = localMapping.value[column]
    if (!mapping) return ''

    const field = availableFields.find(f => f.value === mapping)
    if (!field) return ''

    const examples = props.dataExamples[column] || []
    const invalidValues = examples.filter(value => {
        if (field.pattern && value) {
            return !field.pattern.test(String(value))
        }
        if (field.options && value) {
            return !field.options.includes(String(value).toLowerCase())
        }
        return false
    })

    if (invalidValues.length > 0) {
        return `Valeurs invalides: ${invalidValues.join(', ')}`
    }

    return ''
}

const updateMapping = () => {
    // Convertir '_null' en chaîne vide pour le mapping final
    const cleanedMapping = Object.fromEntries(
        Object.entries(localMapping.value).map(([key, value]) => [
            key,
            value === '_null' ? '' : value
        ])
    )
    emit('update:columnMapping', cleanedMapping)
}

// Synchroniser avec les props
watch(() => props.columnMapping, (newMapping) => {
    localMapping.value = { ...newMapping }
}, { deep: true })

const hasValidationErrors = computed(() => {
    return validationErrors.value.length > 0
})

const validationErrors = computed(() => {
    const errors: string[] = []

    // Vérifier les champs requis manquants
    const requiredFields = availableFields.filter(f => f.required)
    const mappedRequiredFields = requiredFields.filter(f => 
        Object.values(localMapping.value).includes(f.value)
    )

    if (mappedRequiredFields.length < requiredFields.length) {
        const missingFields = requiredFields
            .filter(f => !Object.values(localMapping.value).includes(f.value))
            .map(f => f.label)
        errors.push(`Champs obligatoires manquants : ${missingFields.join(', ')}`)
    }

    // Vérifier les erreurs de validation des données
    Object.keys(localMapping.value).forEach(column => {
        const validationMessage = getFieldValidationMessage(column)
        if (validationMessage) {
            errors.push(`${column}: ${validationMessage}`)
        }
    })

    return errors
})

// Computed pour filtrer les champs disponibles
const getAvailableFieldsForColumn = (column: string) => {
    // Récupérer tous les champs déjà mappés sauf celui de la colonne actuelle
    const usedFields = Object.entries(localMapping.value)
        .filter(([col, _]) => col !== column)
        .map(([_, value]) => value)
        .filter(value => value !== null)

    // Filtrer les champs disponibles
    const availableOptions = [
        // Option pour ne pas mapper (avec une valeur unique)
        { value: '_null', label: 'Ne pas mapper' },
        // Autres champs disponibles
        ...availableFields
            .filter(field => !usedFields.includes(field.value) || field.value === localMapping.value[column])
            .map(field => ({
                value: field.value,
                label: `${field.label}${field.required ? ' *' : ''}`
            }))
    ]

    return availableOptions
}
</script> 