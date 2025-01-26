<template>
    <div class="space-y-1.5">
        <Label :for="id" class="text-sm font-medium">{{ label }}</Label>
        <div v-if="isEditing" class="relative">
            <Input
                :id="id"
                :type="type"
                :value="modelValue"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
                :placeholder="modelValue || `Saisir ${label.toLowerCase()}`"
                :class="[
                    'w-full',
                    { 'border-destructive': error }
                ]"
            />
            <span v-if="error" class="text-xs text-destructive mt-1">{{ error }}</span>
        </div>
        <div v-else class="relative group">
            <div class="min-h-[2.5rem] flex items-center px-3 py-2 text-sm rounded-md border border-transparent bg-muted/40">
                <span v-if="modelValue" class="truncate">{{ modelValue }}</span>
                <span v-else class="text-muted-foreground">Non renseigné</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{
    modelValue: string | number | null
    label: string
    isEditing: boolean
    type?: string
    placeholder?: string
    error?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number | null): void
}>()

// Génère un ID unique pour le champ
const id = computed(() => `field-${props.label.toLowerCase().replace(/\s+/g, '-')}`)
</script>

<style scoped>
.group:hover {
    cursor: default;
}

/* Style pour les inputs en mode édition */
input {
    background-color: white !important;
}

/* Style pour le placeholder */
input::placeholder {
    color: #6b7280 !important;
    opacity: 0.8 !important;
}
</style> 