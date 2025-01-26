export enum VehicleStatusEnum {
  IN_STOCK = 'in_stock',
  IN_OFFER = 'in_offer',
  RESERVED = 'reserved',
  SOLD = 'sold',
  EXPOSED = 'exposed'
}

export enum VehicleSource {
  MANUAL = 'manual',
  API_SOURCE1 = 'api_source1',
  API_SOURCE2 = 'api_source2'
}

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
  status: 'in_stock' | 'reserved' | 'sold'
  selling_price_ttc?: number
  selling_price_ht?: number
  purchase_price_ht?: number
  vat_rate?: number
  repair_cost?: number
  frevo?: number
  created_at?: string
  updated_at?: string
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

export interface VehicleStatus {
  id: string
  vehicle_id: string
  status: VehicleStatusEnum
  location?: string
  is_online: boolean
  exposed_id?: string
}

export interface VehicleFeatures {
  id: string
  vehicle_id: string
  features: Record<string, any>
}

export interface VehicleFilters {
  brand?: string
  model?: string
  status?: Vehicle['status']
  minPrice?: number
  maxPrice?: number
  minYear?: number
  maxYear?: number
} 