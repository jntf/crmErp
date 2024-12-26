// modules/webStock/middleware/check-module-access.ts
export default defineEventHandler(async (event) => {
    // Vérifier si la route commence par /webstock
    if (event.path?.startsWith('/webstock')) {
        const session = await useSupabaseUser()

        if (!session) {
            throw createError({
                statusCode: 401,
                message: 'Non authentifié'
            })
        }

        // Vérifier l'accès au module via une requête à Supabase
        const client = useSupabaseClient()
        const { data: modules, error } = await client
            .rpc('get_accessible_modules') as { data: Array<{ module_name: string }>, error: any }

        if (error || !modules.some(m => m.module_name === 'webStock')) {
            throw createError({
                statusCode: 403,
                message: 'Module non accessible'
            })
        }
    }
})