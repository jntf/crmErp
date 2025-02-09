export default defineNuxtRouteMiddleware(async () => {
    const user = useSupabaseUser()
    const supabase = useSupabaseClient()
    
    if (!user.value) {
        return navigateTo('/login')
    }

    const { data: isAdmin, error } = await supabase
        .rpc('is_admin_v2', { user_uuid: user.value.id })

    if (error || !isAdmin) {
        console.error('Middleware admin error:', error)
        throw createError({
            statusCode: 403,
            message: 'Accès réservé aux administrateurs'
        })
    }
})