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
        <DataTable
            :data="companiesData"
            :columns="tableColumns"
            :loading-state="loading"
            :searchable="true"
            :pagination="true"
            :column-toggle="true"
            :row-selection="true"
            :side-toolbar="true"
            :tableSettings="tableSettings"
            export-filename="liste-entreprises"
            :defaultSorting="[{ id: 'name', desc: false }]"
            :getCoreRowModel="getCoreRowModel()"
            :getSortedRowModel="getSortedRowModel()"
            :getFilteredRowModel="getFilteredRowModel()"
            @selection="onRowSelection"
            @export="handleExport"
            @delete-request="handleDeleteRequest"
            ref="dataTableRef"
        >
            <!-- Slot pour les boutons supplémentaires dans la barre d'outils latérale -->
            <template #side-toolbar-buttons>
                <div class="w-full flex flex-col gap-1 mt-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        class="w-full justify-start px-2"
                        @click="router.push('/entity/company/create')"
                    >
                        <PlusCircle class="h-3.5 w-3.5 mr-2 text-green-500" />
                    </Button>
                </div>
            </template>

            <!-- Slot pour les boutons additionnels dans la barre d'outils principale -->
            <template #toolbar-end>
                <Button 
                    variant="ghost" 
                    size="sm"
                    @click="toggleFullScreenMode" 
                    title="Basculer en mode plein écran"
                >
                    <Maximize2 v-if="!isFullScreen" class="h-4 w-4" />
                    <Minimize2 v-else class="h-4 w-4" />
                </Button>
            </template>
        </DataTable>

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
import { ref, computed, onMounted, h, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { PlusCircle, Download, Trash2, Eye, Trash, Maximize2, Minimize2 } from 'lucide-vue-next'
import { ConfirmDialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import { useCompanies } from '../../composables/useCompanies'
import { exportToCSV, exportToExcel } from '@/components/DataTable/utils/export'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    createColumnHelper, 
    getCoreRowModel,
    getSortedRowModel, 
    getFilteredRowModel 
} from '@tanstack/vue-table'
import type { ColumnDef, SortingState } from '@tanstack/vue-table'
import type { Company } from '../../types/company.type'

// Définition du type pour les colonnes
type TableCompany = Company & {
    contacts_count?: number;
    city?: string;
    country_name?: string;
    [key: string]: any;
}

const router = useRouter()
const { toast } = useToast()
const showConfirmDialog = ref(false)
const dataTableRef = ref(null)
const isFullScreen = ref(false)
const sortingState = ref<SortingState>([{ id: 'name', desc: false }])

const {
    companiesData,
    loading,
    selectedCompanies,
    fetchCompanies,
    deleteCompanies,
    handleSelection
} = useCompanies()

// Fonction pour basculer en mode plein écran
const toggleFullScreenMode = () => {
    isFullScreen.value = !isFullScreen.value
    
    if (dataTableRef.value) {
        // Accéder à la méthode toggleFullWidth du composant DataTable si elle existe
        const table = dataTableRef.value as any
        if (table.table?.options?.meta?.toggleFullWidth) {
            table.table.options.meta.toggleFullWidth()
        } else if (typeof table.toggleFullWidth === 'function') {
            table.toggleFullWidth()
        } else {
            console.warn('La méthode toggleFullWidth n\'est pas disponible sur le composant DataTable')
        }
    }
}

// Wrapper pour la sélection des lignes
const onRowSelection = (rows: any[]) => {
    handleSelection(rows)
}

// Helper pour créer les colonnes TanStack
const columnHelper = createColumnHelper<TableCompany>()

// Fonction de rendu pour le statut avec badge
const renderStatusBadge = (status: string) => {
    const statusConfig = status === 'active'
        ? { bg: 'bg-green-100', text: 'text-green-700', hover: 'hover:bg-green-100', dark: 'dark:bg-green-800/30 dark:text-green-400', label: 'Actif' }
        : { bg: 'bg-gray-100', text: 'text-gray-700', hover: 'hover:bg-gray-100', dark: 'dark:bg-gray-800 dark:text-gray-400', label: 'Inactif' };
    
    return `<div class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.text} ${statusConfig.dark}">${statusConfig.label}</div>`;
}

// Fonction pour le rendu de la cellule de statut
const renderStatusCell = (info: any) => {
    const status = info.row.getValue('status') as string;
    return h('div', { innerHTML: renderStatusBadge(status) });
}

// Configuration des colonnes pour TanStack Table
const columns = [
    columnHelper.accessor('name', {
        header: 'Nom',
        cell: ({ row }) => row.getValue('name'),
        enableSorting: true,
        enableHiding: true,
        size: 300
    }),
    columnHelper.accessor('status', {
        header: 'Statut',
        cell: renderStatusCell,
        enableSorting: true,
        enableHiding: true,
        size: 100,
    }),
    columnHelper.accessor('revenue', {
        header: 'CA',
        cell: ({ row }) => {
            const revenue = row.getValue('revenue')
            if (typeof revenue === 'number') {
                return new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                }).format(revenue)
            }
            return '0 €'
        },
        enableSorting: true,
        enableHiding: true,
        size: 100
    }),
    columnHelper.accessor('city', {
        header: 'Ville',
        enableSorting: true,
        enableHiding: true,
        size: 120
    }),
    columnHelper.accessor('country_name', {
        header: 'Pays',
        enableSorting: true,
        enableHiding: true,
        size: 100
    }),
    columnHelper.accessor('phone', {
        header: 'Tél',
        enableSorting: true,
        enableHiding: true,
        size: 120
    }),
    columnHelper.accessor('tax_number', {
        header: 'Siret',
        enableSorting: true,
        enableHiding: true,
        size: 120
    }),
    columnHelper.accessor('vat_number', {
        header: 'TVA',
        enableSorting: true,
        enableHiding: true,
        size: 120
    }),
    columnHelper.accessor(row => row.contacts_count || 0, {
        id: 'contacts_count',
        header: 'Contacts',
        cell: ({ row }) => {
            const count = Number(row.getValue('contacts_count')) || 0
            return h(Badge, {
                class: count > 0 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-800/30 dark:text-blue-400' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
            }, () => count)
        },
        enableSorting: true,
        enableHiding: true,
        size: 100,
    }),
    columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            return h('div', { class: 'flex gap-2 justify-center' }, [
                h('button', {
                    onClick: (e: Event) => {
                        e.stopPropagation()
                        router.push(`/entity/company/${row.original.id}`)
                    },
                    class: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
                    title: 'Voir'
                }, [h(Eye, { class: 'h-4 w-4' })]),
                h('button', {
                    onClick: (e: Event) => {
                        e.stopPropagation()
                        handleDeleteRequest([row.original])
                    },
                    class: 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
                    title: 'Supprimer'
                }, [h(Trash, { class: 'h-4 w-4' })])
            ])
        },
        enableSorting: false,
        enableHiding: false,
        size: 100,
    })
]

