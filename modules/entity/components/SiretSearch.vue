//components/SiretSearch.vue
<template>
    <div class="w-full max-w-2xl mx-auto">
        <Card class="w-full">
            <CardHeader>
                <CardTitle>Recherche par SIRET</CardTitle>
                <CardDescription>
                    Recherchez une entreprise en utilisant son numéro SIRET
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div class="flex gap-2">
                    <div class="relative flex-1">
                        <Input type="text" placeholder="Entrez le numéro SIRET" v-model="siretNumber"
                            :disabled="loading" @keyup.enter="handleSearch" />
                        <SearchIcon class="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" v-if="!loading" />
                        <LoaderIcon class="absolute right-3 top-2.5 h-4 w-4 animate-spin" v-else />
                    </div>
                    <Button @click="handleSearch" :disabled="loading">
                        Rechercher
                    </Button>
                </div>

                <!-- Ajouter un indicateur de débogage -->
                <div v-if="lastSearchResult" class="mt-4 text-sm text-muted-foreground">
                    Dernière recherche: {{ lastSearchResult.result?.organization?.name }}
                </div>
            </CardContent>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SearchIcon, LoaderIcon } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCompanySearch } from '../composables/useCompanySearch'

const { loading, searchCompanyBySiret } = useCompanySearch()
const siretNumber = ref('')
const lastSearchResult = ref<any>(null)

const emit = defineEmits<{
    (e: 'companyFound', data: any): void
}>()

async function handleSearch() {
    if (!siretNumber.value) return

    const result = await searchCompanyBySiret(siretNumber.value)
    if (result) {
        lastSearchResult.value = result // Sauvegarder le résultat pour le débogage
        console.log('Émission des données:', result)
        emit('companyFound', result)
    }
}
</script>