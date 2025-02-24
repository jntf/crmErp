<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Mise à jour du statut de stock</DialogTitle>
        <DialogDescription>
          Sélectionnez le nouveau statut pour {{ selectedCount }} véhicule(s)
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <RadioGroup v-model="selectedStatus" class="grid gap-4">
          <div class="flex items-center space-x-2" v-for="status in statuses" :key="status.value">
            <RadioGroupItem :value="status.value" :id="status.value" />
            <Label :for="status.value" class="flex items-center">
              <div :class="[
                'inline-flex items-center justify-center rounded-full px-2 py-1 text-xs mr-2',
                status.classes
              ]">
                {{ status.label }}
              </div>
            </Label>
          </div>
        </RadioGroup>

        <!-- Champs additionnels selon le statut -->
        <div v-if="showAdditionalFields" class="space-y-4">
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
              rows="3"
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="$emit('update:modelValue', false)">Annuler</Button>
        <Button type="submit" :disabled="updating" @click="handleSubmit">
          <Loader2 v-if="updating" class="mr-2 h-4 w-4 animate-spin" />
          Mettre à jour
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import type { Vehicle } from '../types'
import { VehicleStockStatus } from '../types/stock'
import { useVehicleStockStore } from '../stores/useVehicleStockStore'

const props = defineProps<{
  modelValue: boolean
  selectedVehicles: Vehicle[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'status-updated'): void
}>()

const { toast } = useToast()
const stockStore = useVehicleStockStore()
const updating = ref(false)
const selectedStatus = ref<VehicleStockStatus>(VehicleStockStatus.ORDERED)

const form = ref({
  location: '',
  notes: ''
})

const selectedCount = computed(() => props.selectedVehicles.length)

const showAdditionalFields = computed(() => [
  VehicleStockStatus.RECEIVED,
  VehicleStockStatus.PREPARED,
  VehicleStockStatus.AVAILABLE
].includes(selectedStatus.value))

const statuses = [
  { value: VehicleStockStatus.ORDERED, label: 'Commandé', classes: 'bg-blue-100 text-blue-700' },
  { value: VehicleStockStatus.IN_TRANSIT, label: 'En transit', classes: 'bg-indigo-100 text-indigo-700' },
  { value: VehicleStockStatus.RECEIVED, label: 'Reçu', classes: 'bg-green-100 text-green-700' },
  { value: VehicleStockStatus.PREPARED, label: 'Préparé', classes: 'bg-yellow-100 text-yellow-700' },
  { value: VehicleStockStatus.AVAILABLE, label: 'Disponible', classes: 'bg-green-100 text-green-700' },
  { value: VehicleStockStatus.RESERVED, label: 'Réservé', classes: 'bg-orange-100 text-orange-700' },
  { value: VehicleStockStatus.SOLD, label: 'Vendu', classes: 'bg-blue-100 text-blue-700' },
  { value: VehicleStockStatus.CANCELLED, label: 'Annulé', classes: 'bg-gray-100 text-gray-700' }
]

const handleSubmit = async () => {
  updating.value = true
  try {
    // Mettre à jour le statut de stock pour chaque véhicule
    await Promise.all(props.selectedVehicles.map(vehicle => {
      const stockItem = {
        vehicle_id: vehicle.id,
        status: selectedStatus.value,
        ...(showAdditionalFields.value && {
          location: form.value.location,
          notes: form.value.notes
        })
      }
      return stockStore.updateStockItem(vehicle.id, stockItem)
    }))

    toast({
      title: 'Statut mis à jour',
      description: `Le statut de ${selectedCount.value} véhicule(s) a été mis à jour avec succès.`
    })

    emit('status-updated')
    emit('update:modelValue', false)
  } catch (error: any) {
    console.error('Error:', error)
    toast({
      title: 'Erreur',
      description: `Une erreur est survenue lors de la mise à jour : ${error.message}`,
      variant: 'destructive'
    })
  } finally {
    updating.value = false
  }
}
</script>