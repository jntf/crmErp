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

export interface CommissionType {
  id: number
  name: string
  description: string
  is_active: boolean
  settings_schema: Record<string, any>
  settings: {
    [key: string]: any
    is_active: boolean
  }
}

export type CommissionRow = Row<Commission>
export type CommissionColumn = Column<Commission>

export type CommissionValue = string | number | boolean | null 