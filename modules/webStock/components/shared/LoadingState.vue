//components/shared/LoadingState.vue
<template>
    <div class="flex flex-col items-center justify-center p-8 min-h-[400px] space-y-4">
        <div class="relative">
            <svg class="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span class="sr-only">Chargement</span>
        </div>
        <div class="text-center space-y-2">
            <h3 class="text-lg font-medium">{{ title || 'Chargement en cours' }}</h3>
            <p class="text-muted-foreground">
                {{ description || 'Veuillez patienter pendant le chargement des données...' }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title?: string
    description?: string
}>()
</script>