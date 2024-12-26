// modules/webStock/types/vehicle.types.ts
export interface Vehicle {
    id: string
    source: string
    brand: string
    model: string
    version: string
    registrationDate: string
    mileage: number
    color: string
    options: string[]
    repairCost: number
    basePrice: number
    sellingPrice: number | null
    vin: string
}

export interface VehicleSource {
    id: string
    name: string
    type: 'xml' | 'api' | 'csv'
    url: string
    active: boolean
}