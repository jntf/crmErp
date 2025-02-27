# Diagramme de la Logique des Ventes

Ce document présente la logique métier des ventes dans le module Orders de l'application CRM/ERP spécialisée dans la vente et l'intermédiation de véhicules.

## Types de Vente et Parties Impliquées

```mermaid
graph TB
    subgraph "Types de Vente"
        direction TB
        
        subgraph "Vente à la Marge"
            MARGIN_UNIT["Vente Unitaire<br>(B2C ou B2B)"]
            MARGIN_BULK["Vente par Lot<br>(uniquement B2B)"]
        end
        
        subgraph "Vente d'Intermédiation"
            B2B2B["B2B2B<br>(Entreprise à Entreprise)"]
            B2B2C["B2B2C<br>(Entreprise à Particulier)"]
            C2B2C["C2B2C<br>(Particulier à Particulier)"]
            C2B2B["C2B2B<br>(Particulier à Entreprise)"]
        end
    end
    
    subgraph "Parties Impliquées"
        BUYER_COMPANY["Entreprise Acheteuse"]
        SELLER_COMPANY["Entreprise Vendeuse"]
        BUYER_CONTACT["Contact Acheteur"]
        SELLER_CONTACT["Contact Vendeur"]
        OWNER["Entreprise Owner<br>(Intermédiaire)"]
        BUSINESS_PROVIDER["Apporteur d'Affaire<br>(Société ou Particulier)"]
    end
    
    %% Vente à la marge unitaire
    MARGIN_UNIT -->|"Vendeur"| OWNER
    MARGIN_UNIT -->|"Acheteur"| BUYER_COMPANY
    MARGIN_UNIT -->|"Acheteur"| BUYER_CONTACT
    MARGIN_UNIT -->|"Commission possible"| BUSINESS_PROVIDER
    
    %% Vente à la marge par lot
    MARGIN_BULK -->|"Vendeur"| OWNER
    MARGIN_BULK -->|"Acheteur"| BUYER_COMPANY
    MARGIN_BULK -->|"Commission possible"| BUSINESS_PROVIDER
    
    %% Vente d'intermédiation B2B2B
    B2B2B -->|"Vendeur"| SELLER_COMPANY
    B2B2B -->|"Acheteur"| BUYER_COMPANY
    B2B2B -->|"Intermédiaire"| OWNER
    B2B2B -->|"Commission"| OWNER
    B2B2B -->|"Commission possible"| BUSINESS_PROVIDER
    
    %% Vente d'intermédiation B2B2C
    B2B2C -->|"Vendeur"| SELLER_COMPANY
    B2B2C -->|"Acheteur"| BUYER_CONTACT
    B2B2C -->|"Intermédiaire"| OWNER
    B2B2C -->|"Commission"| OWNER
    B2B2C -->|"Commission possible"| BUSINESS_PROVIDER
    
    %% Vente d'intermédiation C2B2C
    C2B2C -->|"Vendeur"| SELLER_CONTACT
    C2B2C -->|"Acheteur"| BUYER_CONTACT
    C2B2C -->|"Intermédiaire"| OWNER
    C2B2C -->|"Commission"| OWNER
    C2B2C -->|"Commission possible"| BUSINESS_PROVIDER
    
    %% Vente d'intermédiation C2B2B
    C2B2B -->|"Vendeur"| SELLER_CONTACT
    C2B2B -->|"Acheteur"| BUYER_COMPANY
    C2B2B -->|"Intermédiaire"| OWNER
    C2B2B -->|"Commission"| OWNER
    C2B2B -->|"Commission possible"| BUSINESS_PROVIDER
```

## Processus de Vente

