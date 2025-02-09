<template>
  <div class="container mx-auto p-6">
    <header class="mb-6">
      <h1 class="text-3xl font-bold">Créer un nouvel utilisateur</h1>
      <p class="text-muted-foreground">Ajoutez un nouvel utilisateur et configurez ses accès</p>
    </header>

    <form @submit.prevent="onSubmit" class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>
            Informations de base de l'utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Prénom</Label>
                <Input v-model="form.first_name" placeholder="Prénom" required />
              </div>
              
              <div class="space-y-2">
                <Label>Nom</Label>
                <Input v-model="form.last_name" placeholder="Nom" required />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Email professionnel</Label>
                <Input v-model="form.email" type="email" placeholder="email@exemple.com" required />
              </div>
              
              <div class="space-y-2">
                <Label>Téléphone</Label>
                <Input v-model="form.phone" type="tel" placeholder="+33 6 12 34 56 78" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Poste</Label>
                <Input v-model="form.job_title" placeholder="Poste occupé" />
              </div>
              
              <div class="space-y-2">
                <Label>Service</Label>
                <Input v-model="form.department" placeholder="Service" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accès et permissions</CardTitle>
          <CardDescription>
            Configurez les accès et les rôles de l'utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Société</Label>
                <Select v-model="form.owner_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une société" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="owner in owners" :key="owner.id" :value="owner.id">
                      {{ owner.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div class="space-y-2">
                <Label>Statut</Label>
                <Select v-model="form.status">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="space-y-2">
              <Label>Rôles</Label>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div v-for="role in availableRoles" :key="role.value" class="flex items-center space-x-2">
                  <Checkbox 
                    :id="role.value"
                    v-model="form.roles"
                    :value="role.value"
                    :checked="form.roles.includes(role.value)"
                  />
                  <Label :for="role.value">{{ role.label }}</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          type="button"
          @click="router.back()"
        >
          Annuler
        </Button>
        <Button 
          type="submit"
          :disabled="isLoading"
        >
          <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          Créer l'utilisateur
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { Loader2Icon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// Définition du middleware
definePageMeta({
  middleware: ['superadmin']
})

const router = useRouter()
const supabase = useSupabaseClient()
const isLoading = ref(false)
const owners = ref<any[]>([])

// Rôles disponibles
const availableRoles = [
  { value: 'user', label: 'Utilisateur' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Administrateur' }
]

// État du formulaire
const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  job_title: '',
  department: '',
  owner_id: '',
  status: 'active' as 'active' | 'inactive',
  roles: [] as string[]
})

// Chargement des sociétés
const fetchOwners = async () => {
  try {
    const { data, error } = await supabase
      .from('owners')
      .select('id, name')
      .order('name')

    if (error) throw error
    owners.value = data || []
  } catch (error) {
    console.error('Error fetching owners:', error)
    toast.error('Impossible de charger les sociétés')
  }
}

// Soumission du formulaire
const onSubmit = async () => {
  try {
    isLoading.value = true

    // 1. Créer l'utilisateur dans Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: form.value.email,
      email_confirm: true,
      user_metadata: {
        full_name: `${form.value.first_name} ${form.value.last_name}`
      }
    })

    if (authError) throw authError

    // 2. Créer le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        full_name: `${form.value.first_name} ${form.value.last_name}`,
        email: form.value.email,
        phone: form.value.phone,
        job_title: form.value.job_title,
        department: form.value.department,
        owner_id: form.value.owner_id,
        status: form.value.status,
        roles: form.value.roles
      })

    if (profileError) throw profileError

    toast.success('Utilisateur créé avec succès')
    router.push('/admin/users')
  } catch (error) {
    console.error('Error creating user:', error)
    toast.error("Impossible de créer l'utilisateur")
  } finally {
    isLoading.value = false
  }
}

// Chargement initial
onMounted(() => {
  fetchOwners()
})
</script> 