// Convertir les colonnes pour le composant DataTable
const tableColumns = columns as ColumnDef<TableCompany>[]

// Settings pour le tableau
const tableSettings = {
    height: '70vh',
    fixedHeaderTop: true,
    stretchH: 'none',     // Ne pas étirer les colonnes
    autoWrapRow: false,   // Pas de retour à la ligne automatique
    wordWrap: false,      // Pas de retour à la ligne
    rowHeights: 32,       // Hauteur de ligne réduite
    currentRowClassName: 'current-row',
    currentColClassName: 'current-col',
    fixedWidth: true,     // Forcer la largeur fixe des colonnes
    tableLayout: 'fixed'  // Utiliser table-layout: fixed
}

// Fonction pour gérer la demande de suppression
const handleDeleteRequest = (rows: TableCompany[]) => {
    // Nous utilisons handleSelection pour contourner l'erreur de propriété en lecture seule
    handleSelection(rows)
    showConfirmDialog.value = true
}

// Fonction pour gérer l'export
function handleExport(format: string) {
    const dataToExport = selectedCompanies.value.length > 0
        ? selectedCompanies.value
        : companiesData.value

    // Convertir les colonnes pour l'export
    const exportColumns = columns
        .filter(col => 'accessorKey' in col || 'accessor' in col)
        .map(col => ({
            data: 'accessorKey' in col ? col.accessorKey as string : 
                 ('accessor' in col && typeof col.accessor === 'string' ? col.accessor : col.id),
            title: typeof col.header === 'string' ? col.header : col.id
        }))

    if (format === 'csv') {
        exportToCSV(dataToExport, exportColumns, 'liste-entreprises')
    } else if (format === 'excel') {
        exportToExcel(dataToExport, exportColumns, 'liste-entreprises')
    }
}

// Fonction pour confirmer la suppression
async function confirmDelete() {
    try {
        const companyIds = selectedCompanies.value.map(c => c.id)
        await deleteCompanies(companyIds)
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
    
    // Initialiser le tri après le montage du composant
    nextTick(() => {
        if (dataTableRef.value) {
            // Accéder à l'instance de la table
            const tableInstance = (dataTableRef.value as any).table
            
            // Définir le tri initial si l'instance existe
            if (tableInstance) {
                tableInstance.setSorting([{ id: 'name', desc: false }])
            }
        }
    })
})

// Nettoyage des écouteurs au démontage
onUnmounted(() => {
    // Si des écouteurs sont ajoutés, les nettoyer ici
})
</script>

<style>
/* Styles pour garantir les largeurs fixes */
:deep(table) {
  width: auto !important;
  table-layout: fixed !important;
}

:deep(th),
:deep(td) {
  box-sizing: border-box !important;
  white-space: nowrap !important;
  word-break: break-word !important;
}

:deep(.fixed-width-cell) {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

:deep(.truncate) {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  max-width: 100% !important;
  display: block !important;
}

/* Style pour optimiser l'affichage du tableau */
:deep(.current-row) {
  background-color: rgba(233, 237, 244, 0.4) !important;
}

:deep(.current-col) {
  background-color: rgba(233, 237, 244, 0.2) !important;
}

/* S'assurer que la barre d'outils latérale reste accessible en mode plein écran */
:deep(.full-width-container .absolute.-left-12) {
  left: 0 !important;
  z-index: 60 !important;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 8px 0;
  margin-left: 8px;
}

:deep(.dark .full-width-container .absolute.-left-12) {
  background-color: rgba(17, 24, 39, 0.8);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}
</style>