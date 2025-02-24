<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="sm:max-w-[800px]">
      <DialogHeader>
        <DialogTitle>Gestion du Stock</DialogTitle>
        <DialogDescription>
          {{ isMultiple ? `Gérer ${selectedVehicles.length} véhicule(s)` : 'Gérer le véhicule' }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Informations sur le lot -->
        <div v-if="hasLot" class="rounded-lg border p-4 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-medium">Lot de véhicules</h4>
              <p class="text-sm text-muted-foreground">
                {{ selectedVehicles[0].qty }} véhicules identiques
              </p>
            </div>
            <Button variant="outline" @click="handleSplit" :disabled="!canSplit">
              Dissocier le lot
            </Button>
          </div>
        </div>

        <!-- Formulaire d'entrée en stock -->
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- VIN (uniquement si un seul véhicule) -->
            <div v-if="!isMultiple" class="space-y-2">
              <Label>Numéro de série (VIN)</Label>
              <Input
                v-model="form.vin"
                placeholder="Ex: WF0FXXWPFFAA12345"
              />
            </div>

            <!-- Statut -->
            <div class="space-y-2">
              <Label>Statut</Label>
              <Select v-model="form.status">
                <SelectTrigger>
                  <SelectValue :placeholder="getStatusLabel(form.status)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem
                      v-for="status in stockStatuses"
                      :key="status.value"
                      :value="status.value"
                    >
                      {{ status.label }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- Localisation -->
            <div class="space-y-2">
              <Label>Localisation</Label>
              <Input
                v-model="form.location"
                placeholder="Ex: Parking A"
              />
            </div>

            <!-- Notes -->
            <div class="space-y-2">
              <Label>Notes</Label>
              <Textarea
                v-model="form.notes"
                placeholder="Notes additionnelles..."
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:modelValue', false)">
          Annuler
        </Button>
        <Button @click="handleSubmit" :disabled="loading">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isEditing ? 'Mettre à jour' : 'Enregistrer' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import type { Vehicle } from '../types'
import { VehicleStockStatus } from '../types/stock'
import { useVehicleStockStore } from '../stores/useVehicleStockStore'

// Props
const props = defineProps<{
  modelValue: boolean
  selectedVehicles: Vehicle[]
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'stock-updated'): void
}>()

// Stores
const stockStore = useVehicleStockStore()
const { toast } = useToast()

// État
const loading = ref(false)
const form = ref({
  vin: '',
  status: VehicleStockStatus.ORDERED as VehicleStockStatus,
  location: '',
  notes: ''
})

// Computed
const isMultiple = computed(() => props.selectedVehicles.length > 1)
const hasLot = computed(() => props.selectedVehicles.length === 1 && (props.selectedVehicles[0].qty || 0) > 1)
const canSplit = computed(() => hasLot.value && form.value.vin)
const isEditing = computed(() => false) // Pour l'instant, on ne gère que la création

// Liste des statuts de stock disponibles
const stockStatuses = [
  { value: VehicleStockStatus.ORDERED, label: 'Commandé' },
  { value: VehicleStockStatus.IN_TRANSIT, label: 'En transit' },
  { value: VehicleStockStatus.RECEIVED, label: 'Reçu' },
  { value: VehicleStockStatus.PREPARED, label: 'Préparé' },
  { value: VehicleStockStatus.AVAILABLE, label: 'Disponible' },
  { value: VehicleStockStatus.RESERVED, label: 'Réservé' },
  { value: VehicleStockStatus.SOLD, label: 'Vendu' }
]

// Méthodes
const getStatusLabel = (status: VehicleStockStatus): string => {
  return stockStatuses.find(s => s.value === status)?.label || 'Sélectionner un statut'
}

const handleSubmit = async () => {
  loading.value = true
  try {
    // Créer une entrée en stock pour chaque véhicule sélectionné
    await Promise.all(props.selectedVehicles.map(vehicle => 
      stockStore.createStockItem({
        vehicle_id: vehicle.id,
        vin: form.value.vin,
        status: form.value.status,
        location: form.value.location,
        notes: form.value.notes
      })
    ))

    toast({
      title: 'Stock mis à jour',
      description: 'Les véhicules ont été ajoutés au stock avec succès'
    })

    emit('stock-updated')
    emit('update:modelValue', false)
  } catch (error) {
    toast({
      title: 'Erreur',
      description: 'Une erreur est survenue lors de la mise à jour du stock',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

const handleSplit = async () => {
  if (!hasLot.value || !form.value.vin) return

  loading.value = true
  try {
    const vehicle = props.selectedVehicles[0]
    
    // Créer une entrée en stock pour le véhicule avec le VIN spécifié
    await stockStore.createStockItem({
      vehicle_id: vehicle.id,
      vin: form.value.vin,
      status: form.value.status,
      location: form.value.location,
      notes: form.value.notes
    })

    // Mettre à jour la quantité du lot (-1)
    // TODO: Implémenter la mise à jour de la quantité dans le store

    toast({
      title: 'Lot dissocié',
      description: 'Le véhicule a été dissocié du lot avec succès'
    })

    emit('stock-updated')
    emit('update:modelValue', false)
  } catch (error) {
    toast({
      title: 'Erreur',
      description: 'Une erreur est survenue lors de la dissociation du lot',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}
</script> 