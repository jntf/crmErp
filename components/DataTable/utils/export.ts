//components/DataTable/utils/export.ts
import * as ExcelJS from 'exceljs'

export const exportToCSV = (data: any[], columns: any[], filename: string = 'export') => {

  if (!data?.length) {
    console.warn('No data to export')
    return
  }

  console.log('Data:', data)
  console.log('Columns:', columns)

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
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename || 'export'}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    console.log('CSV export completed')
  } catch (error) {
    console.error('Error in CSV export:', error)
  }
}

export const exportToExcel = async (data: any[], columns: any[], filename: string = 'export') => {
  console.log('Starting Excel export...')
  console.log('Data:', data)
  console.log('Columns:', columns)

  if (!data?.length) {
    console.warn('No data to export')
    return
  }

  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')

    // Définir les colonnes
    worksheet.columns = columns.map(col => ({
      header: col.title || col.data,
      key: col.data,
      width: 15
    }))

    // Ajouter les données
    data.forEach(row => {
      const rowData = {}
      columns.forEach(col => {
        rowData[col.data] = row[col.data]
      })
      worksheet.addRow(rowData)
    })

    // Style des en-têtes
    worksheet.getRow(1).font = { bold: true }

    console.log('Generating Excel buffer...')
    const buffer = await workbook.xlsx.writeBuffer()

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename || 'export'}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    console.log('Excel export completed')
  } catch (error) {
    console.error('Error in Excel export:', error)
    throw error
  }
}
