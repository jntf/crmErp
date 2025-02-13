export interface Owner {
  id: number
  name: string
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
  description: string
  code: string
  settings_schema: CommissionTypeSchema
  is_active: boolean
  created_at: string
  updated_at: string
  active_owners?: Owner[]
}

export interface CommissionFormState {
  name: string
  description: string
  settings: {
    percentage: boolean
    fixed_amount: boolean
    min_amount: boolean
    max_amount: boolean
  }
  selected_owners: string[]
}

export interface CommissionSettings {
  calculationType: 'percentage' | 'fixed'
  percentage: number
  fixedAmount: number
  hasMinAmount: boolean
  minAmount: number
  hasMaxAmount: boolean
  maxAmount: number
  is_active: boolean
}

export interface OwnerCommissionSettings {
  owner_id: number
  commission_type_id: number
  is_active: boolean
  settings: CommissionSettings
}

export interface CommissionTypeResponse extends Omit<CommissionType, 'active_owners'> {
  owner_settings?: {
    owner_id: number
    commission_type_id: number
    is_active: boolean
    settings: CommissionSettings
    owner: Owner
  }[]
}

export interface CommissionTypeData {
  name: string
  description: string
  code: string
  settings_schema: CommissionTypeSchema
  is_active: boolean
  updated_at: string
}

export interface CommissionFormData extends CommissionFormState {}

export interface CommissionStore {
  types: CommissionType[]
  fetchCommissionTypes: () => Promise<void>
  createCommissionType: (data: CommissionTypeData) => Promise<void>
  updateCommissionType: (id: number, data: CommissionTypeData) => Promise<void>
  deleteCommissionType: (id: number) => Promise<void>
  toggleCommissionTypeStatus: (id: number, isActive: boolean) => Promise<void>
}

export type { Owner as OwnerType }
export type { CommissionTypeSchema as CommissionTypeSchemaType }
export type { CommissionType as CommissionTypeType }
export type { CommissionFormState as CommissionFormStateType }
export type { CommissionSettings as CommissionSettingsType }
export type { OwnerCommissionSettings as OwnerCommissionSettingsType }
export type { CommissionTypeResponse as CommissionTypeResponseType }
export type { CommissionTypeData as CommissionTypeDataType }
export type { CommissionFormData as CommissionFormDataType }
export type { CommissionStore as CommissionStoreType } 