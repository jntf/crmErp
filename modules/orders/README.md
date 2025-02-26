# Module Orders

## Vue d'ensemble

Le module Orders est un composant central de l'application CRM/ERP qui gère l'ensemble du processus de commande de véhicules. Il permet de créer, consulter, modifier et suivre les commandes, ainsi que de gérer les commissions associées aux ventes de véhicules.

Ce module s'intègre avec d'autres modules du système, notamment le module de stock pour la gestion des véhicules et le module de contacts/entreprises pour la gestion des parties impliquées dans les transactions.

## Fonctionnalités principales

- Création et gestion des commandes de véhicules
- Support de différents types de vente (B2B, B2C, B2B2B, P2P, B2P, P2B)
- Calcul automatique des totaux, TVA et marges
- Gestion des commissions sur les ventes
- Suivi des statuts des commandes
- Génération de documents PDF

## Architecture

Le module Orders suit une architecture modulaire basée sur les principes de Nuxt 3 et Vue 3 Composition API. Il utilise :

- **Pinia** pour la gestion de l'état
- **Supabase** pour le stockage et la récupération des données
- **TypeScript** pour le typage statique
- **Tailwind CSS** pour le styling

## Structure des dossiers

```
modules/orders/
├── components/       # Composants UI spécifiques aux commandes
│   ├── actions/      # Boutons et actions
│   └── ui/           # Composants UI réutilisables
├── composables/      # Logique réutilisable
├── pages/            # Pages de l'application
│   ├── [id]/         # Pages de détail et d'édition
│   └── commissions/  # Pages de gestion des commissions
├── stores/           # Stores Pinia
├── types/            # Types et interfaces TypeScript
└── module.ts         # Configuration du module Nuxt
```

## Modèle de données

### Entités principales

- **Order** : Représente une commande avec ses métadonnées (client, vendeur, totaux, etc.)
- **OrderItem** : Représente un article de commande (généralement un véhicule)
- **VehicleCommission** : Représente une commission sur la vente d'un véhicule
- **CommissionInvoice** : Représente une facture de commission

### Relations

- Une commande (Order) contient plusieurs articles (OrderItems)
- Un article de commande (OrderItem) peut avoir plusieurs commissions (VehicleCommissions)
- Une commission (VehicleCommission) peut avoir une facture associée (CommissionInvoice)

## Flux de travail principaux

### Création d'une commande

1. Sélection du type de vente (B2B, B2C, etc.)
2. Sélection des parties impliquées (acheteur, vendeur)
3. Ajout des véhicules à la commande
4. Configuration des commissions (si applicable)
5. Enregistrement de la commande

### Gestion des commissions

1. Ajout de commissions aux articles de commande
2. Définition des bénéficiaires et des montants
3. Suivi des factures de commission

## Intégration avec Supabase

Le module utilise plusieurs tables et fonctions dans Supabase :

- Tables : `orders`, `order_items`, `vehicle_commissions`, `commission_invoices`
- Fonctions : `get_commissions()`, `fn_get_tva_rate()`

## Extension du module

Pour étendre le module avec de nouvelles fonctionnalités :

1. Ajouter les nouveaux types dans `types/index.ts`
2. Créer les composants nécessaires dans le dossier `components/`
3. Mettre à jour les stores pour gérer les nouvelles données
4. Ajouter les nouvelles pages si nécessaire

## Dépendances

- Module de stock (pour la gestion des véhicules)
- Module de contacts (pour la gestion des clients et entreprises) 