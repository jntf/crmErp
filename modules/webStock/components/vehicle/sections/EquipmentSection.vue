# components/vehicle/section/EquipmentSection.vue
<template>
    <div class="space-y-4">
        <!-- Header plus compact -->
        <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
                <h2 class="text-lg font-semibold">Équipements</h2>
                <Badge variant="outline">{{ modelValue.length }}</Badge>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" class="h-8">
                        <Plus class="h-4 w-4" />
                        <ChevronDown class="h-4 w-4 ml-1" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-64">
                    <DropdownMenuLabel>Ajouter un équipement</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="showAddFromRefs = true">
                        <ListTree class="h-4 w-4 mr-2" />
                        Depuis la liste de référence
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="showAddCustom = true">
                        <PlusCircle class="h-4 w-4 mr-2" />
                        Personnalisé
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <!-- Liste des équipements -->
        <div class="space-y-2">
            <!-- Options -->
            <div v-if="optionalEquipments.length" class="rounded-lg border">
                <Collapsible defaultOpen>
                    <CollapsibleTrigger class="flex items-center justify-between w-full px-3 py-2 hover:bg-accent/50 transition-colors">
                        <div class="flex items-center gap-2">
                            <Badge variant="default" class="rounded-lg">OPTIONS</Badge>
                            <Badge variant="outline">{{ optionalEquipments.length }}</Badge>
                        </div>
                        <ChevronDown class="h-4 w-4 transition-transform ui-expanded:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div class="divide-y">
                            <div v-for="equipment in optionalEquipments" :key="equipment.id"
                                class="group flex items-center justify-between px-3 py-1.5 hover:bg-accent/50 transition-colors">
                                <span class="text-sm font-medium">{{ equipment.name.replace('*', '') }}</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" class="h-8 w-8 opacity-0 group-hover:opacity-100">
                                            <MoreHorizontal class="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem @click="handleEdit(equipment)">
                                            <Pencil class="h-4 w-4 mr-2" />
                                            Modifier
                                        </DropdownMenuItem>
                                        <DropdownMenuItem @click="handleDelete(equipment)" class="text-destructive">
                                            <Trash2 class="h-4 w-4 mr-2" />
                                            Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>

            <!-- Équipements standards -->
            <div v-for="category in groupedStandardEquipments" :key="category.name" class="rounded-lg border">
                <Collapsible defaultOpen>
                    <CollapsibleTrigger class="flex items-center justify-between w-full px-3 py-2 hover:bg-accent/50 transition-colors">
                        <div class="flex items-center gap-2">
                            <h3 class="text-sm font-semibold">{{ category.name }}</h3>
                            <Badge variant="outline">{{ category.items.length }}</Badge>
                        </div>
                        <ChevronDown class="h-4 w-4 transition-transform ui-expanded:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div class="divide-y">
                            <div v-for="equipment in category.items" :key="equipment.id"
                                class="group flex items-center justify-between px-3 py-1.5 hover:bg-accent/50 transition-colors">
                                <span class="text-sm">{{ equipment.name }}</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" class="h-8 w-8 opacity-0 group-hover:opacity-100">
                                            <MoreHorizontal class="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem @click="handleEdit(equipment)">
                                            <Pencil class="h-4 w-4 mr-2" />
                                            Modifier
                                        </DropdownMenuItem>
                                        <DropdownMenuItem @click="handleDelete(equipment)" class="text-destructive">
                                            <Trash2 class="h-4 w-4 mr-2" />
                                            Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
        
        <!-- Dialog pour ajouter depuis les références -->
        <Dialog :open="showAddFromRefs" @update:open="showAddFromRefs = false">
            <DialogContent class="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Ajouter depuis les références</DialogTitle>
                    <DialogDescription>
                        Sélectionnez les équipements à ajouter au véhicule
                    </DialogDescription>
                </DialogHeader>

                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <Input v-model="searchTerm" placeholder="Rechercher un équipement..." class="flex-1" />
                        <Select v-model="filterCategory">
                            <SelectTrigger class="w-[180px]">
                                <SelectValue placeholder="Toutes catégories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Toutes catégories</SelectItem>
                                <SelectItem v-for="category in availableCategories" :key="category" :value="category">
                                    {{ category }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div class="border rounded-lg divide-y max-h-96 overflow-y-auto">
                        <div v-for="equipment in filteredReferences" :key="equipment.id"
                            class="flex items-center gap-2 p-2 hover:bg-accent transition-colors">
                            <Checkbox :id="equipment.id" v-model:checked="selectedRefs" :value="equipment.id" />
                            <Label :for="equipment.id" class="flex-1 cursor-pointer">
                                {{ equipment.name }}
                            </Label>
                            <Badge variant="outline">{{ equipment.category }}</Badge>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" @click="showAddFromRefs = false">Annuler</Button>
                    <Button @click="handleAddFromRefs" :disabled="!selectedRefs.length">
                        Ajouter ({{ selectedRefs.length }})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Dialog pour ajouter un équipement personnalisé -->
        <Dialog :open="showAddCustom" @update:open="showAddCustom = false">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajouter un équipement personnalisé</DialogTitle>
                </DialogHeader>
                <div class="space-y-4 py-4">
                    <div class="space-y-2">
                        <Label>Nom de l'équipement</Label>
                        <Input v-model="newCustomEquipment.name" placeholder="Nom de l'équipement" />
                    </div>
                    <div class="space-y-2">
                        <Label>Catégorie</Label>
                        <Select v-model="newCustomEquipment.category">
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem v-for="category in categories" :key="category" :value="category">
                                        {{ category }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="flex items-center space-x-2">
                        <Checkbox v-model="newCustomEquipment.isOption" id="isOption" />
                        <Label for="isOption">Marquer comme option</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" @click="showAddCustom = false">Annuler</Button>
                    <Button @click="handleAddCustom"
                        :disabled="!newCustomEquipment.name || !newCustomEquipment.category">
                        Ajouter
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Dialog pour modifier un équipement -->
        <Dialog :open="!!editingEquipment" @update:open="handleCancelEdit">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier l'équipement</DialogTitle>
                </DialogHeader>
                <div class="space-y-4 py-4">
                    <div class="space-y-2">
                        <Label>Nom de l'équipement</Label>
                        <Input v-if="editingEquipment" v-model="editingEquipment.name"
                            placeholder="Nom de l'équipement" />
                    </div>
                    <div class="space-y-2">
                        <Label>Catégorie</Label>
                        <Select v-if="editingEquipment" v-model="editingEquipment.category">
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem v-for="category in categories" :key="category" :value="category">
                                        {{ category }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="flex items-center space-x-2">
                        <Checkbox v-if="editingEquipment" v-model="editingEquipment.isOption" id="editIsOption" />
                        <Label for="editIsOption">Marquer comme option</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" @click="handleCancelEdit">Annuler</Button>
                    <Button @click="handleSaveEdit" :disabled="!editingEquipment?.name || !editingEquipment?.category">
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Dialog de confirmation de suppression -->
        <AlertDialog :open="!!deletingEquipment" @update:open="deletingEquipment = null">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel @click="deletingEquipment = null">Annuler</AlertDialogCancel>
                    <AlertDialogAction @click="handleConfirmDelete"
                        class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Supprimer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
    Plus,
    Trash2,
    PlusCircle,
    ChevronDown,
    ListTree,
    MoreHorizontal,
    Pencil
} from 'lucide-vue-next'

// Types
interface Equipment {
    id: string
    name: string
    category: string
    isOption?: boolean
}

// Props et Emits
const props = defineProps<{
    modelValue: Equipment[]
    vehicleId: string
    source: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: Equipment[]): void
    (e: 'error', message: string): void
}>()

// État local
const categories = [
    'Sécurité',
    'Confort',
    'Connectivité',
    'Éclairage',
    'Roues',
    'Audio'
]

const showAddFromRefs = ref(false)
const showAddCustom = ref(false)
const searchTerm = ref('')
const filterCategory = ref('')
const selectedRefs = ref<string[]>([])
const editingEquipment = ref<Equipment | null>(null)
const deletingEquipment = ref<Equipment | null>(null)

const newCustomEquipment = ref({
    name: '',
    category: '',
    isOption: false
})

// Computed
const optionalEquipments = computed(() =>
    props.modelValue.filter(e => e.name.startsWith('*'))
        .sort((a, b) => a.name.localeCompare(b.name))
)

const standardEquipments = computed(() =>
    props.modelValue.filter(e => !e.name.startsWith('*'))
)

const groupedStandardEquipments = computed(() => {
    const groups = categories.map(category => ({
        name: category,
        items: standardEquipments.value.filter(e => e.category === category)
    })).filter(group => group.items.length > 0)

    const uncategorized = standardEquipments.value.filter(e => !e.category)
    if (uncategorized.length > 0) {
        groups.push({
            name: 'Autres',
            items: uncategorized
        })
    }

    return groups
})

const availableCategories = computed(() =>
    Array.from(new Set(props.modelValue.map(e => e.category)))
        .filter(Boolean)
        .sort()
)

const filteredReferences = computed(() => {
    let filtered = props.modelValue

    if (searchTerm.value) {
        const search = searchTerm.value.toLowerCase()
        filtered = filtered.filter(e =>
            e.name.toLowerCase().includes(search)
        )
    }

    if (filterCategory.value) {
        filtered = filtered.filter(e =>
            e.category === filterCategory.value
        )
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

// Méthodes
function handleAddFromRefs() {
    if (!selectedRefs.length) return

    emit('update:modelValue', [
        ...props.modelValue,
        ...selectedRefs.value.map(refId => {
            const reference = props.modelValue.find(e => e.id === refId)
            return {
                id: refId,
                name: reference?.name || '',
                category: reference?.category || '',
            }
        })
    ])

    // Réinitialiser
    selectedRefs.value = []
    showAddFromRefs.value = false
}

function handleAddCustom() {
    if (!newCustomEquipment.value.name || !newCustomEquipment.value.category) return

    // Préparer le nom avec * si c'est une option
    const name = newCustomEquipment.value.isOption
        ? `*${newCustomEquipment.value.name}`
        : newCustomEquipment.value.name

    const newEquipment: Equipment = {
        id: crypto.randomUUID(),
        name,
        category: newCustomEquipment.value.category,
        isOption: newCustomEquipment.value.isOption
    }

    emit('update:modelValue', [...props.modelValue, newEquipment])

    // Réinitialiser
    newCustomEquipment.value = {
        name: '',
        category: '',
        isOption: false
    }
    showAddCustom.value = false
}

function handleEdit(equipment: Equipment) {
    // Créer une copie pour l'édition
    editingEquipment.value = {
        ...equipment,
        // Si c'est une option (commence par *), on retire le * et on met isOption à true
        name: equipment.name.startsWith('*') ? equipment.name.slice(1) : equipment.name,
        isOption: equipment.name.startsWith('*')
    }
}

function handleCancelEdit() {
    editingEquipment.value = null
}

function handleSaveEdit() {
    if (!editingEquipment.value) return

    const updatedEquipment = {
        ...editingEquipment.value,
        // Ajouter le * si c'est une option
        name: editingEquipment.value.isOption
            ? `*${editingEquipment.value.name}`
            : editingEquipment.value.name
    }

    emit('update:modelValue',
        props.modelValue.map(e =>
            e.id === updatedEquipment.id ? updatedEquipment : e
        )
    )

    editingEquipment.value = null
}

function handleDelete(equipment: Equipment) {
    deletingEquipment.value = equipment
}

function handleConfirmDelete() {
    if (!deletingEquipment.value) return

    emit('update:modelValue',
        props.modelValue.filter(e => e.id !== deletingEquipment.value?.id)
    )

    deletingEquipment.value = null
}
</script>