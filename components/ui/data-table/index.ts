import { defineComponent, h } from 'vue'
import type { PropType } from 'vue'

export interface Column {
  key: string
  label: string
  format?: (value: any) => string
}

export const DataTable = defineComponent({
  name: 'DataTable',
  props: {
    data: {
      type: Array as PropType<any[]>,
      required: true
    },
    columns: {
      type: Array as PropType<Column[]>,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    pagination: {
      type: Boolean,
      default: false
    },
    search: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    // Implémentation à venir
    return () => h('div', 'DataTable Component')
  }
})

export { default as DataTable } from './DataTable.vue' 