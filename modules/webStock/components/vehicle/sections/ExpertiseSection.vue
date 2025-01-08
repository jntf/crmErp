//components/vehicle/ExpertiseSection.vue
<template>
    <div class="space-y-6">
        <!-- Contenu de l'expertise -->
        <div class="grid gap-4">
            <!-- Date d'expertise -->
            <div class="space-y-2">
                <Label>Date d'expertise</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" class="w-full justify-start text-left">
                            <CalendarIcon class="mr-2 h-4 w-4" />
                            {{ formatDate(modelValue?.date) }}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0">
                        <Calendar v-model="modelValue.date" mode="single" class="rounded-md border" />
                    </PopoverContent>
                </Popover>
            </div>

            <!-- Catégories d'expertise directement intégrées -->
            <div v-for="(category, index) in categories" :key="index" class="space-y-4">
                <div class="flex items-center justify-between">
                    <Label>{{ category.label }}</Label>
                    <Badge>{{ getCategoryScore(category.id) }}/10</Badge>
                </div>
                <Slider v-model="modelValue.scores[category.id]" :min="0" :max="10" :step="1" class="w-full" />
                <Textarea v-model="modelValue.comments[category.id]"
                    :placeholder="`Commentaires sur ${category.label.toLowerCase()}`" class="resize-none" />
            </div>

            <!-- Commentaire général -->
            <div class="space-y-2">
                <Label>Commentaire général</Label>
                <Textarea v-model="modelValue.generalComment" placeholder="Commentaire général sur l'expertise"
                    class="resize-none" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CalendarIcon } from 'lucide-vue-next'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface ExpertiseData {
    date: string
    scores: Record<string, number>
    comments: Record<string, string>
    generalComment?: string
}

// Props
const props = defineProps<{
    modelValue: ExpertiseData
}>()

// Emits
const emit = defineEmits<{
    (e: 'update:modelValue', value: ExpertiseData): void
}>()

// Liste statique des catégories
const categories = [
    { id: 'exterior', label: 'Extérieur' },
    { id: 'interior', label: 'Intérieur' },
    { id: 'mechanical', label: 'Mécanique' },
    { id: 'electronics', label: 'Électronique' },
    { id: 'tires', label: 'Pneumatiques' },
    { id: 'bodywork', label: 'Carrosserie' }
]

// Fonctions utilitaires
function formatDate(date: string | undefined) {
    if (!date) return 'Sélectionner une date'
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(date))
}

function getCategoryScore(categoryId: string) {
    return props.modelValue?.scores?.[categoryId] ?? 0
}
</script>