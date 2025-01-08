# components/vehicle/sections/TechnicalSection.vue
<template>
    <div class="space-y-6">
        <!-- Identification -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
                <Label>Marque</Label>
                <Input v-model="modelValue.brand" @update:modelValue="updateField('brand', $event)" />
            </div>
            <div class="space-y-2">
                <Label>Modèle</Label>
                <Input v-model="modelValue.model" @update:modelValue="updateField('model', $event)" />
            </div>
            <div class="space-y-2 md:col-span-2">
                <Label>Version</Label>
                <Input v-model="modelValue.version" @update:modelValue="updateField('version', $event)" />
            </div>
        </div>

        <!-- Caractéristiques Physiques -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-2">
                <Label>Type</Label>
                <Input v-model="modelValue.type" @update:modelValue="updateField('type', $event)" />
            </div>
            <div class="space-y-2">
                <Label>Type de carrosserie</Label>
                <Input v-model="modelValue.body_type" @update:modelValue="updateField('body_type', $event)" />
            </div>
            <div class="space-y-2">
                <Label>Année</Label>
                <Input v-model="modelValue.year" @update:modelValue="updateField('year', $event)" />
            </div>
            <div class="space-y-2">
                <Label>Nombre de portes</Label>
                <Input v-model="modelValue.doors" type="number" @update:modelValue="updateField('doors', $event)" />
            </div>
            <div class="space-y-2">
                <Label>Places</Label>
                <Input v-model="modelValue.seats" type="number" @update:modelValue="updateField('seats', $event)" />
            </div>
            <div class="space-y-2">
                <Label>Poids (kg)</Label>
                <Input v-model="modelValue.weight" type="number" @update:modelValue="updateField('weight', $event)" />
            </div>
        </div>

        <!-- Caractéristiques Moteur -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-2">
                <Label>Type de carburant</Label>
                <Input v-model="modelValue.fuel_type" @update:modelValue="updateField('fuel_type', $event)" />
            </div>
            <div class="space-y-2">
                <Label>Transmission</Label>
                <Input v-model="modelValue.transmission" @update:modelValue="updateField('transmission', $event)" />
            </div>
            <div class="space-y-2">
                <Label>Puissance fiscale</Label>
                <Input v-model="modelValue.power_fiscal" type="number"
                    @update:modelValue="updateField('power_fiscal', $event)" />
            </div>
            <div class="space-y-2">
                <Label>Puissance DIN (ch)</Label>
                <Input v-model="modelValue.power_hp" type="number"
                    @update:modelValue="updateField('power_hp', $event)" />
            </div>
            <div class="space-y-2">
                <Label>Émissions CO2 (g/km)</Label>
                <Input v-model="modelValue.co2_emissions" type="number"
                    @update:modelValue="updateField('co2_emissions', $event)" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Types
interface TechnicalData {
    brand: string
    model: string
    version: string
    type: string
    body_type: string
    transmission: string
    fuel_type: string
    power_fiscal: number
    power_hp: number
    co2_emissions: number
    doors: number
    seats: number
    weight: number
    year: string
    registration_date: string
    registration_number: string
    mileage: number
    vin: string
}

// Props
const props = defineProps<{
    modelValue: TechnicalData
}>()

// Émissions
const emit = defineEmits<{
    (e: 'update:modelValue', value: TechnicalData): void
}>()

// Méthodes
const updateField = (field: keyof TechnicalData, value: any) => {
    emit('update:modelValue', {
        ...props.modelValue,
        [field]: value
    })
}
</script>