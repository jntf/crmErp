export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    first_name: string | null
                    last_name: string | null
                    phone: string | null
                    professional_email: string | null
                    job_title: string | null
                    department: string | null
                    hire_date: string | null
                    contact_info: any
                    preferences: {
                        language: string
                        timezone: string
                        theme: string
                        notifications: {
                            email: {
                                enabled: boolean
                                frequency: string
                            }
                            whatsapp: {
                                enabled: boolean
                                number: string | null
                            }
                            telegram: {
                                enabled: boolean
                                username: string | null
                            }
                        }
                        dashboard_layout: {
                            widgets: any[]
                            layout: string
                        }
                    }
                    professional_metadata: any
                    security_settings: any
                    privacy_consents: any
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    first_name?: string | null
                    last_name?: string | null
                    phone?: string | null
                    professional_email?: string | null
                    job_title?: string | null
                    department?: string | null
                    hire_date?: string | null
                    contact_info?: any
                    preferences?: any
                    professional_metadata?: any
                    security_settings?: any
                    privacy_consents?: any
                    status?: string
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['profiles']['Insert']>
            }
            owners: {
                Row: {
                    id: number
                    company_id: number
                    name: string
                    status: string
                    settings: any
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    company_id: number
                    name: string
                    status?: string
                    settings?: any
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['owners']['Insert']>
            }
            owner_modules: {
                Row: {
                    id: number
                    owner_id: number
                    module_name: string
                    is_active: boolean
                    settings: any
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    owner_id: number
                    module_name: string
                    is_active?: boolean
                    settings?: any
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['owner_modules']['Insert']>
            }
            commission_types: {
                Row: {
                    id: number
                    name: string
                    code: string
                    description: string
                    settings_schema: {
                        [key: string]: {
                            type: 'number' | 'select' | 'boolean'
                            description: string
                            required: boolean
                            options?: Array<{
                                value: string
                                label: string
                            }>
                        }
                    }
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    name: string
                    code: string
                    description: string
                    settings_schema: any
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['commission_types']['Insert']>
            }
            owner_commission_settings: {
                Row: {
                    id: number
                    owner_id: number
                    commission_type_id: number
                    settings: any
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    owner_id: number
                    commission_type_id: number
                    settings: any
                    is_active?: boolean
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['owner_commission_settings']['Insert']>
            }
        }
    }
} 