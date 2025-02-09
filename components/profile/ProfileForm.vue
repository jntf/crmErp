<template>
    <Card>
        <CardHeader>
            <CardTitle>Informations du profil</CardTitle>
            <CardDescription>
                Gérez vos informations personnelles et vos préférences
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form @submit="onSubmit" class="space-y-6">
                <!-- Informations de base -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <Label>Prénom</Label>
                        <Input v-model="values.first_name" placeholder="Votre prénom" />
                    </div>

                    <div class="space-y-2">
                        <Label>Nom</Label>
                        <Input v-model="values.last_name" placeholder="Votre nom" />
                    </div>

                    <div class="space-y-2">
                        <Label>Email professionnel</Label>
                        <Input v-model="values.professional_email" type="email" placeholder="votre@email.com" />
                    </div>

                    <div class="space-y-2">
                        <Label>Téléphone</Label>
                        <Input v-model="values.phone" placeholder="+33 6 12 34 56 78" />
                    </div>

                    <div class="space-y-2">
                        <Label>Poste</Label>
                        <Input v-model="values.job_title" placeholder="Votre poste" />
                    </div>

                    <div class="space-y-2">
                        <Label>Département</Label>
                        <Input v-model="values.department" placeholder="Votre département" />
                    </div>
                </div>

                <!-- Préférences -->
                <div class="space-y-4">
                    <h3 class="text-lg font-medium">Préférences</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="space-y-2">
                            <Label>Langue</Label>
                            <Select v-model="language">
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez une langue" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="fr">Français</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div class="space-y-2">
                            <Label>Fuseau horaire</Label>
                            <Select v-model="timezone">
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un fuseau horaire" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                                        <SelectItem value="UTC">UTC</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div class="space-y-2">
                            <Label>Thème</Label>
                            <Select v-model="theme">
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un thème" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="light">Clair</SelectItem>
                                        <SelectItem value="dark">Sombre</SelectItem>
                                        <SelectItem value="system">Système</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <!-- Notifications -->
                    <div class="space-y-4">
                        <h4 class="font-medium">Notifications</h4>
                        
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div class="space-y-0.5">
                                    <Label>Email</Label>
                                    <p class="text-sm text-muted-foreground">
                                        Recevoir les notifications par email
                                    </p>
                                </div>
                                <Switch v-model="emailEnabled" />
                            </div>

                            <div v-if="emailEnabled" class="space-y-2">
                                <Label>Fréquence</Label>
                                <Select v-model="emailFrequency">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez une fréquence" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="immediate">Immédiate</SelectItem>
                                            <SelectItem value="daily">Quotidienne</SelectItem>
                                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div class="flex items-center justify-between">
                                <div class="space-y-0.5">
                                    <Label>WhatsApp</Label>
                                    <p class="text-sm text-muted-foreground">
                                        Recevoir les notifications par WhatsApp
                                    </p>
                                </div>
                                <Switch v-model="whatsappEnabled" />
                            </div>

                            <div v-if="whatsappEnabled" class="space-y-2">
                                <Label>Numéro WhatsApp</Label>
                                <Input v-model="whatsappNumber" placeholder="+33 6 12 34 56 78" />
                            </div>

                            <div class="flex items-center justify-between">
                                <div class="space-y-0.5">
                                    <Label>Telegram</Label>
                                    <p class="text-sm text-muted-foreground">
                                        Recevoir les notifications par Telegram
                                    </p>
                                </div>
                                <Switch v-model="telegramEnabled" />
                            </div>

                            <div v-if="telegramEnabled" class="space-y-2">
                                <Label>Nom d'utilisateur Telegram</Label>
                                <Input v-model="telegramUsername" placeholder="@username" />
                            </div>
                        </div>
                    </div>
                </div>

                <Button type="submit">
                    Enregistrer les modifications
                </Button>
            </form>
        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/toast/use-toast'
import type { Database } from '@/types/database.types'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { toast } from 'vue-sonner'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

const defaultPreferences = {
  language: 'fr',
  timezone: 'Europe/Paris',
  theme: 'light',
  notifications: {
    email: {
      enabled: true,
      frequency: 'daily'
    },
    whatsapp: {
      enabled: false,
      number: null as string | null
    },
    telegram: {
      enabled: false,
      username: null as string | null
    }
  }
}

