// stores/useModuleStore.ts
import { defineStore } from 'pinia'

interface ModuleState {
  accessibleModules: string[]
  loading: boolean
}

export const useModuleStore = defineStore('module', {
  state: (): ModuleState => ({
    accessibleModules: [],
    loading: false
  }),

  getters: {
    hasAccess: (state) => (moduleName: string) => {
      return state.accessibleModules.includes(moduleName)
    }
  },

  actions: {
    async fetchAccessibleModules() {
      const client = useSupabaseClient()
      this.loading = true

      try {
        const { data, error } = await client
          .rpc('get_accessible_modules')

        if (error) throw error

        this.accessibleModules = data?.map(d => d.module_name) || []
      } catch (error) {
        console.error('Error fetching module access:', error)
        this.accessibleModules = []
      } finally {
        this.loading = false
      }
    }
  }
})