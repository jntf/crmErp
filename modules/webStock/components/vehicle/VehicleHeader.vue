# components/vehicle/VehicleHeader.vue
<template>
    <NavigationMenu
        class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container flex h-16 items-center justify-between gap-4">
            <!-- Section gauche -->
            <div class="flex items-center gap-4">
                <Button variant="ghost" @click="$emit('back')" class="gap-2">
                    <ChevronLeft class="h-4 w-4" />
                    Retour
                </Button>
                <Separator orientation="vertical" class="h-6" />
                <div v-if="vehicle" class="flex items-center gap-2">
                    <Badge variant="outline" class="text-xs">
                        {{ vehicle.vehicleData.brand }} {{ vehicle.vehicleData.model }}
                    </Badge>
                    <Badge v-if="hasChanges" variant="outline"
                        class="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                        Modifications non enregistrées
                    </Badge>
                </div>
            </div>

            <!-- Section droite -->
            <div v-if="vehicle" class="flex items-center gap-4">
                <!-- Menu Statut -->
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" :disabled="loading || saving" size="sm" class="gap-2">
                            <CircleDot class="h-4 w-4" :class="statusConfig.color" />
                            {{ statusConfig.label }}
                            <ChevronDown class="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent class="w-48">
                        <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem v-for="status in availableStatuses" :key="status.value"
                            @click="updateStatus(status.value)">
                            <CircleDot class="h-4 w-4 mr-2" :class="status.color" />
                            <span>{{ status.label }}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <!-- Actions -->
                <div class="flex items-center gap-2">
                    <!-- Bouton Réinitialiser -->
                    <Button v-if="hasChanges" variant="outline" @click="$emit('reset')" :disabled="saving">
                        <RotateCcw class="h-4 w-4" />
                    </Button>

                    <!-- Bouton Enregistrer -->
                    <Button v-if="hasChanges" variant="default" @click="$emit('save')" :disabled="saving">
                        <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
                        <Save v-else class="h-4 w-4" />
                        <!-- {{ saving ? 'Enregistrement...' : 'Enregistrer' }} -->
                    </Button>

                    <!-- Menu Actions -->
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" :disabled="loading || saving">
                                <MoreVertical class="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" class="w-60">
                            <DropdownMenuItem @click="$emit('publish')" :disabled="!canPublish || hasChanges">
                                <Globe class="h-4 w-4 mr-2" />
                                <span>Publier sur le site web</span>
                                <Badge v-if="hasChanges" variant="outline" class="ml-2 text-xs">
                                    Enregistrez d'abord
                                </Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem @click="handleAction('share')">
                                <Share2 class="h-4 w-4 mr-2" />
                                <span>Partager</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem @click="handleAction('download')">
                                <FileText class="h-4 w-4 mr-2" />
                                <span>Télécharger la fiche PDF</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem @click="handleAction('duplicate')">
                                <Copy class="h-4 w-4 mr-2" />
                                <span>Dupliquer</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem @click="handleAction('archive')" class="text-red-600">
                                <Archive class="h-4 w-4 mr-2" />
                                <span>Archiver</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    </NavigationMenu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
    ChevronLeft, ChevronDown, Save, Globe, Share2,
    FileText, Copy, Archive, MoreVertical, CircleDot,
    RotateCcw, Loader2
} from 'lucide-vue-next'
import { NavigationMenu } from '@/components/ui/navigation-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast/use-toast'
import type { TransformedVehicle } from '../../types'

interface Props {
    vehicle: TransformedVehicle | null
    loading?: boolean
    saving?: boolean
    hasChanges?: boolean
    canPublish?: boolean
}

// Props avec valeurs par défaut
const props = withDefaults(defineProps<Props>(), {
    loading: false,
    saving: false,
    hasChanges: false,
    canPublish: false
})

// Émissions d'événements
const emit = defineEmits<{
    (e: 'back'): void
    (e: 'save'): void
    (e: 'reset'): void
    (e: 'publish'): void
    (e: 'status-change', status: string): void
}>()

const { toast } = useToast()

// Configuration des statuts
const availableStatuses = [
    { value: 'available', label: 'Disponible', color: 'text-green-500', variant: 'success' },
    { value: 'reserved', label: 'Réservé', color: 'text-orange-500', variant: 'warning' },
    { value: 'sold', label: 'Vendu', color: 'text-red-500', variant: 'destructive' }
] as const

// Computed pour la configuration du statut actuel
const statusConfig = computed(() => {
    const defaultConfig = { label: 'Inconnu', color: 'text-gray-500', variant: 'outline' as const }
    if (!props.vehicle) return defaultConfig

    const status = availableStatuses.find(s => s.value === props.vehicle.vehicleData.status)
    return status || defaultConfig
})

// Méthodes
function updateStatus(newStatus: string) {
    emit('status-change', newStatus)
}

function handleAction(action: 'share' | 'download' | 'duplicate' | 'archive') {
    const actions = {
        share: {
            title: 'Partage',
            description: 'Fonctionnalité en cours de développement'
        },
        download: {
            title: 'PDF',
            description: 'Génération de la fiche PDF en cours de développement'
        },
        duplicate: {
            title: 'Duplication',
            description: 'Fonctionnalité en cours de développement'
        },
        archive: {
            title: 'Archivage',
            description: 'Êtes-vous sûr de vouloir archiver ce véhicule ?',
            variant: 'destructive' as const,
            action: {
                label: 'Archiver',
                onClick: () => {
                    // Logique d'archivage à implémenter
                }
            }
        }
    }

    const config = actions[action]
    toast(config)
}
</script>