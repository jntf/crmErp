import { generateOrderPDF, generateVehicleListPDF } from '~/services/pdfService'

// Types
export interface PdfExportData {
    template: 'order' | 'vehicle-list'
    data: any
    columns?: any[]
    options?: {
        title?: string
        subtitle?: string
        orientation?: 'portrait' | 'landscape'
    }
}

// Fonction d'export PDF
export const exportToPdf = async (data: PdfExportData): Promise<Uint8Array | null> => {
    try {
        console.log('📄 Export - Génération du PDF avec les données:', data)
        
        let pdfBuffer: Uint8Array | null = null
        
        switch (data.template) {
            case 'order':
                pdfBuffer = await generateOrderPDF(data.data)
                break
            case 'vehicle-list':
                if (!data.columns) {
                    throw new Error('Les colonnes sont requises pour le template vehicle-list')
                }
                pdfBuffer = await generateVehicleListPDF(data.data, data.columns, data.options)
                break
            default:
                throw new Error(`Template ${data.template} non supporté`)
        }
        
        return pdfBuffer
    } catch (error) {
        console.error('📄 Export - Erreur lors de la génération du PDF:', error)
        return null
    }
} 