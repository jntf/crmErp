<template>
  <div class="container mx-auto p-6">
    <header class="mb-6">
      <h1 class="text-3xl font-bold">Paramètres des commissions</h1>
      <p class="text-muted-foreground">Configuration globale du système de commissions</p>
    </header>

    <div class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres généraux</CardTitle>
          <CardDescription>
            Configuration générale du système de commissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="saveGeneralSettings" class="space-y-4">
            <div class="grid gap-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>Devise par défaut</Label>
                  <Select v-model="generalSettings.default_currency">
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">Dollar ($)</SelectItem>
                      <SelectItem value="GBP">Livre sterling (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div class="space-y-2">
                  <Label>Fréquence de calcul</Label>
                  <Select v-model="generalSettings.calculation_frequency">
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une fréquence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>Jour de calcul (si hebdomadaire)</Label>
                  <Select v-model="generalSettings.calculation_day">
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un jour" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Lundi</SelectItem>
                      <SelectItem value="2">Mardi</SelectItem>
                      <SelectItem value="3">Mercredi</SelectItem>
                      <SelectItem value="4">Jeudi</SelectItem>
                      <SelectItem value="5">Vendredi</SelectItem>
                      <SelectItem value="6">Samedi</SelectItem>
                      <SelectItem value="0">Dimanche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div class="space-y-2">
                  <Label>Heure de calcul</Label>
                  <Input 
                    v-model="generalSettings.calculation_time" 
                    type="time"
                    placeholder="00:00"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label>Règles de validation</Label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="flex items-center space-x-2">
                    <Checkbox 
                      v-model="generalSettings.require_approval"
                      id="require_approval"
                    />
                    <Label for="require_approval">Validation requise avant paiement</Label>
                  </div>
                  <div class="flex items-center space-x-2">
                    <Checkbox 
                      v-model="generalSettings.auto_approve_below"
                      id="auto_approve_below"
                    />
                    <Label for="auto_approve_below">Validation automatique en dessous du seuil</Label>
                  </div>
                </div>
              </div>

              <div v-if="generalSettings.auto_approve_below" class="space-y-2">
                <Label>Seuil de validation automatique</Label>
                <div class="flex items-center space-x-2">
                  <Input 
                    v-model="generalSettings.auto_approve_threshold" 
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1000"
                  />
                  <span class="text-muted-foreground">{{ generalSettings.default_currency }}</span>
                </div>
              </div>
            </div>

            <div class="flex justify-end space-x-4">
              <Button 
                type="submit"
                :disabled="isLoading"
              >
                <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configuration des notifications liées aux commissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="saveNotificationSettings" class="space-y-4">
            <div class="space-y-4">
              <div class="space-y-2">
                <Label>Notifications par email</Label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="flex items-center space-x-2">
                    <Checkbox 
                      v-model="notificationSettings.email_on_calculation"
                      id="email_on_calculation"
                    />
                    <Label for="email_on_calculation">Envoi après calcul</Label>
                  </div>
                  <div class="flex items-center space-x-2">
                    <Checkbox 
                      v-model="notificationSettings.email_on_approval"
                      id="email_on_approval"
                    />
                    <Label for="email_on_approval">Envoi après validation</Label>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <Label>Destinataires en copie</Label>
                <Textarea 
                  v-model="notificationSettings.cc_emails"
                  placeholder="email1@exemple.com, email2@exemple.com"
                  rows="2"
                />
                <p class="text-sm text-muted-foreground">
                  Séparez les adresses email par des virgules
                </p>
              </div>
            </div>

            <div class="flex justify-end space-x-4">
              <Button 
                type="submit"
                :disabled="isLoading"
              >
                <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2Icon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// Définition du middleware
definePageMeta({
  middleware: ['superadmin']
})

const supabase = useSupabaseClient()
const isLoading = ref(false)

// État des paramètres
const generalSettings = ref({
  default_currency: 'EUR',
  calculation_frequency: 'monthly',
  calculation_day: '1',
  calculation_time: '00:00',
  require_approval: true,
  auto_approve_below: false,
  auto_approve_threshold: 1000
})

const notificationSettings = ref({
  email_on_calculation: true,
  email_on_approval: true,
  cc_emails: ''
})

// Chargement des paramètres
const fetchSettings = async () => {
  try {
    isLoading.value = true
    
    const { data: general, error: generalError } = await supabase
      .from('commission_settings')
      .select('settings')
      .single()

    if (generalError) throw generalError
    if (general) {
      generalSettings.value = { ...generalSettings.value, ...general.settings }
    }

    const { data: notification, error: notificationError } = await supabase
      .from('commission_notification_settings')
      .select('settings')
      .single()

    if (notificationError) throw notificationError
    if (notification) {
      notificationSettings.value = { ...notificationSettings.value, ...notification.settings }
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    toast.error('Impossible de charger les paramètres')
  } finally {
    isLoading.value = false
  }
}

// Sauvegarde des paramètres généraux
const saveGeneralSettings = async () => {
  try {
    isLoading.value = true

    const { error } = await supabase
      .from('commission_settings')
      .upsert({
        settings: generalSettings.value,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    toast.success('Paramètres généraux enregistrés')
  } catch (error) {
    console.error('Error saving general settings:', error)
    toast.error('Impossible de sauvegarder les paramètres généraux')
  } finally {
    isLoading.value = false
  }
}

// Sauvegarde des paramètres de notification
const saveNotificationSettings = async () => {
  try {
    isLoading.value = true

    const { error } = await supabase
      .from('commission_notification_settings')
      .upsert({
        settings: notificationSettings.value,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    toast.success('Paramètres de notification enregistrés')
  } catch (error) {
    console.error('Error saving notification settings:', error)
    toast.error('Impossible de sauvegarder les paramètres de notification')
  } finally {
    isLoading.value = false
  }
}

// Chargement initial
onMounted(() => {
  fetchSettings()
})
</script> 