<template>
    <Select :model-value="modelValue" @update:model-value="$emit('update:model-value', $event)">
        <SelectTrigger :disabled="loading" class="w-40">
            <SelectValue>
                <div class="flex items-center gap-2">
                    <Circle :class="statusColor" class="w-2 h-2" />
                    {{ statusLabel }}
                </div>
            </SelectValue>
        </SelectTrigger>
        <SelectContent>
            <SelectGroup>
                <SelectLabel>Statut du véhicule</SelectLabel>
                <SelectItem value="available">
                    <div class="flex items-center gap-2">
                        <Circle class="w-2 h-2 text-green-500" />
                        Disponible
                    </div>
                </SelectItem>
                <SelectItem value="reserved">
                    <div class="flex items-center gap-2">
                        <Circle class="w-2 h-2 text-orange-500" />
                        Réservé
                    </div>
                </SelectItem>
                <SelectItem value="sold">
                    <div class="flex items-center gap-2">
                        <Circle class="w-2 h-2 text-red-500" />
                        Vendu
                    </div>
                </SelectItem>
            </SelectGroup>
        </SelectContent>
    </Select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Circle } from 'lucide-vue-next'

const props = defineProps<{
    modelValue: string
    loading?: boolean
}>()

defineEmits<{
    (e: 'update:model-value', value: string): void
    (e: 'update', value: string): void
}>()

const statusLabel = computed(() => {
    const labels: Record<string, string> = {
        available: 'Disponible',
        reserved: 'Réservé',
        sold: 'Vendu'
    }
    return labels[props.modelValue] || 'Inconnu'
})

const statusColor = computed(() => {
    const colors: Record<string, string> = {
        available: 'text-green-500',
        reserved: 'text-orange-500',
        sold: 'text-red-500'
    }
    return colors[props.modelValue] || 'text-gray-500'
})
</script>