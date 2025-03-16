# DataTable - Composant de tableau avancé

Ce composant de tableau avancé offre de nombreuses fonctionnalités comme le tri, la pagination, la recherche, la sélection de lignes, l'épinglage de colonnes et le mode édition.

## Structure du projet

```
components/DataTable/
├── DataTable.vue                  # Composant principal
├── index.ts                       # Point d'entrée avec exportations
├── components/                    # Sous-composants
│   ├── TableHeader.vue            # En-tête de la table
│   ├── TableBody.vue              # Corps de la table
│   ├── TablePagination.vue        # Pagination
│   ├── TableToolbar.vue           # Barre d'outils principale
│   └── KeyboardShortcutsHelp.vue  # Aide pour les raccourcis clavier
├── composables/                   # Logique réutilisable (Composition API)
│   ├── useTableState.ts           # Gestion de l'état global de la table
│   ├── useTableSelection.ts       # Sélection de lignes
│   ├── useTablePinning.ts         # Épinglage des colonnes
│   ├── useTableEditing.ts         # Mode édition
│   ├── useTablePagination.ts      # Pagination
│   ├── useTableSearch.ts          # Recherche
│   └── useTableExport.ts          # Fonctionnalités d'export
├── types/                         # Définitions de types TypeScript
│   └── table-types.ts             # Types pour le DataTable
└── utils/                         # Utilitaires existants
    └── tanstack/                  # Utilitaires pour TanStack Table
        ├── column-helpers.ts      # Helpers pour les colonnes
        └── DataTableSideToolbar.vue # Barre d'outils latérale
```

## Utilisation

### Exemple de base

```vue
<template>
  <DataTable
    :columns="columns"
    :data="data"
    :pagination="true"
    :searchable="true"
    :column-toggle="true"
    :row-selection="true"
  />
</template>

<script setup lang="ts">
import { DataTable } from '@/components/DataTable'
import { ref } from 'vue'

const columns = [
// Définition des colonnes
]

const data = ref([
  // Données du tableau
])
</script>
```

### Props du composant principal

| Nom | Type | Défaut | Description |
|-----|------|--------|-------------|
| columns | ColumnDef<TData, any>[] | - | Définitions des colonnes |
| data | TData[] | - | Données à afficher |
| loadingState | boolean | false | État de chargement |
| pagination | boolean | false | Activer/désactiver pagination |
| searchable | boolean | false | Activer/désactiver recherche |
| searchField | string | - | Champ de recherche |
| columnToggle | boolean | false | Visibilité des colonnes |
| columnPinning | boolean | false | Épinglage des colonnes (gauche uniquement) |
| rowSelection | boolean | false | Sélection de lignes |
| tableSettings | Record<string, any> | - | Paramètres supplémentaires du tableau |
| tableLayout | 'auto' \| 'fixed' | 'fixed' | Disposition du tableau |
| pageSizes | number[] | [10, 25, 50, 100, 500] | Tailles de page disponibles |
| showKeyboardShortcutsHelp | boolean | false | Afficher l'aide sur les raccourcis clavier |
| sideToolbar | boolean | false | Utiliser la barre d'outils latérale |
| isEditable | boolean | false | Activer/désactiver le mode édition |
| exportFilename | string | - | Nom de fichier pour l'export |

### Événements émis

| Nom | Données | Description |
|-----|---------|-------------|
| selection | selectedRows: TData[] | Changement de sélection des lignes |
| change | changes: any | Modifications des données |
| delete-request | rows: TData[] | Demande de suppression de lignes |
| export | format: string, data: any[], columns: any[] | Demande d'export |
| toggle-readonly | - | Basculement entre mode lecture/édition |
| save-changes | changes: Record<string, any>[] | Sauvegarde des modifications |
| cancel-changes | - | Annulation des modifications |

## Fonctionnalités

### Raccourcis clavier

- **Shift + Clic** : Sélectionner plusieurs lignes consécutives
- **Ctrl/Cmd + Clic** : Sélectionner/désélectionner une ligne sans affecter les autres
- **Ctrl/Cmd + A** : Sélectionner toutes les lignes
- **Échap** : Désélectionner toutes les lignes

### Mode édition

Le mode édition permet de modifier les cellules directement dans le tableau. Pour l'activer, définissez `isEditable` à `true`. Les modifications sont temporaires jusqu'à ce qu'elles soient enregistrées avec le bouton "Enregistrer".

### Épinglage des colonnes

L'épinglage des colonnes permet de garder certaines colonnes toujours visibles lors du défilement horizontal. Pour l'activer, définissez `columnPinning` à `true`.

### Barre d'outils latérale

La barre d'outils latérale offre des fonctionnalités supplémentaires comme l'export, le mode plein écran, et l'accès rapide à l'aide sur les raccourcis clavier. Pour l'activer, définissez `sideToolbar` à `true`.

## Personnalisation des styles

Les styles peuvent être personnalisés en modifiant les classes CSS. Le composant utilise Tailwind CSS et les classes sont organisées de manière logique pour faciliter la personnalisation.

## Optimisations

Cette version refactorisée du DataTable améliore considérablement la maintenabilité et la performance par rapport à l'ancienne version monolithique, tout en conservant toutes les fonctionnalités.