const formSchema = toTypedSchema(
  z.object({
    first_name: z.string().min(2).max(50),
    last_name: z.string().min(2).max(50),
    professional_email: z.string().email(),
    phone: z.string().min(10).max(15).optional(),
    job_title: z.string().min(2).max(50),
    department: z.string().min(2).max(50),
    preferences: z.object({
      language: z.string(),
      timezone: z.string(),
      theme: z.string(),
      notifications: z.object({
        email: z.object({
          enabled: z.boolean(),
          frequency: z.string()
        }),
        whatsapp: z.object({
          enabled: z.boolean(),
          number: z.string().nullable()
        }),
        telegram: z.object({
          enabled: z.boolean(),
          username: z.string().nullable()
        })
      })
    }).default(defaultPreferences)
  })
)

const { handleSubmit, values } = useForm({
  validationSchema: formSchema,
  initialValues: {
    first_name: '',
    last_name: '',
    professional_email: '',
    phone: '',
    job_title: '',
    department: '',
    preferences: defaultPreferences
  }
})

// Computed properties pour les préférences
const language = computed({
  get: () => values.preferences?.language || defaultPreferences.language,
  set: (value: string) => {
    if (values.preferences) values.preferences.language = value
  }
})

const timezone = computed({
  get: () => values.preferences?.timezone || defaultPreferences.timezone,
  set: (value: string) => {
    if (values.preferences) values.preferences.timezone = value
  }
})

const theme = computed({
  get: () => values.preferences?.theme || defaultPreferences.theme,
  set: (value: string) => {
    if (values.preferences) values.preferences.theme = value
  }
})

const emailEnabled = computed({
  get: () => values.preferences?.notifications?.email?.enabled || defaultPreferences.notifications.email.enabled,
  set: (value: boolean) => {
    if (values.preferences?.notifications?.email) values.preferences.notifications.email.enabled = value
  }
})

const emailFrequency = computed({
  get: () => values.preferences?.notifications?.email?.frequency || defaultPreferences.notifications.email.frequency,
  set: (value: string) => {
    if (values.preferences?.notifications?.email) values.preferences.notifications.email.frequency = value
  }
})

const whatsappEnabled = computed({
  get: () => values.preferences?.notifications?.whatsapp?.enabled || defaultPreferences.notifications.whatsapp.enabled,
  set: (value: boolean) => {
    if (values.preferences?.notifications?.whatsapp) values.preferences.notifications.whatsapp.enabled = value
  }
})

const whatsappNumber = computed({
  get: () => values.preferences?.notifications?.whatsapp?.number || '',
  set: (value: string) => {
    if (values.preferences?.notifications?.whatsapp) values.preferences.notifications.whatsapp.number = value || null
  }
})

const telegramEnabled = computed({
  get: () => values.preferences?.notifications?.telegram?.enabled || defaultPreferences.notifications.telegram.enabled,
  set: (value: boolean) => {
    if (values.preferences?.notifications?.telegram) values.preferences.notifications.telegram.enabled = value
  }
})

const telegramUsername = computed({
  get: () => values.preferences?.notifications?.telegram?.username || '',
  set: (value: string) => {
    if (values.preferences?.notifications?.telegram) values.preferences.notifications.telegram.username = value || null
  }
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const fetchProfileData = async () => {
  if (!user.value?.id) return

  try {
    // Vérifier si le profil existe
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking profile:', checkError)
      toast.error('Erreur lors de la vérification du profil')
      return
    }

    if (!existingProfile) {
      // Créer un nouveau profil si aucun n'existe
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.value.id,
          first_name: '',
          last_name: '',
          professional_email: user.value.email || '',
          preferences: defaultPreferences
        })

      if (insertError) {
        console.error('Error creating profile:', insertError)
        toast.error('Erreur lors de la création du profil')
        return
      }

      // Initialiser les valeurs par défaut
      Object.assign(values, {
        first_name: '',
        last_name: '',
        professional_email: user.value.email || '',
        phone: '',
        job_title: '',
        department: '',
        preferences: defaultPreferences
      })
    } else {
      // Utiliser le profil existant
      Object.assign(values, {
        first_name: existingProfile.first_name || '',
        last_name: existingProfile.last_name || '',
        professional_email: existingProfile.professional_email || '',
        phone: existingProfile.phone || '',
        job_title: existingProfile.job_title || '',
        department: existingProfile.department || '',
        preferences: {
          ...defaultPreferences,
          ...(existingProfile.preferences || {})
        }
      })
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
    toast.error('Erreur lors de la récupération du profil')
  }
}

const onSubmit = handleSubmit(async (formData) => {
  if (!user.value?.id) return

  const profileData: ProfileInsert = {
    id: user.value.id,
    ...formData,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(profileData)

  if (error) {
    toast.error('Erreur lors de la sauvegarde du profil')
    return
  }

  toast.success('Profil mis à jour avec succès')
})

onMounted(() => {
  fetchProfileData()
})
</script> 