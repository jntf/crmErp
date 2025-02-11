<template>
  <div class="container mx-auto p-6">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Sociétés</h1>
        <p class="text-muted-foreground">Gérez les sociétés et leurs paramètres</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="fetchOwners">
          <RefreshCwIcon class="h-4 w-4 mr-2" />
          Actualiser
        </Button>
        <Button @click="router.push('/admin/owners/create')">
          <PlusIcon class="mr-2 h-4 w-4" />
          Nouvelle société
        </Button>
      </div>
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="confirmDelete(owner)" class="text-destructive">
                        <Trash2Icon class="mr-2 h-4 w-4" />
                        Supprimer
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

    <!-- Dialog de confirmation de suppression -->
    <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = false">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer la société</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer la société "{{ ownerToDelete?.name || '' }}" ?
            Cette action est irréversible et supprimera toutes les données associées.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            @click="showDeleteDialog = false"
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            :disabled="isLoading"
            @click="deleteOwner"
          >
            <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  PowerIcon,
  Trash2Icon,
  RefreshCwIcon
} from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Types
interface Owner {
  id: number
  name: string
  status: 'active' | 'inactive'
  company?: {
    name: string
    industry?: string
    email?: string
    phone?: string
  }
  modules: Array<{
    module_name: string
    is_active: boolean
    settings: Record<string, any>
  }>
  users: Array<{
    id: string // UUID
    role: string
  }>
  user_count: number
  created_at: string
  updated_at: string
}

// Définition du middleware
definePageMeta({
  middleware: ['superadmin']
})

const router = useRouter()
const supabase = useSupabaseClient()
const isLoading = ref(true)
const owners = ref<Owner[]>([])
const showDeleteDialog = ref(false)
const ownerToDelete = ref<Owner | null>(null)
const { toast } = useToast()
// Formatage de date
const formatDate = (date: string) => {
  return format(new Date(date), 'dd MMM yyyy', { locale: fr })
}

// Chargement des sociétés
const fetchOwners = async () => {
  try {
    isLoading.value = true
    
    // Récupérer les sociétés avec leurs modules et utilisateurs
    const { data, error } = await supabase
      .from('owners')
      .select(`
        *,
        company:companies(
          name,
          industry,
          email,
          phone
        ),
        modules:owner_modules(
          module_name,
          is_active,
          settings
        ),
        users:owner_users(
          id,
          role
        )
      `)
      .order('name')

    if (error) throw error

    // Transformation des données pour l'affichage
    owners.value = (data || []).map(owner => ({
      ...owner,
      name: owner.company?.name || owner.name,
      modules: owner.modules.filter((m: any) => m.is_active),
      user_count: owner.users?.length || 0
    }))
  } catch (error) {
    console.error('Error fetching owners:', error)
    toast({
      title: 'Erreur de chargement des sociétés',
      description: error instanceof Error ? error.message : 'Une erreur est survenue lors du chargement des sociétés'
    })
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
      toast({
        title: `La société a été ${newStatus === 'active' ? 'activée' : 'désactivée'}`,
        description: 'Le statut de la société a été mis à jour avec succès'
      })
  } catch (error) {
    console.error('Error toggling owner status:', error)
    toast({
      title: 'Impossible de modifier le statut de la société',
      description: 'Une erreur est survenue lors de la modification du statut de la société'
    })
  }
}

// Confirmation de suppression
const confirmDelete = (owner: any) => {
  ownerToDelete.value = owner
  showDeleteDialog.value = true
}

// Suppression d'une société
const deleteOwner = async () => {
  const owner = ownerToDelete.value
  if (!owner?.id) return

  try {
    isLoading.value = true
    
    // Appel de la fonction RPC
    const { data, error } = await supabase
      .rpc('delete_owner', {
        p_owner_id: owner.id
      })

    if (error) {
      console.error('Delete owner error:', error)
      throw new Error(error.message)
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Erreur lors de la suppression')
    }

    // Suppression locale
    owners.value = owners.value.filter(o => o.id !== owner.id)
    showDeleteDialog.value = false
    ownerToDelete.value = null
    toast({
      title: 'La société a été supprimée',
      description: 'La société a été supprimée avec succès'
    })
  } catch (error: any) {
    console.error('Error deleting owner:', error)
    toast({
      title: 'Impossible de supprimer la société',
      description: error.message || 'Une erreur est survenue lors de la suppression de la société'
    })
  } finally {
    isLoading.value = false
  }
}

// Chargement initial
onMounted(() => {
  fetchOwners()
})
</script> 