// modules/webStock/pages/publish.vue
<template>
    <div class="container py-8">
        <div class="flex items-center justify-between mb-8">
            <div>
                <h2 class="text-3xl font-bold tracking-tight">Publication des véhicules</h2>
                <p class="text-muted-foreground">Configurez les prix de vente pour la publication web</p>
            </div>
            <Button variant="outline" @click="router.back()">
                <ArrowLeft class="w-4 h-4 mr-2" />
                Retour
            </Button>
        </div>

        <div class="grid gap-6">
            <!-- Liste des véhicules -->
            <Card>
                <CardHeader>
                    <CardTitle>Véhicules sélectionnés ({{ vehicles.length }})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Marque</TableHead>
                                <TableHead>Modèle</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Prix de base</TableHead>
                                <TableHead>Prix de vente</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow v-for="vehicle in vehicles" :key="vehicle.vehicleData.id">
                                <TableCell>{{ vehicle.vehicleData.id }}</TableCell>
                                <TableCell>{{ vehicle.vehicleData.brand }}</TableCell>
                                <TableCell>{{ vehicle.vehicleData.model }}</TableCell>
                                <TableCell>{{ vehicle.vehicleData.version }}</TableCell>
                                <TableCell>{{ formatPrice(vehicle.vehicleData.base_price) }}</TableCell>
                                <TableCell>
                                    {{ formatPrice(calculateFinalPrice(vehicle.vehicleData.base_price)) }}
                                </TableCell>
                                <TableCell>
                                    <Badge v-if="publishedVehicles[vehicle.vehicleData.id]" variant="default">
                                        Publié
                                    </Badge>
                                    <Badge v-else-if="failedVehicles[vehicle.vehicleData.id]" variant="destructive">
                                        Erreur
                                    </Badge>
                                    <Badge v-else variant="secondary">
                                        En attente
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <!-- Configuration des prix -->
            <Card>
                <CardHeader>
                    <CardTitle>Stratégie de prix</CardTitle>
                    <CardDescription>
                        Définissez comment les prix de vente seront calculés
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="grid gap-6">
                        <div class="flex items-center gap-4">
                            <Select v-model="priceStrategy" class="w-[200px]">
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir une stratégie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fixed">Prix fixe</SelectItem>
                                    <SelectItem value="margin">Marge fixe</SelectItem>
                                    <SelectItem value="percentage">% du prix de base</SelectItem>
                                </SelectContent>
                            </Select>

                            <div class="flex items-center gap-2" v-if="priceStrategy === 'fixed'">
                                <Input type="number" v-model="fixedPrice" placeholder="Prix de vente"
                                    class="w-[150px]" />
                                <span class="text-sm text-muted-foreground">€</span>
                            </div>

                            <div class="flex items-center gap-2" v-if="priceStrategy === 'margin'">
                                <Input type="number" v-model="marginAmount" placeholder="Marge" class="w-[150px]" />
                                <span class="text-sm text-muted-foreground">€</span>
                            </div>

                            <div class="flex items-center gap-2" v-if="priceStrategy === 'percentage'">
                                <Input type="number" v-model="percentageAmount" placeholder="Pourcentage"
                                    class="w-[150px]" />
                                <span class="text-sm text-muted-foreground">%</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Actions -->
            <div class="flex justify-end gap-4">
                <Button variant="outline" @click="router.back()">Annuler</Button>
                <Button @click="publishVehicles" :disabled="!isValid || isPublishing">
                    <Loader2 v-if="isPublishing" class="w-4 h-4 mr-2 animate-spin" />
                    {{ isPublishing ? 'Publication en cours...' : 'Publier les véhicules' }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import { useVehiclePublisher } from '../services/supabase'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
// import { useVehiclePublisher } from '../services/supabase'
import { usePublishState } from '../composables/usePublishState'

// État local
const router = useRouter()
const route = useRoute()
const { toast } = useToast()
const vehiclePublisher = useVehiclePublisher()
const { selectedVehiclesForPublish } = usePublishState()


const vehicles = ref(selectedVehiclesForPublish.value)
console.log(vehicles.value)
const priceStrategy = ref<'fixed' | 'margin' | 'percentage'>('fixed')
const fixedPrice = ref<number>(0)
const marginAmount = ref<number>(0)
const percentageAmount = ref<number>(0)
const isPublishing = ref(false)
const publishedVehicles = ref<Record<string, boolean>>({})
const failedVehicles = ref<Record<string, boolean>>({})

// Calculs
const isValid = computed(() => {
    switch (priceStrategy.value) {
        case 'fixed':
            return fixedPrice.value > 0
        case 'margin':
            return marginAmount.value > 0
        case 'percentage':
            return percentageAmount.value > 0
        default:
            return false
    }
})

function formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(price)
}

function calculateFinalPrice(basePrice: number): number {
    switch (priceStrategy.value) {
        case 'margin':
            return basePrice + marginAmount.value
        case 'percentage':
            return basePrice * (1 + (percentageAmount.value / 100))
        case 'fixed':
            return fixedPrice.value
        default:
            return basePrice
    }
}

async function publishVehicles() {
    if (!isValid.value) return

    isPublishing.value = true
    const supabase = useSupabaseClient()

    try {
        const { data, error } = await supabase.rpc('insert_vehicles', {
            vehicles: vehicles.value,
            price_strategy: priceStrategy.value,
            price_modifier: priceStrategy.value === 'fixed' ? 0 :
                priceStrategy.value === 'margin' ? marginAmount.value :
                    percentageAmount.value,
            selling_price: priceStrategy.value === 'fixed' ? fixedPrice.value : null
        } as any)

        if (error) throw error

        const successCount = data.success.length
        const errorCount = data.errors.length

        // Mise à jour des statuts dans l'interface
        data.success.forEach(id => {
            publishedVehicles.value[id] = true
        })
        data.errors.forEach(err => {
            failedVehicles.value[err.id] = true
        })

        // Notification du résultat
        toast({
            title: "Publication terminée",
            description: `${successCount} véhicule(s) publié(s) avec succès${errorCount > 0 ? `, ${errorCount} échec(s)` : ''
                }`,
            variant: errorCount === 0 ? "default" : "warning"
        })

        // Affichage des erreurs détaillées si nécessaire
        if (data.errors.length > 0) {
            console.error('Erreurs de publication:', data.errors)
            // Optionnel : afficher les erreurs spécifiques
            data.errors.forEach(err => {
                toast({
                    title: `Erreur - Véhicule ${err.id}`,
                    description: err.error,
                    variant: "destructive"
                })
            })
        }

        if (errorCount === 0) {
            // Retour à la page précédente après un délai en cas de succès total
            setTimeout(() => router.back(), 1500)
        }

    } catch (error) {
        console.error('Erreur lors de la publication:', error)
        toast({
            title: "Erreur de publication",
            description: error instanceof Error ? error.message : "Une erreur est survenue",
            variant: "destructive"
        })
    } finally {
        isPublishing.value = false
    }
}

onMounted(() => {
    if (!vehicles.value.length) {
        toast({
            title: "Erreur",
            description: "Aucun véhicule sélectionné pour la publication",
            variant: "destructive"
        })
        router.push('/erp/webstock')
    }
})
</script>