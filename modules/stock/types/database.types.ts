export interface Database {
    public: {
        Tables: {
            vehicles: {
                Row: {
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
                    status: string
                    created_at?: string
                    updated_at?: string
                }
                Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
            }
            vehicle_prices: {
                Row: {
                    id: string
                    vehicle_id: string
                    purchase_price_ht: number
                    selling_price_ht: number
                    vat_rate: number
                    repair_cost: number
                    frevo: number
                    created_at?: string
                    updated_at?: string
                }
                Insert: Omit<Database['public']['Tables']['vehicle_prices']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['vehicle_prices']['Insert']>
            }
            vehicle_status: {
                Row: {
                    id: string
                    vehicle_id: string
                    status: string
                    location: string
                    is_online: boolean
                    exposed_id: string | null
                    created_at?: string
                    updated_at?: string
                }
                Insert: Omit<Database['public']['Tables']['vehicle_status']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['vehicle_status']['Insert']>
            }
            vehicle_features: {
                Row: {
                    id: string
                    vehicle_id: string
                    features: Record<string, any>
                    created_at?: string
                    updated_at?: string
                }
                Insert: Omit<Database['public']['Tables']['vehicle_features']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['vehicle_features']['Insert']>
            }
        }
        Functions: {
            get_vehicles_with_details: {
                Args: Record<string, never>
                Returns: { results: any[], total_count: number }
            }
            batch_insert_vehicle_ownership: {
                Args: {
                    ownership_data: {
                        vehicle_id: string
                        company_id: number
                        ownership_type: string
                        start_date: string
                        is_primary: boolean
                        notes: string
                        created_by: string
                        updated_by: string
                    }[]
                }
                Returns: { success: boolean, inserted_count: number, error?: string }
            }
        }
    }
} 