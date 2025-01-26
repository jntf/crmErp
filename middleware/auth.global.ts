// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
    const authStore = useAuthStore()
    const moduleStore = useModuleStore()
    const user = useSupabaseUser()
    const client = useSupabaseClient()

    const publicRoutes = ['/login', '/forgot-password']
    if (publicRoutes.includes(to.path)) {
        return
    }

    if (!user.value) {
        return navigateTo('/login')
    }

    try {
        const { data: roleRows, error } = await client
            .from('user_roles')
            .select(`
                roles (
                    name
                )
            `)
            .eq('user_id', user.value.id)

        if (error) {
            return navigateTo('/login')
        }

        const roles = roleRows?.map(row => (row as any).roles.name as string) || []
        await authStore.setRoles(roles)
        await authStore.initUser()
        await moduleStore.fetchAccessibleModules()

    } catch (error) {
        return navigateTo('/login')
    }
})