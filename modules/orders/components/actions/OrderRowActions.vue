<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0">
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="viewOrder">
        <EyeIcon class="mr-2 h-4 w-4" />
        Voir
      </DropdownMenuItem>
      <DropdownMenuItem @click="downloadPdf">
        <Icon name="heroicons:document-arrow-down" class="mr-2 h-4 w-4" />
        Télécharger PDF
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-if="order.status === 'DRAFT'"
        @click="validateOrder"
      >
        <Icon name="heroicons:check-circle" class="mr-2 h-4 w-4" />
        Valider
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="order.status !== 'CANCELLED'"
        @click="cancelOrder"
        class="text-red-600"
      >
        <Icon name="heroicons:x-circle" class="mr-2 h-4 w-4" />
        Annuler
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Order } from '../../types'
import { useOrderStore } from '../../stores/useOrderStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, EyeIcon } from 'lucide-vue-next'

const props = defineProps<{
  order: Order
}>()

const router = useRouter()
const store = useOrderStore()

const viewOrder = () => {
  router.push('/orders/' + props.order.id)
}

const downloadPdf = async () => {
  // TODO: Implémenter la génération et le téléchargement du PDF
}

const validateOrder = async () => {
  await store.updateOrder(props.order.id, {
    status: 'VALIDATED'
  })
}

const cancelOrder = async () => {
  await store.updateOrder(props.order.id, {
    status: 'CANCELLED'
  })
}
</script> 