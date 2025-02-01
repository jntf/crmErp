<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Mise à jour du statut</DialogTitle>
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
import { Loader2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import { VehicleStatusEnum } from '../types'

const props = defineProps<{
  modelValue: boolean
  selectedVehicles: any[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'status-updated': [vehicles: any[]]
}>()

const { toast } = useToast()
const updating = ref(false)
const selectedStatus = ref<VehicleStatusEnum>(VehicleStatusEnum.IN_STOCK)

const selectedCount = computed(() => props.selectedVehicles.length)

const statuses = [
  { value: VehicleStatusEnum.IN_STOCK, label: 'En stock', classes: 'bg-green-100 text-green-700' },
  { value: VehicleStatusEnum.IN_OFFER, label: 'En offre', classes: 'bg-orange-100 text-orange-700' },
  { value: VehicleStatusEnum.IN_TRADING, label: 'Trading', classes: 'bg-yellow-100 text-yellow-700' },
  { value: VehicleStatusEnum.IN_DEALING, label: 'A risque', classes: 'bg-yellow-100 text-yellow-700' },
  { value: VehicleStatusEnum.RESERVED, label: 'Réservé', classes: 'bg-yellow-100 text-yellow-700' },
  { value: VehicleStatusEnum.SOLD, label: 'Vendu', classes: 'bg-blue-100 text-blue-700' },
  { value: VehicleStatusEnum.EXPOSED, label: 'Exposé', classes: 'bg-purple-100 text-purple-700' },
  { value: VehicleStatusEnum.IN_TRANSIT, label: 'En transit', classes: 'bg-indigo-100 text-indigo-700' },
  { value: VehicleStatusEnum.DELIVERED, label: 'Livré', classes: 'bg-green-100 text-green-700' },
  { value: VehicleStatusEnum.BILLED, label: 'Facturé', classes: 'bg-blue-100 text-blue-700' },
  { value: VehicleStatusEnum.ARCHIVED, label: 'Archivé', classes: 'bg-gray-100 text-gray-700' }
]

const handleSubmit = async () => {
  updating.value = true
  const supabase = useSupabaseClient()

  try {
    // Récupérer d'abord les status existants pour avoir les IDs
    const { data: existingStatuses, error: fetchError } = await supabase
      .from('vehicle_status')
      .select('id, vehicle_id')
      .in('vehicle_id', props.selectedVehicles.map(v => v.id))

    if (fetchError) throw fetchError

    // Créer les updates avec les IDs existants
    const updates = props.selectedVehicles.map(vehicle => {
      const existingStatus = existingStatuses?.find(status => status.vehicle_id === vehicle.id)
      return {
        id: existingStatus?.id, // Utiliser l'ID existant s'il existe
        vehicle_id: vehicle.id,
        status: selectedStatus.value,
        updated_at: new Date().toISOString()
      }
    })

    console.log('Updates:', updates)

    const { error } = await supabase
      .from('vehicle_status')
      .upsert(updates, { onConflict: 'id' })

    if (error) throw error

    toast({
      title: 'Statut mis à jour',
      description: `Le statut de ${selectedCount.value} véhicule(s) a été mis à jour avec succès.`
    })

    emit('status-updated', props.selectedVehicles)
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