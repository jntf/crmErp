import type { Component } from 'vue'

export interface PdfTemplateData {
    data: any[]
    columns?: any[]
    options?: {
        title?: string
        subtitle?: string
        orientation?: 'portrait' | 'landscape'
        [key: string]: any
    }
}

export interface PdfTemplate {
    name: string
    component: string
    description?: string
}

// Registre des templates PDF disponibles
export const PDF_TEMPLATES: Record<string, PdfTemplate> = {
    'vehicle-list': {
        name: 'Liste des véhicules',
        component: 'PdfVehiclePdfTemplate',
        description: 'Template pour l\'export de la liste des véhicules'
    },
    // Ajoutez d'autres templates ici
} as const

// Type pour les clés du registre
export type PdfTemplateKey = keyof typeof PDF_TEMPLATES

// Fonction utilitaire pour vérifier si un template existe
export function isPdfTemplate(template: string): template is PdfTemplateKey {
    return template in PDF_TEMPLATES
}

// Fonction pour obtenir le composant d'un template
export function getPdfTemplateComponent(template: PdfTemplateKey): string {
    return PDF_TEMPLATES[template].component
}

// Fonction pour obtenir les informations d'un template
export function getPdfTemplateInfo(template: PdfTemplateKey): PdfTemplate {
    return PDF_TEMPLATES[template]
} 