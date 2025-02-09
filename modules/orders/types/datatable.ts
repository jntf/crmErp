export interface Column {
  data: string
  title: string
  sortable?: boolean
  width?: number
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps {
  tableData: any[]
  tableColumns: Column[]
  loading?: boolean
  searchable?: boolean
  sortable?: boolean
  tableHeight?: number
  tableWidth?: number
} 