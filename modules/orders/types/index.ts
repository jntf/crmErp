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
  vin: string
}

export interface OrderItem {
  id: number
  vehicle?: Vehicle
  sellingPriceHt: number
}

export interface Recipient {
  id: number
  name: string
}

export interface CommissionFormData {
  applyToAll: boolean
  order_item_id: number | null
  commission_type_id: number | null
  rate: number
  amount: number
  recipientType: 'owner' | 'contact' | 'company' | null
  recipientId: number | null
}

export interface VehicleCommissionCreate {
  order_item_id: number
  commission_type_id: number
  rate: number
  amount: number
  recipient_type: 'owner' | 'contact' | 'company'
  recipient_id: number
}

export interface VehicleCommission extends VehicleCommissionCreate {
  id: number
  recipient?: Recipient
  order_item?: {
    id: number
    vehicle_id: number
    vehicle: Vehicle
  }
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