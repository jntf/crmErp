export interface Address {
    id: string
    entity_type: 'company' | 'contact'
    entity_id: string
    address_type: 'billing' | 'shipping' | 'main'
    street_number: string
    street_name: string
    address_line2: string
    postal_code: string
    city: string
    state: string
    country_id: number
    is_primary: boolean
    created_at: string
    updated_at: string
}