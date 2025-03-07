/**
 * Types de vente supportés par le module Orders
 * @typedef {string} SaleType
 */
export type SaleType = 
  // Ventes directes
  | 'B2C'    // Business to Consumer (Entreprise à Particulier)
  | 'B2B'    // Business to Business (Entreprise à Entreprise)
  // Ventes d'intermédiation
  | 'B2B2B'  // Business to Business to Business (Entreprise à Entreprise via Intermédiaire)
  | 'B2B2C'  // Business to Business to Consumer (Entreprise à Particulier via Intermédiaire)
  | 'C2B2C'  // Consumer to Business to Consumer (Particulier à Particulier via Intermédiaire)
  | 'C2B2B'  // Consumer to Business to Business (Particulier à Entreprise via Intermédiaire)

/**
 * Statuts possibles pour une commande
 * @typedef {string} OrderStatus
 */
export type OrderStatus = 'DRAFT' | 'PENDING' | 'VALIDATED' | 'CANCELLED' | 'COMPLETED'

/**
 * Statuts possibles pour un paiement
 * @typedef {string} PaymentStatus
 */
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

/**
 * Types de commission supportés
 * @typedef {string} CommissionType
 */
export type CommissionType = 'MANDATE' | 'INTERMEDIARY' | 'PRIVATE_SALE'

/**
 * Interface représentant un pays
 * @interface CountryInfo
 */
export interface CountryInfo {
  /** Identifiant unique du pays */
  id: number;
  /** Code ISO à 2 lettres */
  iso_code_2: string;
  /** Nom du pays */
  name: string;
  /** Taux de TVA standard */
  tva_rate: number;
  /** Indique si le pays est membre de l'UE */
  is_eu_member: boolean;
}

/**
 * Interface représentant un contact (client particulier)
 * @interface Contact
 */
export interface Contact {
  /** Identifiant unique du contact */
  id: number
  /** Nom complet du contact */
  name: string
  /** Prénom du contact */
  first_name?: string
  /** Nom de famille du contact */
  last_name?: string
  /** Pays du contact */
  country: CountryInfo | null
}

/**
 * Interface représentant une entreprise (client professionnel)
 * @interface Company
 */
export interface Company {
  /** Identifiant unique de l'entreprise */
  id: number
  /** Nom de l'entreprise */
  name: string
  /** Numéro de TVA */
  vat_number?: string
  /** Code NAF / APE */
  domain?: string
  /** Email de l'entreprise */
  email?: string
  /** Téléphone de l'entreprise */
  phone?: string
  /** Pays de l'entreprise */
  country: CountryInfo | null
}

/**
 * Interface représentant un véhicule
 * @interface Vehicle
 */
export interface Vehicle {
  /** Identifiant unique du véhicule */
  id: number | string
  /** Référence interne du véhicule */
  internal_id: string
  /** Marque du véhicule */
  brand: string
  /** Modèle du véhicule */
  model: string
  /** Version du véhicule (optionnel) */
  version?: string
  /** Couleur du véhicule (optionnel) */
  color?: string
  /** Numéro d'identification du véhicule (VIN) */
  vin: string | null
  /** Numéro d'immatriculation (optionnel) */
  registration_number?: string
  /** Date d'immatriculation (optionnel) */
  registration_date?: string | null
  /** Kilométrage du véhicule (optionnel) */
  mileage?: number
  /** Année de mise en circulation (optionnel) */
  year?: number
  /** Type de stock (existant ou commande usine) */
  stock_type?: 'existing' | 'factory_order'
  /** Quantité disponible (par défaut 1) */
  qty?: number
  /** Informations de prix du véhicule */
  vehicle_prices?: {
    /** Prix d'achat HT */
    purchase_price_ht: number
    /** Prix de vente HT */
    selling_price_ht: number
    /** Frais de mise en service (FREVO) */
    frevo: number
    /** Taux de TVA applicable */
    vat_rate?: number
  }
}

/**
 * Interface représentant un article de commande (généralement un véhicule)
 * @interface OrderItem
 */
export interface OrderItem {
  /** Identifiant unique de l'article */
  id: number
  /** Identifiant de la commande parente */
  orderId: number
  /** Identifiant du véhicule associé */
  vehicleId: string | number
  /** Référence interne du véhicule */
  vehicleInternalId: string
  /** Quantité commandée */
  quantity: number
  /** Prix d'achat HT */
  purchasePriceHt: number
  /** Prix unitaire HT */
  unitPriceHt: number
  /** Prix de vente HT */
  sellingPriceHt: number
  /** Taux de TVA applicable */
  tvaRate: number
  /** Total HT */
  totalHt: number
  /** Montant de TVA */
  totalTva: number
  /** Total TTC */
  totalTtc: number
  /** Indique si l'article est payé */
  isPaid: boolean
  /** Statut de l'article */
  status: OrderStatus
  /** Indique si l'article a été livré */
  isDelivered: boolean
  /** Type de stock (existant ou commande usine) */
  stockType?: 'existing' | 'factory_order'
  /** Métadonnées additionnelles */
  metadata?: Record<string, any>
  /** Véhicule associé (optionnel) */
  vehicle?: Vehicle | null
}

