import { type ColumnDef } from '@tanstack/vue-table'
import { h, defineAsyncComponent } from 'vue'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-vue-next'

// Définir le composant TextWithHoverCard comme un composant asynchrone
// Cela permettra de l'importer à la demande sans bloquer le rendu initial
const TextWithHoverCard = defineAsyncComponent(() => 
  import('@/modules/stock/components/TextWithHoverCard.vue')
)

// Interface pour les colonnes Handsontable
export interface HandsontableColumn {
  data: string
  title: string
  type?: string
  width?: number
  format?: string
  suffix?: string
  className?: string
  readOnly?: boolean
  renderer?: (instance: any, td: HTMLElement, row: number, col: number, prop: string, value: any) => HTMLElement
}

/**
 * Convertit les définitions de colonnes Handsontable en définitions de colonnes TanStack Table
 * 
 * @param handsontableColumns Les colonnes au format Handsontable
 * @param cellRenderers Renderers personnalisés pour les cellules
 */
export function convertHandsontableColumns<T>(
  handsontableColumns: HandsontableColumn[],
  cellRenderers?: Record<string, (value: any, row: any) => string>
): ColumnDef<T, any>[] {
  return handsontableColumns.map(column => {
    const baseColumn: ColumnDef<T, any> = {
      accessorKey: column.data,
      header: ({ column }) => {
        // Colonne triable
        if (column.getCanSort()) {
          return h(Button, {
            variant: 'ghost',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
            class: 'p-0 hover:bg-transparent',
          }, () => [
            column.id,
            h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })
          ])
        }
        
        // Colonne non triable
        return column.id
      },
      enableSorting: true,
      enableHiding: true,
    }

    // Définir la largeur de la colonne si spécifiée
    if (column.width) {
      baseColumn.size = column.width;
    }

    // Liste des champs qui nécessitent un HoverCard pour le texte long
    const fieldsNeedingHoverCard = [
      'vehicle_serie', 
      'vehicle_options', 
      'version', 
      'description',
      'comments',
      'equipment',
      'features',
      'notes',
      'address',
      'full_name',
      'company_name'
    ];

    // Déterminer si cette colonne nécessite un HoverCard
    const needsHoverCard = fieldsNeedingHoverCard.includes(column.data) || 
                          (column.width && column.width < 150 && column.type === 'text');

    // En fonction du type de colonne et de ses besoins, personnaliser le rendu
    if (needsHoverCard) {
      // Utiliser le composant TextWithHoverCard défini en haut du fichier
      baseColumn.cell = ({ row }) => {
        const value = row.getValue<string>(column.data) || '';
        // On utilise directement le composant asynchrone
        return h(TextWithHoverCard, { 
          text: value, 
          maxLength: 50
        });
      };
    } else if (cellRenderers && cellRenderers[column.data]) {
      // Utiliser le renderer personnalisé HTML
      baseColumn.cell = ({ row }) => {
        const value = row.getValue(column.data);
        const html = cellRenderers[column.data](value, row.original);
        return h('div', { innerHTML: html });
      };
    } else {
      // Renderer par défaut en fonction du type
      switch (column.type) {
        case 'numeric':
          baseColumn.cell = ({ row }) => {
            const value = row.getValue<number>(column.data)
            let formatted = value?.toString() || ''
            
            // Formater les nombres selon le format défini
            if (column.format && value !== undefined && value !== null) {
              try {
                // Formater avec les séparateurs de milliers
                formatted = new Intl.NumberFormat('fr-FR').format(value)
              } catch (error) {
                console.error(`Erreur de formatage pour ${column.data}:`, error)
              }
            }
            
            // Ajouter le suffixe si défini
            if (column.suffix) {
              formatted = `${formatted}${column.suffix}`
            }
            
            return h('div', { 
              class: `text-xs ${column.className?.includes('htRight') ? 'text-right' : 
                    column.className?.includes('htCenter') ? 'text-center' : 'text-left'}`
            }, formatted)
          }
          break
          
        case 'date':
          baseColumn.cell = ({ row }) => {
            const value = row.getValue<string>(column.data)
            // Laisser la formatation de date à l'appelant pour l'instant
            return h('div', { 
              class: `text-xs ${column.className?.includes('htRight') ? 'text-right' : 
                    column.className?.includes('htCenter') ? 'text-center' : 'text-left'}`
            }, value || '')
          }
          break
          
        case 'checkbox':
          baseColumn.cell = ({ row }) => {
            const value = row.getValue<boolean>(column.data)
            return h('div', { 
              class: `text-xs ${column.className?.includes('htRight') ? 'text-right' : 
                    column.className?.includes('htCenter') ? 'text-center' : 'text-left'}`
            }, value ? '✓' : '')
          }
          break
          
        default:
          baseColumn.cell = ({ row }) => {
            const value = row.getValue<string>(column.data)
            return h('div', { 
              class: `text-xs ${column.className?.includes('htRight') ? 'text-right' : 
                    column.className?.includes('htCenter') ? 'text-center' : 'text-left'}`
            }, value || '')
          }
      }
    }

    return baseColumn
  })
}

/**
 * Utilitaire pour mettre à jour les valeurs des états dans TanStack Table
 */
export function valueUpdater<T>(updaterOrValue: T | ((prev: T) => T), ref: any) {
  ref.value = typeof updaterOrValue === 'function'
    ? (updaterOrValue as (prev: T) => T)(ref.value)
    : updaterOrValue
} 