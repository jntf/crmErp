// modules/webStock/types/photo.types.ts
export interface PhotoData {
    id: string
    model_id?: string
    url: string
    type: string
    position: number
    isMain?: boolean
}