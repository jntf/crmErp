<template>
    <div class="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Types de commissions</CardTitle>
                <CardDescription>
                    Configurez les différents types de commissions pour votre entreprise
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div class="space-y-4">
                    <div v-for="commission in commissionTypes" :key="commission.id" class="border-b pb-4">
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-medium">{{ commission.name }}</h4>
                                <p class="text-sm text-muted-foreground">{{ commission.description }}</p>
                                <div class="mt-1 text-xs text-muted-foreground">
                                    Code: <code class="bg-muted px-1 py-0.5 rounded">{{ commission.code }}</code>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" @click="editCommission(commission)">
                                Configurer
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Dialog v-model:open="showDialog">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Configuration de la commission</DialogTitle>
                    <DialogDescription>
                        Configurez les paramètres pour ce type de commission
                    </DialogDescription>
                </DialogHeader>

                <form @submit.prevent="saveCommissionSettings" class="space-y-4">
                    <div v-if="selectedCommission">
                        <div class="space-y-4">
                            <div v-for="(field, key) in selectedCommission.settings_schema" :key="key">
                                <div class="space-y-2">
                                    <Label>{{ field.description }}</Label>
                                    <Input 
                                        v-if="field.type === 'number'"
                                        type="number" 
                                        step="0.01" 
                                        v-model="commissionSettings[key]" 
                                        :placeholder="field.description"
                                        :required="field.required"
                                    />
                                    <Select 
                                        v-else-if="field.type === 'select'"
                                        v-model="commissionSettings[key]"
                                    >
                                        <SelectTrigger>
                                            <SelectValue :placeholder="field.description" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem 
                                                    v-for="option in field.options" 
                                                    :key="option.value"
                                                    :value="option.value"
                                                >
                                                    {{ option.label }}
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <Label>Statut</Label>
                                <Select v-model="commissionSettings.is_active">
                                    <SelectTrigger>
                                        <SelectValue :placeholder="commissionSettings.is_active === 'active' ? 'Actif' : 'Inactif'" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="active">Actif</SelectItem>
                                            <SelectItem value="inactive">Inactif</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" :loading="isLoading">Enregistrer</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/components/ui/toast/use-toast'
import type { Database } from '@/types/database.types'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type CommissionType = Database['public']['Tables']['commission_types']['Row']
type CommissionSetting = Database['public']['Tables']['owner_commission_settings']['Row']

interface CommissionSettings {
    [key: string]: any
    is_active: 'active' | 'inactive'
}

const supabase = useSupabaseClient<Database>()
const { toast } = useToast()
const isLoading = ref(false)
const showDialog = ref(false)
const commissionTypes = ref<CommissionType[]>([])
const selectedCommission = ref<CommissionType | null>(null)
const commissionSettings = ref<CommissionSettings>({
    is_active: 'active'
})

const fetchCommissionTypes = async () => {
    try {
        const { data, error } = await supabase
            .from('commission_types')
            .select()
            .order('name')

        if (error) throw error
        commissionTypes.value = data || []
    } catch (error) {
        console.error('Error fetching commission types:', error)
        toast({
            title: "Erreur",
            description: "Impossible de charger les types de commission",
            variant: "destructive"
        })
    }
}

const editCommission = (commission: CommissionType) => {
    selectedCommission.value = commission
    loadCommissionSettings(commission.id)
    showDialog.value = true
}

const loadCommissionSettings = async (commissionTypeId: number) => {
    try {
        // Récupérer l'ID de l'entreprise
        const { data: owner, error: ownerError } = await supabase
            .from('owners')
            .select('id')
            .single()

        if (ownerError) throw ownerError

        const { data, error } = await supabase
            .from('owner_commission_settings')
            .select()
            .eq('owner_id', owner.id)
            .eq('commission_type_id', commissionTypeId)
            .single()

        if (error && error.code !== 'PGRST116') throw error

        if (data) {
            commissionSettings.value = {
                ...data.settings,
                is_active: data.is_active ? 'active' : 'inactive'
            }
        } else {
            // Initialiser avec les valeurs par défaut du schéma
            const defaultSettings: CommissionSettings = {
                is_active: 'active'
            }
            if (selectedCommission.value) {
                Object.entries(selectedCommission.value.settings_schema).forEach(([key, field]) => {
                    if (field.type === 'number') {
                        defaultSettings[key] = 0
                    } else if (field.type === 'select' && field.options?.length) {
                        defaultSettings[key] = field.options[0].value
                    } else if (field.type === 'boolean') {
                        defaultSettings[key] = false
                    }
                })
            }
            commissionSettings.value = defaultSettings
        }
    } catch (error) {
        console.error('Error loading commission settings:', error)
        toast({
            title: "Erreur",
            description: "Impossible de charger les paramètres de la commission",
            variant: "destructive"
        })
    }
}

const saveCommissionSettings = async () => {
    if (!selectedCommission.value) return

    try {
        isLoading.value = true

        // Récupérer l'ID de l'entreprise
        const { data: owner, error: ownerError } = await supabase
            .from('owners')
            .select('id')
            .single()

        if (ownerError) throw ownerError

        const { is_active, ...settings } = commissionSettings.value

        const { error } = await supabase
            .from('owner_commission_settings')
            .upsert({
                owner_id: owner.id,
                commission_type_id: selectedCommission.value.id,
                settings,
                is_active: is_active === 'active',
                updated_at: new Date().toISOString()
            } as Database['public']['Tables']['owner_commission_settings']['Insert'])

        if (error) throw error

        showDialog.value = false
        toast({
            title: "Succès",
            description: "Paramètres de commission mis à jour avec succès"
        })
    } catch (error) {
        console.error('Error saving commission settings:', error)
        toast({
            title: "Erreur",
            description: "Impossible de mettre à jour les paramètres de la commission",
            variant: "destructive"
        })
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchCommissionTypes()
})
</script> 