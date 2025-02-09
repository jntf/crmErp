<template>
  <div class="container mx-auto p-6">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">Profil</h1>
      <p class="text-muted-foreground">
        Gérez vos informations personnelles et vos préférences
      </p>
    </header>

    <Card class="mt-6">
      <CardHeader>
        <CardTitle>Informations du profil</CardTitle>
        <CardDescription>
          Gérez vos informations personnelles et vos préférences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="onSubmit" class="space-y-6">
          <!-- Informations de base -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Prénom</Label>
              <Input v-model="form.first_name" placeholder="Votre prénom" />
            </div>

            <div class="space-y-2">
              <Label>Nom</Label>
              <Input v-model="form.last_name" placeholder="Votre nom" />
            </div>
          </div>

          <!-- Contact -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Email professionnel</Label>
              <Input v-model="form.professional_email" type="email" placeholder="email@exemple.com" />
            </div>

            <div class="space-y-2">
              <Label>Téléphone</Label>
              <Input v-model="form.phone" type="tel" placeholder="+33 6 12 34 56 78" />
            </div>
          </div>

          <!-- Informations professionnelles -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Poste</Label>
              <Input v-model="form.job_title" placeholder="Votre poste" />
            </div>

            <div class="space-y-2">
              <Label>Service</Label>
              <Input v-model="form.department" placeholder="Votre service" />
            </div>
          </div>

          <!-- Adresse -->
          <div class="space-y-2">
            <Label>Adresse professionnelle</Label>
            <div class="grid grid-cols-1 gap-4">
              <Input v-model="form.contact_info.addresses[0].street" placeholder="Rue" />
              <div class="grid grid-cols-2 gap-4">
                <Input v-model="form.contact_info.addresses[0].postal_code" placeholder="Code postal" />
                <Input v-model="form.contact_info.addresses[0].city" placeholder="Ville" />
              </div>
              <Input v-model="form.contact_info.addresses[0].country" placeholder="Pays" />
            </div>
          </div>

          <!-- Préférences -->
          <div class="space-y-4">
            <h3 class="font-medium">Préférences</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-2">
                <Label>Langue</Label>
                <Select v-model="form.preferences.language">
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label>Fuseau horaire</Label>
                <Select v-model="form.preferences.timezone">
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un fuseau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Europe/London">Londres</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label>Thème</Label>
                <Select v-model="form.preferences.theme">
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un thème" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button type="submit" :loading="isLoading">
            Enregistrer les modifications
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

definePageMeta({
  middleware: ['auth']
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { toast } = useToast()
const isLoading = ref(false)

// État du formulaire
const form = ref({
  first_name: '',
  last_name: '',
  professional_email: '',
  phone: '',
  job_title: '',
  department: '',
  contact_info: {
    addresses: [{
      type: 'professional',
      street: '',
      city: '',
      postal_code: '',
      country: '',
      is_primary: true
    }]
  },
  preferences: {
    language: 'fr',
    timezone: 'Europe/Paris',
    theme: 'light'
  }
})

// Chargement du profil
const loadProfile = async () => {
  try {
    if (!user.value) return

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()

    if (error) throw error
    if (profile) {
      form.value = {
        ...form.value,
        ...profile,
        contact_info: profile.contact_info || form.value.contact_info,
        preferences: {
          ...form.value.preferences,
          ...(profile.preferences || {})
        }
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error)
    toast({
      title: "Erreur",
      description: "Impossible de charger votre profil",
      variant: "destructive"
    })
  }
}

// Sauvegarde du profil
const onSubmit = async () => {
  try {
    isLoading.value = true
    if (!user.value) return

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        professional_email: form.value.professional_email,
        phone: form.value.phone,
        job_title: form.value.job_title,
        department: form.value.department,
        contact_info: form.value.contact_info,
        preferences: form.value.preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.value.id)

    if (error) throw error

    toast({
      title: "Succès",
      description: "Votre profil a été mis à jour"
    })
  } catch (error) {
    console.error('Error saving profile:', error)
    toast({
      title: "Erreur",
      description: "Impossible de mettre à jour votre profil",
      variant: "destructive"
    })
  } finally {
    isLoading.value = false
  }
}

// Chargement initial
onMounted(() => {
  loadProfile()
})
</script> 