```mermaid
flowchart TD
    START[Début du Processus] --> ADD_VEHICLE[Ajout des Véhicules<br>API, CSV, ou Manuel]
    ADD_VEHICLE --> SELECT_SALE_TYPE[Sélection du Type de Vente]
    
    SELECT_SALE_TYPE --> IS_MARGIN{Vente à la Marge?}
    
    %% Vente à la marge
    IS_MARGIN -->|Oui| IS_BULK{Vente par Lot?}
    IS_BULK -->|Non| SELECT_BUYER_TYPE{Type d'Acheteur?}
    SELECT_BUYER_TYPE -->|Particulier| SELECT_CONTACT[Sélection du Contact Acheteur]
    SELECT_BUYER_TYPE -->|Entreprise| SELECT_COMPANY[Sélection de l'Entreprise Acheteuse]
    
    IS_BULK -->|Oui| SELECT_COMPANY
    
    SELECT_CONTACT --> CONFIGURE_MARGIN_COMMISSION[Configuration Commission Apporteur<br>sur la Marge]
    SELECT_COMPANY --> CONFIGURE_MARGIN_COMMISSION
    
    CONFIGURE_MARGIN_COMMISSION --> CALCULATE_TOTALS[Calcul des Totaux et TVA]
    
    %% Vente d'intermédiation
    IS_MARGIN -->|Non| SELECT_INTERMEDIATION_TYPE{Type d'Intermédiation?}
    
    SELECT_INTERMEDIATION_TYPE -->|B2B2B| SELECT_COMPANIES[Sélection des Entreprises<br>Vendeuse et Acheteuse]
    SELECT_INTERMEDIATION_TYPE -->|B2B2C| SELECT_COMPANY_CONTACT[Sélection Entreprise Vendeuse<br>et Contact Acheteur]
    SELECT_INTERMEDIATION_TYPE -->|C2B2C| SELECT_CONTACTS[Sélection des Contacts<br>Vendeur et Acheteur]
    SELECT_INTERMEDIATION_TYPE -->|C2B2B| SELECT_CONTACT_COMPANY[Sélection Contact Vendeur<br>et Entreprise Acheteuse]
    
    SELECT_COMPANIES --> CONFIGURE_INTERMEDIATION_COMMISSION[Configuration des Commissions<br>par Véhicule]
    SELECT_COMPANY_CONTACT --> CONFIGURE_INTERMEDIATION_COMMISSION
    SELECT_CONTACTS --> CONFIGURE_INTERMEDIATION_COMMISSION
    SELECT_CONTACT_COMPANY --> CONFIGURE_INTERMEDIATION_COMMISSION
    
    CONFIGURE_INTERMEDIATION_COMMISSION --> DEFINE_PAYER{Qui Paie la Commission?}
    DEFINE_PAYER -->|Vendeur| ADD_SELLER_COMMISSION[Ajout Commission Vendeur]
    DEFINE_PAYER -->|Acheteur| ADD_BUYER_COMMISSION[Ajout Commission Acheteur]
    DEFINE_PAYER -->|Les Deux| ADD_BOTH_COMMISSIONS[Ajout Commission<br>Vendeur et Acheteur]
    
    ADD_SELLER_COMMISSION --> ADD_PROVIDER[Ajout Commission<br>Apporteur d'Affaire]
    ADD_BUYER_COMMISSION --> ADD_PROVIDER
    ADD_BOTH_COMMISSIONS --> ADD_PROVIDER
    
    ADD_PROVIDER --> CALCULATE_TOTALS
    
    CALCULATE_TOTALS --> SAVE_ORDER[Enregistrement de la Commande]
    SAVE_ORDER --> END[Fin du Processus]
```

## Logique de Calcul des Commissions

```mermaid
flowchart TD
    START[Début Calcul Commission] --> SALE_TYPE{Type de Vente?}
    
    %% Vente à la marge
    SALE_TYPE -->|Marge| HAS_PROVIDER{Apporteur d'Affaire?}
    HAS_PROVIDER -->|Non| NO_COMMISSION[Pas de Commission]
    HAS_PROVIDER -->|Oui| MARGIN_CALC[Calcul Commission<br>sur la Marge]
    MARGIN_CALC --> APPLY_DEGRESSIVE[Application Taux<br>Dégressif]
    
    %% Vente d'intermédiation
    SALE_TYPE -->|Intermédiation| PER_VEHICLE[Commission par Véhicule<br>Montant Fixe]
    PER_VEHICLE --> COMMISSION_PAYER{Qui Paie?}
    
    COMMISSION_PAYER -->|Vendeur| SELLER_COMMISSION[Commission Facturée<br>au Vendeur]
    COMMISSION_PAYER -->|Acheteur| BUYER_COMMISSION[Commission Facturée<br>à l'Acheteur]
    COMMISSION_PAYER -->|Les Deux| BOTH_COMMISSION[Commissions Distinctes<br>Vendeur et Acheteur]
    
    SELLER_COMMISSION --> PROVIDER_CHECK{Apporteur d'Affaire?}
    BUYER_COMMISSION --> PROVIDER_CHECK
    BOTH_COMMISSION --> PROVIDER_CHECK
    
    PROVIDER_CHECK -->|Oui| DEDUCT_PROVIDER[Déduction Commission<br>Apporteur]
    PROVIDER_CHECK -->|Non| FINALIZE[Finalisation Commission]
    
    DEDUCT_PROVIDER --> FINALIZE
    APPLY_DEGRESSIVE --> FINALIZE
    NO_COMMISSION --> FINALIZE
    
    FINALIZE --> END[Fin Calcul Commission]
```

