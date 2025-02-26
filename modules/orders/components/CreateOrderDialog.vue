<template>
    <Dialog :open="isOpen" @update:open="updateOpen">
        <DialogContent class="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Créer une commande</DialogTitle>
                <DialogDescription>
                    Sélectionnez la quantité désirée pour chaque véhicule
                </DialogDescription>
            </DialogHeader>

            <div class="space-y-4">
                <div class="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Véhicule</TableHead>
                                <TableHead>Stock disponible</TableHead>
                                <TableHead>Quantité souhaitée</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow v-for="vehicle in vehicles" :key="vehicle.id">
                                <TableCell>
                                    <div class="flex flex-col">
                                        <span class="font-medium">{{ vehicle.brand }} {{ vehicle.model }}</span>
                                        <span class="text-sm text-muted-foreground">
                                            {{ vehicle.version }} - {{ vehicle.color }}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>{{ vehicle.qty }}</TableCell>
                                <TableCell>
                                    <div class="flex items-center space-x-2">
                                        <Input
                                            type="number"
                                            :min="1"
                                            :max="vehicle.qty"
                                            v-model="selectedQuantities[vehicle.id]"
                                            class="w-24"
                                        />
                                        <span class="text-sm text-muted-foreground">
                                            / {{ vehicle.qty }}
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                <div class="flex justify-between items-center">
                    <div class="text-sm text-muted-foreground">
                        Total véhicules sélectionnés : {{ totalSelectedVehicles }}
                    </div>
                    <div class="space-x-2">
                        <Button variant="outline" @click="updateOpen(false)">
                            Annuler
                        </Button>
                        <Button 
                            :disabled="totalSelectedVehicles === 0"
                            @click="handleCreateOrder"
                        >
                            Créer la commande
                        </Button>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Vehicle } from '../../stock/types'

const props = defineProps<{
    isOpen: boolean
    vehicles: Vehicle[]
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'create', quantities: Record<string, number>): void
}>()

const selectedQuantities = ref<Record<string, number>>({})

// Initialiser les quantités lorsque les véhicules changent
watch(() => props.vehicles, (newVehicles) => {
    if (newVehicles) {
        selectedQuantities.value = newVehicles.reduce((acc, vehicle) => {
            acc[vehicle.id] = 1
            return acc
        }, {} as Record<string, number>)
    }
}, { immediate: true })

// Réinitialiser les quantités lorsque le dialogue s'ouvre
watch(() => props.isOpen, (isOpen) => {
    if (isOpen && props.vehicles) {
        selectedQuantities.value = props.vehicles.reduce((acc, vehicle) => {
            acc[vehicle.id] = 1
            return acc
        }, {} as Record<string, number>)
    }
})

const totalSelectedVehicles = computed(() => {
    return Object.values(selectedQuantities.value).reduce((acc, qty) => acc + qty, 0)
})

const updateOpen = (value: boolean) => {
    emit('update:open', value)
}

const handleCreateOrder = () => {
    emit('create', selectedQuantities.value)
    updateOpen(false)
}
</script> 