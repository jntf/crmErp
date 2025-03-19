<script setup lang="ts">
import { ref, watch } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const props = defineProps<{
  initialData: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
}>()

const formData = ref<Record<string, any>>(structuredClone(props.initialData) || {})

// Surveiller les changements dans formData et émettre les mises à jour
watch(formData, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

// Surveiller les changements dans initialData et mettre à jour formData
watch(() => props.initialData, (newValue) => {
  formData.value = structuredClone(newValue) || {}
}, { deep: true })
</script>

<template>
  <form class="space-y-4 overflow-y-auto" @submit.prevent>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Prénom -->
      <div class="space-y-2">
        <Label for="first_name" class="text-sm font-medium">Prénom <span class="text-red-500">*</span></Label>
        <Input 
          id="first_name" 
          v-model="formData.first_name" 
          placeholder="Prénom du contact" 
          required
        />
      </div>
      
      <!-- Nom -->
      <div class="space-y-2">
        <Label for="last_name" class="text-sm font-medium">Nom <span class="text-red-500">*</span></Label>
        <Input 
          id="last_name" 
          v-model="formData.last_name" 
          placeholder="Nom du contact"
          required
        />
      </div>
      
      <!-- Email -->
      <div class="space-y-2">
        <Label for="email" class="text-sm font-medium">Email <span class="text-red-500">*</span></Label>
        <Input 
          id="email" 
          v-model="formData.email" 
          type="email" 
          placeholder="exemple@domaine.com"
          required
        />
      </div>
      
      <!-- Téléphone -->
      <div class="space-y-2">
        <Label for="phone" class="text-sm font-medium">Téléphone</Label>
        <Input 
          id="phone" 
          v-model="formData.phone" 
          placeholder="0123456789"
        />
      </div>
      
      <!-- Mobile -->
      <div class="space-y-2">
        <Label for="mobile" class="text-sm font-medium">Mobile</Label>
        <Input 
          id="mobile" 
          v-model="formData.mobile" 
          placeholder="0612345678"
        />
      </div>
      
      <!-- Fonction -->
      <div class="space-y-2">
        <Label for="job_title" class="text-sm font-medium">Fonction</Label>
        <Input 
          id="job_title" 
          v-model="formData.job_title" 
          placeholder="Ex: Directeur commercial"
        />
      </div>
      
      <!-- Service -->
      <div class="space-y-2">
        <Label for="service" class="text-sm font-medium">Service</Label>
        <Input 
          id="service" 
          v-model="formData.service" 
          placeholder="Ex: Commercial"
        />
      </div>
    </div>
    
    <!-- Notes -->
    <div class="space-y-2 pt-2">
      <Label for="notes" class="text-sm font-medium">Notes</Label>
      <Textarea 
        id="notes" 
        v-model="formData.notes" 
        placeholder="Informations complémentaires sur le contact"
        class="min-h-[80px] max-h-[120px]"
      />
    </div>
  </form>
</template> 