/**
 * Interface représentant une commission sur un véhicule
 * @interface VehicleCommission
 */
export interface VehicleCommission {
  /** Identifiant unique de la commission */
  id: number
  /** Identifiant de l'article de commande associé */
  order_item_id: number
  /** Identifiant du véhicule associé (pour traçabilité avant création de l'article) */
  vehicleId: number | string
  /** Identifiant UUID du véhicule (si format UUID utilisé) */
  vehicleUuid?: string | null
  /** Identifiant du type de commission */
  commission_type_id: number
  /** Montant de la commission */
  amount: number
  /** Taux de commission (pourcentage) */
  rate: number | null
  /** Type de bénéficiaire */
  recipient_type: 'owner' | 'contact' | 'company'
  /** Identifiant du bénéficiaire */
  recipient_id: number
  /** Métadonnées additionnelles */
  metadata: Record<string, any>
  /** Date de création */
  created_at?: string
  /** Date de dernière modification */
  updated_at?: string
  /** Article de commande associé (relation) */
  order_item?: {
    id: number
    vehicle?: {
      id: number | string
      internal_id: string
      model: string
      vin: string
    }
  }
  /** Factures de commission associées */
  invoice?: CommissionInvoice[]
}

/**
 * Types de bénéficiaires possibles pour une commission
 * @typedef {string} CommissionBeneficiaryType
 */
export type CommissionBeneficiaryType = 'owner' | 'contact' | 'company'

/**
 * Configuration d'un type de commission
 * @interface CommissionTypeConfig
 */
export interface CommissionTypeConfig {
  /** Identifiant unique du type de commission */
  id: number
  /** Nom du type de commission */
  name: string
  /** Code unique du type de commission */
  code: string
  /** Description du type de commission */
  description: string
  /** Schéma de configuration du type de commission */
  settings_schema: {
    /** Indique si le pourcentage est applicable */
    percentage: boolean
    /** Indique si un montant fixe est applicable */
    fixed_amount: boolean
    /** Indique si un montant minimum est défini */
    min_amount: boolean
    /** Indique si un montant maximum est défini */
    max_amount: boolean
  }
  /** Indique si le type de commission est actif */
  is_active: boolean
  /** Date de création */
  created_at: string
  /** Date de dernière modification */
  updated_at: string
  /** Liste des propriétaires actifs pour ce type de commission */
  active_owners: Array<{
    id: number
    name: string
  }>
}

/**
 * Interface représentant une commande
 * @interface Order
 */
export interface Order {
  /** Identifiant unique de la commande */
  id: number
  /** Numéro de commande */
  orderNumber: string
  /** Date de la commande */
  orderDate: Date
  /** Type de vente */
  saleType: SaleType
  /** Identifiant du contact (optionnel) */
  contactId?: number
  /** Identifiant de l'entreprise acheteuse (optionnel) */
  buyerCompanyId?: number
  /** Identifiant de l'entreprise vendeuse (optionnel) */
  sellerCompanyId?: number
  /** Identifiant de l'entreprise propriétaire */
  ownerCompanyId?: number
  /** Total HT */
  totalHt: number
  /** Montant de TVA */
  totalTva: number
  /** Total TTC */
  totalTtc: number
  /** Statut de la commande */
  status: OrderStatus
  /** Commentaires (optionnel) */
  comments?: string
  /** Métadonnées additionnelles */
  metadata?: Record<string, any>
  /** Date de création */
  createdAt: Date
  /** Date de dernière modification */
  updatedAt: Date
  /** Articles de la commande (optionnel) */
  items?: OrderItem[]
}

/**
 * Interface étendant Order avec ses relations
 * @interface OrderWithRelations
 * @extends {Order}
 */
export interface OrderWithRelations extends Order {
  /** Articles de la commande avec leurs relations */
  items: OrderItemWithRelations[]
  /** Contact associé (optionnel) */
  contact?: Contact
  /** Entreprise acheteuse (optionnel) */
  buyerCompany?: Company
  /** Entreprise vendeuse (optionnel) */
  sellerCompany?: Company
}

