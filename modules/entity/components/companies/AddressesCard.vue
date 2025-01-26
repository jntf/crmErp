<!-- components/companies/AddressesCard.vue -->
<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2 text-xl font-semibold">
          <MapPin class="h-5 w-5" />
          Adresses
        </CardTitle>
        <Button variant="ghost" size="icon" @click="openAddDialog">
          <PlusIcon class="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>

    <CardContent>
      <div v-if="!addresses.length" class="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Building2 class="h-12 w-12 mb-2" />
        <p>Aucune adresse enregistrée</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="address in addresses" :key="address.id" class="rounded-lg border p-4">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <Badge variant="outline" :class="{ 'bg-primary text-white': address.is_primary }">
                  {{ getAddressTypeLabel(address.address_type) }}
                </Badge>
                <Badge v-if="address.is_primary" variant="secondary">
                  Principal
                </Badge>
              </div>

              <div class="mt-2 space-y-1">
                <p class="font-medium">
                  {{ address.street_number }} {{ address.street_name }}
                </p>
                <p v-if="address.address_line2" class="text-sm">
                  {{ address.address_line2 }}
                </p>
                <p class="text-sm">
                  {{ address.postal_code }} {{ address.city }}
                </p>
                <p v-if="address.state" class="text-sm">
                  {{ address.state }}
                </p>
                <p class="text-sm">
                  {{ getCountryName(address.country) }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <Button variant="ghost" size="icon" @click="editAddress(address)">
                <PencilIcon class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="deleteAddress(address.id)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CardContent>

    <!-- Dialog d'ajout/modification -->
    <Dialog :open="showDialog" @update:open="showDialog = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Modifier l\'adresse' : 'Ajouter une adresse' }}</DialogTitle>
        </DialogHeader>

        <form @submit.prevent="saveAddress" class="space-y-6">
          <!-- Type d'adresse et options -->
          <div class="space-y-4">
            <div class="space-y-2">
              <Label>Type d'adresse</Label>
              <Select v-model="form.address_type" required>
                <SelectTrigger>
                  <SelectValue :placeholder="getAddressTypeLabel(form.address_type)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="main">Principale</SelectItem>
                    <SelectItem value="billing">Facturation</SelectItem>
                    <SelectItem value="shipping">Livraison</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div class="flex items-center space-x-2">
              <Checkbox id="isPrimary" v-model="form.is_primary" />
              <Label for="isPrimary">Adresse principale</Label>
            </div>
          </div>

          <!-- Adresse -->
          <div class="grid gap-4">
            <div class="grid grid-cols-4 gap-4">
              <div class="space-y-2 col-span-1">
                <Label for="streetNumber">N°</Label>
                <Input id="streetNumber" v-model="form.street_number" required />
              </div>
              <div class="space-y-2 col-span-3">
                <Label for="streetName">Rue</Label>
                <Input id="streetName" v-model="form.street_name" required />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="addressLine2">Complément d'adresse</Label>
              <Input id="addressLine2" v-model="form.address_line2" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="postalCode">Code postal</Label>
                <Input id="postalCode" v-model="form.postal_code" required />
              </div>
              <div class="space-y-2">
                <Label for="city">Ville</Label>
                <Input id="city" v-model="form.city" required />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="state">Région/État</Label>
              <Input id="state" v-model="form.state" />
            </div>

            <div class="space-y-2">
              <Label for="country">Pays</Label>
              <Select v-model="form.country_id" required>
                <SelectTrigger class="w-full">
                  <SelectValue :placeholder="getCountryName(form.country_id)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem v-for="country in countries" :key="country.id" :value="country.id">
                      {{ country.name }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
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
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { Address } from '@/types/address.type'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MapPin, Building2, PlusIcon, PencilIcon, Trash2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'

interface Country {
  id: number
  name: string
  iso_code_2: string
  iso_code_3: string
}

interface Props {
  addresses: Address[]
  entityId: string
  entityType: 'company' | 'contact'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  refresh: []
}>()

const supabase = useSupabaseClient()
const { toast } = useToast()
const showDialog = ref(false)
const isEditing = ref(false)
const countries = ref<Country[]>([])
const isLoadingCountries = ref(false)

const form = ref<Partial<Address>>({
  entity_type: props.entityType,
  entity_id: props.entityId,
  address_type: 'main',
  street_number: '',
  street_name: '',
  address_line2: '',
  postal_code: '',
  city: '',
  state: '',
  country_id: 1,
  is_primary: false,
  country: undefined
})

const fetchCountries = async () => {
  try {
    isLoadingCountries.value = true
    const { data, error } = await supabase.from('countries').select('*').order('name')
    if (error) throw error
    countries.value = data
  } catch (error) {
    console.error('Error fetching countries:', error)
    toast({
      title: "Erreur",
      description: "Impossible de charger la liste des pays",
      variant: "destructive"
    })
  } finally {
    isLoadingCountries.value = false
  }
}

const getAddressTypeLabel = (type: string) => {
  const types = {
    main: 'Principale',
    billing: 'Facturation',
    shipping: 'Livraison'
  }
  return types[type as keyof typeof types] || type
}

const getCountryName = (countryOrId: Country | number | undefined | null) => {
  if (!countryOrId) return 'Inconnu'

  if (typeof countryOrId === 'number') {
    const country = countries.value.find(c => c.id === countryOrId)
    return country ? country.name : 'Inconnu'
  }

  // Si c'est un objet Country
  if ('name' in countryOrId) {
    return countryOrId.name
  }

  return 'Inconnu'
}

const openAddDialog = () => {
  isEditing.value = false
  form.value = {
    entity_type: props.entityType,
    entity_id: props.entityId,
    address_type: 'main',
    street_number: '',
    street_name: '',
    address_line2: '',
    postal_code: '',
    city: '',
    state: '',
    country_id: 1,
    is_primary: false,
    country: undefined
  }
  showDialog.value = true
}

const editAddress = (address: Address) => {
  isEditing.value = true
  const { country, ...addressData } = address
  form.value = {
    ...addressData,
    country_id: country?.id || addressData.country_id
  }
  showDialog.value = true
}

const saveAddress = async () => {
  try {
    // Nettoyer l'objet avant l'envoi à Supabase
    const { country, ...addressData } = form.value

    const { data, error } = await supabase
      .from('addresses')
      .upsert({
        ...addressData,
        entity_type: props.entityType,
        entity_id: props.entityId
      })

    if (error) throw error

    emit('refresh')
    showDialog.value = false
    toast({
      title: isEditing.value ? "Adresse modifiée" : "Adresse ajoutée",
      description: "Les modifications ont été enregistrées avec succès",
      variant: "success"
    })
  } catch (error) {
    console.error('Error saving address:', error)
    toast({
      title: "Erreur",
      description: "Une erreur est survenue lors de l'enregistrement",
      variant: "destructive"
    })
  }
}

const deleteAddress = async (addressId: string) => {
  try {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)

    if (error) throw error

    emit('refresh')
    toast({
      title: "Adresse supprimée",
      description: "L'adresse a été supprimée avec succès",
      variant: "success"
    })
  } catch (error) {
    console.error('Error deleting address:', error)
    toast({
      title: "Erreur",
      description: "Une erreur est survenue lors de la suppression",
      variant: "destructive"
    })
  }
}

onMounted(async () => {
  await fetchCountries()
})
</script>