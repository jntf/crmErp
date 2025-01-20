<!-- components/edit/LegalInfo.vue -->
<template>
    <Card class="w-full">
        <CardContent class="p-3"> <!-- Réduit le padding -->
            <div class="flex items-center justify-between mb-1">
                <div class="flex-grow">
                    <div class="flex items-center justify-between">
                        <div class="flex-grow">
                            <div class="flex items-center justify-between">
                                <p class="text-xs text-muted-foreground inline-block">SIRET: </p>
                                <p class="text-sm font-medium">{{ isEditing ? '' : (modelValue.tax_number || '-') }}</p>
                                <input v-if="isEditing" v-model="editedLegal.tax_number" type="text"
                                    class="w-full text-sm rounded-md border px-2 py-1 h-7" />
                            </div>
                            <div class="flex items-center justify-between mt-1">
                                <p class="text-xs text-muted-foreground inline-block">N° TVA: </p>
                                <p class="text-sm font-medium">{{ isEditing ? '' : (modelValue.vat_number || '-') }}</p>
                                <input v-if="isEditing" v-model="editedLegal.vat_number" type="text"
                                    class="w-full text-sm rounded-md border px-2 py-1 h-7" />
                            </div>
                        </div>
                        <div class="ml-2">
                            <Button v-if="isEditing" variant="outline" size="sm" @click="cancelEdit" class="h-7 px-2">
                                Annuler
                            </Button>
                            <Button v-if="isEditing" variant="default" size="sm" @click="saveChanges"
                                class="h-7 px-2 ml-1">
                                Enregistrer
                            </Button>
                            <Button v-else variant="ghost" size="icon" @click="startEditing" class="h-7 w-7">
                                <PencilIcon class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PencilIcon } from 'lucide-vue-next'
import EditableField from './Principals.vue'

interface LegalInfo {
    tax_number: string
    vat_number: string
}

const props = defineProps<{
    modelValue: LegalInfo
}>()

const emit = defineEmits<{
    'update:modelValue': [value: LegalInfo]
    'save': [value: LegalInfo]
}>()

const isEditing = ref(false)
const editedLegal = ref<LegalInfo>({
    tax_number: '',
    vat_number: ''
})

watch(() => props.modelValue, (newValue) => {
    if (newValue && !isEditing.value) {
        editedLegal.value = { ...newValue }
    }
}, { immediate: true })

const startEditing = () => {
    editedLegal.value = { ...props.modelValue }
    isEditing.value = true
}

const cancelEdit = () => {
    editedLegal.value = { ...props.modelValue }
    isEditing.value = false
}

const saveChanges = () => {
    emit('save', editedLegal.value)
    emit('update:modelValue', editedLegal.value)
    isEditing.value = false
}
</script>