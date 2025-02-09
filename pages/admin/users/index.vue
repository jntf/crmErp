<template>
  <div class="container mx-auto p-6">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Utilisateurs</h1>
        <p class="text-muted-foreground">Gérez les utilisateurs de toutes les sociétés</p>
      </div>
      <Button @click="router.push('/admin/users/create')">
        <PlusIcon class="mr-2 h-4 w-4" />
        Nouvel utilisateur
      </Button>
    </header>

    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-if="isLoading" class="flex justify-center p-4">
              <Loader2Icon class="h-6 w-6 animate-spin" />
            </div>
            
            <div v-else-if="users.length === 0" class="text-center py-6">
              <div class="space-y-2">
                <Users2Icon class="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 class="font-medium">Aucun utilisateur</h3>
                <p class="text-sm text-muted-foreground">
                  Commencez par créer un nouvel utilisateur
                </p>
              </div>
            </div>

            <div v-else class="divide-y">
              <div v-for="user in users" :key="user.id" class="py-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <UserIcon v-if="!user.avatar_url" class="w-5 h-5" />
                      <img v-else :src="user.avatar_url" :alt="user.full_name"
                        class="w-full h-full rounded-full object-cover" />
                    </div>
                    <div class="space-y-1">
                      <h3 class="font-medium">{{ user.full_name }}</h3>
                      <div class="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Badge :variant="user.status === 'active' ? 'default' : 'secondary'">
                          {{ user.status === 'active' ? 'Actif' : 'Inactif' }}
                        </Badge>
                        <span>·</span>
                        <span>{{ user.email }}</span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVerticalIcon class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="router.push(`/admin/users/${user.id}/edit`)">
                        <PencilIcon class="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="toggleUserStatus(user)" :class="{'text-destructive': user.status === 'active'}">
                        <PowerIcon class="mr-2 h-4 w-4" />
                        {{ user.status === 'active' ? 'Désactiver' : 'Activer' }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 class="font-medium">Rôles</h4>
                    <div class="mt-1 flex flex-wrap gap-1">
                      <Badge v-for="role in user.roles" :key="role" variant="outline">
                        {{ role }}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 class="font-medium">Société</h4>
                    <p class="text-muted-foreground">{{ user.owner?.name || 'Non assigné' }}</p>
                  </div>

                  <div>
                    <h4 class="font-medium">Dernière connexion</h4>
                    <p class="text-muted-foreground">{{ formatDate(user.last_sign_in_at) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  PlusIcon, 
  Loader2Icon, 
  Users2Icon,
  UserIcon,
  MoreVerticalIcon,
  PencilIcon,
  PowerIcon
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// Définition du middleware
definePageMeta({
  middleware: ['superadmin']
})

const router = useRouter()
const supabase = useSupabaseClient()
const isLoading = ref(true)
const users = ref<any[]>([])

// Formatage de date
const formatDate = (date: string | null) => {
  if (!date) return 'Jamais'
  return format(new Date(date), 'dd MMM yyyy', { locale: fr })
}

// Chargement des utilisateurs
const fetchUsers = async () => {
  try {
    isLoading.value = true
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        owner:owners(name)
      `)
      .order('full_name')

    if (error) throw error
    users.value = data || []
  } catch (error) {
    console.error('Error fetching users:', error)
    toast.error('Impossible de charger les utilisateurs')
  } finally {
    isLoading.value = false
  }
}

// Activation/désactivation d'un utilisateur
const toggleUserStatus = async (user: any) => {
  try {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase
      .from('profiles')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error

    user.status = newStatus
    toast.success(`L'utilisateur a été ${newStatus === 'active' ? 'activé' : 'désactivé'}`)
  } catch (error) {
    console.error('Error toggling user status:', error)
    toast.error("Impossible de modifier le statut de l'utilisateur")
  }
}

// Chargement initial
onMounted(() => {
  fetchUsers()
})
</script> 