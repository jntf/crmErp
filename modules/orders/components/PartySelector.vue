<!--
/**
 * Composant de sélection des parties impliquées dans une commande
 * 
 * Ce composant s'adapte en fonction du type de vente sélectionné :
 * - B2C : Sélection d'un contact acheteur
 * - B2B : Sélection d'une entreprise acheteuse
 * - B2B2B : Sélection d'une entreprise acheteuse et d'une entreprise vendeuse
 * - B2B2C : Sélection d'une entreprise vendeuse et d'un contact acheteur
 * - C2B2C : Sélection d'un contact vendeur et d'un contact acheteur
 * - C2B2B : Sélection d'un contact vendeur et d'une entreprise acheteuse
 */
-->

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-base font-semibold">{{ getPartyTitle }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- B2C : Contact acheteur -->
      <template v-if="saleType === 'B2C'">
        <div class="space-y-2">
          <Label>Contact acheteur</Label>
          <Select v-model="contactIdStr">
            <SelectTrigger>
              <SelectValue :placeholder="'Sélectionnez un contact'" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="contact in contacts" :key="contact.id" :value="contact.id.toString()">
                  {{ contact.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </template>

      <!-- B2B : Entreprise acheteuse -->
      <template v-else-if="saleType === 'B2B'">
        <div class="space-y-2">
          <Label>Entreprise acheteuse</Label>
          <Combobox by="label" v-model="buyerCompanyIdStr">
            <ComboboxAnchor>
              <div class="relative w-full items-center">
                <ComboboxInput
                  :display-value="(val) => companies.find(c => c.id.toString() === val)?.name ?? ''"
                  placeholder="Sélectionnez une entreprise..." />
                <ComboboxTrigger class="absolute end-0 inset-y-0 flex items-center justify-center px-3">
                  <ChevronsUpDown class="size-4 text-muted-foreground" />
                </ComboboxTrigger>
              </div>
            </ComboboxAnchor>
            <ComboboxList>
              <ComboboxEmpty>
                Aucune entreprise trouvée.
              </ComboboxEmpty>
              <ComboboxGroup>
                <ComboboxItem v-for="company in companies" :key="company.id" :value="company.id.toString()">
                  {{ company.name }}
                  <ComboboxItemIndicator>
                    <Check :class="cn('ml-auto h-4 w-4')" />
                  </ComboboxItemIndicator>
                </ComboboxItem>
              </ComboboxGroup>
            </ComboboxList>
          </Combobox>
        </div>
      </template>

      <!-- B2B2B : Entreprise acheteuse + Entreprise vendeuse -->
      <template v-else-if="saleType === 'B2B2B'">
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>Entreprise acheteuse</Label>
            <Combobox by="label" v-model="buyerCompanyIdStr">
              <ComboboxAnchor>
                <div class="relative w-full items-center">
                  <ComboboxInput
                    :display-value="(val) => companies.find(c => c.id.toString() === val)?.name ?? ''"
                    placeholder="Sélectionnez une entreprise..." />
                  <ComboboxTrigger class="absolute end-0 inset-y-0 flex items-center justify-center px-3">
                    <ChevronsUpDown class="size-4 text-muted-foreground" />
                  </ComboboxTrigger>
                </div>
              </ComboboxAnchor>
              <ComboboxList>
                <ComboboxEmpty>
                  Aucune entreprise trouvée.
                </ComboboxEmpty>
                <ComboboxGroup>
                  <ComboboxItem v-for="company in companies" :key="company.id" :value="company.id.toString()">
                    {{ company.name }}
                    <ComboboxItemIndicator>
                      <Check :class="cn('ml-auto h-4 w-4')" />
                    </ComboboxItemIndicator>
                  </ComboboxItem>
                </ComboboxGroup>
              </ComboboxList>
            </Combobox>
          </div>
          <div class="space-y-2">
            <Label>Entreprise vendeuse</Label>
            <Combobox by="label" v-model="sellerCompanyIdStr">
              <ComboboxAnchor>
                <div class="relative w-full items-center">
                  <ComboboxInput
                    :display-value="(val) => companies.find(c => c.id.toString() === val)?.name ?? ''"
                    placeholder="Sélectionnez une entreprise..." />
                  <ComboboxTrigger class="absolute end-0 inset-y-0 flex items-center justify-center px-3">
                    <ChevronsUpDown class="size-4 text-muted-foreground" />
                  </ComboboxTrigger>
                </div>
              </ComboboxAnchor>
              <ComboboxList>
                <ComboboxEmpty>
                  Aucune entreprise trouvée.
                </ComboboxEmpty>
                <ComboboxGroup>
                  <ComboboxItem v-for="company in companies" :key="company.id" :value="company.id.toString()">
                    {{ company.name }}
                    <ComboboxItemIndicator>
                      <Check :class="cn('ml-auto h-4 w-4')" />
                    </ComboboxItemIndicator>
                  </ComboboxItem>
                </ComboboxGroup>
              </ComboboxList>
            </Combobox>
          </div>
        </div>
      </template>

      <!-- B2B2C : Entreprise vendeuse + Contact acheteur -->
      <template v-else-if="saleType === 'B2B2C'">
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>Entreprise vendeuse</Label>
            <Combobox by="label" v-model="sellerCompanyIdStr">
              <ComboboxAnchor>
                <div class="relative w-full items-center">
                  <ComboboxInput
                    :display-value="(val) => companies.find(c => c.id.toString() === val)?.name ?? ''"
                    placeholder="Sélectionnez une entreprise..." />
                  <ComboboxTrigger class="absolute end-0 inset-y-0 flex items-center justify-center px-3">
                    <ChevronsUpDown class="size-4 text-muted-foreground" />
                  </ComboboxTrigger>
                </div>
              </ComboboxAnchor>
              <ComboboxList>
                <ComboboxEmpty>
                  Aucune entreprise trouvée.
                </ComboboxEmpty>
                <ComboboxGroup>
                  <ComboboxItem v-for="company in companies" :key="company.id" :value="company.id.toString()">
                    {{ company.name }}
                    <ComboboxItemIndicator>
                      <Check :class="cn('ml-auto h-4 w-4')" />
                    </ComboboxItemIndicator>
                  </ComboboxItem>
                </ComboboxGroup>
              </ComboboxList>
            </Combobox>
          </div>
          <div class="space-y-2">
            <Label>Contact acheteur</Label>
            <Select v-model="contactIdStr">
              <SelectTrigger>
                <SelectValue :placeholder="'Sélectionnez un contact'" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="contact in contacts" :key="contact.id" :value="contact.id.toString()">
                    {{ contact.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </template>

      <!-- C2B2C : Contact vendeur + Contact acheteur -->
      <template v-else-if="saleType === 'C2B2C'">
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>Contact vendeur</Label>
            <Select v-model="sellerContactIdStr">
              <SelectTrigger>
                <SelectValue :placeholder="'Sélectionnez un contact'" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="contact in contacts" :key="contact.id" :value="contact.id.toString()">
                    {{ contact.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Contact acheteur</Label>
            <Select v-model="contactIdStr">
              <SelectTrigger>
                <SelectValue :placeholder="'Sélectionnez un contact'" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="contact in contacts" :key="contact.id" :value="contact.id.toString()">
                    {{ contact.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </template>

      <!-- C2B2B : Contact vendeur + Entreprise acheteuse -->
      <template v-else-if="saleType === 'C2B2B'">
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>Contact vendeur</Label>
            <Select v-model="sellerContactIdStr">
              <SelectTrigger>
                <SelectValue :placeholder="'Sélectionnez un contact'" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="contact in contacts" :key="contact.id" :value="contact.id.toString()">
                    {{ contact.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Entreprise acheteuse</Label>
            <Combobox by="label" v-model="buyerCompanyIdStr">
              <ComboboxAnchor>
                <div class="relative w-full items-center">
                  <ComboboxInput
                    :display-value="(val) => companies.find(c => c.id.toString() === val)?.name ?? ''"
                    placeholder="Sélectionnez une entreprise..." />
                  <ComboboxTrigger class="absolute end-0 inset-y-0 flex items-center justify-center px-3">
                    <ChevronsUpDown class="size-4 text-muted-foreground" />
                  </ComboboxTrigger>
                </div>
              </ComboboxAnchor>
              <ComboboxList>
                <ComboboxEmpty>
                  Aucune entreprise trouvée.
                </ComboboxEmpty>
                <ComboboxGroup>
                  <ComboboxItem v-for="company in companies" :key="company.id" :value="company.id.toString()">
                    {{ company.name }}
                    <ComboboxItemIndicator>
                      <Check :class="cn('ml-auto h-4 w-4')" />
                    </ComboboxItemIndicator>
                  </ComboboxItem>
                </ComboboxGroup>
              </ComboboxList>
            </Combobox>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { cn } from '@/utils'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Label, 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger
} from '#components'
import type { SaleType, Contact, Company } from '../types'

const props = defineProps<{
  saleType: SaleType
  contactId?: number
  buyerCompanyId?: number
  sellerCompanyId?: number
  sellerContactId?: number
  contacts: Contact[]
  companies: Company[]
}>()

const emit = defineEmits<{
  (e: 'update:contactId', value: number | undefined): void
  (e: 'update:buyerCompanyId', value: number | undefined): void
  (e: 'update:sellerCompanyId', value: number | undefined): void
  (e: 'update:sellerContactId', value: number | undefined): void
}>()

// Titre dynamique selon le type de vente
const getPartyTitle = computed(() => {
  switch (props.saleType) {
    case 'B2C':
      return 'Contact'
    case 'B2B':
      return 'Entreprise'
    case 'B2B2B':
      return 'Entreprises'
    case 'B2B2C':
      return 'Entreprise vendeuse et Contact acheteur'
    case 'C2B2C':
      return 'Contacts vendeur et acheteur'
    case 'C2B2B':
      return 'Contact vendeur et Entreprise acheteuse'
    default:
      return 'Parties impliquées'
  }
})

// Conversion des IDs en string pour les composants de sélection
const contactIdStr = computed({
  get: () => props.contactId?.toString() || '',
  set: (value: string) => {
    emit('update:contactId', value ? Number(value) : undefined)
  }
})

const buyerCompanyIdStr = computed({
  get: () => props.buyerCompanyId?.toString() || '',
  set: (value: string) => {
    emit('update:buyerCompanyId', value ? Number(value) : undefined)
  }
})

const sellerCompanyIdStr = computed({
  get: () => props.sellerCompanyId?.toString() || '',
  set: (value: string) => {
    emit('update:sellerCompanyId', value ? Number(value) : undefined)
  }
})

const sellerContactIdStr = computed({
  get: () => props.sellerContactId?.toString() || '',
  set: (value: string) => {
    emit('update:sellerContactId', value ? Number(value) : undefined)
  }
})
</script> 