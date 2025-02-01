<template>
    <div class="w-full">
        <Input
            v-model="searchQuery"
            placeholder="Rechercher par marque, modèle, version, VIN ou immatriculation..."
            class="w-full"
            @input="handleSearch"
            @keydown.enter="handleSearch"
        >
            <template #prefix>
                <Search class="h-4 w-4 text-muted-foreground" />
            </template>
        </Input>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'

const emit = defineEmits<{
    (e: 'search', searchData: { terms: string[], rawQuery: string }): void
}>()

const searchQuery = ref('')

const normalizeString = (str: string) => {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .replace(/[^a-z0-9\s]/g, '') // Garde uniquement les lettres, chiffres et espaces
}

const handleSearch = () => {
    const rawQuery = searchQuery.value.trim()
    
    // Si la recherche est vide, on émet un tableau vide
    if (!rawQuery) {
        emit('search', { terms: [], rawQuery: '' })
        return
    }

    // Normalise et divise la requête en mots
    const searchTerms = normalizeString(rawQuery)
        .split(/\s+/)
        .filter(term => term.length > 0)
        .map(term => term.trim())
    
    emit('search', { 
        terms: searchTerms,
        rawQuery
    })
}

// Debounce la recherche pour éviter trop d'appels
let debounceTimeout: NodeJS.Timeout
watch(searchQuery, () => {
    clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(handleSearch, 300)
})
</script> 