<!-- components/companies/AddressesCard.vue -->
<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-xl font-semibold">
        <MapPin class="h-5 w-5" />
        Adresses
        <Button v-if="!readonly" variant="ghost" size="icon" class="ml-auto">
          <Plus class="h-4 w-4" />
        </Button>
        <Button v-else variant="ghost" size="icon" class="ml-auto">
          <PencilIcon class="h-4 w-4" />
        </Button>
      </CardTitle>
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
              <!-- Badge pour le type d'adresse -->
              <div class="flex items-center gap-2">
                <Badge variant="outline" class="capitalize" :class="{ 'bg-green-500 text-white': address.is_primary }">
                  {{ address.address_type == "main" ? "Principale" : "Secondaire" }}
                </Badge>
              </div>

              <!-- Adresse complète -->
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
                  {{ address.country.name }}
                  <span class="text-muted-foreground">({{ address.country.iso_code_2 }})</span>
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="!readonly" class="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Pencil class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Building2, Plus, Pencil, Trash2, PencilIcon } from 'lucide-vue-next'

interface Country {
  id: number
  name: string
  iso_code_2: string
  iso_code_3: string
}

interface Address {
  id: number
  address_type: string
  is_primary: boolean
  street_number: string
  street_name: string
  address_line2: string | null
  postal_code: string
  city: string
  state: string | null
  country: Country
}

interface Props {
  addresses: Address[]
  readonly?: boolean
}

defineProps<Props>()
</script>