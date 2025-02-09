<template>
  <div class="container mx-auto p-6">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">Notifications</h1>
      <p class="text-muted-foreground">
        Gérez vos préférences de notifications
      </p>
    </header>

    <Card class="mt-6">
      <CardHeader>
        <CardTitle>Préférences de notifications</CardTitle>
        <CardDescription>
          Configurez comment vous souhaitez être notifié
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="onSubmit" class="space-y-6">
          <div class="space-y-4">
            <!-- Email notifications -->
            <div class="space-y-4">
              <h3 class="font-medium">Notifications par email</h3>
              <div class="grid gap-2">
                <div class="flex items-center space-x-2">
                  <Switch v-model="form.email.enabled" id="email-enabled" />
                  <Label for="email-enabled">Activer les notifications par email</Label>
                </div>
                
                <div v-if="form.email.enabled" class="space-y-2">
                  <Label>Fréquence</Label>
                  <Select v-model="form.email.frequency">
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une fréquence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immédiate</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <!-- WhatsApp notifications -->
            <div class="space-y-4">
              <h3 class="font-medium">Notifications WhatsApp</h3>
              <div class="grid gap-2">
                <div class="flex items-center space-x-2">
                  <Switch v-model="form.whatsapp.enabled" id="whatsapp-enabled" />
                  <Label for="whatsapp-enabled">Activer les notifications WhatsApp</Label>
                </div>
                
                <div v-if="form.whatsapp.enabled" class="space-y-2">
                  <Label>Numéro WhatsApp</Label>
                  <Input v-model="form.whatsapp.number" type="tel" placeholder="+33 6 12 34 56 78" />
                </div>
              </div>
            </div>

            <!-- Telegram notifications -->
            <div class="space-y-4">
              <h3 class="font-medium">Notifications Telegram</h3>
              <div class="grid gap-2">
                <div class="flex items-center space-x-2">
                  <Switch v-model="form.telegram.enabled" id="telegram-enabled" />
                  <Label for="telegram-enabled">Activer les notifications Telegram</Label>
                </div>
                
                <div v-if="form.telegram.enabled" class="space-y-2">
                  <Label>Nom d'utilisateur Telegram</Label>
                  <Input v-model="form.telegram.username" placeholder="@username" />
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" :loading="isLoading">
            Enregistrer les préférences
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
import { Switch } from '@/components/ui/switch'

definePageMeta({
  middleware: ['auth']
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { toast } = useToast()
const isLoading = ref(false)

// État du formulaire
const form = ref({
  email: {
    enabled: true,
    frequency: 'immediate'
  },
  whatsapp: {
    enabled: false,
    number: ''
  },
  telegram: {
    enabled: false,
    username: ''
  }
})

// Chargement des préférences
const loadPreferences = async () => {
  try {
    if (!user.value) return

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.value.id)
      .single()

    if (error) throw error
    if (profile?.preferences?.notifications) {
      form.value = profile.preferences.notifications
    }
  } catch (error) {
    console.error('Error loading preferences:', error)
    toast({
      title: "Erreur",
      description: "Impossible de charger vos préférences",
      variant: "destructive"
    })
  }
}

// Sauvegarde des préférences
const onSubmit = async () => {
  try {
    isLoading.value = true
    if (!user.value) return

    const { error } = await supabase
      .from('profiles')
      .update({
        preferences: {
          notifications: form.value
        }
      })
      .eq('id', user.value.id)

    if (error) throw error

    toast({
      title: "Succès",
      description: "Vos préférences ont été enregistrées"
    })
  } catch (error) {
    console.error('Error saving preferences:', error)
    toast({
      title: "Erreur",
      description: "Impossible d'enregistrer vos préférences",
      variant: "destructive"
    })
  } finally {
    isLoading.value = false
  }
}

// Chargement initial
onMounted(() => {
  loadPreferences()
})
</script> 