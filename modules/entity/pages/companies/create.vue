# pages/companies/create.vue
<template>
    <div class="container mx-auto py-6 max-w-6xl space-y-6">
        <!-- En-tête -->
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-3xl font-bold tracking-tight">Nouvelle Entreprise</h2>
                <p class="text-muted-foreground">Créez une nouvelle entreprise dans votre base</p>
            </div>
            <Button variant="outline" @click="router.push('/companies')">
                <ArrowLeft class="mr-2 h-4 w-4" />
                Retour
            </Button>
        </div>

        <!-- Recherche SIRET -->
        <SiretSearch @companyFound="handleCompanyData" />

        <Form @submit="(values: FormValues) => onSubmit(values)" class="space-y-6">
            <Alert v-if="formPreFilled" class="mb-6">
                <AlertTitle>Données pré-remplies</AlertTitle>
                <AlertDescription>
                    Les informations ci-dessous ont été récupérées automatiquement.
                    Veuillez les vérifier et les ajuster si nécessaire avant de créer l'entreprise.
                </AlertDescription>
            </Alert>

            <!-- Informations générales -->
            <Card>
                <CardHeader>
                    <CardTitle>Informations générales</CardTitle>
                    <CardDescription>Informations principales de l'entreprise</CardDescription>
                </CardHeader>
                <CardContent class="grid gap-6 grid-cols-6">
                    <!-- Nom (conservé comme exemple qui fonctionne) -->
                    <div class="col-span-6 lg:col-span-4">
                        <Label for="company-name">Nom</Label>
                        <Field v-slot="{ meta }" name="name">
                            <div>
                                <Input id="company-name" :value="values.name"
                                    @input="e => setFieldValue('name', e.target.value)"
                                    :class="{ 'border-destructive': meta.touched && meta.error }" />
                                <span v-if="meta.touched && meta.error" class="text-sm text-destructive">
                                    {{ meta.error }}
                                </span>
                            </div>
                        </Field>
                    </div>

                    <!-- Statut -->
                    <div class="col-span-6 lg:col-span-2">
                        <Label for="company-status">Statut</Label>
                        <Field v-slot="{ meta }" name="status">
                            <div>
                                <Select id="company-status" :model-value="values.status"
                                    @update:model-value="value => setFieldValue('status', value)">
                                    <SelectTrigger>
                                        <SelectValue :placeholder="values.status || 'Sélectionnez'" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Actif</SelectItem>
                                        <SelectItem value="inactive">Inactif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </Field>
                    </div>

                    <!-- Code APE/NAF -->
                    <div class="col-span-3 lg:col-span-2">
                        <Label for="company-domain">Code APE/NAF</Label>
                        <Field v-slot="{ meta }" name="domain">
                            <div>
                                <Input id="company-domain" :value="values.domain"
                                    @input="e => setFieldValue('domain', e.target.value)" />
                            </div>
                        </Field>
                    </div>

                    <!-- Secteur d'activité -->
                    <div class="col-span-3 lg:col-span-4">
                        <Label for="company-industry">Secteur d'activité</Label>
                        <Field v-slot="{ meta }" name="industry">
                            <div>
                                <Input id="company-industry" :value="values.industry"
                                    @input="e => setFieldValue('industry', e.target.value)" />
                            </div>
                        </Field>
                    </div>
                </CardContent>
            </Card>

            <!-- Contact & Chiffres clés -->
            <div class="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <!-- Contact -->
                <Card>
                    <CardHeader>
                        <CardTitle>Coordonnées</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <!-- Email -->
                        <div class="grid grid-cols-4 gap-4">
                            <div class="col-span-4">
                                <Label for="company-email">Email</Label>
                                <Field v-slot="{ meta }" name="email">
                                    <div>
                                        <Input id="company-email" type="email" :value="values.email"
                                            @input="e => setFieldValue('email', e.target.value)"
                                            :class="{ 'border-destructive': meta.touched && meta.error }" />
                                        <span v-if="meta.touched && meta.error" class="text-sm text-destructive">
                                            {{ meta.error }}
                                        </span>
                                    </div>
                                </Field>
                            </div>

                            <!-- Téléphone -->
                            <div class="col-span-2">
                                <Label for="company-phone">Téléphone</Label>
                                <Field v-slot="{ meta }" name="phone">
                                    <div>
                                        <Input id="company-phone" type="tel" :value="values.phone"
                                            @input="e => setFieldValue('phone', e.target.value)" />
                                    </div>
                                </Field>
                            </div>

                            <!-- Site web -->
                            <div class="col-span-4">
                                <Label for="company-website">Site web</Label>
                                <Field v-slot="{ meta }" name="website">
                                    <div>
                                        <Input id="company-website" type="url" :value="values.website"
                                            @input="e => setFieldValue('website', e.target.value)"
                                            placeholder="https://"
                                            :class="{ 'border-destructive': meta.touched && meta.error }" />
                                        <span v-if="meta.touched && meta.error" class="text-sm text-destructive">
                                            {{ meta.error }}
                                        </span>
                                    </div>
                                </Field>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Chiffres clés -->
                <Card>
                    <CardHeader>
                        <CardTitle>Chiffres clés</CardTitle>
                    </CardHeader>
                    <CardContent class="grid grid-cols-2 gap-4">
                        <!-- Employés -->
                        <div>
                            <Label for="company-employees">Employés</Label>
                            <Field v-slot="{ meta }" name="number_of_employees">
                                <div>
                                    <Input id="company-employees" type="number" :value="values.number_of_employees"
                                        @input="e => setFieldValue('number_of_employees', e.target.value)" min="0" />
                                </div>
                            </Field>
                        </div>

                        <!-- Flotte -->
                        <div>
                            <Label for="company-fleet">Flotte</Label>
                            <Field v-slot="{ meta }" name="fleet_size">
                                <div>
                                    <Input id="company-fleet" type="number" :value="values.fleet_size"
                                        @input="e => setFieldValue('fleet_size', e.target.value)" min="0" />
                                </div>
                            </Field>
                        </div>

                        <!-- Capital social -->
                        <div>
                            <Label for="company-capital">Capital social</Label>
                            <Field v-slot="{ meta }" name="social_capital">
                                <div>
                                    <Input id="company-capital" type="number" :value="values.social_capital"
                                        @input="e => setFieldValue('social_capital', e.target.value)" min="0"
                                        step="0.01" />
                                </div>
                            </Field>
                        </div>

                        <!-- CA -->
                        <div>
                            <Label for="company-revenue">CA</Label>
                            <Field v-slot="{ meta }" name="revenue">
                                <div>
                                    <Input id="company-revenue" type="number" :value="values.revenue"
                                        @input="e => setFieldValue('revenue', e.target.value)" min="0" step="0.01" />
                                </div>
                            </Field>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Identifiants et Options -->
            <div class="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <!-- Identifiants -->
                <Card>
                    <CardHeader>
                        <CardTitle>Identifiants</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <!-- SIRET -->
                        <Field v-slot="{ meta }" name="tax_number">
                            <div class="grid grid-cols-4 gap-4 items-center">
                                <Label for="company-siret" class="text-right">SIRET</Label>
                                <div class="col-span-3">
                                    <Input id="company-siret" :value="values.tax_number"
                                        @input="e => setFieldValue('tax_number', e.target.value)" />
                                </div>
                            </div>
                        </Field>

                        <!-- TVA -->
                        <Field v-slot="{ meta }" name="vat_number">
                            <div class="grid grid-cols-4 gap-4 items-center">
                                <Label for="company-vat" class="text-right">N° TVA</Label>
                                <div class="col-span-3">
                                    <Input id="company-vat" :value="values.vat_number"
                                        @input="e => setFieldValue('vat_number', e.target.value)"
                                        placeholder="FR1234567890" />
                                </div>
                            </div>
                        </Field>
                    </CardContent>
                </Card>

                <!-- Options -->
                <Card>
                    <CardHeader>
                        <CardTitle>Options</CardTitle>
                    </CardHeader>
                    <CardContent class="flex gap-8 items-center h-[104px]">
                        <!-- Fournisseur -->
                        <Label class="flex items-center space-x-2 cursor-pointer">
                            <Field v-slot="{ meta }" name="is_supplier">
                                <Checkbox :checked="values.is_supplier"
                                    @update:checked="value => setFieldValue('is_supplier', value)" />
                            </Field>
                            <span>Fournisseur</span>
                        </Label>

                        <!-- Client -->
                        <Label class="flex items-center space-x-2 cursor-pointer">
                            <Field v-slot="{ meta }" name="is_customer">
                                <Checkbox :checked="values.is_customer"
                                    @update:checked="value => setFieldValue('is_customer', value)" />
                            </Field>
                            <span>Client</span>
                        </Label>
                    </CardContent>
                </Card>
            </div>

            <!-- Adresse -->
            <Card>
                <CardHeader>
                    <CardTitle>Adresse</CardTitle>
                </CardHeader>
                <CardContent class="grid gap-4">
                    <div class="grid grid-cols-6 gap-4">
                        <!-- Numéro -->
                        <div class="col-span-2 lg:col-span-1">
                            <Label for="company-street-number">N°</Label>
                            <Field v-slot="{ meta }" name="address.street_number">
                                <div>
                                    <Input id="company-street-number" :value="values?.address?.street_number"
                                        @input="e => setFieldValue('address.street_number', e.target.value)" />
                                </div>
                            </Field>
                        </div>

                        <!-- Rue -->
                        <div class="col-span-4 lg:col-span-5">
                            <Label for="company-street-name">Rue</Label>
                            <Field v-slot="{ meta }" name="address.street_name">
                                <div>
                                    <Input id="company-street-name" :value="values?.address?.street_name"
                                        @input="e => setFieldValue('address.street_name', e.target.value)" />
                                </div>
                            </Field>
                        </div>
                    </div>

                    <!-- Complément -->
                    <div>
                        <Label for="company-address-line2">Complément</Label>
                        <Field v-slot="{ meta }" name="address.address_line2">
                            <div>
                                <Input id="company-address-line2" :value="values?.address?.address_line2"
                                    @input="e => setFieldValue('address.address_line2', e.target.value)" />
                            </div>
                        </Field>
                    </div>

                    <div class="grid grid-cols-6 gap-4">
                        <!-- Code postal -->
                        <div class="col-span-2">
                            <Label for="company-postal-code">Code postal</Label>
                            <Field v-slot="{ meta }" name="address.postal_code">
                                <div>
                                    <Input id="company-postal-code" :value="values?.address?.postal_code"
                                        @input="e => setFieldValue('address.postal_code', e.target.value)" />
                                </div>
                            </Field>
                        </div>

                        <!-- Ville -->
                        <div class="col-span-4">
                            <Label for="company-city">Ville</Label>
                            <Field v-slot="{ meta }" name="address.city">
                                <div>
                                    <Input id="company-city" :value="values?.address?.city"
                                        @input="e => setFieldValue('address.city', e.target.value)" />
                                </div>
                            </Field>
                        </div>
                    </div>

                    <!-- Pays -->
                    <div class="w-full lg:w-1/3">
                        <Label for="company-country">Pays</Label>
                        <Field v-slot="{ meta }" name="address.country_id">
                            <div>
                                <Select id="company-country" :model-value="values?.address?.country_id"
                                    @update:model-value="value => setFieldValue('address.country_id', value)">
                                    <SelectTrigger>
                                        <SelectValue :placeholder="countries.find(c => c.id === values?.address?.country_id)?.name || 'Sélectionnez'
                                            " />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem v-for="country in countries" :key="country.id" :value="country.id">
                                            {{ country.name }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <span v-if="meta.touched && meta.error" class="text-sm text-destructive">
                                    {{ meta.error }}
                                </span>
                            </div>
                        </Field>
                    </div>
                </CardContent>
            </Card>

            <!-- Boutons d'action -->
            <div class="flex justify-end gap-4">
                <Button type="button" variant="outline" @click="router.push('/companies')">
                    Annuler
                </Button>
                <Button type="submit" :disabled="isSubmitting">
                    <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                    Créer l'entreprise
                </Button>
            </div>
        </Form>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { Form, Field } from 'vee-validate'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useCompanyForm } from '../../composables/useCompanyForm'
import { useCountries } from '../../composables/useCountries'
import SiretSearch from '../../components/SiretSearch.vue'
import type { FormValues } from '../../types/company.type'

const router = useRouter()
const { countries, loadCountries } = useCountries()
const {
    isSubmitting,
    formPreFilled,
    handleCompanyData,
    onSubmit,
    rawApiData,
    values,
    setFieldValue
} = useCompanyForm()

// Optionnel : Ajouter un watcher pour déboguer
// watch(() => values, (newValues) => {
//   console.log('Valeurs du formulaire mises à jour:', newValues)
// }, { deep: true })

onMounted(() => {
    loadCountries()
})
</script>