/**
 * Types relatifs au processus d'approbation des contacts importés
 */

export interface SimilarCompany {
  id: string
  name: string
  industry?: string
  domain?: string
  similarity: number
}

export interface SimilarContact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  job_title?: string
  similarity: number
}

export interface ApprovalResult {
  success: boolean
  message: string
  contact_id?: string
  company_id?: string
} 