<template>
    <div class="flex flex-col items-center justify-center p-8 min-h-[400px] space-y-6">
      <div class="w-full max-w-md">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>{{ title || 'Erreur' }}</AlertTitle>
          <AlertDescription>
            {{ message || "Une erreur s'est produite lors du chargement des données." }}
          </AlertDescription>
        </Alert>
      </div>
      
      <div class="flex gap-4">
        <Button v-if="canRetry" @click="$emit('retry')" variant="outline">
          <RefreshCw class="h-4 w-4 mr-2" />
          Réessayer
        </Button>
        <Button v-if="canGoBack" @click="router.back()" variant="ghost">
          <ChevronLeft class="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
  
      <!-- Support Section -->
      <div v-if="showSupport" class="text-center space-y-2 mt-8">
        <p class="text-sm text-muted-foreground">
          Si le problème persiste, veuillez contacter le support :
        </p>
        <div class="flex items-center justify-center gap-4">
          <Button variant="link" @click="handleEmailSupport">
            <Mail class="h-4 w-4 mr-2" />
            support@example.com
          </Button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { AlertCircle, RefreshCw, ChevronLeft, Mail } from 'lucide-vue-next'
  import { useToast } from '@/components/ui/toast/use-toast'
  
  const router = useRouter()
  const { toast } = useToast()
  
  const props = defineProps<{
    title?: string
    message?: string
    canRetry?: boolean
    canGoBack?: boolean
    showSupport?: boolean
  }>()
  
  defineEmits<{
    (e: 'retry'): void
  }>()
  
  function handleEmailSupport() {
    // Copier l'adresse email dans le presse-papier
    navigator.clipboard.writeText('support@example.com')
    toast({
      title: "Adresse copiée",
      description: "L'adresse email du support a été copiée dans le presse-papier."
    })
  }
  </script>