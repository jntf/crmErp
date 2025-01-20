<!-- CompanyLogo.vue -->
<template>
  <div class="relative flex flex-col items-center">
    <!-- Container du logo avec bordure et padding -->
    <div
      class="relative p-6 w-32 h-auto rounded-xl border border-gray-200 bg-white/50 hover:border-primary/50 transition-colors shadow-sm"
      :class="[props.class, { 'border-primary/20 bg-primary/5': isLoading }]">
      <!-- Image du logo -->
      <img v-if="logoUrl" :src="logoUrl" :alt="domain ? `Logo de ${domain}` : 'Logo entreprise'"
        @error="handleImageError" class="w-full h-full object-contain" />

      <!-- État de chargement -->
      <div v-else-if="isLoading" class="absolute inset-0 flex items-center justify-center animate-pulse">
        <Loader2Icon class="h-10 w-10 animate-spin text-primary/70" />
      </div>

      <!-- Fallback si pas d'image -->
      <div v-else class="absolute inset-0 flex items-center justify-center">
        <BuildingIcon class="h-10 w-10 text-gray-400" />
      </div>

      <!-- Overlay avec bouton de génération -->
      <div
        class="absolute inset-0 bg-black/0 hover:bg-black/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-all rounded-xl">
        <Button variant="outline" size="sm" :disabled="isLoading" @click="fetchLogo"
          class="shadow-sm bg-white/90 hover:bg-white">
          <RefreshCwIcon v-if="logoUrl" class="h-4 w-4 mr-2" />
          <WandIcon v-else class="h-4 w-4 mr-2" />
          {{ logoUrl ? 'Actualiser' : 'Générer' }}
        </Button>
      </div>
    </div>

    <!-- Message d'état -->
    <p v-if="error" class="text-sm text-destructive mt-2">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Building as BuildingIcon, RefreshCw as RefreshCwIcon, Wand as WandIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

interface Props {
  website?: string
  email?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  website: '',
  email: '',
  class: ''
})

const supabase = useSupabaseClient()
const logoUrl = ref<string | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Extraire le domaine depuis le site web ou l'email
const domain = computed(() => {
  if (props.website) {
    return props.website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
  }
  if (props.email) {
    return props.email.split('@')[1]
  }
  return null
})

const fetchLogo = async () => {
  if (!domain.value) {
    error.value = 'Aucun domaine trouvé'
    return
  }

  error.value = null
  isLoading.value = true

  try {
    const { data, error: functionError } = await supabase.functions.invoke('fetch-company-logo', {
      body: {
        website: props.website,
        email: props.email,
        domain: domain.value,
      },
    })

    if (functionError) throw functionError

    if (data?.logo_url) {
      logoUrl.value = data.logo_url
    } else {
      error.value = 'Impossible de générer le logo'
    }
  } catch (err) {
    console.error('Error fetching logo:', err)
    error.value = 'Erreur lors de la génération du logo'
    logoUrl.value = null
  } finally {
    isLoading.value = false
  }
}

const handleImageError = () => {
  logoUrl.value = null
  error.value = 'Erreur lors du chargement de l\'image'
}

onMounted(() => {
  // Tentative automatique de récupération du logo au montage
  if (domain.value) {
    fetchLogo()
  }
})
</script>