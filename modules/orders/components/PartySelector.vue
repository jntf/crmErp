<template>
  <div class="space-y-4">
    <div v-if="saleType === 'B2C'">
      <Label>Contact</Label>
      <Select
        :model-value="selectedContactId?.toString()"
        @update:model-value="updateContactId"
        required
      >
        <option value="">Sélectionnez un contact</option>
        <option v-for="contact in contacts" :key="contact.id" :value="contact.id.toString()">
          {{ contact.name }}
        </option>
      </Select>
    </div>

    <div v-else-if="saleType === 'B2B'">
      <Label>Entreprise acheteuse</Label>
      <Select
        :model-value="selectedBuyerCompanyId?.toString()"
        @update:model-value="updateBuyerCompanyId"
        required
      >
        <option value="">Sélectionnez une entreprise</option>
        <option v-for="company in companies" :key="company.id" :value="company.id.toString()">
          {{ company.name }}
        </option>
      </Select>
    </div>

    <div v-else-if="saleType === 'B2B2B'" class="space-y-4">
      <div>
        <Label>Entreprise acheteuse</Label>
        <Select
          :model-value="selectedBuyerCompanyId?.toString()"
          @update:model-value="updateBuyerCompanyId"
          required
        >
          <option value="">Sélectionnez une entreprise</option>
          <option v-for="company in companies" :key="company.id" :value="company.id.toString()">
            {{ company.name }}
          </option>
        </Select>
      </div>

      <div>
        <Label>Entreprise vendeuse</Label>
        <Select
          :model-value="selectedSellerCompanyId?.toString()"
          @update:model-value="updateSellerCompanyId"
          required
        >
          <option value="">Sélectionnez une entreprise</option>
          <option v-for="company in companies" :key="company.id" :value="company.id.toString()">
            {{ company.name }}
          </option>
        </Select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { SaleType } from '../types'
import { useReferenceStore } from '../stores/useReferenceStore'
import { Select, Label } from '#components'

const props = defineProps<{
  saleType: SaleType
  contactId?: number
  buyerCompanyId?: number
  sellerCompanyId?: number
}>()

const emit = defineEmits<{
  (e: 'update:contactId', value: number | undefined): void
  (e: 'update:buyerCompanyId', value: number | undefined): void
  (e: 'update:sellerCompanyId', value: number | undefined): void
}>()

const store = useReferenceStore()

const selectedContactId = computed(() => props.contactId)
const selectedBuyerCompanyId = computed(() => props.buyerCompanyId)
const selectedSellerCompanyId = computed(() => props.sellerCompanyId)

const updateContactId = (value: string) => {
  emit('update:contactId', value ? Number(value) : undefined)
}

const updateBuyerCompanyId = (value: string) => {
  emit('update:buyerCompanyId', value ? Number(value) : undefined)
}

const updateSellerCompanyId = (value: string) => {
  emit('update:sellerCompanyId', value ? Number(value) : undefined)
}

const contacts = computed(() => store.contacts)
const companies = computed(() => store.companies)

// Réinitialiser les valeurs lors du changement de type de vente
watch(() => props.saleType, () => {
  if (props.saleType === 'B2C') {
    emit('update:buyerCompanyId', undefined)
    emit('update:sellerCompanyId', undefined)
  } else {
    emit('update:contactId', undefined)
    if (props.saleType === 'B2B') {
      emit('update:sellerCompanyId', undefined)
    }
  }
})

onMounted(async () => {
  await Promise.all([
    store.fetchContacts(),
    store.fetchCompanies()
  ])
})
</script> 