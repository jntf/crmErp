<!-- components/companies/ContactsCard.vue -->
<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2 text-xl font-semibold">
          <Users class="h-5 w-5" />
          Contacts
        </CardTitle>
        <Button variant="ghost" size="icon" @click="openAddDialog">
          <PlusIcon class="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>

    <CardContent>
      <!-- État vide -->
      <div v-if="!contacts.length" class="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Users class="h-12 w-12 mb-2" />
        <p>Aucun contact enregistré</p>
      </div>

      <!-- Liste des contacts -->
      <div v-else class="space-y-4">
        <div v-for="contact in contacts" :key="contact.id" class="flex flex-col p-4 rounded-lg border">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h3 class="font-medium">{{ contact.first_name }} {{ contact.last_name }}</h3>
                <Badge v-if="contact.status !== 'active'"
                  :variant="contact.status === 'inactive' ? 'secondary' : 'destructive'">
                  {{ contact.status }}
                </Badge>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <Badge v-if="contact.is_primary" variant="secondary">Principal</Badge>
                <Badge v-if="contact.role" variant="outline">{{ contact.role }}</Badge>
                <Badge v-if="contact.is_decision_maker" variant="default">Décideur</Badge>
                <Badge v-for="tag in contact.tags" :key="tag.id" variant="outline"
                  :style="{ backgroundColor: tag.color + '20', borderColor: tag.color }">
                  {{ tag.name }}
                </Badge>
              </div>
            </div>

            <div v-if="!readonly" class="flex items-center gap-1">
              <Button variant="ghost" size="icon" @click="editContact(contact)">
                <PencilIcon class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="deleteContact(contact.id)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <div v-if="contact.job_title || contact.department" class="text-sm text-muted-foreground">
                {{ contact.job_title }}
                <span v-if="contact.department">• {{ contact.department }}</span>
              </div>

              <div class="space-y-1 text-sm">
                <div v-if="contact.email" class="flex items-center gap-2">
                  <Mail class="h-4 w-4" />
                  <a :href="`mailto:${contact.email}`" class="text-primary hover:underline">
                    {{ contact.email }}
                  </a>
                </div>
                <div v-if="contact.phone" class="flex items-center gap-2">
                  <Phone class="h-4 w-4" />
                  <a :href="`tel:${contact.phone}`" class="hover:underline">
                    {{ contact.phone }}
                  </a>
                </div>
                <div v-if="contact.mobile_phone" class="flex items-center gap-2">
                  <Smartphone class="h-4 w-4" />
                  <a :href="`tel:${contact.mobile_phone}`" class="hover:underline">
                    {{ contact.mobile_phone }}
                  </a>
                </div>
                <div v-if="contact.linkedin_profile" class="flex items-center gap-2">
                  <LinkedinIcon class="h-4 w-4" />
                  <a :href="contact.linkedin_profile" target="_blank" class="hover:underline">
                    Profil LinkedIn
                  </a>
                </div>
              </div>
            </div>

            <div v-if="contact.notes" class="text-sm">
              <p class="text-muted-foreground">Notes</p>
              <p class="mt-1">{{ contact.notes }}</p>
            </div>
          </div>
        </div>
      </div>
    </CardContent>

    <!-- Dialog d'ajout/modification -->
    <Dialog :open="showDialog" @update:open="showDialog = $event">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Modifier le contact' : 'Ajouter un contact' }}</DialogTitle>
        </DialogHeader>

        <form @submit.prevent="saveContact" class="space-y-6">
          <!-- Informations principales - inchangé -->
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="firstName">Prénom</Label>
                <Input id="firstName" v-model="form.first_name" required />
              </div>
              <div class="space-y-2">
                <Label for="lastName">Nom</Label>
                <Input id="lastName" v-model="form.last_name" required />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input id="email" type="email" v-model="form.email" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="phone">Téléphone</Label>
                <Input id="phone" v-model="form.phone" />
              </div>
              <div class="space-y-2">
                <Label for="mobilePhone">Mobile</Label>
                <Input id="mobilePhone" v-model="form.mobile_phone" />
              </div>
            </div>
          </div>

          <!-- Informations professionnelles - inchangé -->
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="jobTitle">Fonction</Label>
                <Input id="jobTitle" v-model="form.job_title" />
              </div>
              <div class="space-y-2">
                <Label for="department">Service</Label>
                <Input id="department" v-model="form.department" />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="role">Rôle</Label>
              <Input id="role" v-model="form.role" />
            </div>

            <div class="space-y-2">
              <Label for="linkedinProfile">Profil LinkedIn</Label>
              <Input id="linkedinProfile" v-model="form.linkedin_profile" />
            </div>
          </div>

          <!-- Options et préférences -->
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="flex items-center space-x-2">
                <Checkbox id="isPrimary" v-model="form.is_primary" />
                <Label for="isPrimary">Contact principal</Label>
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox id="isDecisionMaker" v-model="form.is_decision_maker" />
                <Label for="isDecisionMaker">Décideur</Label>
              </div>
            </div>

            <!-- Langue avec Select de shadcn -->
            <div class="space-y-2">
              <Label for="language">Langue préférée</Label>
              <Select v-model="form.language">
                <SelectTrigger>
                  <SelectValue :placeholder="getLanguageLabel(form.language)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">Anglais</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- Tags avec Select de shadcn -->
            <div class="space-y-2">
              <Label>Tags</Label>
              <Select v-model="form.tagIds" multiple>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner des tags">
                    {{ getSelectedTagsLabel(form.tagIds) }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem v-for="tag in availableTags" :key="tag.id" :value="tag.id">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: tag.color }" />
                        {{ tag.name }}
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Notes -->
          <div class="space-y-2">
            <Label for="notes">Notes</Label>
            <Textarea id="notes" v-model="form.notes" rows="3" />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="showDialog = false">
              Annuler
            </Button>
            <Button type="submit">{{ isEditing ? 'Modifier' : 'Ajouter' }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSupabaseClient } from '#imports'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Users,
  PlusIcon,
  PencilIcon,
  Mail,
  Phone,
  Smartphone,
  Trash2,
  Linkedin as LinkedinIcon
} from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'

