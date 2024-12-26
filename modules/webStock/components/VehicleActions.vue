// modules/webStock/components/VehicleActions.vue
<template>
  <div>
    <Dialog :open="isOpen" @update:open="isOpen = $event">
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" :disabled="!hasSelection">
          <PlusCircle class="mr-2 h-4 w-4" />
          Publier sur le site
        </Button>
      </DialogTrigger>

      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Publication des véhicules</DialogTitle>
          <DialogDescription>
            Cette action va publier les véhicules sélectionnés sur le site de vente.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="space-y-2">
            <h4 class="font-medium">Véhicules sélectionnés:</h4>
            <ul class="text-sm space-y-1 max-h-40 overflow-y-auto">
              <li v-for="vehicle in selectedVehicles" :key="vehicle.vehicleData.id"
                class="flex justify-between items-center">
                <span>{{ vehicle.vehicleData.brand }} {{ vehicle.vehicleData.model }} - {{ vehicle.vehicleData.version
                  }}</span>
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

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">
              Annuler
            </Button>
          </DialogClose>
          <Button type="submit" @click="saveVehicles" :disabled="isSaving || !isValid">
            {{ isSaving ? 'Publication...' : 'Publier' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PlusCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

function calculateSellingPrice(basePrice: number): number {
  switch (priceStrategy.value) {
    case 'margin':
      return basePrice + priceModifier.value
    case 'percentage':
      return basePrice * (1 + priceModifier.value / 100)
    default:
      return sellingPrice.value
  }
}

async function saveVehicles() {
  if (!isValid.value) return

  isSaving.value = true
  try {
    // TODO: Implémentez la logique de sauvegarde avec Supabase ici
    console.log('Publication des véhicules...')

    emit('success')
    isOpen.value = false
  } catch (error) {
    emit('error', error as Error)
  } finally {
    isSaving.value = false
  }
}
</script>