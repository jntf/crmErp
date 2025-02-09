<template>
    <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
        <DialogContent class="max-w-5xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Génération d'offre commerciale</DialogTitle>
                <DialogDescription>
                    Personnalisez votre offre commerciale pour {{ selectedVehicles.length }} véhicule(s)
                </DialogDescription>
            </DialogHeader>

            <div class="flex gap-6 py-6">
                <!-- Sidebar avec les switches -->
                <div class="w-64 space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    <Card>
                        <CardHeader class="py-3">
                            <CardTitle class="text-xs">Options d'affichage</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-3">
                            <FormField v-slot="{ value, handleChange }" name="showVIN">
                                <FormItem class="flex items-center justify-between">
                                    <FormLabel class="text-xs">Numéro VIN</FormLabel>
                                    <FormControl>
                                        <Switch
                                            :checked="value"
                                            @update:checked="handleChange"
                                            class="scale-65 origin-left"
                                        />
                                    </FormControl>
                                </FormItem>
                            </FormField>

                            <FormField v-slot="{ value, handleChange }" name="showFrevo">
                                <FormItem class="flex items-center justify-between">
                                    <FormLabel class="text-xs">Frais VO</FormLabel>
                                    <FormControl>
                                        <Switch
                                            :checked="value"
                                            @update:checked="handleChange"
                                            class="scale-65 origin-left"
                                        />
                                    </FormControl>
                                </FormItem>
                            </FormField>

                            <FormField v-slot="{ value, handleChange }" name="showEquipment">
                                <FormItem class="flex items-center justify-between">
                                    <FormLabel class="text-xs">Équipements</FormLabel>
                                    <FormControl>
                                        <Switch
                                            :checked="value"
                                            @update:checked="handleChange"
                                            class="scale-65 origin-left"
                                        />
                                    </FormControl>
                                </FormItem>
                            </FormField>

                            <FormField v-slot="{ value, handleChange }" name="showColor">
                                <FormItem class="flex items-center justify-between">
                                    <FormLabel class="text-xs">Couleur</FormLabel>
                                    <FormControl>
                                        <Switch
                                            :checked="value"
                                            @update:checked="handleChange"
                                            class="scale-65 origin-left"
                                        />
                                    </FormControl>
                                </FormItem>
                            </FormField>

                            <FormField v-slot="{ value, handleChange }" name="showMEC">
                                <FormItem class="flex items-center justify-between">
                                    <FormLabel class="text-xs">Date MEC</FormLabel>
                                    <FormControl>
                                        <Switch
                                            :checked="value"
                                            @update:checked="handleChange"
                                            class="scale-65 origin-left"
                                        />
                                    </FormControl>
                                </FormItem>
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="py-3">
                            <CardTitle class="text-xs">Options de prix</CardTitle>
                            <CardDescription class="text-xs">Prix de référence : Prix camion</CardDescription>
                        </CardHeader>
                        <CardContent class="space-y-3">
                            <!-- Type de différence -->
                            <FormField v-slot="{ value, handleChange }" name="isDiffPercent">
                                <FormItem class="flex items-center justify-between">
                                    <FormLabel class="text-xs">Différence en pourcentage</FormLabel>
                                    <FormControl>
                                        <Switch
                                            :checked="value"
                                            @update:checked="handleChange"
                                            class="scale-65 origin-left"
                                        />
                                    </FormControl>
                                </FormItem>
                            </FormField>

                            <!-- Prix camion (référence) -->
                            <FormField v-slot="{ value, handleChange }" name="showPriceTruck">
                                <FormItem class="flex flex-col gap-1.5">
                                    <div class="flex items-center justify-between">
                                        <FormLabel class="text-xs">Prix camion (référence)</FormLabel>
                                        <FormControl>
                                            <Switch
                                                :checked="value"
                                                @update:checked="handleChange"
                                                class="scale-65 origin-left"
                                            />
                                        </FormControl>
                                    </div>
                                    <div v-if="value" class="flex items-center gap-2">
                                        <Input 
                                            v-model="priceSettings.truck"
                                            type="number"
                                            class="w-24 h-7 text-xs"
                                            placeholder="Prix HT"
                                        />
                                        <span class="text-xs text-muted-foreground">€ HT</span>
                                    </div>
                                </FormItem>
                            </FormField>

                            <!-- Prix 4 unités -->
                            <FormField v-slot="{ value, handleChange }" name="showPrice4Units">
                                <FormItem class="flex flex-col gap-1.5">
                                    <div class="flex items-center justify-between">
                                        <FormLabel class="text-xs">Prix 4 unités</FormLabel>
                                        <FormControl>
                                            <Switch
                                                :checked="value"
                                                @update:checked="handleChange"
                                                class="scale-65 origin-left"
                                            />
                                        </FormControl>
                                    </div>
                                    <div v-if="value" class="flex items-center gap-2">
                                        <Input 
                                            v-model="priceSettings.fourUnitsDiff"
                                            type="number"
                                            class="w-24 h-7 text-xs"
                                            :placeholder="options.isDiffPercent ? '% en plus' : '€ en plus'"
                                        />
                                        <span class="text-xs text-muted-foreground">{{ options.isDiffPercent ? '%' : '€' }}</span>
                                        <span class="text-xs text-muted-foreground ml-1">
                                            = {{ formatPrice(calculatePrice(priceSettings.truck, 1)) }} € HT
                                        </span>
                                    </div>
                                </FormItem>
                            </FormField>

                            <!-- Prix 2 unités -->
                            <FormField v-slot="{ value, handleChange }" name="showPrice2Units">
                                <FormItem class="flex flex-col gap-1.5">
                                    <div class="flex items-center justify-between">
                                        <FormLabel class="text-xs">Prix 2 unités</FormLabel>
                                        <FormControl>
                                            <Switch
                                                :checked="value"
                                                @update:checked="handleChange"
                                                class="scale-15 origin-left"
                                            />
                                        </FormControl>
                                    </div>
                                    <div v-if="value" class="flex items-center gap-2">
                                        <Input 
                                            v-model="priceSettings.twoUnitsDiff"
                                            type="number"
                                            class="w-24 h-7 text-xs"
                                            :placeholder="options.isDiffPercent ? '% en plus' : '€ en plus'"
                                        />
                                        <span class="text-xs text-muted-foreground">{{ options.isDiffPercent ? '%' : '€' }}</span>
                                        <span class="text-xs text-muted-foreground ml-1">
                                            = {{ formatPrice(calculatePrice(priceSettings.truck, 2)) }} € HT
                                        </span>
                                    </div>
                                </FormItem>
                            </FormField>

                            <!-- Prix unitaire -->
                            <FormField v-slot="{ value, handleChange }" name="showPriceUnit">
                                <FormItem class="flex flex-col gap-1.5">
                                    <div class="flex items-center justify-between">
                                        <FormLabel class="text-xs">Prix unitaire</FormLabel>
                                        <FormControl>
                                            <Switch
                                                :checked="value"
                                                @update:checked="handleChange"
                                                class="scale-65 origin-left"
                                            />
                                        </FormControl>
                                    </div>
                                    <div v-if="value" class="flex items-center gap-2">
                                        <Input 
                                            v-model="priceSettings.unitDiff"
                                            type="number"
                                            class="w-24 h-7 text-xs"
                                            :placeholder="options.isDiffPercent ? '% en plus' : '€ en plus'"
                                        />
                                        <span class="text-xs text-muted-foreground">{{ options.isDiffPercent ? '%' : '€' }}</span>
                                        <span class="text-xs text-muted-foreground ml-1">
                                            = {{ formatPrice(calculatePrice(priceSettings.truck, 3)) }} € HT
                                        </span>
                                    </div>
                                </FormItem>
                            </FormField>
                        </CardContent>
                    </Card>
                </div>

                <!-- Aperçu de l'offre -->
                <Card class="flex-1">
                    <CardHeader class="flex flex-row items-center justify-between">
                        <CardTitle class="text-sm">Aperçu de l'offre</CardTitle>
                        <div class="flex items-center gap-2">
                            <Button variant="outline" size="sm" @click="copyToClipboard">
                                <ClipboardCopy class="w-4 h-4 mr-2" />
                                Copier
                            </Button>
                            <Button variant="outline" size="sm" @click="showEmailDialog">
                                <Mail class="w-4 h-4 mr-2" />
                                Envoyer par email
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent class="p-0">
                        <div id="offerContent" class="p-6 max-h-[600px] overflow-y-auto">
                            <div v-for="(titleGroup, titleKey) in groupedVehicles" :key="titleKey" class="mb-8">
                                <h3 class="text-xl font-bold uppercase mb-4">{{ formatTitleGroupTitle(titleKey) }}</h3>
                                <div v-for="(priceGroup, priceKey) in titleGroup" :key="priceKey" 
                                    class="bg-muted p-4 rounded-lg mb-4">
                                    <!-- <div v-if="priceGroup.length > 1" class="mb-4">
                                        <p class="text-lg font-semibold text-center">Option {{ getOptionNumber(titleGroup, priceKey) }}</p>
                                    </div> -->
                                    
                                    <!-- Informations véhicule -->
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p class="mb-2"><span class="font-semibold">Kilométrage :</span> {{ formatKilometers(priceGroup) }}</p>
                                            <p v-if="options.showColor" class="mb-2">
                                                <span class="font-semibold">{{ priceGroup.length > 1 ? 'Couleurs :' : 'Couleur :' }}</span> 
                                                {{ formatColors(priceGroup) }}
                                            </p>
                                            <p v-if="options.showMEC" class="mb-2">
                                                <span class="font-semibold">Mise en circulation :</span> 
                                                {{ formatMEC(priceGroup) }}
                                            </p>
                                        </div>
                                        <div>
                                            <p v-if="options.showFrevo && priceGroup[0].frevo > 0" class="mb-2">
                                                <span class="font-semibold">Frevo :</span> 
                                                {{ formatFrevo(priceGroup) }} € HT
                                            </p>
                                            <p v-if="options.showVIN && priceGroup[0].vin" class="mb-2">
                                                <span class="font-semibold">VIN (exemple) :</span> 
                                                {{ priceGroup[0].vin }}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Prix -->
                                    <div class="space-y-2">
                                        <p v-if="options.showPriceUnit" class="flex justify-between items-center py-1">
                                            <span class="font-semibold">Prix à l'unité :</span>
                                            <span>
                                                {{ formatPrice(calculatePrice(priceKey, 3)) }} HT
                                                <span class="text-muted-foreground">({{ formatPrice(calculatePrice(priceKey, 3) * 1.2) }} TTC)</span>
                                            </span>
                                        </p>
                                        <p v-if="options.showPrice2Units" class="flex justify-between items-center py-1">
                                            <span class="font-semibold">À partir de 2 unités :</span>
                                            <span>
                                                {{ formatPrice(calculatePrice(priceKey, 2)) }} HT
                                                <span class="text-muted-foreground">({{ formatPrice(calculatePrice(priceKey, 2) * 1.2) }} TTC)</span>
                                            </span>
                                        </p>
                                        <p v-if="options.showPrice4Units" class="flex justify-between items-center py-1">
                                            <span class="font-semibold">À partir de 4 unités :</span>
                                            <span>
                                                {{ formatPrice(calculatePrice(priceKey, 1)) }} HT
                                                <span class="text-muted-foreground">({{ formatPrice(calculatePrice(priceKey, 1) * 1.2) }} TTC)</span>
                                            </span>
                                        </p>
                                        <p v-if="options.showPriceTruck" class="flex justify-between items-center py-1">
                                            <span class="font-semibold">Prix camion :</span>
                                            <span>
                                                {{ formatPrice(calculatePrice(priceKey, 0)) }} HT
                                                <span class="text-muted-foreground">({{ formatPrice(calculatePrice(priceKey, 0) * 1.2) }} TTC)</span>
                                            </span>
                                        </p>
                                    </div>

                                    <!-- Équipements -->
                                    <div v-if="options.showEquipment && hasEquipments(priceGroup)" 
                                        class="mt-4 pt-4 border-t">
                                        <p class="font-semibold mb-2">Équipements :</p>
                                        <div class="space-y-2">
                                            <div v-if="findCommonEquipment(priceGroup).options.length > 0">
                                                <p class="font-medium text-sm text-muted-foreground">Options :
                                                <span class="text-sm">{{ findCommonEquipment(priceGroup).options.join(', ') }}</span></p>
                                            </div>
                                            <div v-if="findCommonEquipment(priceGroup).serie.length > 0">
                                                <p class="font-medium text-sm text-muted-foreground">Série :
                                                <span class="text-sm">{{ findCommonEquipment(priceGroup).serie.join(', ') }}</span></p>
                                            </div>
                                            <div v-if="findCommonEquipment(priceGroup).comfort.length > 0">
                                                <p class="font-medium text-sm text-muted-foreground">Confort :
                                                <span class="text-sm">{{ findCommonEquipment(priceGroup).comfort.join(', ') }}</span></p>
                                            </div>
                                            <div v-if="findCommonEquipment(priceGroup).exterior.length > 0">
                                                <p class="font-medium text-sm text-muted-foreground">Extérieur :
                                                <span class="text-sm">{{ findCommonEquipment(priceGroup).exterior.join(', ') }}</span></p>
                                            </div>
                                            <div v-if="findCommonEquipment(priceGroup).interior.length > 0">
                                                <p class="font-medium text-sm text-muted-foreground">Intérieur :
                                                <span class="text-sm">{{ findCommonEquipment(priceGroup).interior.join(', ') }}</span></p>
                                            </div>
                                            <div v-if="findCommonEquipment(priceGroup).safety.length > 0">
                                                <p class="font-medium text-sm text-muted-foreground">Sécurité :
                                                <span class="text-sm">{{ findCommonEquipment(priceGroup).safety.join(', ') }}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="$emit('update:modelValue', false)">Fermer</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Modal d'envoi d'email -->
    <Dialog :open="showEmailModalValue" @update:open="showEmailModalValue = $event">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Envoyer l'offre par email</DialogTitle>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label for="email">Destinataire</Label>
                    <Input id="email" type="email" v-model="emailData.to" placeholder="email@example.com" />
                </div>
                <div class="grid gap-2">
                    <Label for="subject">Objet</Label>
                    <Input id="subject" type="text" v-model="emailData.subject" :placeholder="generateEmailSubject()" />
                </div>
                <div class="grid gap-2">
                    <Label for="message">Message</Label>
                    <Textarea id="message" v-model="emailData.message" placeholder="Votre message..." />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" @click="showEmailModalValue = false">Annuler</Button>
                <Button type="submit" @click="sendEmail">Envoyer</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ClipboardCopy, Mail } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast/use-toast'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { formatPriceHT, formatPriceTTC, formatKilometerRange, formatMECDate, formatFeatures, formatColorCount } from '@/utils/formatter'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

