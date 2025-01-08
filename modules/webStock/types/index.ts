// modules/webStock/types/index.ts
export * from './vehicle.types'
export * from './photo.types'
export * from './transformed.types'

export interface VehicleIdentifier {
    vehicleId: string
    source: string
}