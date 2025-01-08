# components/vehicle/cards/VehicleFinancialCard.vue
<template>
    <Card>
        <CardHeader>
            <CardTitle>Informations financières</CardTitle>
        </CardHeader>
        <CardContent>
            <div class="space-y-4">
                <!-- Prix de vente -->
                <div class="space-y-2">
                    <Label>Prix de vente</Label>
                    <div class="flex items-center gap-2">
                        <Input v-model="selling_price" type="number" class="text-xl font-bold"
                            @update:modelValue="updatePrice('selling_price', $event)" />
                        <span class="text-xl font-bold">€</span>
                    </div>
                </div>

                <!-- Prix du véhicule neuf -->
                <div class="space-y-2">
                    <Label>Prix du véhicule neuf</Label>
                    <div class="flex items-center gap-2">
                        <Input v-model="new_vehicle_price" type="number"
                            @update:modelValue="updatePrice('new_vehicle_price', $event)" />
                        <span>€</span>
                    </div>
                </div>

                <!-- TVA -->
                <div class="space-y-2">
                    <Label>TVA</Label>
                    <div class="flex items-center gap-2">
                        <Input v-model="vat_rate" type="number" step="0.1"
                            @update:modelValue="updatePrice('vat_rate', $event)" />
                        <span>%</span>
                    </div>
                </div>

                <!-- Frais de remise en état -->
                <div class="space-y-2">
                    <Label>Frais de remise en état</Label>
                    <div class="flex items-center gap-2">
                        <Input v-model="repair_cost" type="number"
                            @update:modelValue="updatePrice('repair_cost', $event)" />
                        <span>€</span>
                    </div>
                </div>

                <!-- Marge calculée -->
                <div class="space-y-2">
                    <Label>Marge calculée</Label>
                    <div class="flex items-center gap-2">
                        <Input :value="calculatedMargin" disabled type="number" class="bg-muted" />
                        <span>€</span>
                    </div>
                </div>

                <!-- Marge en pourcentage -->
                <div class="space-y-2">
                    <Label>Marge en pourcentage</Label>
                    <div class="flex items-center gap-2">
                        <Input :value="marginPercentage" disabled type="number" class="bg-muted" />
                        <span>%</span>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface VehicleFinancials {
    selling_price: number
    new_vehicle_price: number
    vat_rate: number
    repair_cost: number
}

// Props
const props = defineProps<{
    modelValue: VehicleFinancials
}>()

// Emits
const emit = defineEmits<{
    (e: 'update:modelValue', value: VehicleFinancials): void
}>()

// Refs pour les champs
const selling_price = ref(props.modelValue.selling_price || 0)
const new_vehicle_price = ref(props.modelValue.new_vehicle_price || 0)
const vat_rate = ref(props.modelValue.vat_rate || 20)
const repair_cost = ref(props.modelValue.repair_cost || 0)

// Watch pour mettre à jour les refs quand les props changent
watch(() => props.modelValue, (newValue) => {
    selling_price.value = newValue.selling_price || 0
    new_vehicle_price.value = newValue.new_vehicle_price || 0
    vat_rate.value = newValue.vat_rate || 20
    repair_cost.value = newValue.repair_cost || 0
}, { deep: true })

// Calculs
const calculatedMargin = computed(() => {
    return selling_price.value - (new_vehicle_price.value + repair_cost.value)
})

const marginPercentage = computed(() => {
    if (selling_price.value === 0) return 0
    return ((calculatedMargin.value / selling_price.value) * 100).toFixed(2)
})

// Méthodes
function updatePrice(field: keyof VehicleFinancials, value: string) {
    const numValue = value === '' ? 0 : Number(value)
    const updatedValue = {
        selling_price: selling_price.value,
        new_vehicle_price: new_vehicle_price.value,
        vat_rate: vat_rate.value,
        repair_cost: repair_cost.value,
        [field]: numValue
    }
    emit('update:modelValue', updatedValue)
}
</script>