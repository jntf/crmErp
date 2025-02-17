<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger asChild>
      <Button>
        <PlusIcon class="mr-2 h-4 w-4" />
        Nouvelle commande
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Nouvelle commande</DialogTitle>
        <DialogDescription>
          Choisissez le type de vente pour créer une nouvelle commande
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label>Type de vente</Label>
          <Select v-model="selectedType">
            <SelectTrigger>
              <SelectValue :placeholder="'Sélectionnez un type'" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="type in saleTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="isOpen = false">
          Annuler
        </Button>
        <Button
          type="submit"
          :disabled="!selectedType"
          @click="createOrder"
        >
          Créer
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon } from 'lucide-vue-next'
import type { SaleType } from '../../types'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Button,
  Label
} from '#components'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const router = useRouter()
const isOpen = ref(false)
const selectedType = ref<SaleType | ''>('')

const saleTypes = [
  { value: 'B2C', label: 'Particulier' },
  { value: 'B2B', label: 'Professionnel' },
  { value: 'B2B2B', label: 'Intermédiation' }
]

const createOrder = () => {
  if (selectedType.value) {
    router.push({
      path: '/orders/new',
      query: { type: selectedType.value }
    })
    isOpen.value = false
  }
}
</script> 