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

export interface PdfPreviewOptions {
    showPreview?: boolean
    download?: boolean
    filename?: string
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
    'order': {
        name: 'Bon de commande',
        component: 'OrderPdfTemplate',
        description: 'Template pour l\'export des bons de commande'
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

// Fonction utilitaire pour télécharger le PDF
export function downloadPdf(pdfBuffer: Uint8Array, filename: string): void {
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
} 