## Logique de Calcul de TVA

```mermaid
flowchart TD
    START[Calcul TVA] --> SALE_TYPE{Type de Vente}
    
    %% Vente à la marge
    SALE_TYPE -->|Marge| BUYER_TYPE{Type d'Acheteur?}
    BUYER_TYPE -->|Particulier| APPLY_SELLER_COUNTRY[Taux du Pays du Vendeur<br>(Owner)]
    
    BUYER_TYPE -->|Entreprise| COUNTRY_CHECK{Même Pays?}
    COUNTRY_CHECK -->|Oui| LOCAL_RATE[Taux Local du Pays]
    COUNTRY_CHECK -->|Non| EU_CHECK{Tous deux dans UE?}
    
    EU_CHECK -->|Oui| IS_B2B{Vente B2B?}
    IS_B2B -->|Oui| ZERO_TVA[Pas de TVA (0%)]
    IS_B2B -->|Non| SELLER_COUNTRY[Taux du Pays<br>du Vendeur]
    
    EU_CHECK -->|Non| SELLER_COUNTRY
    
    %% Vente d'intermédiation
    SALE_TYPE -->|Intermédiation| INTERMEDIATION_PARTIES{Parties Impliquées}
    INTERMEDIATION_PARTIES --> CALC_FOR_EACH[Calcul Séparé<br>pour Chaque Partie]
    
    CALC_FOR_EACH --> COMPANY_COUNTRY_CHECK{Même Pays pour<br>les Entreprises?}
    COMPANY_COUNTRY_CHECK -->|Oui| INTER_LOCAL_RATE[Taux Local]
    COMPANY_COUNTRY_CHECK -->|Non| INTER_EU_CHECK{Tous dans UE?}
    
    INTER_EU_CHECK -->|Oui| INTER_B2B{Entre Entreprises?}
    INTER_B2B -->|Oui| INTER_ZERO_TVA[Pas de TVA (0%)]
    INTER_B2B -->|Non| INTER_SELLER_RATE[Taux du Pays<br>du Vendeur]
    
    INTER_EU_CHECK -->|Non| INTER_SELLER_RATE
    
    APPLY_SELLER_COUNTRY --> FINAL_CALC[Calcul Final]
    LOCAL_RATE --> FINAL_CALC
    ZERO_TVA --> FINAL_CALC
    SELLER_COUNTRY --> FINAL_CALC
    INTER_LOCAL_RATE --> FINAL_CALC
    INTER_ZERO_TVA --> FINAL_CALC
    INTER_SELLER_RATE --> FINAL_CALC
    
    FINAL_CALC --> END[Fin Calcul TVA]
```

## Relations entre Entités