interface Equipment {
    serie: string[]
    options: string[]
    comfort: string[]
    exterior: string[]
    interior: string[]
    safety: string[]
}

const props = defineProps<{
    modelValue: boolean
    selectedVehicles: any[]
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const { toast } = useToast()

// État pour les prix personnalisés
const priceSettings = ref({
    truck: 0, // Prix de référence
    unitDiff: 3, // +3% ou +500€
    twoUnitsDiff: 2, // +2% ou +300€
    fourUnitsDiff: 1, // +1% ou +100€
})

// Initialisation des prix par défaut
watch(() => props.selectedVehicles, (newVehicles) => {
    if (newVehicles.length > 0) {
        const basePrice = newVehicles[0].details?.price_details?.selling_price_ht || 0
        priceSettings.value = {
            truck: Math.ceil(basePrice / 10) * 10,
            unitDiff: 3,
            twoUnitsDiff: 2,
            fourUnitsDiff: 1
        }
    }
}, { immediate: true })

// Schéma de validation pour les options
const formSchema = toTypedSchema(z.object({
    showVIN: z.boolean().default(true),
    showFrevo: z.boolean().default(true),
    showEquipment: z.boolean().default(true),
    showColor: z.boolean().default(true),
    showMEC: z.boolean().default(true),
    showPriceUnit: z.boolean().default(true),
    showPrice2Units: z.boolean().default(true),
    showPrice4Units: z.boolean().default(true),
    showPriceTruck: z.boolean().default(true),
    isDiffPercent: z.boolean().default(true)
}))

// Initialisation du formulaire avec vee-validate
const { handleSubmit, values: options } = useForm({
    validationSchema: formSchema,
    initialValues: {
        showVIN: true,
        showFrevo: true,
        showEquipment: true,
        showColor: true,
        showMEC: true,
        showPriceUnit: true,
        showPrice2Units: true,
        showPrice4Units: true,
        showPriceTruck: true
    }
})

const showEmailModalValue = ref(false)
const emailData = ref({
    to: '',
    subject: '',
    message: ''
})

// Logique de groupement des véhicules
const groupedVehicles = computed(() => {
    return props.selectedVehicles.reduce((acc, vehicle) => {
        const titleKey = `${vehicle.brand}|${vehicle.model}|${vehicle.version}`
        const priceKey = vehicle.details.price_details.selling_price_ht

        if (!acc[titleKey]) {
            acc[titleKey] = {}
        }
        if (!acc[titleKey][priceKey]) {
            acc[titleKey][priceKey] = []
        }
        acc[titleKey][priceKey].push({ ...vehicle })
        return acc
    }, {})
})

// Fonctions utilitaires
const formatTitleGroupTitle = (key: string | number) => {
    const [brand, model, version] = String(key).split('|')
    return `${brand} ${model} - ${version}`
}

const getOptionNumber = (titleGroup: any, priceKey: number) => {
    return Object.keys(titleGroup).indexOf(String(priceKey)) + 1
}

const formatKilometers = (group: any[]) => {
    const kms = group.map(v => parseInt(v.mileage))
    const minKm = Math.min(...kms)
    const maxKm = Math.max(...kms)
    return formatKilometerRange(minKm, maxKm)
}

const formatMEC = (group: any[]) => {
    const dates = group.map(v => formatMECDate(v.registration_date))
    const uniqueDates = [...new Set(dates)]
    return uniqueDates.join(', ')
}

const formatFrevo = (group: any[]) => {
    const frevos = group.map(v => v.details.price_details.frevo)
    const minFrevo = Math.min(...frevos)
    const maxFrevo = Math.max(...frevos)
    return minFrevo === maxFrevo ? formatPriceHT(minFrevo) : `${formatPriceHT(minFrevo)} - ${formatPriceHT(maxFrevo)}`
}

const formatColors = (group: any[]) => {
    const colorCounts = group.reduce((acc: any, vehicle: any) => {
        acc[vehicle.color] = (acc[vehicle.color] || 0) + 1
        return acc
    }, {})

    return Object.entries(colorCounts)
        .map(([color, count]) => formatColorCount(color, count as number))
        .join(', ')
}

const calculatePrice = (basePrice: number, tier: number) => {
    const truckPrice = priceSettings.value.truck
    if (!truckPrice) return basePrice

    switch(tier) {
        case 3: // Prix unitaire
            return options.isDiffPercent
                ? Math.ceil(truckPrice * (1 + priceSettings.value.unitDiff / 100) / 10) * 10
                : Math.ceil((truckPrice + priceSettings.value.unitDiff) / 10) * 10
        case 2: // Prix 2 unités
            return options.isDiffPercent
                ? Math.ceil(truckPrice * (1 + priceSettings.value.twoUnitsDiff / 100) / 10) * 10
                : Math.ceil((truckPrice + priceSettings.value.twoUnitsDiff) / 10) * 10
        case 1: // Prix 4 unités
            return options.isDiffPercent
                ? Math.ceil(truckPrice * (1 + priceSettings.value.fourUnitsDiff / 100) / 10) * 10
                : Math.ceil((truckPrice + priceSettings.value.fourUnitsDiff) / 10) * 10
        case 0: // Prix camion
            return truckPrice
        default:
            return basePrice
    }
}

const findCommonEquipment = (group: any[]) => {
    if (!group || group.length === 0) return {
        options: [] as string[],
        serie: [] as string[],
        comfort: [] as string[],
        exterior: [] as string[],
        interior: [] as string[],
        safety: [] as string[]
    }
    
    try {
        // Récupérer les équipements de tous les véhicules
        const allEquipment = group.map(vehicle => {
            const features = vehicle.details?.features || {}
            return {
                serie: features.serie || [],
                options: features.options || [],
                comfort: features.comfort || [],
                exterior: features.exterior || [],
                interior: features.interior || [],
                safety: features.safety || []
            }
        }) as Equipment[]

        if (allEquipment.length === 0) {
            return {
                options: [] as string[],
                serie: [] as string[],
                comfort: [] as string[],
                exterior: [] as string[],
                interior: [] as string[],
                safety: [] as string[]
            }
        }

        // Fonction pour trouver les équipements communs dans une catégorie
        const findCommonInCategory = (category: keyof Equipment) => {
            if (!allEquipment[0][category]) return []
            return allEquipment.reduce((common: string[], current: Equipment) => 
                common.filter((item: string) => current[category].includes(item)),
                [...allEquipment[0][category]]
            )
        }

        return {
            options: findCommonInCategory('options'),
            serie: findCommonInCategory('serie'),
            comfort: findCommonInCategory('comfort'),
            exterior: findCommonInCategory('exterior'),
            interior: findCommonInCategory('interior'),
            safety: findCommonInCategory('safety')
        }
    } catch (error) {
        console.error('Erreur dans findCommonEquipment:', error)
        return {
            options: [] as string[],
            serie: [] as string[],
            comfort: [] as string[],
            exterior: [] as string[],
            interior: [] as string[],
            safety: [] as string[]
        }
    }
}

const hasEquipments = (group: any[]) => {
    const equipment = findCommonEquipment(group)
    return Object.values(equipment).some(array => array && array.length > 0)
}

const generateEmailSubject = () => {
    const brands = new Set(props.selectedVehicles.map(v => v.brand))
    const brandText = brands.size > 1 ? `${[...brands][0]} ...` : [...brands][0]
    
    const kmType = props.selectedVehicles.every(v => parseInt(v.mileage) < 200) ? '0km' : 'VO'
    const year = new Set(props.selectedVehicles.map(v => v.year)).size === 1 
        ? ` - ${props.selectedVehicles[0].year}` 
        : ''
    
    return `OFFRE - ${brandText} - ${kmType}${year}`
}

// Fonction pour générer le contenu compatible email
const generateEmailContent = () => {
    const styles = `
        <style>
            .offer-container { font-family: Arial, sans-serif; color: #333; }
            .vehicle-group { margin-bottom: 30px; }
            .vehicle-title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 13px; color: #1a1a1a; }
            .vehicle-block { padding: 13px; border-radius: 8px; margin-bottom: 13px; }
            .info-grid { display: table; width: 100%; margin-bottom: 13px; }
            .info-col { display: table-cell; width: 50%; vertical-align: top; padding: 5px 13px 5px 0; }
            .info-label { font-weight: bold; color: #1a1a1a; }
            .price-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .price-label { font-weight: bold; }
            .price-value { text-align: right; }
            .price-ttc { color: #666; }
            .equipment-section { border-top: 1px solid #ddd; margin-top: 13px; padding-top: 13px; }
            .equipment-title { font-weight: bold; margin-bottom: 10px; }
            .equipment-category { margin-bottom: 8px; }
            .equipment-label { color: #666; font-weight: 500; }
        </style>
    `

    let content = `<div class="offer-container">`

    // Parcourir les groupes de véhicules
    Object.entries(groupedVehicles.value).forEach(([titleKey, titleGroup]) => {
        content += `
            <div class="vehicle-group">
                <div class="vehicle-title">${formatTitleGroupTitle(titleKey)}</div>
        `

        Object.entries(titleGroup as Record<string, any[]>).forEach(([priceKey, priceGroup]) => {
            const numericPriceKey = Number(priceKey)
            content += `
                <div class="vehicle-block">
                    <div class="info-grid">
                        <div class="info-col">
                            <div><span class="info-label">Kilométrage :</span> ${formatKilometers(priceGroup)}</div>
                            ${options.showColor ? `
                                <div><span class="info-label">${priceGroup.length > 1 ? 'Couleurs :' : 'Couleur :'}</span> ${formatColors(priceGroup)}</div>
                            ` : ''}
                            ${options.showMEC ? `
                                <div><span class="info-label">Mise en circulation :</span> ${formatMEC(priceGroup)}</div>
                            ` : ''}
                        </div>
                        <div class="info-col">
                            ${options.showFrevo && priceGroup[0]?.details?.price_details?.frevo > 0 ? `
                                <div><span class="info-label">Frevo :</span> ${formatFrevo(priceGroup)} € HT</div>
                            ` : ''}
                            ${options.showVIN && priceGroup[0]?.vin ? `
                                <div><span class="info-label">VIN (exemple) :</span> ${priceGroup[0].vin}</div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="price-section">
                        ${options.showPriceUnit ? `
                            <div class="price-row">
                                <span class="price-label">Prix à l'unité :</span>
                                <span class="price-value">
                                    ${formatPrice(calculatePrice(numericPriceKey, 3))} € HT
                                    <span class="price-ttc">(${formatPrice(calculatePrice(numericPriceKey, 3) * 1.2)} € TTC)</span>
                                </span>
                            </div>
                        ` : ''}
                        ${options.showPrice2Units ? `
                            <div class="price-row">
                                <span class="price-label">À partir de 2 unités :</span>
                                <span class="price-value">
                                    ${formatPrice(calculatePrice(numericPriceKey, 2))} € HT
                                    <span class="price-ttc">(${formatPrice(calculatePrice(numericPriceKey, 2) * 1.2)} € TTC)</span>
                                </span>
                            </div>
                        ` : ''}
                        ${options.showPrice4Units ? `
                            <div class="price-row">
                                <span class="price-label">À partir de 4 unités :</span>
                                <span class="price-value">
                                    ${formatPrice(calculatePrice(numericPriceKey, 1))} € HT
                                    <span class="price-ttc">(${formatPrice(calculatePrice(numericPriceKey, 1) * 1.2)} € TTC)</span>
                                </span>
                            </div>
                        ` : ''}
                        ${options.showPriceTruck ? `
                            <div class="price-row">
                                <span class="price-label">Prix camion :</span>
                                <span class="price-value">
                                    ${formatPrice(calculatePrice(numericPriceKey, 0))} € HT
                                    <span class="price-ttc">(${formatPrice(calculatePrice(numericPriceKey, 0) * 1.2)} € TTC)</span>
                                </span>
                            </div>
                        ` : ''}
                    </div>

                    ${options.showEquipment && hasEquipments(priceGroup) ? `
                        <div class="equipment-section">
                            <div class="equipment-title">Équipements :</div>
                            ${Object.entries(findCommonEquipment(priceGroup)).map(([category, items]) => 
                                items.length > 0 ? `
                                    <div class="equipment-category">
                                        <span class="equipment-label">${category.charAt(0).toUpperCase() + category.slice(1)} :</span>
                                        ${items.join(', ')}
                                    </div>
                                ` : ''
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            `
        })

        content += `</div>`
    })

    content += `</div>`
    return styles + content
}

// Actions
const copyToClipboard = async () => {
    const content = generateEmailContent()
    if (!content) return

    try {
        const blob = new Blob([content], { type: 'text/html' })
        const clipboardItem = new ClipboardItem({ 'text/html': blob })
        await navigator.clipboard.write([clipboardItem])
        toast({
            title: 'Succès',
            description: 'Offre copiée dans le presse-papier'
        })
    } catch (err) {
        console.error('Erreur lors de la copie :', err)
        toast({
            title: 'Erreur',
            description: 'Impossible de copier l\'offre',
            variant: 'destructive'
        })
    }
}

const showEmailDialog = () => {
    emailData.value = {
        to: '',
        subject: generateEmailSubject(),
        message: ''
    }
    showEmailModalValue.value = true
}

const sendEmail = async () => {
    // TODO: Implémenter l'envoi d'email
    toast({
        title: 'Succès',
        description: 'Email envoyé avec succès'
    })
    showEmailModalValue.value = false
}
</script> 