export type SaleType = 'B2C' | 'B2B' | 'B2B2B' | 'B2P' | 'P2P'
export type OrderStatus = 'DRAFT' | 'PENDING' | 'VALIDATED' | 'CANCELLED' | 'COMPLETED'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type CommissionType = 'MANDATE' | 'INTERMEDIARY' | 'PRIVATE_SALE'

export interface Contact {
  id: number
  name: string
}

export interface Company {
  id: number
  name: string
}

export interface Vehicle {
  id: number
  internal_id: string
  brand: string
  model: string
  version?: string
  color?: string
  vin: string | null
  registration_number?: string
  mileage?: number
  year?: number
  vehicle_prices?: {
    purchase_price_ht: number
    selling_price_ht: number
    frevo: number
  }
}

export interface OrderItem {
  id: number
  orderId: number
  vehicleId: string
  vehicleInternalId: string
  quantity: number
  purchasePriceHt: number
  unitPriceHt: number
  sellingPriceHt: number
  tvaRate: number
  totalHt: number
  totalTva: number
  totalTtc: number
  isPaid: boolean
  status: OrderStatus
  isDelivered: boolean
  metadata?: Record<string, any>
  vehicle?: Vehicle | null
}

export interface VehicleCommission {
  id: number
  order_item_id: number
  commission_type_id: number
  amount: number
  rate: number | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  order_item?: {
    id: number
    vehicle?: {
      id: number
      internal_id: string
      model: string
      vin: string
    }
  }
  invoice?: CommissionInvoice[]
}

export type CommissionBeneficiaryType = 'owner' | 'contact' | 'company'

export interface CommissionTypeConfig {
  id: number
  name: string
  code: string
  description: string
  settings_schema: {
    percentage: boolean
    fixed_amount: boolean
    min_amount: boolean
    max_amount: boolean
  }
  is_active: boolean
  created_at: string
  updated_at: string
  active_owners: Array<{
    id: number
    name: string
  }>
}

export interface Order {
  id: number
  orderNumber: string
  orderDate: Date
  saleType: SaleType
  contactId?: number
  buyerCompanyId?: number
  sellerCompanyId?: number
  totalHt: number
  totalTva: number
  totalTtc: number
  status: OrderStatus
  comments?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  items?: OrderItem[]
}

export interface OrderWithRelations extends Order {
  items: OrderItemWithRelations[]
  contact?: Contact
  buyerCompany?: Company
  sellerCompany?: Company
}

export interface OrderItemWithRelations extends OrderItem {
  order?: Order
  vehicle?: Vehicle
  commissions?: VehicleCommission[]
}

export interface OrderFormData {
  saleType: SaleType
  contactId?: number
  buyerCompanyId?: number
  sellerCompanyId?: number
  items: OrderItem[]
  commissions: VehicleCommission[]
  comments: string
  totalHt: number
  totalTva: number
  totalTtc: number
  status?: OrderStatus
}

export interface Owner {
  id: number
  name: string
}

export interface CommissionInvoice {
  id: number
  vehicle_commission_id: number
  issuer_id: number
  recipient_id: number
  recipient_type: 'contact' | 'company' | 'owner'
  external_invoice_id: string | null
  status: 'pending' | 'paid' | 'cancelled'
  created_at: string
  updated_at: string
  issuer?: {
    id: number
    name: string
  }
}

export type InvoiceStatus = 'all' | 'pending' | 'paid' | 'cancelled' 