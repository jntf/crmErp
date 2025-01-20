// types/tag.ts

export interface Tag {
    id: string;          // UUID in PostgreSQL, string in TypeScript
    name: string;
    color?: string;      // Optional car pas de contrainte NOT NULL dans la DB
    category?: string;   // Optional car pas de contrainte NOT NULL dans la DB
    created_at?: string; // Optional car c'est une valeur par défaut dans la DB
  }
  
  // Type pour la relation company_tags
  export interface CompanyTag {
    company_id: number;
    tag_id: string;     // UUID
    created_at?: string;
  }
  
  // Type pour la relation contact_tags
  export interface ContactTag {
    contact_id: number;
    tag_id: string;     // UUID
    created_at?: string;
  }
  
  // Type utilitaire pour la création d'un nouveau tag
  export type CreateTagInput = Omit<Tag, 'id' | 'created_at'>;
  
  // Type utilitaire pour la mise à jour d'un tag
  export type UpdateTagInput = Partial<CreateTagInput>;