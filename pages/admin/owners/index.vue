<template>
  <div class="container mx-auto p-6">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Sociétés</h1>
        <p class="text-muted-foreground">Gérez les sociétés et leurs paramètres</p>
      </div>
      <Button @click="router.push('/admin/owners/create')">
        <PlusIcon class="mr-2 h-4 w-4" />
        Nouvelle société
      </Button>
    </header>

    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Liste des sociétés</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-if="isLoading" class="flex justify-center p-4">
              <Loader2Icon class="h-6 w-6 animate-spin" />
            </div>
            
            <div v-else-if="owners.length === 0" class="text-center py-6">
              <div class="space-y-2">
                <BuildingIcon class="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 class="font-medium">Aucune société</h3>
                <p class="text-sm text-muted-foreground">
                  Commencez par créer une nouvelle société
                </p>
              </div>
            </div>

            <div v-else class="divide-y">
              <div v-for="owner in owners" :key="owner.id" class="py-4">
                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <h3 class="font-medium">{{ owner.name }}</h3>
                    <div class="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Badge :variant="owner.status === 'active' ? 'default' : 'secondary'">
                        {{ owner.status === 'active' ? 'Active' : 'Inactive' }}
                      </Badge>
                      <span>·</span>
                      <span>{{ formatDate(owner.created_at) }}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVerticalIcon class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="router.push(`/admin/owners/${owner.id}/edit`)">
                        <PencilIcon class="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="router.push(`/admin/owners/${owner.id}/users`)">
                        <UsersIcon class="mr-2 h-4 w-4" />
                        Utilisateurs
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="router.push(`/admin/owners/${owner.id}/modules`)">
                        <LayoutGridIcon class="mr-2 h-4 w-4" />
                        Modules
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="router.push(`/admin/owners/${owner.id}/commissions`)">
                        <PercentIcon class="mr-2 h-4 w-4" />
                        Commissions
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="toggleOwnerStatus(owner)" :class="{'text-destructive': owner.status === 'active'}">
                        <PowerIcon class="mr-2 h-4 w-4" />
                        {{ owner.status === 'active' ? 'Désactiver' : 'Activer' }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 class="font-medium">Modules actifs</h4>
                    <div class="mt-1 flex flex-wrap gap-1">
                      <Badge v-for="module in owner.modules" :key="module.module_name" variant="outline">
                        {{ module.module_name }}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 class="font-medium">Utilisateurs</h4>
                    <p class="text-muted-foreground">{{ owner.user_count || 0 }} utilisateur(s)</p>
                  </div>

                  <div>
                    <h4 class="font-medium">Dernière modification</h4>
                    <p class="text-muted-foreground">{{ formatDate(owner.updated_at) }}</p>
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
  BuildingIcon,
  MoreVerticalIcon,
  PencilIcon,
  UsersIcon,
  LayoutGridIcon,
  PercentIcon,
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
const owners = ref<any[]>([])

// Formatage de date
const formatDate = (date: string) => {
  return format(new Date(date), 'dd MMM yyyy', { locale: fr })
}

// Chargement des sociétés
const fetchOwners = async () => {
  try {
    isLoading.value = true
    
    // Récupérer les sociétés avec leurs modules
    const { data, error } = await supabase
      .from('owners')
      .select(`
        *,
        modules:owner_modules(module_name, is_active),
        user_count:owner_users(count)
      `)
      .order('name')

    if (error) throw error
    owners.value = data || []
  } catch (error) {
    console.error('Error fetching owners:', error)
    toast.error('Impossible de charger les sociétés')
  } finally {
    isLoading.value = false
  }
}

// Activation/désactivation d'une société
const toggleOwnerStatus = async (owner: any) => {
  try {
    const newStatus = owner.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase
      .from('owners')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', owner.id)

    if (error) throw error

    owner.status = newStatus
    toast.success(`La société a été ${newStatus === 'active' ? 'activée' : 'désactivée'}`)
  } catch (error) {
    console.error('Error toggling owner status:', error)
    toast.error('Impossible de modifier le statut de la société')
  }
}

// Chargement initial
onMounted(() => {
  fetchOwners()
})
</script> 