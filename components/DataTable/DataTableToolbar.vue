//components/DataTable/DataTableToolbar.vue
<template>
    <div class="flex items-center relative h-10">
        <!-- Left floating section -->
        <div class="absolute -left-12 top-0 flex flex-col space-y-4 h-full py-5">
            <!-- Column visibility -->
            <Popover class="relative">
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" class="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 group">
                        <div class="relative w-4 h-4">
                            <!-- Custom column icon -->
                            <div class="absolute inset-0 flex flex-col justify-between">
                                <div class="h-[2px] w-full bg-gray-500 dark:bg-gray-400 group-hover:bg-gray-700 dark:group-hover:bg-gray-300 transition-colors"></div>
                                <div class="h-[2px] w-3/4 bg-gray-500 dark:bg-gray-400 group-hover:bg-gray-700 dark:group-hover:bg-gray-300 transition-colors"></div>
                                <div class="h-[2px] w-1/2 bg-gray-500 dark:bg-gray-400 group-hover:bg-gray-700 dark:group-hover:bg-gray-300 transition-colors"></div>
                            </div>
                        </div>
                        <span class="sr-only">Gérer les colonnes</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent class="w-64 p-0" align="start">
                    <Command class="border-none">
                        <CommandInput placeholder="Rechercher une colonne..." class="h-9" />
                        <CommandList>
                            <CommandEmpty>Aucune colonne trouvée.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    v-for="column in columns"
                                    :key="column.data"
                                    :value="column.data"
                                    :disabled="column.required"
                                    class="flex items-center space-x-2 px-2 py-1.5"
                                >
                                    <Checkbox
                                        :id="column.data"
                                        :checked="isColumnVisible(column)"
                                        @update:checked="toggleColumn(column)"
                                        class="h-4 w-4"
                                    />
                                    <span class="text-sm">{{ column.title }}</span>
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <!-- Export -->
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" class="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Download class="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span class="sr-only">Exporter</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-48">
                    <DropdownMenuItem @click="handleExportClick('csv')" class="flex items-center">
                        <FileText class="h-4 w-4 mr-2" />
                        <span>Exporter en CSV</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="handleExportClick('xlsx')" class="flex items-center">
                        <Table class="h-4 w-4 mr-2" />
                        <span>Exporter en Excel</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <!-- Main toolbar content -->
        <div class="flex items-center justify-between w-full border-b border-gray-200 dark:border-gray-800 px-4">
            <!-- Selection info with animation -->
            <TransitionRoot
                :show="selectedCount > 0"
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 -translate-x-2"
                enterTo="opacity-100 translate-x-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 -translate-x-2"
            >
                <div v-if="selectedCount > 0" 
                    class="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                    {{ selectedCount }} sélectionné{{ selectedCount > 1 ? 's' : '' }}
                </div>
            </TransitionRoot>

            <!-- Right section for custom actions -->
            <div class="flex items-center">
                <slot name="actions"></slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Download, FileText, Table } from 'lucide-vue-next'
import { TransitionRoot } from '@headlessui/vue'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'

interface Column {
    data: string
    title: string
    required?: boolean
}

interface Props {
    columns: Column[]
    selectedCount: number
    visibleColumns: string[]
}

const props = withDefaults(defineProps<Props>(), {
    selectedCount: 0
})

const emit = defineEmits<{
    'toggleColumn': [column: string]
    'export': [format: string]
}>()

const isColumnVisible = (column: Column): boolean => {
    return props.visibleColumns.includes(column.data)
}

const toggleColumn = (column: Column): void => {
    emit('toggleColumn', column.data)
}

const handleExportClick = (format: 'csv' | 'xlsx'): void => {
    emit('export', format)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>