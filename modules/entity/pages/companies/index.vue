//pages/companies.vue
<template>
    <div class="container mx-auto py-6">
        <div class="mb-8">
            <h2 class="text-3xl font-bold tracking-tight">Gestion des Entreprises</h2>
            <p class="text-muted-foreground">Gérez votre base d'entreprises et leurs contacts associés.</p>
        </div>

        <!-- Boutons d'action -->
        <div class="mb-4 flex gap-2">
            <Button variant="outline" size="sm" :disabled="!selectedCompanies.length" @click="handleExport">
                <Download class="mr-2 h-4 w-4" />
                Exporter
            </Button>
            <Button variant="outline" size="sm" @click="router.push('/entity/company/create')">
                <PlusCircle class="h-4 w-4" />
            </Button>
        </div>

        <!-- Table principale -->
        <DataTable :tableData="companiesData" :tableColumns="columns" :tableSettings="tableSettings"
            :cellRenderers="cellRenderers" :toolbarConfig="toolbarConfig" :loadingState="loading"
            :selectedRows="selectedCompanies" @selection="handleSelection" @change="handleChange" @export="handleExport"
            @delete-request="handleDeleteRequest" />

        <!-- Modal de confirmation pour la suppression -->
        <ConfirmDialog v-model="showConfirmDialog" title="Confirmer la suppression"
            :message="`Voulez-vous vraiment supprimer ${selectedCompanies.length} entreprise(s) ?`"
            confirm-text="Supprimer" cancel-text="Annuler" :close-on-backdrop="true" @confirm="confirmDelete">
            <template #confirm-icon>
                <Trash2 class="w-4 h-4 mr-2" />
            </template>
        </ConfirmDialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PlusCircle, Download, Trash2 } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, ConfirmDialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import { useCompanies } from '../../composables/useCompanies'
import { exportToCSV, exportToExcel } from '@/components/DataTable/utils/export'

const router = useRouter()
const { toast } = useToast()
const showConfirmDialog = ref(false)

const {
    companiesData,
    loading,
    selectedCompanies,
    fetchCompanies,
    deleteCompanies,
    handleSelection
} = useCompanies()

// Configuration des colonnes mise à jour
const columns = [
    {
        data: 'name',
        title: 'Nom',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'status',
        title: 'Statut',
        type: 'text',
        width: 100,
        className: 'text-center status-badge',
        renderer(instance: any, td: any, row: any, col: any, prop: any, value: any) {
            td.innerHTML = value;
            return td;
        }
    },
    {
        data: 'revenue',
        title: 'CA',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight'
    },
    {
        data: 'city',
        title: 'Ville',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'country_name',
        title: 'Pays',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'phone',
        title: 'Tél',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'tax_number',
        title: 'Siret',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'vat_number',
        title: 'TVA',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'contacts_count',
        title: 'Contacts',
        type: 'numeric',
        width: 70,
        className: 'text-center contacts-badge',
        renderer(instance: any, td: any, row: any, col: any, prop: any, value: any) {
            td.innerHTML = value;
            return td;
        }
    },
    {
        data: 'actions',
        title: 'Actions',
        type: 'text',
        width: 50,
        className: 'htCenter',
        renderer(instance: any, td: any, row: any, col: any, prop: any, value: any) {
            td.innerHTML = value;
            return td;
        }
    }
]

const tableSettings = {
    stretchH: 'all',
    autoWrapRow: true,
    rowHeights: 35,
    contextMenu: true,
    height: '70vh',
    selectionMode: 'multiple',
    outsideClickDeselects: false,
    multiSelect: true,
    currentRowClassName: 'current-row',
    currentColClassName: 'current-col',
    manualColumnResize: true,
    fixedRowsTop: 1,
    fixedColumnsLeft: 2,
    renderAllRows: false,
    viewportRowRenderingOffset: 20,
    rowHeaders: true,
    afterSelectionEnd: (rowStart: number, colStart: number, rowEnd: number, colEnd: number) => {
        console.log('Selection:', { rowStart, colStart, rowEnd, colEnd });
    },
    afterOnCellMouseDown: (event: MouseEvent, coords: any, TD: HTMLElement) => {
        const deleteButton = TD.querySelector('.delete-button');
        const viewButton = TD.querySelector('.edit-button');
        if (deleteButton && (event.target === deleteButton || deleteButton.contains(event.target as Node))) {
            event.stopPropagation();
            const rowData = companiesData.value[coords.row];
            if (rowData) {
                showConfirmDialog.value = true;
                handleSelection([rowData]); // Utiliser handleSelection au lieu d'une affectation directe
            }
        } else if (viewButton && (event.target === viewButton || viewButton.contains(event.target as Node))) {
            event.stopPropagation();
            const rowData = companiesData.value[coords.row];
            if (rowData) {
                router.push(`/entity/company/${rowData.id}`);
            }
        }
    }
}

const cellRenderers = {
    status: (value: string) => {
        return `<div class="inline-flex items-center justify-center rounded-full h-4 px-2 text-[11px] leading-none min-w-[60px] ${value === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }">${value}</div>`
    },
    contacts_count: (value: number) => {
        const count = Number(value) || 0;
        return `<div class="inline-flex items-center justify-center h-4 w-6 rounded-full text-[11px] leading-none ${count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }">${count}</div>`
    },
    actions: () => {
        return `<span class="edit-button inline-flex items-center justify-center h-4 w-4 text-gray-500 cursor-pointer opacity-70 hover:opacity-100 mr-2" title="Voir">👁️</span><span class="delete-button text-red-500 inline-flex items-center justify-center h-4 w-4 text-red-500 cursor-pointer opacity-70 hover:opacity-100" title="Supprimer">🗑️</span>`
    }
}

const handleDeleteRequest = (rows: any[]) => {
    selectedCompanies.value = rows;
    showConfirmDialog.value = true;
}

const toolbarConfig = {
    searchPlaceholder: 'Rechercher une entreprise...',
    exportFileName: 'liste-entreprises'
}

const handleChange = (changes: Array<[number, string, any, any]>) => {
    console.log('Modifications:', changes)
}

function handleExport(format: 'csv' | 'xlsx') {
    const dataToExport = selectedCompanies.value.length > 0
        ? selectedCompanies.value
        : companiesData.value

    if (format === 'csv') {
        exportToCSV(dataToExport, columns, toolbarConfig.exportFileName)
    } else {
        exportToExcel(dataToExport, columns, toolbarConfig.exportFileName)
    }
}

async function confirmDelete() {
    try {
        await deleteCompanies(selectedCompanies.value.map(c => c.id))
        showConfirmDialog.value = false

        toast({
            title: "Suppression réussie",
            description: "Les entreprises sélectionnées ont été supprimées"
        })

        // Rafraîchir les données après la suppression
        await fetchCompanies()
    } catch (err) {
        toast({
            title: "Erreur de suppression",
            description: "Une erreur est survenue lors de la suppression",
            variant: "destructive"
        })
    }
}

onMounted(() => {
    fetchCompanies()
})
</script>

<style>
.current-row {
    background-color: rgba(233, 237, 244, 0.4) !important;
}

.current-col {
    background-color: rgba(233, 237, 244, 0.2) !important;
}
</style>