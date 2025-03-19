export interface ContactStaging {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  company?: string
  job_title?: string
  contact_type?: string[][] | null
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  contact_id?: string
  company_id?: string
  import_batch_id?: string
  created_at: string
  updated_at?: string
  created_by?: string
  approved_at?: string
  approved_by?: string
}

export enum ContactStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// Réexporter les types de notification depuis le fichier commun
export { NotificationType } from '@/types/notifications'
export type { 
  Notification, 
  NotificationWithEntity, 
  NotificationFilters 
} from '@/types/notifications' 