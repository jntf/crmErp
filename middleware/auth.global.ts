export default defineNuxtRouteMiddleware(async (to) => {
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
      // Utiliser la fonction RPC avec le bon type de retour
      const { data: roleRows, error } = await client
          .from('user_roles')
          .select(`
              roles (
                  name
              )
          `)
          .eq('user_id', user.value.id)

      if (error) {
          return
      }

      const userStore = useState('user', () => ({
          roles: [] as string[]
      }))
      
      // Extraire les noms des rôles de la réponse
      userStore.value.roles = roleRows?.map(row => row.roles.name) || []

  } catch (error) {
      console.error('Unexpected error in auth middleware:', error)
  }
})