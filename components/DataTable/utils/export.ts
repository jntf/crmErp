//components/DataTable/utils/export.ts
import * as ExcelJS from 'exceljs'
import { createApp, h } from 'vue'
import VehiclePdfTemplate from './VehiclePdfTemplate.vue'
import { format } from 'date-fns'
import { exportToPdf } from '~/utils/pdf'

export interface ExportTemplate {
  name: string
  columns: string[]
}

export const exportTemplates = {
  vente: {
    name: 'Vue Vente',
    columns: [
      'brand', 'model', 'version',
      'vehicle_selling_price_ht', 'vehicle_frevo',
      'status', 'vehicle_is_online'
    ]
  },
  achat: {
    name: 'Vue Achat',
    columns: [
      'brand', 'model', 'version', 'vin',
      'vehicle_price_ht', 'vehicle_repair_cost',
      'vehicle_ownership'
    ]
  }
}

// Export CSV inchangé
export const exportToCSV = (data: any[], columns: any[], filename: string = 'export') => {
  if (!data?.length) {
    console.warn('No data to export')
    return
  }

  try {
    const headers = columns.map(col => col.title || col.data)
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        columns.map(col => {
          const value = row[col.data]
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `${filename}.csv`)
  } catch (error) {
    console.error('Error in CSV export:', error)
  }
}

// Export Excel inchangé
export const exportToExcel = async (data: any[], columns: any[], filename: string = 'export') => {
  if (!data?.length) {
    console.warn('No data to export')
    return
  }

  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')

    worksheet.columns = columns.map(col => ({
      header: col.title || col.data,
      key: col.data,
      width: 15
    }))

    data.forEach(row => {
      const rowData: Record<string, any> = {}
      columns.forEach(col => {
        rowData[col.data] = row[col.data]
      })
      worksheet.addRow(rowData)
    })

    worksheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    downloadFile(blob, `${filename}.xlsx`)
  } catch (error) {
    console.error('Error in Excel export:', error)
    throw error
  }
}

// Export PDF avec prévisualisation
export const exportToPDF = async (data: any[], columns: any[], filename?: string) => {
    try {
        console.log('📤 Export - Préparation des données PDF')

        // Formater les colonnes pour le template
        const formattedColumns = columns.map(col => ({
            id: col.data,
            title: col.title || col.data,
            width: col.width
        }))

        // Préparer les données pour le PDF
        const pdfData = {
            template: 'vehicle-list', // Utilisation de la clé du registre
            data,
            columns: formattedColumns,
            options: {
                title: filename || 'Export des véhicules',
                subtitle: `État au ${format(new Date(), 'dd MMMM yyyy')}`,
                orientation: 'landscape' as const
            }
        }

        // Utiliser la fonction exportToPdf de utils/pdf.ts
        const success = await exportToPdf(pdfData)
        if (!success) {
            throw new Error('Échec de l\'export PDF')
        }

        return true
    } catch (error) {
        console.error('📤 Export - Erreur:', error)
        throw error
    }
}

// Fonction utilitaire pour le téléchargement
function downloadFile(blob: Blob, filename: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

// Fonction utilitaire pour filtrer les colonnes selon un template
export const filterColumnsByTemplate = (allColumns: any[], template: ExportTemplate) => {
  if (!template?.columns) return allColumns
  return allColumns.filter(col => template.columns.includes(col.data))
}