// stores/useAuthStore.ts
import { defineStore } from 'pinia'

interface User {
    id: string
    name: string
    email: string
    avatar?: string
    roles: string[]
}

interface AuthState {
    user: User | null
    roles: string[]
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: null,
        roles: []
    }),

    getters: {
        isAuthenticated: (state) => !!state.user,
        hasRole: (state) => (role: string) => {
            // Si l'utilisateur est superadmin, il a accès à tout
            if (state.roles.includes('superadmin')) {
                return true
            }
            // Sinon on vérifie le rôle spécifique
            return state.roles.includes(role)
        }
    },

    actions: {
        setRoles(roles: string[]) {
            this.roles = roles
        },

        async initUser() {
            const supabaseUser = useSupabaseUser()

            if (supabaseUser.value) {
                this.user = {
                    id: supabaseUser.value.id,
                    name: supabaseUser.value.user_metadata?.full_name || 'Utilisateur',
                    email: supabaseUser.value.email || '',
                    avatar: supabaseUser.value.user_metadata?.avatar_url,
                    roles: this.roles
                }
            }
        },

        async logout() {
            const client = useSupabaseClient()
            await client.auth.signOut()
            this.user = null
            this.roles = []
            navigateTo('/login')
        }
    }
})