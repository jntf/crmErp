<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="sm:max-w-[800px]">
      <DialogHeader>
        <DialogTitle>Gestion des équipements</DialogTitle>
        <DialogDescription>
          Modifiez les équipements de série et les options des véhicules sélectionnés.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <!-- Équipements de série -->
        <div class="space-y-2">
          <Label>Équipements de série</Label>
          <Command class="rounded-lg border shadow-md">
            <CommandInput placeholder="Rechercher un équipement..." />
            <CommandList>
              <CommandEmpty>Aucun équipement trouvé.</CommandEmpty>
              <CommandGroup>
                <div class="p-2">
                  <div class="flex items-center space-x-2">
                    <Input v-model="newSerieItem" placeholder="Nouvel équipement..." class="flex-1" />
                    <Button variant="outline" size="sm" @click="addSerieItem">
                      <Plus class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <ScrollArea class="h-[200px]">
                  <div class="p-2 space-y-2">
                    <div v-for="item in serieItems" :key="item" class="flex items-center space-x-2">
                      <Checkbox :id="'serie-' + item" v-model:checked="selectedSerie" :value="item" />
                      <Label :for="'serie-' + item" class="flex-1">{{ item }}</Label>
                      <Button variant="ghost" size="sm" @click="removeSerieItem(item)">
                        <X class="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        <!-- Options -->
        <div class="space-y-2">
          <Label>Options</Label>
          <Command class="rounded-lg border shadow-md">
            <CommandInput placeholder="Rechercher une option..." />
            <CommandList>
              <CommandEmpty>Aucune option trouvée.</CommandEmpty>
              <CommandGroup>
                <div class="p-2">
                  <div class="flex items-center space-x-2">
                    <Input v-model="newOptionItem" placeholder="Nouvelle option..." class="flex-1" />
                    <Button variant="outline" size="sm" @click="addOptionItem">
                      <Plus class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <ScrollArea class="h-[200px]">
                  <div class="p-2 space-y-2">
                    <div v-for="item in optionItems" :key="item" class="flex items-center space-x-2">
                      <Checkbox :id="'option-' + item" v-model:checked="selectedOptions" :value="item" />
                      <Label :for="'option-' + item" class="flex-1">{{ item }}</Label>
                      <Button variant="ghost" size="sm" @click="removeOptionItem(item)">
                        <X class="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        <!-- Véhicules sélectionnés -->
        <div class="space-y-2">
          <h4 class="font-medium">Véhicules sélectionnés:</h4>
          <ScrollArea class="h-[100px] rounded-md border">
            <div class="p-4">
              <p v-for="vehicle in selectedVehicles" :key="vehicle.id" class="text-sm">
                {{ vehicle.brand }} {{ vehicle.model }} - {{ vehicle.version }}
              </p>
            </div>
          </ScrollArea>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:modelValue', false)">Annuler</Button>
        <Button type="submit" @click="handleSave" :disabled="isSaving">
          {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type { Vehicle } from '../types'

const props = defineProps<{
  modelValue: boolean
  selectedVehicles: Vehicle[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [serie: string[], options: string[]]
}>()

const { toast } = useToast()

// État local
const isSaving = ref(false)
const newSerieItem = ref('')
const newOptionItem = ref('')
const serieItems = ref<string[]>([])
const optionItems = ref<string[]>([])
const selectedSerie = ref<string[]>([])
const selectedOptions = ref<string[]>([])

// Initialisation des données
watch(() => props.selectedVehicles, (vehicles) => {
  if (vehicles.length > 0) {
    // Récupérer tous les équipements uniques
    const allSerie = new Set<string>()
    const allOptions = new Set<string>()

    vehicles.forEach(vehicle => {
      const serie = vehicle.details?.features?.serie || []
      const options = vehicle.details?.features?.options || []
      
      serie.forEach(item => allSerie.add(item))
      options.forEach(item => allOptions.add(item))
    })

    serieItems.value = Array.from(allSerie)
    optionItems.value = Array.from(allOptions)

    // Sélectionner les équipements communs à tous les véhicules
    selectedSerie.value = Array.from(allSerie).filter(item =>
      vehicles.every(v => v.details?.features?.serie?.includes(item))
    )
    selectedOptions.value = Array.from(allOptions).filter(item =>
      vehicles.every(v => v.details?.features?.options?.includes(item))
    )
  }
}, { immediate: true })

// Gestion des équipements de série
const addSerieItem = () => {
  if (newSerieItem.value && !serieItems.value.includes(newSerieItem.value)) {
    serieItems.value.push(newSerieItem.value)
    selectedSerie.value.push(newSerieItem.value)
    newSerieItem.value = ''
  }
}

const removeSerieItem = (item: string) => {
  serieItems.value = serieItems.value.filter(i => i !== item)
  selectedSerie.value = selectedSerie.value.filter(i => i !== item)
}

// Gestion des options
const addOptionItem = () => {
  if (newOptionItem.value && !optionItems.value.includes(newOptionItem.value)) {
    optionItems.value.push(newOptionItem.value)
    selectedOptions.value.push(newOptionItem.value)
    newOptionItem.value = ''
  }
}

const removeOptionItem = (item: string) => {
  optionItems.value = optionItems.value.filter(i => i !== item)
  selectedOptions.value = selectedOptions.value.filter(i => i !== item)
}

// Sauvegarde
const handleSave = async () => {
  isSaving.value = true
  try {
    emit('save', selectedSerie.value, selectedOptions.value)
    emit('update:modelValue', false)
    toast({
      title: "Modifications enregistrées",
      description: "Les équipements ont été mis à jour avec succès."
    })
  } catch (error) {
    toast({
      title: "Erreur",
      description: "Une erreur est survenue lors de la sauvegarde.",
      variant: "destructive"
    })
  } finally {
    isSaving.value = false
  }
}
</script> 