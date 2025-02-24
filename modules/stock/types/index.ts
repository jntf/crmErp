import type { Store } from 'pinia'

// Types existants inchangés
export enum VehicleStatusEnum {
  IN_STOCK = 'in_stock',
  IN_OFFER = 'in_offer',
  IN_TRADING = 'in_trading',
  IN_DEALING = 'in_dealing',
  RESERVED = 'reserved',
  SOLD = 'sold',
  EXPOSED = 'exposed',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  BILLED = 'billed',
  ARCHIVED = 'archived'
}

export enum VehicleSource {
  MANUAL = 'manual',
  API_SOURCE1 = 'api_source1',
  API_SOURCE2 = 'api_source2'
}

// Ajout du nouveau type pour l'ownership
export enum VehicleOwnershipType {
  SUPPLIER = 'supplier',
  CUSTOMER = 'customer',
  DEALER = 'dealer'
}

// Interfaces existantes inchangées
export interface Vehicle {
  id: string
  brand: string
  model: string
  version?: string
  year?: number
  mileage?: number
  fuel_type?: string
  transmission?: string
  color?: string
  vin?: string
  registration_number?: string
  status: VehicleStatusEnum
  selling_price_ttc?: number
  selling_price_ht?: number
  purchase_price_ht?: number
  vat_rate?: number
  repair_cost?: number
  frevo?: number
  qty: number
  created_at?: string
  updated_at?: string
  details?: VehicleDetails
}

export interface VehiclePrice {
  id: string
  vehicle_id: string
  purchase_price_ht: number
  selling_price_ht: number
  vat_rate: number
  repair_cost?: number
  frevo?: number
}

export interface VehiclePriceCreate {
  purchase_price_ht: number
  selling_price_ht: number
  vat_rate: number
  repair_cost?: number
  frevo?: number
}

export interface VehicleStatus {
  id: string
  vehicle_id: string
  status: VehicleStatusEnum
  location?: string
  is_online: boolean
  exposed_id?: string
}

export interface VehicleStatusCreate {
  status: VehicleStatusEnum
  location?: string
  is_online: boolean
  exposed_id?: string | null
}

export interface VehicleFeatures {
  id: string
  vehicle_id: string
  features: {
    serie?: string[]
    options?: string[]
    [key: string]: any
  }
}

export interface VehicleFeaturesCreate {
  features: {
    serie?: string[]
    options?: string[]
    [key: string]: any
  }
}

interface VehicleOwnershipCompany {
  id: number
  name: string
  phone?: string
  email?: string
  is_supplier: boolean
  is_customer: boolean
}

interface VehicleOwnershipContact {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  mobile_phone?: string
  job_title?: string
}

interface VehicleOwnershipBase {
    ownership_id: string
    ownership_type: VehicleOwnershipType
    start_date?: string
    end_date?: string
    is_primary: boolean
    notes?: string
    company?: VehicleOwnershipCompany
    contact?: VehicleOwnershipContact
}

export interface VehicleOwnership {
    id?: string
    vehicle_id: string
    company_id: string
    ownership_type: VehicleOwnershipType
    start_date: string
    end_date?: string
    is_primary: boolean
    notes?: string
    created_at?: string
    updated_at?: string
    created_by?: string
    updated_by?: string
    company?: VehicleOwnershipCompany
    contact?: VehicleOwnershipContact
}

// Interface pour les détails du véhicule retournés par la fonction stockée
export interface VehicleDetails {
  price_details: VehiclePrice
  status_details: VehicleStatus
  features: VehicleFeatures
  ownership?: VehicleOwnership[]
}

export interface VehicleDetailsCreate {
  price_details: VehiclePriceCreate
  status_details: VehicleStatusCreate
  features: VehicleFeaturesCreate
  ownership?: Omit<VehicleOwnership, 'id' | 'created_at' | 'updated_at'>[]
}

// Interface des filtres inchangée
export interface VehicleFilters {
  brand?: string
  model?: string
  status?: Vehicle['status']
  minPrice?: number
  maxPrice?: number
  minYear?: number
  maxYear?: number
}

export interface Supplier {
    id: string
    name: string
    vat_number: string | null
    domain: string | null
    is_supplier: boolean
    created_at?: string
    updated_at?: string
    created_by?: string
    updated_by?: string
}

export interface SupplierAddress {
    id: string
    company_id: string
    adress_line1: string
    zip_code: string
    city: string
    country_id: number
}

export interface Database {
    public: {
        Tables: {
            companies: {
                Row: Supplier
                Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>
            }
            company_addresses: {
                Row: SupplierAddress
                Insert: Omit<SupplierAddress, 'id'>
                Update: Partial<Omit<SupplierAddress, 'id'>>
            }
            vehicle_ownership: {
                Row: VehicleOwnership
                Insert: Omit<VehicleOwnership, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<VehicleOwnership, 'id' | 'created_at' | 'updated_at'>>
            }
        }
    }
}

export interface VehicleTableData extends Vehicle {
    vehicle_price_ht: number
    vehicle_selling_price_ht: number
    vehicle_repair_cost: number
    vehicle_frevo: number
    vehicle_vat_rate: number
    vehicle_status: VehicleStatusEnum
    vehicle_location: string
    vehicle_is_online: boolean
    vehicle_ownership: string
    actions: string
}

// Interface pour le store
export interface VehicleState {
    vehicles: Vehicle[]
}

// Interface pour les méthodes du store
export interface VehicleStore extends Store<'vehicle', VehicleState> {
    createVehicle(vehicle: Partial<Vehicle>): Promise<void>
    updateVehicle(vehicle: Partial<Vehicle>): Promise<void>
    deleteVehicle(id: string): Promise<void>
    fetchVehicles(): Promise<void>
}

export interface VehicleCreate {
    brand: string
    model: string
    version?: string
    year?: number
    mileage?: number
    fuel_type?: string
    transmission?: string
    color?: string
    vin?: string
    registration_number?: string
    registration_date?: string
    power_hp?: number
    power_fiscal?: number
    co2_emissions?: number
    purchase_price_ht?: number
    selling_price_ht?: number
    repair_cost?: number
    frevo?: number
    status: VehicleStatusEnum
    qty?: number
    details?: VehicleDetailsCreate
}