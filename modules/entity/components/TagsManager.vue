<!-- components/TagsManager.vue -->
<template>
  <div class="w-full space-y-2">
    <!-- Tags existants -->
    <div v-if="modelValue.length > 0" class="flex flex-wrap gap-2">
      <div v-for="tag in modelValue" :key="tag.id"
        class="group flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm" :style="{
          backgroundColor: `${tag.color}20`,
          borderColor: tag.color
        }">
        <span>{{ tag.name }}</span>
        <Button variant="ghost" size="icon" class="h-4 w-4 p-0 opacity-50 hover:opacity-100" @click="removeTag(tag)">
          <X class="h-3 w-3" />
        </Button>
      </div>
    </div>

    <!-- Interface d'ajout -->
    <div class="flex items-center gap-2">
      <div class="relative flex-1">
        <Command class="overflow-visible border">
          <CommandInput placeholder="Rechercher ou créer un tag..." @keydown.enter.prevent="handleEnter" />
          <CommandList>
            <CommandEmpty>
              <div class="flex items-center gap-2 p-2">
                <PlusCircle class="h-4 w-4" />
                <span>Créer "{{ search }}"</span>
              </div>
            </CommandEmpty>
            <CommandGroup>
              <CommandItem v-for="tag in availableTags" :key="tag.id" :value="tag.name" @select="selectTag(tag)">
                <div class="flex items-center gap-2">
                  <div class="h-3 w-3 rounded-full" :style="{ backgroundColor: tag.color }" />
                  <span>{{ tag.name }}</span>
                  <Badge v-if="tag.category" variant="outline" class="ml-auto">
                    {{ tag.category }}
                  </Badge>
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>

      <!-- Bouton pour ouvrir le dialog de création -->
      <Button variant="outline" size="icon" @click="showCreateDialog = true">
        <PlusIcon class="h-4 w-4" />
      </Button>
    </div>

    <!-- Dialog de création de tag -->
    <Dialog :open="showCreateDialog" @update:open="showCreateDialog = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau tag</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="createTag" class="space-y-4">
          <div class="space-y-2">
            <Label for="tagName">Nom</Label>
            <Input id="tagName" v-model="newTag.name" required />
          </div>

          <div class="space-y-2">
            <Label for="tagCategory">Catégorie</Label>
            <Input id="tagCategory" v-model="newTag.category" />
          </div>

          <div class="space-y-2">
            <Label>Couleur</Label>
            <div class="grid grid-cols-6 gap-2">
              <Button v-for="color in predefinedColors" :key="color" variant="outline" class="h-8 w-8 rounded-full p-0"
                :style="{ backgroundColor: color }" :class="{ 'ring-2 ring-offset-2': newTag.color === color }"
                @click.prevent="newTag.color = color" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="showCreateDialog = false">
              Annuler
            </Button>
            <Button type="submit">Créer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSupabaseClient } from '#imports'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { PlusIcon, X, PlusCircle } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'

interface Tag {
  id: string
  name: string
  color: string
  category?: string
}

interface Props {
  modelValue: Tag[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [tags: Tag[]]
}>()

// State
const supabase = useSupabaseClient()
const { toast } = useToast()
const showCreateDialog = ref(false)
const search = ref('')
const allTags = ref<Tag[]>([])
const newTag = ref({
  name: '',
  color: '#2563eb',
  category: ''
})

const predefinedColors = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#dc2626', // red-600
  '#ca8a04', // yellow-600
  '#9333ea', // purple-600
  '#be185d', // pink-600
  '#0891b2', // cyan-600
  '#ea580c', // orange-600
  '#4f46e5', // indigo-600
  '#be123c'  // rose-600
]

// Computed
const availableTags = computed(() => {
  const searchLower = search.value.toLowerCase()
  return allTags.value.filter(tag =>
    !props.modelValue.find(t => t.id === tag.id) &&
    (tag.name.toLowerCase().includes(searchLower) ||
      (tag.category && tag.category.toLowerCase().includes(searchLower)))
  )
})

// Methods
const fetchTags = async () => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  if (!error) {
    allTags.value = data
  }
}

const selectTag = (tag: Tag) => {
  emit('update:modelValue', [...props.modelValue, tag])
  search.value = ''
}

const removeTag = (tagToRemove: Tag) => {
  emit('update:modelValue', props.modelValue.filter(tag => tag.id !== tagToRemove.id))
}

const handleEnter = async () => {
  if (search.value.trim()) {
    showCreateDialog.value = true
    newTag.value.name = search.value.trim()
  }
}

const createTag = async () => {
  try {
    const { data: tag, error } = await supabase
      .from('tags')
      .insert({
        name: newTag.value.name,
        color: newTag.value.color,
        category: newTag.value.category || null
      })
      .select()
      .single()

    if (error) throw error

    allTags.value = [...allTags.value, tag]
    selectTag(tag)
    showCreateDialog.value = false
    newTag.value = { name: '', color: '#2563eb', category: '' }

    toast({
      title: "Tag créé",
      description: "Le tag a été créé avec succès"
    })
  } catch (error) {
    console.error('Error creating tag:', error)
    toast({
      title: "Erreur",
      description: "Une erreur est survenue lors de la création du tag",
      variant: "destructive"
    })
  }
}

// Initial fetch
onMounted(fetchTags)
</script>