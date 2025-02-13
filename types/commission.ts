import type { Row, Column } from '@tanstack/vue-table'

export interface Commission {
  id: number
  created_at: string
  type: string
  amount: number | string
  status: 'pending' | 'paid'
  beneficiary: string
  commission_type: {
    name: string
  }
}

export interface CommissionTypeSchema {
  percentage: boolean
  fixed_amount: boolean
  min_amount: boolean
  max_amount: boolean
}

export interface CommissionType {
  id: number
  name: string
  code: string
  description: string
  settings_schema: CommissionTypeSchema
  is_active: boolean
  created_at: string
  updated_at: string
  active_owners?: {
    id: number
    name: string
  }[]
}

export interface CommissionSettings {
  id?: number
  owner_id: number
  commission_type_id: number
  is_active: boolean
  settings: {
    calculationType: 'percentage' | 'fixed' | 'mixed'
    percentage?: number
    fixedAmount?: number
    hasMinAmount?: boolean
    minAmount?: number
    hasMaxAmount?: boolean
    maxAmount?: number
    [key: string]: any
  }
  created_at?: string
  updated_at?: string
}

export interface VehicleCommissionRaw {
  id: number
  amount: number
  rate: number | null
  is_paid: boolean
  payment_date: string | null
  payment_reference: string | null
  metadata: any
  created_at: string
  commission_type: {
    id: number
    name: string
    code: string
  }
  beneficiary: {
    id: number
    first_name: string
    last_name: string
  }
  order_item: {
    id: number
    vehicle: {
      id: number
      vin: string
    }
  }
}

export interface VehicleCommission {
  id: number
  amount: number
  rate: number | null
  is_paid: boolean
  payment_date: string | null
  payment_reference: string | null
  metadata: any
  created_at: string
  commission_type: {
    id: number
    name: string
    code: string
  } | null
  beneficiary: {
    id: number
    first_name: string
    last_name: string
  } | null
  order_item: {
    id: number
    vehicle: {
      id: number
      vin: string
    }
  } | null
}

export interface CommissionFormState {
  calculationType: 'percentage' | 'fixed' | 'mixed'
  percentage: number
  fixedAmount: number
  hasMinAmount: boolean
  minAmount: number
  hasMaxAmount: boolean
  maxAmount: number
  is_active: boolean
}

export interface CommissionTableData {
  id: number
  created_at: string
  type: string
  amount: number
  status: 'pending' | 'paid'
  beneficiary: string
  commission_type: {
    name: string
  }
}

export type CommissionRow = Row<Commission>
export type CommissionColumn = Column<Commission>

export type CommissionValue = string | number | boolean | null 