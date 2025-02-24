<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="sm:max-w-[800px]">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? 'Modifier le véhicule' : 'Ajouter un véhicule' }}</DialogTitle>
        <DialogDescription>
          {{ isEditing ? 'Modifiez les informations du véhicule' : 'Remplissez les informations du nouveau véhicule' }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <Tabs defaultValue="general" class="w-full">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="technical">Technique</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
          </TabsList>

          <!-- Informations générales -->
          <TabsContent value="general" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <!-- Marque -->
              <div class="space-y-2">
                <Label>Marque *</Label>
                <Input
                  v-model="form.brand"
                  required
                  placeholder="Ex: Renault"
                />
              </div>

              <!-- Modèle -->
              <div class="space-y-2">
                <Label>Modèle *</Label>
                <Input
                  v-model="form.model"
                  required
                  placeholder="Ex: Clio"
                />
              </div>

              <!-- Version -->
              <div class="space-y-2">
                <Label>Version</Label>
                <Input
                  v-model="form.version"
                  placeholder="Ex: Intens"
                />
              </div>

              <!-- VIN -->
              <div class="space-y-2">
                <Label>Numéro de série (VIN)</Label>
                <Input
                  v-model="form.vin"
                  placeholder="Ex: WF0FXXWPFFAA12345"
                />
              </div>

              <!-- Immatriculation -->
              <div class="space-y-2">
                <Label>Immatriculation</Label>
                <Input
                  v-model="form.registration_number"
                  placeholder="Ex: AB-123-CD"
                />
              </div>

              <!-- Date de mise en circulation -->
              <div class="space-y-2">
                <Label>Date de mise en circulation</Label>
                <Input
                  v-model="form.registration_date"
                  type="date"
                />
              </div>

              <!-- Quantité -->
              <div class="space-y-2">
                <Label>Quantité</Label>
                <div class="flex items-center space-x-2">
                  <Input
                    v-model="form.qty"
                    type="number"
                    min="1"
                    :placeholder="isEditing ? String(form.qty || 1) : '1'"
                    :disabled="isEditing"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Info class="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent v-if="isEditing">
                      La quantité ne peut pas être modifiée après la création
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p class="text-sm text-muted-foreground">
                  Utilisé pour les commandes en lot
                </p>
              </div>
            </div>
          </TabsContent>

          <!-- Informations techniques -->
          <TabsContent value="technical" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <!-- Kilométrage -->
              <div class="space-y-2">
                <Label>Kilométrage</Label>
                <Input
                  v-model="form.mileage"
                  type="number"
                  placeholder="Ex: 50000"
                />
              </div>

              <!-- Carburant -->
              <div class="space-y-2">
                <Label>Carburant</Label>
                <Select v-model="form.fuel_type">
                  <option value="">Sélectionner</option>
                  <option value="essence">Essence</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybride">Hybride</option>
                  <option value="electrique">Électrique</option>
                </Select>
              </div>

              <!-- Transmission -->
              <div class="space-y-2">
                <Label>Transmission</Label>
                <Select v-model="form.transmission">
                  <option value="">Sélectionner</option>
                  <option value="manuelle">Manuelle</option>
                  <option value="automatique">Automatique</option>
                </Select>
              </div>

              <!-- Puissance -->
              <div class="space-y-2">
                <Label>Puissance (ch)</Label>
                <Input
                  v-model="form.power_hp"
                  type="number"
                  placeholder="Ex: 110"
                />
              </div>

              <!-- Puissance fiscale -->
              <div class="space-y-2">
                <Label>Puissance fiscale</Label>
                <Input
                  v-model="form.power_fiscal"
                  type="number"
                  placeholder="Ex: 6"
                />
              </div>

              <!-- CO2 -->
              <div class="space-y-2">
                <Label>Émissions CO2 (g/km)</Label>
                <Input
                  v-model="form.co2_emissions"
                  type="number"
                  placeholder="Ex: 95"
                />
              </div>
            </div>
          </TabsContent>

          <!-- Informations commerciales -->
          <TabsContent value="commercial" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <!-- Prix d'achat HT -->
              <div class="space-y-2">
                <Label>Prix d'achat HT *</Label>
                <Input
                  v-model="form.purchase_price_ht"
                  type="number"
                  required
                  placeholder="Ex: 15000"
                />
              </div>

              <!-- Prix de vente HT -->
              <div class="space-y-2">
                <Label>Prix de vente HT *</Label>
                <Input
                  v-model="form.selling_price_ht"
                  type="number"
                  required
                  placeholder="Ex: 18000"
                />
              </div>

              <!-- Frais de remise en état -->
              <div class="space-y-2">
                <Label>Frais de remise en état</Label>
                <Input
                  v-model="form.repair_cost"
                  type="number"
                  placeholder="Ex: 500"
                />
              </div>

              <!-- Frais de VO -->
              <div class="space-y-2">
                <Label>Frais de VO</Label>
                <Input
                  v-model="form.frevo"
                  type="number"
                  placeholder="Ex: 300"
                />
              </div>

              <!-- Statut -->
              <div class="space-y-2">
                <Label>Statut *</Label>
                <Select v-model="form.status" required>
                  <option
                    v-for="status in Object.values(VehicleStatusEnum)"
                    :key="status"
                    :value="status"
                  >
                    {{ formatStatus(status) }}
                  </option>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" @click="$emit('close')">
            Annuler
          </Button>
          <Button type="submit" :disabled="loading">
            <Spinner v-if="loading" class="mr-2 h-4 w-4" />
            {{ isEditing ? 'Mettre à jour' : 'Ajouter' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Vehicle, VehicleCreate } from '../types'
import { VehicleStatusEnum } from '../types'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-vue-next'
import { Spinner } from '@/components/ui/spinner'

// Props
const props = defineProps<{
  modelValue: boolean
  vehicle?: Vehicle | null
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', vehicle: VehicleCreate): void
  (e: 'close'): void
}>()

// État
const loading = ref(false)
const form = ref<VehicleCreate>({
  brand: '',
  model: '',
  status: VehicleStatusEnum.IN_STOCK,
  qty: 1
})

// Si on est en mode édition, on pré-remplit le formulaire
if (props.vehicle) {
  form.value = {
    ...props.vehicle,
    qty: props.vehicle.qty || 1
  }
}

// Computed
const isEditing = computed(() => !!props.vehicle)

// Méthodes
const handleSubmit = async () => {
  loading.value = true
  try {
    emit('save', form.value)
  } finally {
    loading.value = false
  }
}

const formatStatus = (status: VehicleStatusEnum): string => {
  const statusLabels: Record<VehicleStatusEnum, string> = {
    [VehicleStatusEnum.IN_STOCK]: 'En stock',
    [VehicleStatusEnum.IN_OFFER]: 'En offre',
    [VehicleStatusEnum.IN_TRADING]: 'En négociation',
    [VehicleStatusEnum.IN_DEALING]: 'En commande',
    [VehicleStatusEnum.RESERVED]: 'Réservé',
    [VehicleStatusEnum.SOLD]: 'Vendu',
    [VehicleStatusEnum.EXPOSED]: 'Exposé',
    [VehicleStatusEnum.IN_TRANSIT]: 'En transit',
    [VehicleStatusEnum.DELIVERED]: 'Livré',
    [VehicleStatusEnum.BILLED]: 'Facturé',
    [VehicleStatusEnum.ARCHIVED]: 'Archivé'
  }
  return statusLabels[status] || status
}
</script> 