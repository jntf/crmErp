//modules/webStock/components/VehicleActions.vue
<template>
  <div>
    <Button variant="outline" size="sm" :disabled="!hasSelection" @click="isOpen = true">
      <PlusCircle class="mr-2 h-4 w-4" />
      Publier sur le site
    </Button>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isOpen" class="fixed inset-0 z-[9999]">
          <!-- Overlay -->
          <div class="absolute inset-0 bg-background/80 backdrop-blur-sm" @click="isOpen = false" />

          <!-- Modal -->
          <div
            class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <div class="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 class="text-lg font-semibold leading-none tracking-tight">Publication des véhicules</h2>
              <p class="text-sm text-muted-foreground">
                Cette action va publier les véhicules sélectionnés sur le site de vente.
              </p>
            </div>

            <div class="grid gap-4 py-4">
              <div class="space-y-2">
                <h4 class="font-medium">Véhicules sélectionnés:</h4>
                <ul class="text-sm space-y-1 max-h-40 overflow-y-auto">
                  <li v-for="vehicle in selectedVehicles" :key="vehicle.vehicleData.id"
                    class="flex justify-between items-center">
                    <span>{{ vehicle.vehicleData.brand }} {{ vehicle.vehicleData.model }} - {{
                      vehicle.vehicleData.version }}</span>
                    <span class="text-gray-500">Prix de base: {{ formatPrice(vehicle.vehicleData.base_price) }}</span>
                  </li>
                </ul>
              </div>

              <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right col-span-2">Prix de vente</Label>
                <div class="col-span-2 flex items-center gap-2">
                  <Input v-model="sellingPrice" type="number" placeholder="Prix en euros" />
                  <Select v-model="priceStrategy">
                    <SelectTrigger class="w-[180px]">
                      <SelectValue placeholder="Stratégie de prix" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Prix fixe</SelectItem>
                      <SelectItem value="margin">Marge fixe</SelectItem>
                      <SelectItem value="percentage">% du prix de base</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div v-if="priceStrategy !== 'fixed'" class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right col-span-2">
                  {{ priceStrategy === 'margin' ? 'Marge (€)' : 'Pourcentage (%)' }}
                </Label>
                <Input v-model="priceModifier" type="number" class="col-span-2"
                  :placeholder="priceStrategy === 'margin' ? 'Marge en euros' : 'Pourcentage'" />
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <Button variant="secondary" @click="isOpen = false">
                Annuler
              </Button>
              <Button type="submit" @click="publishVehicles" :disabled="isSaving || !isValid">
                {{ isSaving ? 'Publication...' : 'Publier' }}
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PlusCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TransformedVehicle } from '../connectors/mcautomobiles/types'

const props = defineProps<{
  selectedVehicles: TransformedVehicle[]
}>()

const emit = defineEmits<{
  'success': []
  'error': [error: Error]
}>()

const isOpen = ref(false)
const sellingPrice = ref<number>(0)
const priceStrategy = ref<'fixed' | 'margin' | 'percentage'>('fixed')
const priceModifier = ref<number>(0)
const isSaving = ref(false)
const { toast } = useToast()

const hasSelection = computed(() => props.selectedVehicles.length > 0)
const isValid = computed(() => {
  if (priceStrategy.value === 'fixed') return sellingPrice.value > 0
  return priceModifier.value > 0
})

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

async function publishVehicles() {
  if (!isValid.value) return

  isSaving.value = true
  try {
    const response = await $fetch('/api/webstock/publish-vehicles', {
      method: 'POST',
      body: {
        vehicles: props.selectedVehicles,
        sellingPrice: sellingPrice.value,
        priceStrategy: priceStrategy.value,
        priceModifier: priceModifier.value
      }
    })

    toast({
      title: "Publication réussie",
      description: `${props.selectedVehicles.length} véhicule(s) publié(s) avec succès.`,
      variant: "success"
    })

    emit('success')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la publication:', error)
    toast({
      title: "Erreur de publication",
      description: error instanceof Error ? error.message : "Une erreur est survenue",
      variant: "destructive"
    })
    emit('error', error as Error)
  } finally {
    isSaving.value = false
  }
}
</script>

<style>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>