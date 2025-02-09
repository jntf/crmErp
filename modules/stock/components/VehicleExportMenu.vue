<template>
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
                <Download class="w-4 h-4 mr-2" />
                Exporter
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <FileSpreadsheet class="w-4 h-4 mr-2" />
                    Excel
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuItem @click="handleExport('excel', 'vente')">
                        Vue Vente
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="handleExport('excel', 'achat')">
                        Vue Achat
                    </DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <FileText class="w-4 h-4 mr-2" />
                    CSV
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuItem @click="handleExport('csv', 'vente')">
                        Vue Vente
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="handleExport('csv', 'achat')">
                        Vue Achat
                    </DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <FileDown class="w-4 h-4 mr-2" />
                    PDF
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuItem @click="handleExport('pdf', 'vente')">
                        Vue Vente
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="handleExport('pdf', 'achat')">
                        Vue Achat
                    </DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuSub>
        </DropdownMenuContent>
    </DropdownMenu>
</template>

<script setup lang="ts">
import { Download, FileText, FileSpreadsheet, FileDown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportToCSV, exportToExcel, exportToPDF, exportTemplates, filterColumnsByTemplate } from '@/components/DataTable/utils/export'

const props = defineProps<{
    data: any[]
    columns: any[]
}>()

const handleExport = async (format: 'csv' | 'excel' | 'pdf', templateKey: 'vente' | 'achat') => {
    try {
        const template = exportTemplates[templateKey]
        const filteredColumns = filterColumnsByTemplate(props.columns, template)
        const filename = `vehicules_${templateKey}_${new Date().toISOString().split('T')[0]}`

        switch (format) {
            case 'csv':
                await exportToCSV(props.data, filteredColumns, filename)
                break
            case 'excel':
                await exportToExcel(props.data, filteredColumns, filename)
                break
            case 'pdf':
                await exportToPDF(props.data, filteredColumns, filename, template)
                break
        }
    } catch (error) {
        console.error('Erreur lors de l\'export:', error)
    }
}
</script> 