// Types & Interfaces
interface Tag {
  id: string
  name: string
  color: string
  category: string
}

interface Contact {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  mobile_phone?: string
  job_title?: string
  department?: string
  linkedin_profile?: string
  date_of_birth?: string
  is_primary: boolean
  status: 'active' | 'inactive' | 'archived'
  notes?: string
  language?: string
  company_id: number
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  role?: string
  is_decision_maker: boolean
  tags: Tag[]
}

interface FormData extends Partial<Contact> {
  tagIds: string[]
}

interface Props {
  contacts: Contact[]
  readonly?: boolean
  companyId: number
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<{
  refresh: []
}>()

// State
const supabase = useSupabaseClient()
const { toast } = useToast()
const showDialog = ref(false)
const isEditing = ref(false)
const availableTags = ref<Tag[]>([])

const initialForm: FormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  mobile_phone: '',
  job_title: '',
  department: '',
  linkedin_profile: '',
  status: 'active',
  notes: '',
  language: 'fr',
  is_primary: false,
  is_decision_maker: false,
  role: '',
  tagIds: []
}

const form = ref<FormData>({ ...initialForm })

// Methods
const getLanguageLabel = (language: string | undefined) => {
  const languages = {
    fr: 'Français',
    en: 'Anglais'
  }
  return languages[language as keyof typeof languages] || 'Sélectionner une langue'
}

const getSelectedTagsLabel = (tagIds: string[]) => {
  if (!tagIds?.length) return ''
  const selectedTags = availableTags.value.filter(tag => tagIds.includes(tag.id))
  return selectedTags.map(tag => tag.name).join(', ')
}

const fetchTags = async () => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')

    if (error) throw error
    availableTags.value = data
  } catch (error) {
    console.error('Error fetching tags:', error)
    toast({
      title: "Erreur",
      description: "Impossible de charger les tags",
      variant: "destructive"
    })
  }
}

const openAddDialog = () => {
  isEditing.value = false
  form.value = { ...initialForm }
  showDialog.value = true
}

const editContact = (contact: Contact) => {
  isEditing.value = true
  form.value = {
    ...contact,
    tagIds: contact.tags ? contact.tags.map(tag => tag.id) : []
  }
  showDialog.value = true
}

const saveContact = async () => {
  try {
    const contactData = {
      id: form.value.id,
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email: form.value.email,
      phone: form.value.phone,
      mobile_phone: form.value.mobile_phone,
      job_title: form.value.job_title,
      department: form.value.department,
      linkedin_profile: form.value.linkedin_profile,
      status: form.value.status,
      notes: form.value.notes,
      language: form.value.language,
      is_primary: form.value.is_primary,
      company_id: props.companyId
    }

    const companyContactData = {
      role: form.value.role,
      is_decision_maker: form.value.is_decision_maker
    }

    const { data, error } = await supabase.rpc('upsert_company_contact', {
      p_contact: contactData,
      p_company_contact: companyContactData,
      p_tags: form.value.tagIds
    })

    if (error) throw error

    showDialog.value = false
    emit('refresh')
    toast({
      title: isEditing.value ? "Contact modifié" : "Contact ajouté",
      description: "Les informations ont été enregistrées avec succès"
    })
  } catch (error) {
    console.error('Error saving contact:', error)
    toast({
      title: "Erreur",
      description: "Une erreur est survenue lors de l'enregistrement",
      variant: "destructive"
    })
  }
}

const deleteContact = async (contactId: number) => {
  try {
    const { error } = await supabase.rpc('delete_company_contact', {
      p_contact_id: contactId,
      p_company_id: props.companyId
    })

    if (error) throw error

    emit('refresh')
    toast({
      title: "Contact supprimé",
      description: "Le contact a été supprimé avec succès"
    })
  } catch (error) {
    console.error('Error deleting contact:', error)
    toast({
      title: "Erreur",
      description: "Une erreur est survenue lors de la suppression",
      variant: "destructive"
    })
  }
}

// Lifecycle hooks
onMounted(async () => {
  console.log('ContactsCard mounted')
  console.log('Company ID:', props.companyId)
  console.log('Initial contacts:', props.contacts)
  await fetchTags()
})

// Watch pour la réinitialisation du formulaire
watch(showDialog, (newValue) => {
  if (!newValue) {
    form.value = { ...initialForm }
    isEditing.value = false
  }
})

// Watch pour les props
watch(() => props.contacts, (newContacts) => {
  console.log('Contacts updated:', newContacts)
}, { deep: true })

// Computed properties pour la validation
const isFormValid = computed(() => {
  return form.value.first_name && form.value.last_name
})
</script>

<style scoped>
.contact-card {
  transition: all 0.3s ease;
}

.contact-card:hover {
  box-shadow: 0 0 0 1px var(--border);
}
</style>