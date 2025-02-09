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
  id: string
  internal_id: string
  brand: string
  model: string
  version?: string
  color?: string
  vin?: string
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
  vehicle?: Vehicle
}

export interface VehicleCommission {
  id: number
  orderItemId: number
  amount: number
  rate: number
  beneficiaryId: number
  commissionType: CommissionType
  isPaid: boolean
  paymentDate?: Date
  metadata?: Record<string, any>
  beneficiary?: Company | Contact
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