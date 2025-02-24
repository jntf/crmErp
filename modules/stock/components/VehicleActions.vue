<template>
    <div class="fixed right-0 top-1/4 bg-background border-l h-auto py-4 shadow-sm z-10 w-12">
        <div class="flex flex-col space-y-2">
            <TooltipProvider>
                <template v-for="action in actions" :key="action.id">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="w-12 h-12 rounded-none hover:bg-accent"
                                :disabled="!hasSelection && action.requiresSelection"
                                @click="action.handler()"
                            >
                                <component :is="action.icon" class="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p>{{ action.tooltip }}</p>
                        </TooltipContent>
                    </Tooltip>
                </template>
            </TooltipProvider>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
    ClipboardList,
    FileSpreadsheet,
    Trash2,
    RefreshCcw,
    Building2,
    ShoppingCart,
    Upload,
    Settings2,
    Package
} from 'lucide-vue-next'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

const props = defineProps<{
    hasSelection: boolean
}>()

const emit = defineEmits<{
    (e: 'updateStatus'): void
    (e: 'deleteSelection'): void
    (e: 'exportExcel'): void
    (e: 'generateOffer'): void
    (e: 'changeSupplier'): void
    (e: 'createOrder'): void
    (e: 'importExcel'): void
    (e: 'manage-equipment'): void
    (e: 'manage-stock'): void
}>()

const actions = computed(() => [
    {
        id: 'import',
        icon: Upload,
        tooltip: 'Importer depuis Excel',
        requiresSelection: false,
        handler: () => emit('importExcel')
    },
    {
        id: 'status',
        icon: RefreshCcw,
        tooltip: 'Mettre à jour le statut',
        requiresSelection: true,
        handler: () => emit('updateStatus')
    },
    {
        id: 'delete',
        icon: Trash2,
        tooltip: 'Supprimer la sélection',
        requiresSelection: true,
        handler: () => emit('deleteSelection')
    },
    {
        id: 'export',
        icon: FileSpreadsheet,
        tooltip: 'Exporter en Excel',
        requiresSelection: false,
        handler: () => emit('exportExcel')
    },
    {
        id: 'offer',
        icon: ClipboardList,
        tooltip: 'Générer une offre commerciale',
        requiresSelection: true,
        handler: () => emit('generateOffer')
    },
    {
        id: 'supplier',
        icon: Building2,
        tooltip: 'Changer le fournisseur',
        requiresSelection: true,
        handler: () => emit('changeSupplier')
    },
    {
        id: 'order',
        icon: ShoppingCart,
        tooltip: 'Créer un bon de commande',
        requiresSelection: true,
        handler: () => emit('createOrder')
    },
    {
        id: 'equipment',
        icon: Settings2,
        tooltip: 'Gérer les équipements',
        requiresSelection: true,
        handler: () => emit('manage-equipment')
    },
    {
        id: 'stock',
        icon: Package,
        tooltip: 'Gérer le stock',
        requiresSelection: true,
        handler: () => emit('manage-stock')
    }
])
</script> 