```mermaid
erDiagram
    orders ||--o{ order_items : "contient"
    order_items ||--o{ vehicle_commissions : "peut avoir"
    vehicle_commissions ||--o{ commission_invoices : "peut avoir"
    vehicles ||--o{ order_items : "est commandé dans"
    commission_types ||--o{ vehicle_commissions : "définit"
    vehicles ||--o| vehicle_features : "possède"
    vehicles ||--o| vehicle_prices : "possède"
    vehicles ||--o{ vehicle_stock : "est géré dans"
    order_items ||--o| vehicle_stock : "peut référencer"
    
    orders {
        bigint id PK
        varchar order_number
        timestamp order_date
        varchar sale_type
        bigint contact_id FK
        bigint buyer_company_id FK
        bigint seller_company_id FK
        numeric total_ht
        numeric total_tva
        numeric total_ttc
        varchar status
        text comments
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    order_items {
        bigint id PK
        bigint order_id FK
        uuid vehicle_id FK
        varchar vehicle_internal_id FK
        integer quantity
        numeric unit_price_ht
        numeric tva_rate
        numeric total_ht
        numeric total_tva
        numeric total_ttc
        boolean is_paid
        varchar status
        boolean is_delivered
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    vehicle_commissions {
        bigint id PK
        bigint order_item_id FK
        bigint commission_type_id FK
        numeric amount
        numeric rate
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    commission_invoices {
        bigint id PK
        bigint vehicle_commission_id FK
        bigint issuer_id
        bigint recipient_id
        varchar recipient_type
        varchar external_invoice_id
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    vehicles {
        uuid id PK
        varchar internal_id UK
        varchar source
        varchar external_id
        varchar vin UK
        varchar brand
        varchar model
        varchar version
        date registration_date
        integer year
        integer mileage
        varchar fuel_type
        varchar transmission
        integer doors
        integer seats
        varchar color
        integer power_hp
        integer power_fiscal
        integer co2_emissions
        varchar registration_number
        integer qty
        timestamp created_at
        timestamp updated_at
    }

    vehicle_features {
        uuid id PK
        uuid vehicle_id FK,UK
        jsonb features
        timestamp created_at
    }

    vehicle_prices {
        uuid id PK
        uuid vehicle_id FK,UK
        numeric purchase_price_ht
        numeric selling_price_ht
        numeric vat_rate
        numeric repair_cost
        numeric frevo
        timestamp created_at
        timestamp updated_at
    }

    vehicle_stock {
        uuid id PK
        uuid vehicle_id FK
        varchar vin
        enum status
        timestamp stocked_at
        varchar location
        text notes
        varchar created_by
        varchar updated_by
        bigint order_item_id FK
        timestamp created_at
        timestamp updated_at
    }

    commission_types {
        bigint id PK
        varchar name
        varchar code
        text description
        boolean is_active
    }
```

## Notes sur les Contraintes de Données

La table `orders` possède une contrainte de validation qui impose des règles selon le type de vente:

- Pour `sale_type='B2C'`: `contact_id` doit être renseigné, `buyer_company_id` et `seller_company_id` doivent être NULL
- Pour `sale_type='B2B'`: `buyer_company_id` doit être renseigné, `contact_id` et `seller_company_id` doivent être NULL
- Pour `sale_type='B2B2B'`: `buyer_company_id` et `seller_company_id` doivent être renseignés, `contact_id` doit être NULL

Pour les nouveaux types d'intermédiation (B2B2C, C2B2C, C2B2B), des modifications de schéma seront nécessaires. Ces types pourraient être gérés via le champ `metadata` en attendant la mise à jour du modèle de données.

## Gestion des Véhicules et du Stock

Le système gère les véhicules à travers plusieurs tables spécialisées:

- `vehicles`: Contient les informations de base sur chaque véhicule (marque, modèle, VIN, etc.)
- `vehicle_features`: Stocke les caractéristiques détaillées du véhicule sous forme de JSON
- `vehicle_prices`: Gère les informations de prix (achat, vente, TVA, coûts de réparation)
- `vehicle_stock`: Suit l'état du stock des véhicules (commandé, en stock, vendu, etc.)

Un véhicule peut exister dans le système sans être nécessairement en stock. Le stock est lié à une instance physique d'un véhicule, tandis que la table `vehicles` peut contenir des véhicules qui sont en commande, proposés à la vente, ou simplement dans le catalogue.

L'intégration entre les ventes et le stock se fait via la table `vehicle_stock` qui peut référencer un `order_item_id`, ce qui permet de suivre quels véhicules en stock sont associés à quelles commandes.

## Flux de Travail des Commissions

```mermaid
sequenceDiagram
    participant User as Utilisateur
    participant Order as Commande
    participant Vehicle as Véhicule
    participant Margin as Calcul Marge
    participant Commission as Commission
    participant Invoice as Facture
    
    User->>Vehicle: Ajoute véhicules (API, CSV, Manuel)
    User->>Order: Sélectionne type de vente
    
    alt Vente à la Marge
        User->>Order: Définit acheteur (Particulier/Entreprise)
        Order->>Margin: Calcule marge par véhicule
        
        opt Commission Apporteur
            User->>Commission: Configure commission sur marge
            Commission->>Commission: Applique taux dégressif
        end
        
    else Vente d'Intermédiation
        User->>Order: Définit vendeur et acheteur
        
        User->>Commission: Configure commission par véhicule
        User->>Commission: Définit qui paie (Vendeur/Acheteur/Les deux)
        
        opt Commission Apporteur
            User->>Commission: Ajoute commission apporteur
        end
    end
    
    Order->>Order: Calcule totaux (HT, TVA, TTC)
    User->>Order: Enregistre la commande
    
    par Facturation des Commissions
        User->>Invoice: Génère facture de commission
        Invoice->>Commission: Associe à la commission
    end
``` 