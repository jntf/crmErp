export interface Vehicle {
    id: string
    source: string
    brand: string
    model: string
    version: string
    registration_date: string 
    mileage: number
    color: string
    options: string[]
    repair_cost: number      
    base_price: number       
    selling_price: number | null
    vin: string
    status: string          
}

export interface VehicleSource {
    id: string
    name: string
    type: 'xml' | 'api' | 'csv'
    url: string
    active: boolean
}