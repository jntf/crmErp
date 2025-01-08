import type { Vehicle } from './vehicle.types'
import type { PhotoData } from './photo.types'

export interface TransformedVehicle {
    vehicleData: Vehicle
    equipments: Array<{
        name: string
        category: string
        isPresent: boolean
    }>
    photos: PhotoData[]
    expertise: any
}