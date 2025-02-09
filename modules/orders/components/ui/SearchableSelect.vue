<template>
  <Popover class="relative w-full">
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        :class="[
          'w-full justify-between',
          !modelValue && 'text-muted-foreground'
        ]"
      >
        {{ selectedOption?.label || placeholder }}
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-full p-0">
      <Command>
        <CommandInput 
          v-model="search"
          :placeholder="'Rechercher...'"
          class="h-9"
        />
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        <CommandGroup>
          <ScrollArea class="h-[200px]">
            <CommandItem
              v-for="option in filteredOptions"
              :key="option.value"
              :value="option.value"
              @select="handleSelect(option.value)"
            >
              <Check
                :class="[
                  'mr-2 h-4 w-4',
                  modelValue === option.value ? 'opacity-100' : 'opacity-0'
                ]"
              />
              {{ option.label }}
            </CommandItem>
          </ScrollArea>
        </CommandGroup>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Option {
  value: string
  label: string
}

interface Props {
  modelValue?: string
  options: Option[]
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Sélectionner...',
  modelValue: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const search = ref('')

const filteredOptions = computed(() => {
  if (!search.value) return props.options
  
  const searchLower = search.value.toLowerCase()
  console.log('searchLower', searchLower)
  return props.options.filter(option => 
    option.label.toLowerCase().includes(searchLower)
  )
})

const selectedOption = computed(() => 
  props.options.find(option => option.value === props.modelValue)
)

const handleSelect = (value: string) => {
  emit('update:modelValue', value)
  search.value = ''
}
</script>

<style scoped>
.command-list {
  position: absolute;
  z-index: 50;
  width: 100%;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-top: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
}

.command-item {
  padding: 0.5rem;
  cursor: pointer;
}

.command-item:hover {
  background-color: #f3f4f6;
}
</style> 