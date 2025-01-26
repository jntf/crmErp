export default defineNuxtRouteMiddleware(async (to) => {
    const moduleStore = useModuleStore()

    // Vérifier si l'utilisateur a accès au module stock
    if (!moduleStore.hasAccess('stock')) {
        return navigateTo('/')
    }
}) 