# components/vehicle/cards/VehicleIdentityCard.vue
<template>
    <Card>
        <CardHeader>
            <CardTitle>Identité du véhicule</CardTitle>
        </CardHeader>
        <CardContent>
            <div class="space-y-4">
                <!-- VIN -->
                <div class="space-y-2">
                    <Label>Numéro VIN</Label>
                    <Input :value="modelValue.vin" disabled placeholder="VIN" class="bg-muted" />
                </div>

                <!-- Immatriculation -->
                <div class="space-y-2">
                    <Label>Immatriculation</Label>
                    <Input :value="modelValue.registration_number" disabled placeholder="Immatriculation"
                        class="bg-muted" />
                </div>

                <!-- Date de mise en circulation -->
                <div class="space-y-2">
                    <Label>Date de mise en circulation</Label>
                    <Popover>
                        <PopoverTrigger disabled>
                            <Button variant="outline" class="w-full justify-start text-left font-normal bg-muted">
                                <CalendarIcon class="mr-2 h-4 w-4" />
                                {{ formatDisplayDate(modelValue.registration_date) }}
                            </Button>
                        </PopoverTrigger>
                    </Popover>
                </div>

                <!-- Source -->
                <div class="space-y-2">
                    <Label>Source</Label>
                    <Input :value="modelValue.source" disabled placeholder="Source" class="bg-muted" />
                </div>

                <!-- Vehicle ID -->
                <div class="space-y-2">
                    <Label>ID Véhicule</Label>
                    <Input :value="modelValue.vehicle_id" disabled placeholder="ID" class="bg-muted" />
                </div>
            </div>
        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CalendarIcon } from 'lucide-vue-next'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { DateFormatter } from '@internationalized/date'

interface VehicleIdentity {
    vin: string
    registration_number: string
    registration_date: string
    source: string
    vehicle_id: string
}

// Props
const props = defineProps<{
    modelValue: VehicleIdentity
}>()

// Date formatter
const df = new DateFormatter('fr-FR', { dateStyle: 'long' })

// Méthodes
function formatDisplayDate(date: string | null): string {
    if (!date) return "Non renseigné"
    try {
        return df.format(new Date(date))
    } catch {
        return "Date invalide"
    }
}
</script>