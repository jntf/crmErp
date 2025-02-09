<template>
    <div class="flex items-center gap-2">
        <!-- Menu d'export -->
        <VehicleExportMenu 
            :data="data" 
            :columns="columns"
        />

        <!-- Bouton d'ajout -->
        <Button @click="handleAdd">
            <Plus class="w-4 h-4 mr-2" />
            Ajouter un véhicule
        </Button>

        <!-- Actions sur la sélection -->
        <TransitionRoot
            :show="!!selectedCount"
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 -translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-1"
        >
            <div v-if="selectedCount" class="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            Actions groupées
                            <ChevronDown class="w-4 h-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-48">
                        <DropdownMenuItem @click="handleBulkStatus('online')">
                            <Globe class="w-4 h-4 mr-2" />
                            Mettre en ligne
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="handleBulkStatus('offline')">
                            <WifiOff class="w-4 h-4 mr-2" />
                            Mettre hors ligne
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="handleBulkDelete" class="text-red-600">
                            <Trash class="w-4 h-4 mr-2" />
                            Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </TransitionRoot>
    </div>
</template>

<script setup lang="ts">
import { Plus, ChevronDown, Globe, Trash } from 'lucide-vue-next'
import { WifiOff } from 'lucide-vue-next'
import { TransitionRoot } from '@headlessui/vue'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import VehicleExportMenu from './VehicleExportMenu.vue'

// Props
interface Props {
    data: any[]
    columns: any[]
    selectedCount: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    'add': []
    'bulk-status': [status: 'online' | 'offline', selectedCount: number]
    'bulk-delete': [selectedCount: number]
}>()

// Handlers
const handleAdd = () => {
    emit('add')
}

const handleBulkStatus = (status: 'online' | 'offline') => {
    emit('bulk-status', status, props.selectedCount)
}

const handleBulkDelete = () => {
    emit('bulk-delete', props.selectedCount)
}
</script> 