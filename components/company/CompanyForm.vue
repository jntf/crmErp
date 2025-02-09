<template>
    <Card>
        <CardHeader>
            <CardTitle>Paramètres de l'entreprise</CardTitle>
            <CardDescription>
                Gérez les informations et les paramètres de votre entreprise
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form @submit.prevent="onSubmit" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <Label for="companyName">Nom de l'entreprise</Label>
                        <Input id="companyName" v-model="form.name" />
                    </div>

                    <div class="space-y-2">
                        <Label>Statut</Label>
                        <Select v-model="form.status">
                            <SelectTrigger>
                                <SelectValue :placeholder="form.status" />
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

                <!-- Modules activés -->
                <div class="space-y-4">
                    <h3 class="text-lg font-medium">Modules activés</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div v-for="module in modules" :key="module.name" class="flex items-center space-x-2">
                            <Switch 
                                :id="module.name"
                                v-model="form.modules[module.name]"
                            />
                            <Label :for="module.name">{{ module.label }}</Label>
                        </div>
                    </div>
                </div>

                <!-- Configuration avancée -->
                <div class="space-y-2">
                    <Label for="settings">Configuration avancée</Label>
                    <Textarea 
                        id="settings" 
                        v-model="form.settings" 
                        placeholder="Configuration JSON"
                        rows="4"
                    />
                    <p class="text-sm text-muted-foreground">
                        Configuration au format JSON pour les paramètres spécifiques
                    </p>
                </div>

                <Button type="submit" :loading="isLoading">
                    Enregistrer les modifications
                </Button>
            </form>
        </CardContent>
    </Card>
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
import { Switch } from '@/components/ui/switch'

type Owner = Database['public']['Tables']['owners']['Row']
type OwnerModule = Database['public']['Tables']['owner_modules']['Row']

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const { toast } = useToast()
const isLoading = ref(false)

interface CompanyForm {
    name: string
    status: string
    modules: Record<string, boolean>
    settings: string
}

const modules = [
    { name: 'stock', label: 'Gestion de stock' },
    { name: 'orders', label: 'Commandes' },
    { name: 'accounting', label: 'Comptabilité' },
    { name: 'crm', label: 'CRM' },
    { name: 'hr', label: 'Ressources Humaines' },
    { name: 'analytics', label: 'Analyses' }
]

const form = ref<CompanyForm>({
    name: '',
    status: 'active',
    modules: {},
    settings: '{}'
})

const fetchCompanyData = async () => {
    try {
        // Récupérer l'ID de l'entreprise associée à l'utilisateur
        const { data: ownerUser, error: userError } = await supabase
            .from('owner_users')
            .select('owner_id')
            .eq('user_id', user.value?.id)
            .maybeSingle()

        if (userError) {
            console.error('Error fetching owner user:', userError)
            toast({
                title: "Erreur",
                description: "Impossible de récupérer les informations de l'utilisateur",
                variant: "destructive"
            })
            return
        }

        if (!ownerUser?.owner_id) {
            toast({
                title: "Information",
                description: "Aucune entreprise associée à votre compte",
                variant: "default"
            })
            return
        }

        // Récupérer les données de l'entreprise
        const { data: owner, error: ownerError } = await supabase
            .from('owners')
            .select('*')
            .eq('id', ownerUser.owner_id)
            .single()

        if (ownerError) {
            console.error('Error fetching owner:', ownerError)
            toast({
                title: "Erreur",
                description: "Impossible de charger les données de l'entreprise",
                variant: "destructive"
            })
            return
        }

        // Récupérer les modules activés
        const { data: ownerModules, error: modulesError } = await supabase
            .from('owner_modules')
            .select('*')
            .eq('owner_id', ownerUser.owner_id)

        if (modulesError) {
            console.error('Error fetching modules:', modulesError)
            toast({
                title: "Erreur",
                description: "Impossible de charger les modules",
                variant: "destructive"
            })
            return
        }

        // Initialiser les modules
        const activeModules: Record<string, boolean> = {}
        modules.forEach(module => {
            const foundModule = ownerModules?.find(m => m.module_name === module.name)
            activeModules[module.name] = foundModule ? foundModule.is_active : false
        })

        if (owner) {
            form.value = {
                name: owner.name,
                status: owner.status,
                modules: activeModules,
                settings: JSON.stringify(owner.settings, null, 2)
            }
        }
    } catch (error) {
        console.error('Error fetching company data:', error)
        toast({
            title: "Erreur",
            description: "Impossible de charger les données de l'entreprise",
            variant: "destructive"
        })
    }
}

const onSubmit = async () => {
    try {
        isLoading.value = true

        // Récupérer l'ID de l'entreprise
        const { data: ownerUser, error: userError } = await supabase
            .from('owner_users')
            .select('owner_id')
            .eq('user_id', user.value?.id)
            .maybeSingle()

        if (userError || !ownerUser?.owner_id) {
            throw new Error('Impossible de récupérer l\'ID de l\'entreprise')
        }

        // Mettre à jour l'entreprise
        const { error: updateError } = await supabase
            .from('owners')
            .update({
                name: form.value.name,
                status: form.value.status,
                settings: JSON.parse(form.value.settings),
                updated_at: new Date().toISOString()
            } as Database['public']['Tables']['owners']['Update'])
            .eq('id', ownerUser.owner_id)

        if (updateError) throw updateError

        // Mettre à jour les modules
        const moduleUpdates = Object.entries(form.value.modules).map(([name, isActive]) => ({
            owner_id: ownerUser.owner_id,
            module_name: name,
            is_active: isActive,
            updated_at: new Date().toISOString()
        } as Database['public']['Tables']['owner_modules']['Insert']))

        const { error: modulesError } = await supabase
            .from('owner_modules')
            .upsert(moduleUpdates, {
                onConflict: 'owner_id,module_name'
            })

        if (modulesError) throw modulesError

        toast({
            title: "Succès",
            description: "Paramètres de l'entreprise mis à jour avec succès"
        })
    } catch (error) {
        console.error('Error updating company:', error)
        toast({
            title: "Erreur",
            description: "Impossible de mettre à jour les paramètres de l'entreprise",
            variant: "destructive"
        })
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchCompanyData()
})
</script> 