# components/vehicle/sections/ColorSection.vue
<template>
    <div class="space-y-6">
        <!-- Couleur principale -->
        <div class="flex items-center justify-between">
            <Label>Couleur principale</Label>
            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button variant="outline" class="flex items-center gap-2">
                        <div v-if="selectedBaseColor" class="w-4 h-4 rounded-sm"
                            :class="[selectedBaseColor.background_class, selectedBaseColor.text_class]" />
                        {{ selectedBaseColor ? selectedBaseColor.name : autoDetectedColor || 'Sélectionner' }}
                        <ChevronDown class="h-4 w-4 ml-1" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-56">
                    <DropdownMenuLabel>Couleurs disponibles</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup v-model="selectedBaseColorId">
                        <DropdownMenuRadioItem v-for="color in colors" :key="color.id" :value="color.id.toString()"
                            class="flex items-center gap-2">
                            <div class="w-4 h-4 rounded-sm border" :style="{ backgroundColor: color.hex_code }" />
                            {{ color.name }}
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <!-- Variante de couleur -->
        <div class="flex items-center justify-between">
            <Label>Variante</Label>
            <div class="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button variant="outline" :disabled="!selectedBaseColor" class="flex items-center gap-2">
                            <div v-if="selectedVariant && selectedBaseColor" class="w-4 h-4 rounded-sm"
                                :class="[selectedBaseColor.background_class, selectedBaseColor.text_class]" />
                            {{ selectedVariant ? selectedVariant.variant_name : 'Sélectionner une variante' }}
                            <ChevronDown class="h-4 w-4 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-56">
                        <DropdownMenuLabel>Variantes disponibles</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuRadioGroup v-model="variantId">
                                <DropdownMenuRadioItem v-for="variant in availableVariants" :key="variant.id"
                                    :value="variant.id.toString()">
                                    {{ variant.variant_name }}
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="startCreateVariant">
                            <Plus class="h-4 w-4 mr-2" />
                            Nouvelle variante
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <!-- Modal de création de variante -->
        <Dialog :open="isCreatingNewVariant" @update:open="cancelCreateVariant">
            <DialogContent class="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nouvelle variante</DialogTitle>
                    <DialogDescription>
                        Créer une nouvelle variante pour {{ selectedBaseColor?.name }}
                    </DialogDescription>
                </DialogHeader>
                <div class="space-y-4">
                    <div class="space-y-2">
                        <Label>Nom de la variante</Label>
                        <Input v-model="newVariantName"
                            :placeholder="`ex: ${selectedBaseColor?.name?.toLowerCase() || ''} métallisé`" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" @click="cancelCreateVariant">Annuler</Button>
                    <Button variant="default" :disabled="!newVariantName" @click="handleCreateVariant">
                        Créer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { Plus, ChevronDown } from 'lucide-vue-next'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'

// Types
interface Color {
    id: number
    name: string
    hex_code: string
    background_class: string
    text_class: string
}

interface ColorVariant {
    id: number
    color_id: number
    variant_name: string
}

interface VehicleColorData {
    color: string
    color_variant?: string
}

// Supabase Client
const supabase = useSupabaseClient()

// Props et Emits
const props = defineProps<{
    modelValue: VehicleColorData
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: VehicleColorData): void
    (e: 'error', message: string): void
}>()

// État local
const colors = ref<Color[]>([])
const colorVariants = ref<ColorVariant[]>([])
const isLoading = ref(false)
const isCreatingNewVariant = ref(false)
const newVariantName = ref('')
const selectedBaseColorId = ref<string>('')

// Computed
const autoDetectedColor = computed(() => {
    if (!props.modelValue.color) return null
    return props.modelValue.color.split(' ')[0].toUpperCase()
})

const baseColorFound = computed(() => {
    return colors.value.some(c => c.name === autoDetectedColor.value)
})

const baseColorId = computed(() => {
    return selectedBaseColorId.value || (baseColorFound.value ?
        colors.value.find(c => c.name === autoDetectedColor.value)?.id.toString() : '')
})

const selectedBaseColor = computed(() =>
    colors.value.find(c => c.id.toString() === baseColorId.value)
)

const availableVariants = computed(() => {
    if (!baseColorId.value) return []
    return colorVariants.value.filter(v => v.color_id.toString() === baseColorId.value)
})

const variantId = computed({
    get: () => props.modelValue.color_variant || '',
    set: (value) => handleVariantChange(value)
})

const selectedVariant = computed(() =>
    colorVariants.value.find(v => v.id.toString() === props.modelValue.color_variant)
)

// Méthodes
async function fetchColorsAndVariants() {
    try {
        isLoading.value = true

        const { data: colorsData, error: colorsError } = await supabase
            .from('colors')
            .select('*')
            .order('name')

        if (colorsError) throw colorsError

        const { data: variantsData, error: variantsError } = await supabase
            .from('color_variants')
            .select('*')
            .order('variant_name')

        if (variantsError) throw variantsError

        colors.value = colorsData || []
        colorVariants.value = variantsData || []

        // Si une couleur est automatiquement détectée, la sélectionner
        if (baseColorFound.value) {
            selectedBaseColorId.value = baseColorId.value
        }
    } catch (error: any) {
        emit('error', `Erreur lors du chargement des données: ${error.message}`)
    } finally {
        isLoading.value = false
    }
}

function handleBaseColorChange(colorId: string) {
    selectedBaseColorId.value = colorId
    // Réinitialiser la variante quand on change la couleur de base
    handleClearMatching()
}

function handleVariantChange(variantId: string) {
    emit('update:modelValue', {
        ...props.modelValue,
        color_variant: variantId || undefined
    })
}

function handleClearMatching() {
    emit('update:modelValue', {
        ...props.modelValue,
        color_variant: undefined
    })
}

function startCreateVariant() {
    isCreatingNewVariant.value = true
    newVariantName.value = props.modelValue.color
}

function cancelCreateVariant() {
    isCreatingNewVariant.value = false
    newVariantName.value = ''
}

async function handleCreateVariant() {
    if (!baseColorId.value || !newVariantName.value) return

    try {
        isLoading.value = true
        const { data, error } = await supabase
            .from('color_variants')
            .insert({
                color_id: parseInt(baseColorId.value),
                variant_name: newVariantName.value
            })
            .select()
            .single()

        if (error) throw error

        // Ajouter la nouvelle variante à la liste
        colorVariants.value.push(data)

        // Sélectionner la nouvelle variante
        handleVariantChange(data.id.toString())

        // Réinitialiser le formulaire
        cancelCreateVariant()

    } catch (error: any) {
        emit('error', `Erreur lors de la création de la variante: ${error.message}`)
    } finally {
        isLoading.value = false
    }
}

// Lifecycle
onMounted(async () => {
    await fetchColorsAndVariants()
})
</script>