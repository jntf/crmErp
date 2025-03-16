# Migration du DataTable - Notes de refactorisation

Ce document explique la migration de l'ancienne architecture du DataTable vers la nouvelle version refactorisée. Il explique comment adapter le code existant qui utilisait les anciennes versions.

## Fichiers déplacés vers le dossier backup

Les fichiers suivants ont été déplacés dans le dossier `backup/` car ils sont remplacés par la nouvelle architecture :

- `DataTableHand.vue` - Remplacé par le nouveau composant `DataTable.vue`
- `DataTableToolbar.vue` - Remplacé par le nouveau composant `TableToolbar.vue`
- `DataTableExport.ts` - Remplacé par le composable `useTableExport.ts`

## Équivalence des fonctionnalités

| Ancienne fonctionnalité | Nouvelle implémentation |
|-------------------------|-------------------------|
| DataTableHand (Handsontable) | DataTable (TanStack Table) |
| DataTableToolbar | TableToolbar + DataTableSideToolbar |
| Fonction d'export | useTableExport + fonctions importables |
| Sélection de lignes | useTableSelection |
| Mode édition | useTableEditing |
| Colonnes visibles | Gestion via table.getVisibleLeafColumns() |

## Mise à jour des imports dans le code existant

Si votre code utilisait l'ancien DataTable, voici comment migrer:

### Avant :

```javascript
import { DataTableHand, DataTableToolbar } from '@/components/DataTable'
```

### Après :

```javascript
import { DataTable, TableToolbar } from '@/components/DataTable'
```

## Utilitaires d'export

Pour maintenir la compatibilité, les fonctions d'export sont toujours disponibles:

```javascript
// Toujours disponible pour compatibilité
import { exportToCSV, exportToExcel, exportToPDF } from '@/components/DataTable'

// Nouvelle méthode recommandée
import { useTableExport } from '@/components/DataTable'
const exporter = useTableExport(table)
exporter.handleExport('csv')
```

## Différences de propriétés

Le nouveau DataTable prend des propriétés légèrement différentes:

### DataTableHand (ancien)

```vue
<DataTableHand
  :tableData="data"
  :tableColumns="columns"
  :isEditable="true"
  :tableHeight="400"
/>
```

### DataTable (nouveau)

```vue
<DataTable
  :data="data"
  :columns="columns"
  :isEditable="true"
  :tableSettings="{ height: '400px' }"
  :row-selection="true"
  :pagination="true"
/>
```

## Événements émis

Les événements émis ont été maintenus pour assurer la compatibilité:

- `selection` - Émis lors de la sélection de lignes
- `change` - Émis lors de modifications de données
- `delete-request` - Émis pour les demandes de suppression de lignes
- `export` - Émis lors des demandes d'export

## Notes importantes

1. Le nouveau composant est plus modulaire et extensible
2. Les fichiers sauvegardés peuvent servir de référence mais ne doivent plus être utilisés
3. Tous les modules qui utilisaient l'ancien DataTable doivent être migrés vers le nouveau

## Prochaines étapes

- Mettre à jour toutes les références dans le code existant
- Tester les modules qui utilisaient l'ancien DataTable
- Documenter les éventuels problèmes rencontrés lors de la migration
