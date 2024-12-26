export default defineNuxtRouteMiddleware(async () => {
    const userStore = useState('user')
    const adminRoles = ['superadmin', 'admin']

    if (!userStore.value.roles.some(role => adminRoles.includes(role))) {
        throw createError({
            statusCode: 403,
            message: 'Accès non autorisé'
        })
    }
})