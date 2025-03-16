<template>
  <div class="flex items-center justify-between py-4">
    <div class="flex-1 text-sm text-muted-foreground">
      {{ table.getFilteredSelectedRowModel().rows.length }} sur {{ table.getFilteredRowModel().rows.length }} ligne(s) sélectionnée(s)
    </div>
    <div class="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="pageIndex <= 0"
        @click="goToPreviousPage"
      >
        Précédent
      </Button>
      <div class="flex items-center space-x-1">
        <span class="text-sm">Page {{ pageIndex + 1 }} sur {{ totalPages }}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        :disabled="pageIndex >= totalPages - 1"
        @click="goToNextPage"
      >
        Suivant
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TData">
import { Button } from '@/components/ui/button'
import type { Table } from '@tanstack/vue-table'

const props = defineProps<{
  table: Table<TData>
  pageIndex: number
  totalPages: number
  goToPreviousPage: () => void
  goToNextPage: () => void
}>()
</script> 