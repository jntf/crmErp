// stores/useModuleStore.ts
import { defineStore } from 'pinia'

interface ModuleState {
  accessibleModules: string[]
  loading: boolean
}

interface ModuleData {
  module_name: string
}

export const useModuleStore = defineStore('module', {
  state: (): ModuleState => ({
    accessibleModules: [],
    loading: false
  }),

  getters: {
    hasAccess: (state) => (moduleName: string) => {
      const authStore = useAuthStore()
      // Si l'utilisateur est superadmin, il a accès à tous les modules
      if (authStore.roles.includes('superadmin')) {
        return true
      }
      // Sinon on vérifie dans la liste des modules accessibles
      return state.accessibleModules.includes(moduleName)
    }
  },

  actions: {
    async fetchAccessibleModules() {
      const client = useSupabaseClient()
      const authStore = useAuthStore()
      
      // Si superadmin, pas besoin de charger les modules
      if (authStore.roles.includes('superadmin')) {
        this.accessibleModules = ['*']
        return
      }

      this.loading = true
      try {
        const { data, error } = await client
          .rpc('get_accessible_modules')

        if (error) throw error

        // Ajouter le module stock pour les admin et manager
        const modules = (data as ModuleData[])?.map(d => d.module_name) || []
        if (authStore.hasRole('admin') || authStore.hasRole('manager')) {
          modules.push('stock')
        }

        this.accessibleModules = modules
      } catch {
        this.accessibleModules = []
      } finally {
        this.loading = false
      }
    }
  }
})