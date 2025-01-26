export default defineNuxtRouteMiddleware(async () => {
    console.log('=== ADMIN MIDDLEWARE ===')
    const authStore = useAuthStore()
    const adminRoles = ['superadmin', 'admin']

    console.log('Current user:', authStore.user)
    console.log('Current roles in store:', authStore.roles)
    
    const hasAdminAccess = adminRoles.some(role => authStore.hasRole(role))
    console.log('Has admin access:', hasAdminAccess)

    if (!hasAdminAccess) {
        throw createError({
            statusCode: 403,
            message: 'Accès non autorisé'
        })
    }
})