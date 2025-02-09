<template>
  <div class="space-y-4">
    <!-- Barre de recherche -->
    <div v-if="search" class="flex items-center space-x-2">
      <Input
        v-model="searchQuery"
        placeholder="Rechercher..."
        class="max-w-sm"
      />
    </div>

    <!-- Tableau -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead v-for="column in columns" :key="column.key">
              {{ column.label }}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell :colspan="columns.length" class="h-24 text-center">
              <Loader2Icon class="mx-auto h-4 w-4 animate-spin" />
            </TableCell>
          </TableRow>
          <TableRow v-else-if="!filteredData.length">
            <TableCell :colspan="columns.length" class="h-24 text-center">
              Aucune donnée
            </TableCell>
          </TableRow>
          <TableRow v-for="(row, index) in paginatedData" :key="index">
            <TableCell v-for="column in columns" :key="column.key">
              {{ formatValue(row[column.key], column.format) }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && filteredData.length > pageSize" class="flex items-center justify-end space-x-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        Précédent
      </Button>
      <div class="flex items-center gap-1">
        <Button
          v-for="page in totalPages"
          :key="page"
          variant="outline"
          size="sm"
          :class="{ 'bg-primary text-primary-foreground': currentPage === page }"
          @click="currentPage = page"
        >
          {{ page }}
        </Button>
      </div>
      <Button
        variant="outline"
        size="sm"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        Suivant
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Loader2Icon } from 'lucide-vue-next'
import type { Column } from './index'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  data: any[]
  columns: Column[]
  loading?: boolean
  pagination?: boolean
  search?: boolean
}>()

// État
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 10

// Données filtrées
const filteredData = computed(() => {
  if (!searchQuery.value) return props.data

  const query = searchQuery.value.toLowerCase()
  return props.data.filter(row => {
    return props.columns.some(column => {
      const value = row[column.key]
      if (value == null) return false
      return String(value).toLowerCase().includes(query)
    })
  })
})

// Pagination
const totalPages = computed(() => 
  Math.ceil(filteredData.value.length / pageSize)
)

const paginatedData = computed(() => {
  if (!props.pagination) return filteredData.value
  
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredData.value.slice(start, end)
})

// Formatage des valeurs
const formatValue = (value: any, format?: (value: any) => string) => {
  if (format) return format(value)
  if (value == null) return '-'
  return String(value)
}

// Reset de la pagination quand les filtres changent
watch(searchQuery, () => {
  currentPage.value = 1
})
</script> 