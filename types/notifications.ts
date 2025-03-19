export interface Notification {
  id: string
  user_email: string
  message: string
  entity_type: string
  entity_id: string
  entity_status: string | null
  action_required: boolean
  action_url: string | null
  is_read: boolean
  created_at: string
}

export enum NotificationType {
  CONTACT_IMPORT = 'contacts_staging',
  ORDER = 'order',
  COMMISSION = 'commission',
  TEST = 'test'
}

export interface NotificationWithEntity extends Notification {
  entity?: any
}

export interface NotificationFilters {
  unreadOnly?: boolean
  readOnly?: boolean
  entityType?: string
  actionRequired?: boolean
  sortDirection?: 'asc' | 'desc'
} 