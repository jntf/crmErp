//components/DataTable/DataTableToolbar.vue
<template>
    <div class="flex items-center justify-between pb-4">
        <div class="flex flex-1 items-center space-x-2">
            <!-- Search -->
            <div class="relative w-64">
                <input type="text" :placeholder="searchPlaceholder"
                    class="w-full pl-8 pr-2 py-1 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
                    v-model="searchValue" @input="handleSearch" />
                <Search class="absolute left-2 top-1.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>

            <!-- Column Visibility -->
            <Popover class="relative">
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" class="h-8 border-dashed bg-blue-500 hover:bg-blue-100">
                        <ViewIcon class="h-4 w-4 text-blue-100 hover:text-blue-500" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent class="w-80 p-0 mt-14" align="start">
                    <Command>
                        <CommandInput placeholder="Rechercher une colonne..." />
                        <CommandList>
                            <CommandEmpty>Aucune colonne trouvée.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem v-for="column in columns" :key="column.data" 
                                    :value="column.data"
                                    :disabled="column.required">
                                    <Checkbox :id="column.data" :checked="isColumnVisible(column)"
                                        @update:checked="toggleColumn(column)" class="mr-2" />
                                    {{ column.title }}
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <!-- Selection info -->
            <div v-if="selectedCount > 0" class="text-sm text-gray-500 dark:text-gray-400">
                {{ selectedCount }} ligne{{ selectedCount > 1 ? 's' : '' }} sélectionnée{{ selectedCount > 1 ? 's' : ''
                }}
            </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center space-x-2">
            <!-- Export -->
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" class="ml-auto">
                        <Download class="mr-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="mt-14">
                    <DropdownMenuItem @click="handleExportClick('csv')">
                        Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="handleExportClick('xlsx')">
                        Export Excel
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <slot name="actions"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search, ViewIcon, Download } from 'lucide-vue-next'
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

interface Props {
    columns: any[]
    searchPlaceholder?: string
    selectedCount: number
    visibleColumns: string[]
}

const props = withDefaults(defineProps<Props>(), {
    searchPlaceholder: 'Rechercher...',
    selectedCount: 0
})

const emit = defineEmits<{
    'search': [value: string]
    'toggleColumn': [column: string]
    'export': [format: string]
}>()

const searchValue = ref('')

const handleSearch = () => {
    emit('search', searchValue.value)
}

const isColumnVisible = (column) => {
    return props.visibleColumns.includes(column.data)
}

const toggleColumn = (column) => {
    emit('toggleColumn', column.data)
}

const handleExportClick = (format: 'csv' | 'xlsx') => {
    console.log('Export clicked:', format)
    emit('export', format)
}
</script>