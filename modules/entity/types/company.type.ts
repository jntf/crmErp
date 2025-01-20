export interface Company {
    id: string
    name: string
    domain: string
    industry: string
    phone: string
    email: string
    website: string
    number_of_employees: number
    social_capital: number
    revenue: number
    fleet_size: number
    status: string
    description: string
    tax_number: string
    vat_number: string
    is_supplier: boolean
    is_customer: boolean
    created_at: string
    updated_at: string
    created_by: string
    updated_by: string
}

export interface CompanyFormData {
    name: string;
    status: 'active' | 'inactive';
    domain: string;
    industry: string;
    email: string;
    phone: string;
    website: string;
    number_of_employees: number;
    social_capital: number;
    revenue: number;
    fleet_size: number;
    tax_number: string;
    vat_number: string;
    is_supplier: boolean;
    is_customer: boolean;
    address: {
      street_number: string;
      street_name: string;
      address_line2: string;
      postal_code: string;
      city: string;
      country_id: number;
    };
  }