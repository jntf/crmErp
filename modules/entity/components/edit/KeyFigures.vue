<!-- components/edit/KeyFigures.vue -->
<template>
    <Card>
        <CardHeader>
            <CardTitle class="flex items-center gap-2 text-xl font-semibold">
                <BarChart3 class="h-5 w-5" />
                Chiffres Clés
                <div class="ml-auto flex gap-2">
                    <Button v-if="isEditing" variant="outline" size="sm" @click="cancelEdit">
                        Annuler
                    </Button>
                    <Button v-if="isEditing" variant="default" size="sm" @click="saveChanges">
                        Enregistrer
                    </Button>
                    <Button v-else variant="ghost" size="icon" @click="startEditing">
                        <PencilIcon class="h-4 w-4" />
                    </Button>
                </div>
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-2">
                <div class="space-y-1">
                    <p class="text-sm text-gray-500">Chiffre d'Affaires</p>
                    <div v-if="isEditing" class="flex items-center gap-2">
                        <input type="number" v-model="editedFigures.revenue"
                            class="w-full rounded-md border p-2 text-sm" step="1000" />
                        <span class="text-sm text-gray-500">€</span>
                    </div>
                    <p v-else class="font-medium">{{ formatCurrency(modelValue.revenue) }}</p>
                </div>

                <div class="space-y-1">
                    <p class="text-sm text-gray-500">Capital Social</p>
                    <div v-if="isEditing" class="flex items-center gap-2">
                        <input type="number" v-model="editedFigures.social_capital"
                            class="w-full rounded-md border p-2 text-sm" step="1000" />
                        <span class="text-sm text-gray-500">€</span>
                    </div>
                    <p v-else class="font-medium">{{ formatCurrency(modelValue.social_capital) }}</p>
                </div>

                <div class="space-y-1">
                    <p class="text-sm text-gray-500">Employés</p>
                    <div v-if="isEditing">
                        <input type="number" v-model="editedFigures.number_of_employees"
                            class="w-full rounded-md border p-2 text-sm" min="0" />
                    </div>
                    <p v-else class="font-medium">{{ modelValue.number_of_employees || '-' }}</p>
                </div>

                <div class="space-y-1">
                    <p class="text-sm text-gray-500">Flotte</p>
                    <div v-if="isEditing">
                        <input type="number" v-model="editedFigures.fleet_size"
                            class="w-full rounded-md border p-2 text-sm" min="0" />
                    </div>
                    <p v-else class="font-medium">{{ modelValue.fleet_size || '-' }}</p>
                </div>
            </div>
        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, PencilIcon } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/formatter'

interface KeyFigures {
    revenue?: number
    social_capital?: number
    number_of_employees?: number
    fleet_size?: number
}

const props = defineProps<{
    modelValue: KeyFigures
}>()

const emit = defineEmits<{
    'update:modelValue': [value: KeyFigures]
    'save': [value: KeyFigures]
}>()

const isEditing = ref(false)
const editedFigures = ref<KeyFigures>({
    revenue: 0,
    social_capital: 0,
    number_of_employees: 0,
    fleet_size: 0
})

watch(() => props.modelValue, (newValue) => {
    if (newValue && !isEditing.value) {
        editedFigures.value = { ...newValue }
    }
}, { immediate: true })

const startEditing = () => {
    editedFigures.value = { ...props.modelValue }
    isEditing.value = true
}

const cancelEdit = () => {
    editedFigures.value = { ...props.modelValue }
    isEditing.value = false
}

const saveChanges = () => {
    emit('save', editedFigures.value)
    emit('update:modelValue', editedFigures.value)
    isEditing.value = false
}
</script>