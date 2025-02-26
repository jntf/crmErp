<template>
    <div class="space-y-4 mx-2 w-full h-[calc(100vh-160px)] flex flex-col">
        <div class="text-sm text-muted-foreground">
            Vérifiez et complétez les données avant l'import.
        </div>

        <!-- Contrôles fixes -->
        <div class="bg-card rounded-lg border shadow-sm p-4 space-y-4 w-1/4">
            <div class="flex items-center space-x-2">
                <Select v-model="bulkEditField">
                    <SelectTrigger class="h-8 text-xs w-[150px]">
                        <SelectValue placeholder="Champ à éditer" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="field in bulkEditFields" :key="field.value" :value="field.value" class="text-xs">
                            {{ field.label }}
                        </SelectItem>
                    </SelectContent>
                </Select>

                <div v-if="bulkEditField === 'country_id'" class="w-[200px]">
                    <Select v-model="bulkEditValue">
                        <SelectTrigger class="h-8 text-xs">
                            <SelectValue placeholder="Sélectionner un pays" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem 
                                v-for="country in countries" 
                                :key="country.id" 
                                :value="String(country.id)"
                                class="text-xs"
                            >
                                {{ country.flag_emoji }} {{ country.name }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Input v-else v-model="bulkEditValue" placeholder="Valeur à appliquer"
                    class="w-[300px] h-8 text-xs" />

                <Button variant="outline" size="sm" :disabled="!canApplyBulkEdit" @click="applyBulkEdit"
                    class="text-xs">
                    Appliquer
                </Button>
            </div>

            <div class="flex items-center space-x-2">
                <Button variant="outline" size="sm" class="mx-auto text-xs" @click="showSupplierDialog = true">
                    {{ selectedSupplier ? `Fournisseur: ${selectedSupplier.name}` : 'Sélectionner un fournisseur' }}
                </Button>

                <Select v-model="selectedStatus">
                    <SelectTrigger class="h-8 text-xs w-[200px]">
                        <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="status in statusOptions" :key="status.value" :value="status.value"
                            class="text-xs">
                            {{ status.label }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <!-- Nouveau bloc pour le total et le type d'import -->
            <div class="flex items-center justify-between border-t pt-4 mt-4">
                <div class="flex items-center space-x-2">
                    <div class="text-sm font-medium">Total véhicules : {{ getTotalVehicles() }}</div>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info class="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Nombre total de véhicules en tenant compte des quantités</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div class="flex items-center space-x-4">
                    <Label class="text-sm">Type d'import :</Label>
                    <Select v-model="importType">
                        <SelectTrigger class="w-[200px]">
                            <SelectValue placeholder="Sélectionner le type d'import" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="vehicles_only">
                                Véhicules uniquement
                            </SelectItem>
                            <SelectItem value="vehicles_and_stock">
                                Véhicules et entrées en stock
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info class="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent class="max-w-[300px]">
                            <p>
                                <strong>Véhicules uniquement</strong> : Importe les véhicules dans le catalogue sans créer d'entrées en stock.
                                <br><br>
                                <strong>Véhicules et entrées en stock</strong> : Importe les véhicules et crée automatiquement des entrées en stock pour chaque unité.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>

        <!-- Table avec scroll -->
        <div class="flex-1 min-h-0 overflow-hidden rounded-md border">
            <div class="h-full overflow-auto relative">
                <Table>
                    <TableHeader class="sticky top-0 bg-background z-10">
                        <TableRow>
                            <TableHead class="w-[40px] sticky left-0 bg-background z-20">
                                <input type="checkbox" :checked="isAllSelected" @change="selectAll" class="h-4 w-4" />
                            </TableHead>
                            <TableHead v-for="field in displayFields" :key="field.key"
                                :class="[field.width, 'text-xs py-2 px-2']">
                                {{ field.label }}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow v-for="(row, index) in localData" :key="index">
                            <TableCell class="sticky left-0 bg-background z-20">
                                <input type="checkbox" v-model="row.selected" class="h-4 w-4" @change="handleValidationComplete" />
                            </TableCell>
                            <TableCell v-for="field in displayFields" :key="field.key" class="text-xs py-2 px-2">
                                <template v-if="field.key === 'qty'">
                                    <Input 
                                        type="number" 
                                        v-model="row[field.key]" 
                                        class="h-8 text-xs w-[60px]" 
                                        min="1"
                                        @change="handleValidationComplete"
                                    />
                                </template>
                                <template v-else-if="field.type === 'select' && field.key === 'country_id'">
                                    <Select v-model="row[field.key]" @change="handleValidationComplete">
                                        <SelectTrigger class="h-7 text-xs border-0">
                                            <SelectValue placeholder="Sélectionner un pays" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem 
                                                v-for="country in countries" 
                                                :key="country.id" 
                                                :value="String(country.id)"
                                                class="text-xs"
                                            >
                                                {{ country.flag_emoji }} {{ country.name }}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </template>
                                <template v-else>
                                    <Input 
                                        v-model="row[field.key]" 
                                        :placeholder="field.placeholder"
                                        class="h-7 text-xs border-0 focus:ring-0 focus:ring-offset-0" 
                                        @change="handleValidationComplete"
                                    />
                                </template>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    </div>

    <!-- Ajout du SupplierSelectionDialog -->
    <div v-if="showSupplierDialog" class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
        <SupplierSelectionDialog v-model="showSupplierDialog" :selected-vehicles="[]"
            @supplier-selected="handleSupplierSelected" class="max-w-[90vw]" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import SupplierSelectionDialog from '../SupplierSelectionDialog.vue'
import { VehicleStatusEnum } from '../../types'
import type { Supplier } from '../../types'
import { useToast } from '@/components/ui/toast/use-toast'
import { Label } from '@/components/ui/label'
import { format, parse } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertCircle, Info } from 'lucide-vue-next'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface Country {
    id: number
    name: string
    code: string
    flag_emoji: string
}

interface Props {
    mappedData: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
    (e: 'validation-complete', data: { data: any[], supplier: Supplier | null, importType: 'vehicles_only' | 'vehicles_and_stock' }): void
}>()

// État local
const localData = ref<Array<any>>([])
const bulkEditField = ref('')
const bulkEditValue = ref('')
const isAllSelected = ref(false)
const supabase = useSupabaseClient()
const { toast } = useToast()
// Nouveaux états pour la gestion du fournisseur
const showSupplierDialog = ref(false)
const selectedSupplier = ref<Supplier | null>(null)
const selectedStatus = ref<VehicleStatusEnum>(VehicleStatusEnum.IN_OFFER)
const importType = ref<'vehicles_only' | 'vehicles_and_stock'>('vehicles_only')

// Nouveaux états pour la gestion du pays
const countries = ref<Country[]>([])
const loadingCountries = ref(false)

// Chargement des pays
const fetchCountries = async () => {
    loadingCountries.value = true
    try {
        const { data, error } = await supabase
            .from('countries')
            .select('id, name, iso_code_2 as code, flag_emoji')
            .order('name')
        
        if (error) throw error
        if (data) countries.value = data as unknown as Country[]
    } catch (error) {
        console.error('Erreur lors du chargement des pays:', error)
        toast({
            title: 'Erreur',
            description: 'Impossible de charger la liste des pays',
            variant: 'destructive'
        })
    } finally {
        loadingCountries.value = false
    }
}

// Configuration des champs
const displayFields = [
    // Informations principales
    { key: 'qty', label: 'Qté', width: 'min-w-[60px]', placeholder: 'Quantité', type: 'number' },
    { key: 'brand', label: 'Marque', width: 'min-w-[120px]', placeholder: 'Marque' },
    { key: 'model', label: 'Modèle', width: 'min-w-[120px]', placeholder: 'Modèle' },
    { key: 'version', label: 'Version', width: 'min-w-[150px]', placeholder: 'Version' },
    { key: 'vin', label: 'VIN', width: 'min-w-[130px]', placeholder: 'Numéro VIN' },
    { key: 'registration_number', label: 'Immat.', width: 'min-w-[80px]', placeholder: 'XX-123-XX' },
    { key: 'registration_date', label: 'Date Immat.', width: 'min-w-[100px]', placeholder: 'JJ/MM/AAAA', type: 'date' },

    // Caractéristiques techniques
    { key: 'year', label: 'Année', width: 'min-w-[60px]', placeholder: 'AAAA', type: 'number' },
    { key: 'mileage', label: 'Km', width: 'min-w-[80px]', placeholder: 'Kilométrage', type: 'number' },
    { key: 'fuel_type', label: 'Carb.', width: 'min-w-[80px]', placeholder: 'Carburant' },
    { key: 'transmission', label: 'Boîte', width: 'min-w-[80px]', placeholder: 'Boîte' },
    { key: 'color', label: 'Couleur', width: 'min-w-[80px]', placeholder: 'Couleur' },
    { key: 'co2_emissions', label: 'CO2', width: 'min-w-[60px]', placeholder: 'g/km', type: 'number' },
    { key: 'power_hp', label: 'Ch', width: 'min-w-[60px]', placeholder: 'ch', type: 'number' },
    { key: 'power_fiscal', label: 'CV', width: 'min-w-[50px]', placeholder: 'cv', type: 'number' },
    { key: 'doors', label: 'Portes', width: 'min-w-[60px]', placeholder: 'Nb', type: 'number' },
    { key: 'seats', label: 'Places', width: 'min-w-[60px]', placeholder: 'Nb', type: 'number' },

    // Prix et coûts
    { key: 'vehicle_price_ht', label: 'Prix HT', width: 'min-w-[90px]', placeholder: 'Prix HT', type: 'number' },
    { key: 'vehicle_selling_price_ht', label: 'Prix Vente', width: 'min-w-[90px]', placeholder: 'Prix Vente HT', type: 'number' },
    { key: 'vehicle_repair_cost', label: 'Frais Rép.', width: 'min-w-[80px]', placeholder: 'Frais', type: 'number' },
    { key: 'vehicle_frevo', label: 'FREVO', width: 'min-w-[80px]', placeholder: 'FREVO', type: 'number' },
    { key: 'vehicle_vat_rate', label: 'TVA', width: 'min-w-[60px]', placeholder: '%', type: 'number' },

    // Localisation
    { key: 'vehicle_location', label: 'Lieu', width: 'min-w-[100px]', placeholder: 'Localisation' },
    { 
        key: 'country_id', 
        label: 'Pays', 
        width: 'min-w-[100px]', 
        placeholder: 'Pays', 
        type: 'select', 
        options: computed(() => countries.value.map(country => ({
            ...country,
            name: `${country.flag_emoji} ${country.name}`
        })))
    }
]

const statusOptions = [
    { value: VehicleStatusEnum.IN_STOCK, label: 'En stock' },
    { value: VehicleStatusEnum.IN_OFFER, label: 'En offre' },
    { value: VehicleStatusEnum.IN_TRADING, label: 'En trading' },
    { value: VehicleStatusEnum.IN_DEALING, label: 'En négociation' },
    { value: VehicleStatusEnum.RESERVED, label: 'Réservé' },
    { value: VehicleStatusEnum.SOLD, label: 'Vendu' },
    { value: VehicleStatusEnum.IN_TRANSIT, label: 'En transit' },
    { value: VehicleStatusEnum.DELIVERED, label: 'Livré' },
    { value: VehicleStatusEnum.BILLED, label: 'Facturé' },
    { value: VehicleStatusEnum.ARCHIVED, label: 'Archivé' }
]

// Champs disponibles pour le bulk edit
const bulkEditFields = [
    { value: 'qty', label: 'Quantité' },
    { value: 'brand', label: 'Marque' },
    { value: 'model', label: 'Modèle' },
    { value: 'version', label: 'Version' },
    { value: 'vin', label: 'VIN' },
    { value: 'registration_number', label: 'Immat.' },
    { value: 'registration_date', label: 'Date Immat.' },
    { value: 'year', label: 'Année' },
    { value: 'mileage', label: 'Km' },
    { value: 'fuel_type', label: 'Carb.' },
    { value: 'transmission', label: 'Boîte' },
    { value: 'color', label: 'Couleur' },
    { value: 'co2_emissions', label: 'CO2' },
    { value: 'power_hp', label: 'Ch' },
    { value: 'power_fiscal', label: 'CV' },
    { value: 'doors', label: 'Portes' },
    { value: 'seats', label: 'Places' },
    // Prix et coûts
    { value: 'vehicle_price_ht', label: 'Prix HT' },
    { value: 'vehicle_selling_price_ht', label: 'Prix Vente HT' },
    { value: 'vehicle_repair_cost', label: 'Frais Réparation' },
    { value: 'vehicle_frevo', label: 'FREVO' },
    { value: 'vehicle_vat_rate', label: 'TVA' },
    // Localisation
    { value: 'vehicle_location', label: 'Lieu' },
    { value: 'country_id', label: 'Pays' }
]

// Computed properties
const allSelected = computed(() => {
    return localData.value.length > 0 && localData.value.every(row => row.selected)
})

const canApplyBulkEdit = computed(() => {
    const hasSelection = localData.value.some(row => row.selected)
    const hasField = !!bulkEditField.value
    const hasValue = !!bulkEditValue.value
    return hasSelection && hasField && hasValue
})

// Methods
const initializeData = () => {
    if (localData.value.length === 0) {
        localData.value = props.mappedData.map(row => ({
            ...row,
            selected: false
        }))
    }
}

const selectAll = (event?: Event) => {
    const newValue = event?.target ? (event.target as HTMLInputElement).checked : !isAllSelected.value
    isAllSelected.value = newValue

    localData.value = localData.value.map(row => ({
        ...row,
        selected: newValue
    }))
}

const handleRowSelection = (row: any) => {
    isAllSelected.value = localData.value.every(r => r.selected)
}

const applyBulkEdit = () => {
    if (!bulkEditField.value || !bulkEditValue.value) return

    localData.value = localData.value.map(row => {
        if (row.selected) {
            return {
                ...row,
                [bulkEditField.value]: bulkEditValue.value
            }
        }
        return row
    })

    bulkEditValue.value = ''
    handleValidationComplete()
}

const handleSupplierSelected = (supplier: Supplier) => {
    selectedSupplier.value = supplier
    showSupplierDialog.value = false
    handleValidationComplete()
}

const getTotalVehicles = () => {
    return localData.value.reduce((total, row) => {
        return total + (parseInt(row.qty) || 1)
    }, 0)
}

const handleValidationComplete = () => {
    const validatedData = {
        data: localData.value.map(row => {
            // Fonction pour formater la date
            const formatDate = (dateStr: string) => {
                if (!dateStr) return null
                try {
                    const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date())
                    return format(parsedDate, 'yyyy-MM-dd')
                } catch (error) {
                    console.error('Erreur de parsing de date:', error)
                    return null
                }
            }

            return {
                ...row,
                qty: parseInt(row.qty) || 1,
                registration_date: formatDate(row.registration_date),
                status: selectedStatus.value,
                details: {
                    status_details: {
                        status: selectedStatus.value,
                        location: row.vehicle_location || '',
                        is_online: false,
                        exposed_id: null
                    },
                    price_details: {
                        purchase_price_ht: parseFloat(row.vehicle_price_ht) || 0,
                        selling_price_ht: parseFloat(row.vehicle_selling_price_ht) || 0,
                        vat_rate: parseFloat(row.vehicle_vat_rate) || 20,
                        repair_cost: parseFloat(row.vehicle_repair_cost) || 0,
                        frevo: parseFloat(row.vehicle_frevo) || 0
                    },
                    ownership: selectedSupplier.value ? [{
                        company_id: parseInt(selectedSupplier.value.id),
                        ownership_type: 'supplier',
                        start_date: new Date().toISOString(),
                        is_primary: true,
                        notes: '',
                        created_by: 'system',
                        updated_by: 'system'
                    }] : []
                }
            }
        }),
        supplier: selectedSupplier.value,
        importType: importType.value
    }
    
    emit('validation-complete', validatedData)
}

