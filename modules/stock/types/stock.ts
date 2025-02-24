// Enum pour les statuts de stock (correspond à l'enum PostgreSQL)
export enum VehicleStockStatus {
    ORDERED = 'ordered',
    IN_TRANSIT = 'in_transit',
    RECEIVED = 'received',
    PREPARED = 'prepared',
    AVAILABLE = 'available',
    RESERVED = 'reserved',
    SOLD = 'sold',
    CANCELLED = 'cancelled'
}

// Interface pour la table vehicle_stock
export interface VehicleStock {
    id: string
    vehicle_id: string
    vin?: string
    status: VehicleStockStatus
    stocked_at: string
    location?: string
    notes?: string
    created_at?: string
    updated_at?: string
    created_by?: string
    updated_by?: string
}

// Interface pour la création d'une entrée en stock
export interface VehicleStockCreate {
    vehicle_id: string
    vin?: string
    status?: VehicleStockStatus
    location?: string
    notes?: string
}

// Interface pour la mise à jour d'une entrée en stock
export interface VehicleStockUpdate {
    vin?: string
    status?: VehicleStockStatus
    location?: string
    notes?: string
}

// Interface pour les données retournées par get_vehicles_in_stock
export interface VehicleStockWithDetails {
    vehicle_data: any // Données complètes du véhicule
    stock_id: string
    vin?: string
    status: VehicleStockStatus
    stocked_at: string
    location?: string
    notes?: string
    created_at: string
    updated_at: string
}

// Interface pour le state du store
export interface VehicleStockState {
    stockItems: VehicleStockWithDetails[]
}

// Interface pour les filtres de stock
export interface VehicleStockFilters {
    status?: VehicleStockStatus
    location?: string
    hasVin?: boolean
    dateFrom?: string
    dateTo?: string
} 