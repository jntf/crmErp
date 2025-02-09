import { navigateTo } from '#app'

export interface PdfExportData {
    template: string
    data?: any[]
    columns?: any[]
    options?: {
        title?: string
        subtitle?: string
        orientation?: 'portrait' | 'landscape'
        showDate?: boolean
        dateFormat?: string
        [key: string]: any
    }
}

const PDF_STORAGE_KEY = 'pdf_export_data'

export const exportToPdf = async (data: PdfExportData) => {
    try {
        // Stocker les données dans le localStorage
        localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(data))
        
        // Ouvrir la page de prévisualisation dans un nouvel onglet
        await navigateTo('/pdf/preview', {
            external: true,
            open: {
                target: '_blank'
            }
        })
        
        return true
    } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error)
        return false
    }
} 