// Watch for changes in props
watch(() => props.mappedData, (newData) => {
    if (localData.value.length === 0) {
        initializeData()
    }
}, { deep: true })

// Watch pour le changement de status
watch(() => selectedStatus.value, () => {
    handleValidationComplete()
})

// Charger les pays au montage du composant
onMounted(() => {
    initializeData()
    fetchCountries()
})
</script>

<style scoped>
.sticky {
    position: sticky;
    z-index: 1;
    left: 0;
    background-color: hsl(var(--background));
}

/* Pour le header */
.top-0 {
    top: 0;
}

/* Pour la colonne de checkbox */
.left-0 {
    left: 0;
}

:deep(.input) {
    min-width: 100% !important;
    min-width: max-content;
    padding: 4px 8px !important;
}

:deep(.table) {
    background-color: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    white-space: nowrap;
}

:deep(.table-header) {
    background-color: hsl(var(--background));
    border-bottom: 1px solid hsl(var(--border));
    position: sticky;
    top: 0;
    z-index: 10;
}

:deep(.table-row) {
    border-bottom: 1px solid hsl(var(--border));
}

:deep(.table-row:hover) {
    background-color: hsl(var(--muted));
}

:deep(.table-cell) {
    background-color: transparent;
    padding: 0 !important;
}

.bg-card {
    background-color: hsl(var(--background));
}
</style>