/**
 * Interface étendant OrderItem avec ses relations
 * @interface OrderItemWithRelations
 * @extends {OrderItem}
 */
export interface OrderItemWithRelations extends OrderItem {
  /** Commande parente (optionnel) */
  order?: Order
  /** Véhicule associé (optionnel) */
  vehicle?: Vehicle
  /** Commissions associées (optionnel) */
  commissions?: VehicleCommission[]
}

/**
 * Interface représentant les données d'un formulaire de commande
 * @interface OrderFormData
 */
export interface OrderFormData {
  /** Type de vente */
  saleType: SaleType
  /** Identifiant du contact (optionnel) */
  contactId?: number
  /** Identifiant de l'entreprise acheteuse (optionnel) */
  buyerCompanyId?: number
  /** Identifiant de l'entreprise vendeuse (optionnel) */
  sellerCompanyId?: number
  /** Identifiant du contact vendeur (optionnel, pour C2B2C et C2B2B) */
  sellerContactId?: number
  /** Identifiant de l'entreprise propriétaire */
  ownerCompanyId?: number
  /** Articles de la commande */
  items: OrderItem[]
  /** Commissions associées */
  commissions: VehicleCommission[]
  /** Commentaires */
  comments: string
  /** Total HT */
  totalHt: number
  /** Montant de TVA */
  totalTva: number
  /** Total TTC */
  totalTtc: number
  /** Statut de la commande (optionnel) */
  status?: OrderStatus
  /** Métadonnées additionnelles */
  metadata?: Record<string, any>
}

/**
 * Interface représentant un propriétaire
 * @interface Owner
 */
export interface Owner {
  /** Identifiant unique du propriétaire */
  id: number
  /** Nom du propriétaire */
  name: string
}

/**
 * Interface représentant une facture de commission
 * @interface CommissionInvoice
 */
export interface CommissionInvoice {
  /** Identifiant unique de la facture */
  id: number
  /** Identifiant de la commission associée */
  vehicle_commission_id: number
  /** Identifiant de l'émetteur de la facture */
  issuer_id: number
  /** Identifiant du destinataire de la facture */
  recipient_id: number
  /** Type de destinataire */
  recipient_type: 'contact' | 'company' | 'owner'
  /** Identifiant externe de la facture (optionnel) */
  external_invoice_id: string | null
  /** Statut de la facture */
  status: 'pending' | 'paid' | 'cancelled'
  /** Date de création */
  created_at: string
  /** Date de dernière modification */
  updated_at: string
  /** Émetteur de la facture (optionnel) */
  issuer?: {
    id: number
    name: string
  }
}

/**
 * Statuts possibles pour une facture (incluant 'all' pour le filtrage)
 * @typedef {string} InvoiceStatus
 */
export type InvoiceStatus = 'all' | 'pending' | 'paid' | 'cancelled'

/**
 * Interface représentant une adresse
 * @interface Address
 */
export interface Address {
  /** Identifiant unique de l'adresse */
  id: number
  /** Type d'entité (company ou contact) */
  entity_type: 'company' | 'contact'
  /** Identifiant de l'entité */
  entity_id: number
  /** Type d'adresse */
  address_type: string
  /** Numéro de rue */
  street_number?: string
  /** Nom de la rue */
  street_name: string
  /** Complément d'adresse */
  address_line2?: string
  /** Code postal */
  postal_code: string
  /** Ville */
  city: string
  /** État/Région (optionnel) */
  state?: string
  /** Identifiant du pays */
  country_id: number
  /** Indique si c'est l'adresse principale */
  is_primary: boolean
  /** Date de création */
  created_at: string
  /** Date de mise à jour */
  updated_at: string
}

/**
 * Interface représentant un pays
 * @interface Country
 */
export interface Country {
  /** Identifiant unique du pays */
  id: number
  /** Nom du pays */
  name: string
  /** Nom natif du pays */
  native_name: string
  /** Code ISO à 2 lettres */
  iso_code_2: string
  /** Code ISO à 3 lettres */
  iso_code_3: string
  /** Code numérique */
  numeric_code: string
  /** Capitale */
  capital: string
  /** Région */
  region: string
  /** Sous-région */
  subregion: string
  /** Emoji du drapeau */
  flag_emoji: string
  /** Code téléphonique */
  phone_code: string
  /** Code de la devise */
  currency_code: string
  /** Symbole de la devise */
  currency_symbol: string
  /** Devise */
  currency: string
  /** Taux de TVA */
  tva_rate: number
  /** Membre de l'UE */
  is_eu_member: boolean
  /** Actif */
  is_active: boolean
  /** Date de création */
  created_at: string
} 