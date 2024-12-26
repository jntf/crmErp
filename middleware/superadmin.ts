export default defineNuxtRouteMiddleware(async () => {
    const userStore = useState('user')

    if (!userStore.value.roles.includes('superadmin')) {
        throw createError({
            statusCode: 403,
            message: 'Accès non autorisé'
        })
    }
})