export default defineNuxtRouteMiddleware(async () => {
    const user = useSupabaseUser()
    const supabase = useSupabaseClient()
    
    if (!user.value) {
        return navigateTo('/login')
    }

    const { data: isSuperAdmin, error } = await supabase
        .rpc('is_superadmin_v2', { user_uuid: user.value.id })

    if (error || !isSuperAdmin) {
        console.error('Middleware superadmin error:', error)
        throw createError({
            statusCode: 403,
            message: 'Accès réservé aux super administrateurs'
        })
    }
})