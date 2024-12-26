export default defineNuxtRouteMiddleware((to, from) => {
    const user = useSupabaseUser()

    if (!user.value && to.path !== '/login' && to.path !== '/forgot-password') {
        return navigateTo('/login')
    }
})