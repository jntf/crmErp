<template>
    <div class="container mx-auto py-6">
        <div class="mb-8">
            <h2 class="text-3xl font-bold tracking-tight">Gestion des Contacts</h2>
            <p class="text-muted-foreground">Gérez votre base de contacts et leurs entreprises associées.</p>
        </div>

        <!-- Boutons d'action -->
        <div class="mb-4 flex gap-2">
            <Button variant="outline" size="sm" :disabled="!selectedContacts.length" @click="handleExport">
                <Download class="mr-2 h-4 w-4" />
                Exporter
            </Button>
            <Button variant="outline" size="sm" @click="router.push('/entity/contact/create')">
                <PlusCircle class="h-4 w-4" />
            </Button>
        </div>

        <!-- Table principale -->
        <DataTable 
            :tableData="contactsData" 
            :tableColumns="columns" 
            :tableSettings="tableSettings"
            :cellRenderers="cellRenderers" 
            :toolbarConfig="toolbarConfig" 
            :loadingState="loading"
            :selectedRows="selectedContacts" 
            @selection="handleSelection" 
            @change="handleChange" 
            @export="handleExport"
            @delete-request="handleDeleteRequest" 
        />

        <!-- Modal de confirmation pour la suppression -->
        <ConfirmDialog 
            v-model="showConfirmDialog" 
            title="Confirmer la suppression"
            :message="`Voulez-vous vraiment supprimer ${selectedContacts.length} contact(s) ?`"
            confirm-text="Supprimer" 
            cancel-text="Annuler" 
            :close-on-backdrop="true" 
            @confirm="confirmDelete"
        >
            <template #confirm-icon>
                <Trash2 class="w-4 h-4 mr-2" />
            </template>
        </ConfirmDialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PlusCircle, Download, Trash2, Eye } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, ConfirmDialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import { useContacts } from '../../composables/useContacts'
import { exportToCSV, exportToExcel } from '@/components/DataTable/utils/export'
import type { CellRenderer } from '@/components/DataTable/types'

const router = useRouter()
const { toast } = useToast()
const showConfirmDialog = ref(false)

const {
    contactsData,
    loading,
    selectedContacts,
    fetchContacts,
    deleteContacts,
    handleSelection
} = useContacts()

// Configuration des colonnes
const columns = [
    {
        data: 'first_name',
        title: 'Prénom',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'last_name',
        title: 'Nom',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'email',
        title: 'Email',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'phone',
        title: 'Téléphone',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'mobile',
        title: 'Mobile',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'companies',
        title: 'Entreprises',
        type: 'text',
        className: 'htLeft',
        renderer(instance: any, td: any, row: any, col: any, prop: any, value: any) {
            if (Array.isArray(value)) {
                td.innerHTML = value.map(company => company.name).join(', ')
            } else {
                td.innerHTML = ''
            }
            return td
        }
    },
    {
        data: 'job_title',
        title: 'Fonction',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'department',
        title: 'Service',
        type: 'text',
        className: 'htLeft'
    },
    {
        data: 'status',
        title: 'Statut',
        type: 'text',
        width: 60,
        className: 'text-center status-badge',
        renderer(instance: any, td: any, row: any, col: any, prop: any, value: any) {
            td.innerHTML = `<span class="inline-flex items-center rounded-md px-2 text-xs font-medium ring-1 ring-inset ${
                value === 'active' 
                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                    : 'bg-gray-50 text-gray-600 ring-gray-500/10'
            }">${value}</span>`
            return td
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

// Configuration de la table
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
            const rowData = contactsData.value[coords.row];
            if (rowData) {
                showConfirmDialog.value = true;
                handleSelection([rowData]);
            }
        } else if (viewButton && (event.target === viewButton || viewButton.contains(event.target as Node))) {
            event.stopPropagation();
            const rowData = contactsData.value[coords.row];
            if (rowData) {
                router.push(`/entity/contact/${rowData.id}`);
            }
        }
    }
}

// Configuration de la barre d'outils
const toolbarConfig = {
    enableSearch: true,
    enableColumnFilter: true,
    enableExport: true,
    enableDelete: true
}

// Gestionnaires d'événements
const handleChange = async (changes: any[]) => {
    // Implémenter la logique de mise à jour
    console.log('Changes:', changes)
}

const handleExport = async (format: 'csv' | 'excel') => {
    const data = selectedContacts.value.length ? selectedContacts.value : contactsData.value
    const filename = `contacts_export_${new Date().toISOString().split('T')[0]}`

    if (format === 'csv') {
        await exportToCSV(data, filename, columns)
    } else {
        await exportToExcel(data, filename, columns)
    }
}

const handleDeleteRequest = () => {
    if (selectedContacts.value.length > 0) {
        showConfirmDialog.value = true
    }
}

const confirmDelete = async () => {
    try {
        await deleteContacts(selectedContacts.value.map(contact => contact.id))
        showConfirmDialog.value = false
        toast({
            title: "Suppression réussie",
            description: `${selectedContacts.value.length} contact(s) supprimé(s)`,
        })
        // Rafraîchir les données après la suppression
        await fetchContacts()
    } catch (err) {
        toast({
            title: "Erreur de suppression",
            description: "Une erreur est survenue lors de la suppression",
            variant: "destructive"
        })
    }
}

// Cell Renderers pour les actions
const cellRenderers = {
    actions: () => {
        return `<span class="edit-button inline-flex items-center justify-center h-4 w-4 text-gray-500 cursor-pointer opacity-70 hover:opacity-100 mr-2" title="Voir">👁️</span><span class="delete-button text-red-500 inline-flex items-center justify-center h-4 w-4 text-red-500 cursor-pointer opacity-70 hover:opacity-100" title="Supprimer">🗑️</span>`
    }
}

onMounted(() => {
    fetchContacts()
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