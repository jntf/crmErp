# Module de Gestion des Contacts Importés

## Vue d'ensemble

Ce module est conçu pour gérer les contacts importés depuis des sources externes (comme Outlook) et fournir un système de notifications général pour l'application. Il permet de visualiser, modifier, approuver ou rejeter les contacts en attente directement depuis l'interface.

## Fonctionnalités principales

- Affichage et gestion des contacts importés en attente de validation
- Système de notifications pour alerter les utilisateurs des nouveaux contacts ou modifications
- Capacité de validation directe depuis les notifications
- Interface détaillée pour modifier les contacts avant validation

## Architecture

Le module suit une architecture modulaire basée sur les principes de Nuxt 3 et Vue 3 Composition API. Il utilise :

- **Supabase** pour le stockage et la récupération des données
- **Vue 3 Composition API** pour la logique réactive
- **TypeScript** pour le typage statique
- **Tailwind CSS** pour le styling

## Structure des dossiers

```
modules/contacts-import/
├── components/       # Composants UI spécifiques
│   └── NotificationsList.vue
├── composables/      # Logique réutilisable
│   ├── useContactsImport.ts
│   └── useNotifications.ts
├── pages/            # Pages de l'application
│   ├── index.vue     # Liste des contacts importés
│   └── [id].vue      # Détail d'un contact
├── types/            # Types et interfaces TypeScript
├── module.ts         # Configuration du module Nuxt
└── README.md         # Documentation
```

## Modèle de données

### Entités principales

- **ContactStaging** : Représente un contact importé en attente de validation
- **Notification** : Représente une notification liée à un contact ou autre entité

## Intégration avec l'application

Le module s'intègre à l'application principale de plusieurs façons :

1. **Barre de navigation supérieure** : Affiche un indicateur de notifications non lues
2. **Popover de notifications** : Permet de voir et gérer les notifications directement
3. **Pages dédiées** : Offre une interface complète pour la gestion des contacts

## Tables Supabase

Le module utilise deux tables principales dans Supabase :

- `contacts_staging` : Stocke les contacts importés en attente de validation
- `notifications` : Stocke les notifications associées

## Utilisation

### Affichage des notifications

Le composant `NotificationsList` peut être intégré dans n'importe quelle partie de l'application pour afficher les notifications en cours :

```vue
<NotificationsList @close="handleClose" @refresh="refreshData" />
```

### Récupération des notifications

Utilisez le composable `useNotifications` pour accéder aux fonctionnalités de notification :

```typescript
const { notifications, totalUnread, fetchNotifications, markAsRead } = useNotifications()

// Charger les notifications de l'utilisateur actuel
await fetchNotifications(userEmail)
```

### Gestion des contacts importés

Utilisez le composable `useContactsImport` pour gérer les contacts :

```typescript
const { pendingContacts, approveContact, rejectContact } = useContactsImport()

// Récupérer les contacts en attente
await fetchPendingContacts()

// Approuver un contact
await approveContact(contactId, approverEmail)
```

## Extension du module

Pour étendre le module avec de nouvelles fonctionnalités :

1. Ajouter de nouveaux types dans `types/index.ts`
2. Créer les composables nécessaires dans le dossier `composables/`
3. Développer les composants UI dans le dossier `components/`
4. Ajouter les nouvelles pages si nécessaire 