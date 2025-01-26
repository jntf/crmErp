<template>
    <div class="container mx-auto py-6 max-w-6xl space-y-6">
        <!-- En-tête -->
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-3xl font-bold tracking-tight">Nouveau Contact</h2>
                <p class="text-muted-foreground">Créez un nouveau contact dans votre base</p>
            </div>
            <Button variant="outline" @click="router.push('/entity/contacts')">
                <ArrowLeft class="mr-2 h-4 w-4" />
                Retour
            </Button>
        </div>

        <!-- Formulaire -->
        <Form @submit="onSubmit" class="space-y-6">
            <!-- Informations générales -->
            <Card>
                <CardHeader>
                    <CardTitle>Informations générales</CardTitle>
                    <CardDescription>Informations principales du contact</CardDescription>
                </CardHeader>
                <CardContent class="grid gap-6">
                    <div class="grid grid-cols-2 gap-4">
                        <!-- Prénom -->
                        <div>
                            <Label for="first-name">Prénom</Label>
                            <Input id="first-name" v-model="formData.first_name" required />
                        </div>

                        <!-- Nom -->
                        <div>
                            <Label for="last-name">Nom</Label>
                            <Input id="last-name" v-model="formData.last_name" required />
                        </div>

                        <!-- Email -->
                        <div>
                            <Label for="email">Email</Label>
                            <Input id="email" type="email" v-model="formData.email" />
                        </div>

                        <!-- Téléphone -->
                        <div>
                            <Label for="phone">Téléphone</Label>
                            <Input id="phone" type="tel" v-model="formData.phone" />
                        </div>

                        <!-- Mobile -->
                        <div>
                            <Label for="mobile">Mobile</Label>
                            <Input id="mobile" type="tel" v-model="formData.mobile_phone" />
                        </div>

                        <!-- Fonction -->
                        <div>
                            <Label for="job-title">Fonction</Label>
                            <Input id="job-title" v-model="formData.job_title" />
                        </div>

                        <!-- Service -->
                        <div>
                            <Label for="department">Service</Label>
                            <Input id="department" v-model="formData.department" />
                        </div>

                        <!-- Statut -->
                        <div>
                            <Label for="status">Statut</Label>
                            <Select v-model="formData.status">
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Actif</SelectItem>
                                    <SelectItem value="inactive">Inactif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <!-- Entreprise -->
                        <div class="col-span-2">
                            <Label for="company">Entreprise</Label>
                            <Select v-model="formData.company_id">
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez une entreprise" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="company in companies" :key="company.id" :value="company.id">
                                        {{ company.name }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Adresse -->
            <Card>
                <CardHeader>
                    <CardTitle>Adresse</CardTitle>
                    <CardDescription>Adresse principale du contact</CardDescription>
                </CardHeader>
                <CardContent class="grid gap-6">
                    <div class="grid grid-cols-6 gap-4">
                        <!-- Numéro -->
                        <div class="col-span-1">
                            <Label for="street-number">N°</Label>
                            <Input id="street-number" v-model="formData.address.street_number" />
                        </div>

                        <!-- Rue -->
                        <div class="col-span-5">
                            <Label for="street-name">Rue</Label>
                            <Input id="street-name" v-model="formData.address.street_name" />
                        </div>

                        <!-- Complément -->
                        <div class="col-span-6">
                            <Label for="address-line2">Complément d'adresse</Label>
                            <Input id="address-line2" v-model="formData.address.address_line2" />
                        </div>

                        <!-- Code postal -->
                        <div class="col-span-2">
                            <Label for="postal-code">Code postal</Label>
                            <Input id="postal-code" v-model="formData.address.postal_code" />
                        </div>

                        <!-- Ville -->
                        <div class="col-span-4">
                            <Label for="city">Ville</Label>
                            <Input id="city" v-model="formData.address.city" />
                        </div>

                        <!-- Pays -->
                        <div class="col-span-6">
                            <Label for="country">Pays</Label>
                            <Select v-model="formData.address.country_id">
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un pays" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="country in countries" :key="country.id" :value="country.id">
                                        {{ country.name }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <!-- Type d'adresse -->
                        <div class="col-span-3">
                            <Label for="address-type">Type d'adresse</Label>
                            <Select v-model="formData.address.address_type">
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="main">Principale</SelectItem>
                                    <SelectItem value="billing">Facturation</SelectItem>
                                    <SelectItem value="shipping">Livraison</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <!-- Adresse principale -->
                        <div class="col-span-3 flex items-center space-x-2">
                            <Checkbox id="is-primary" v-model="formData.address.is_primary" />
                            <Label for="is-primary">Adresse principale</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Boutons d'action -->
            <div class="flex justify-end gap-4">
                <Button type="button" variant="outline" @click="router.push('/entity/contacts')">
                    Annuler
                </Button>
                <Button type="submit" :disabled="loading">
                    <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                    Créer le contact
                </Button>
            </div>
        </Form>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import { useContacts } from '../../composables/useContacts'
import type { CreateContactData } from '../../composables/useContacts'

const router = useRouter()
const { toast } = useToast()
const { createContact, loading, fetchCompanies, fetchCountries } = useContacts()

const companies = ref([])
const countries = ref([])

const formData = ref<CreateContactData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile_phone: '',
    job_title: '',
    department: '',
    status: 'active',
    address: {
        street_name: '',
        city: '',
        country_id: 0,
        address_type: 'main',
        is_primary: true
    }
})

const loadData = async () => {
    try {
        const [companiesData, countriesData] = await Promise.all([
            fetchCompanies(),
            fetchCountries()
        ])
        companies.value = companiesData
        countries.value = countriesData
    } catch (error) {
        console.error('Error loading data:', error)
        toast({
            title: 'Erreur',
            description: 'Impossible de charger les données',
            variant: 'destructive'
        })
    }
}

const onSubmit = async () => {
    try {
        await createContact(formData.value)
        toast({
            title: 'Contact créé',
            description: 'Le contact a été créé avec succès'
        })
        router.push('/entity/contacts')
    } catch (error) {
        console.error('Error creating contact:', error)
        toast({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la création du contact',
            variant: 'destructive'
        })
    }
}

onMounted(() => {
    loadData()
})
</script> 