# DataTable pour le CRM-ERP

Ce dossier contient deux implémentations de DataTable :

1. **DataTable** - Nouvelle implémentation basée sur shadcn/TanStack Table (recommandée)
2. **DataTableHand** - Ancienne implémentation basée sur Handsontable (à des fins de rétrocompatibilité)

## Nouvelle implémentation (DataTable)

La nouvelle implémentation est basée sur [TanStack Table](https://tanstack.com/table) et les composants UI de shadcn. Elle offre une expérience utilisateur moderne, des performances améliorées et une meilleure intégration avec le reste de l'UI.

### Fonctionnalités

- Pagination
- Tri des colonnes
- Filtrage
- Sélection de lignes
- Visibilité des colonnes
- Rendu de cellules personnalisé
- Intégration avec shadcn UI
- Thème Tailwind CSS

### Utilisation de base

```vue
<template>
  <DataTable
    :columns="columns"
    :data="data"
    :loading-state="loading"
    :pagination="true"
    :searchable="true"
    search-field="brand"
    :column-toggle="true"
    :row-selection="true"
    @selection="handleSelection"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DataTable } from '@/components/DataTable'
import { type ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'

// Définition des types de données
interface Vehicle {
  id: string
  brand: string
  model: string
  // ...
}

// État
const data = ref<Vehicle[]>([])
const loading = ref(false)

// Définition des colonnes
const columns: ColumnDef<Vehicle, any>[] = [
  {
    accessorKey: 'brand',
    header: 'Marque',
    cell: ({ row }) => h('div', {}, row.getValue('brand')),
  },
  {
    accessorKey: 'model',
    header: 'Modèle',
    cell: ({ row }) => h('div', {}, row.getValue('model')),
  },
  // ...
]

// Gestion des événements
function handleSelection(rows: Vehicle[]) {
  console.log('Lignes sélectionnées:', rows)
}
</script>
```

### Props disponibles

| Prop | Type | Description | Par défaut |
|------|------|-------------|------------|
| `columns` | `ColumnDef<TData, any>[]` | Définitions des colonnes (format TanStack Table) | **Requis** |
| `data` | `TData[]` | Données à afficher | **Requis** |
| `loadingState` | `boolean` | État de chargement | `false` |
| `pagination` | `boolean` | Activer la pagination | `false` |
| `searchable` | `boolean` | Activer la recherche | `false` |
| `searchField` | `string` | Champ sur lequel effectuer la recherche | - |
| `columnToggle` | `boolean` | Permettre de masquer/afficher les colonnes | `false` |
| `rowSelection` | `boolean` | Permettre la sélection des lignes | `false` |

### Événements émis

| Événement | Paramètres | Description |
|-----------|------------|-------------|
| `selection` | `selectedRows: TData[]` | Émis lorsque la sélection de lignes change |
| `change` | `changes: any` | Émis lorsque les données sont modifiées |
| `delete-request` | `rows: TData[]` | Émis lorsqu'une demande de suppression est effectuée |

### Conversion depuis Handsontable

Pour faciliter la migration depuis l'ancienne implémentation, vous pouvez utiliser la fonction `convertHandsontableColumns` :

```ts
import { convertHandsontableColumns, type HandsontableColumn } from '@/components/DataTable'

// Anciennes définitions de colonnes Handsontable
const oldColumns: HandsontableColumn[] = [
  { data: 'brand', title: 'Marque', type: 'text' },
  { data: 'price', title: 'Prix', type: 'numeric', format: '0,0', suffix: ' €' },
  // ...
]

// Conversion vers le format TanStack Table
const newColumns = convertHandsontableColumns(oldColumns)
```

## Exemple complet

Consultez le fichier d'exemple dans `/components/DataTable/examples/SimpleExample.vue` pour un exemple complet d'utilisation.

## Ancienne implémentation (DataTableHand)

L'ancienne implémentation est conservée pour des raisons de compatibilité. Vous pouvez continuer à l'utiliser en important `DataTableHand` au lieu de `DataTable`. 