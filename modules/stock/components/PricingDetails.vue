<template>
  <div class="space-y-4">
    <!-- Prix d'achat -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label>Prix d'achat HT</Label>
        <div class="flex items-center space-x-2">
          <Input
            v-model="form.purchase_price_ht"
            type="number"
            :disabled="!editable"
            class="w-full"
          />
          <span class="text-sm text-gray-500">€</span>
        </div>
      </div>

      <!-- Frais de remise en état -->
      <div class="space-y-2">
        <Label>Frais de remise en état</Label>
        <div class="flex items-center space-x-2">
          <Input
            v-model="form.repair_cost"
            type="number"
            :disabled="!editable"
            class="w-full"
          />
          <span class="text-sm text-gray-500">€</span>
        </div>
      </div>

      <!-- Frais de VO -->
      <div class="space-y-2">
        <Label>Frais de VO</Label>
        <div class="flex items-center space-x-2">
          <Input
            v-model="form.frevo"
            type="number"
            :disabled="!editable"
            class="w-full"
          />
          <span class="text-sm text-gray-500">€</span>
        </div>
      </div>

      <!-- TVA -->
      <div class="space-y-2">
        <Label>Taux de TVA</Label>
        <div class="flex items-center space-x-2">
          <Input
            v-model="form.vat_rate"
            type="number"
            :disabled="!editable"
            class="w-full"
          />
          <span class="text-sm text-gray-500">%</span>
        </div>
      </div>
    </div>

    <!-- Coûts totaux -->
    <Card>
      <CardHeader>
        <CardTitle>Coûts totaux</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Prix d'achat HT</span>
            <span>{{ formatPrice(form.purchase_price_ht) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Frais de remise en état</span>
            <span>{{ formatPrice(form.repair_cost) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Frais de VO</span>
            <span>{{ formatPrice(form.frevo) }}</span>
          </div>
          <Separator />
          <div class="flex justify-between font-semibold">
            <span>Total des coûts HT</span>
            <span>{{ formatPrice(totalCosts) }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Prix de vente -->
    <Card>
      <CardHeader>
        <CardTitle>Prix de vente</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <!-- Prix de vente HT -->
          <div class="space-y-2">
            <Label>Prix de vente HT</Label>
            <div class="flex items-center space-x-2">
              <Input
                v-model="form.selling_price_ht"
                type="number"
                :disabled="!editable"
                class="w-full"
              />
              <span class="text-sm text-gray-500">€</span>
            </div>
          </div>

          <!-- Détails -->
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-500">Prix de vente HT</span>
              <span>{{ formatPrice(form.selling_price_ht) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500">TVA ({{ form.vat_rate }}%)</span>
              <span>{{ formatPrice(vatAmount) }}</span>
            </div>
            <Separator />
            <div class="flex justify-between font-semibold">
              <span>Prix de vente TTC</span>
              <span>{{ formatPrice(sellingPriceTtc) }}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Marge -->
    <Card>
      <CardHeader>
        <CardTitle>Marge</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Marge brute HT</span>
            <span>{{ formatPrice(marginHt) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Marge en %</span>
            <span
              :class="{
                'text-red-500': marginPercentage < 0,
                'text-green-500': marginPercentage > 0
              }"
            >
              {{ formatPercentage(marginPercentage) }}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Actions -->
    <div v-if="editable" class="flex justify-end space-x-2">
      <Button
        variant="outline"
        @click="suggestPrice"
        :disabled="loading"
      >
        Suggérer un prix
      </Button>
      <Button
        @click="handleSave"
        :disabled="loading"
      >
        <Spinner v-if="loading" class="mr-2 h-4 w-4" />
        Enregistrer
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { VehiclePrice } from '../types'
import { useVehiclePricing } from '../composables/useVehiclePricing'

// Props
const props = defineProps<{
  modelValue: VehiclePrice
  editable?: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: VehiclePrice): void
  (e: 'save', value: VehiclePrice): void
}>()

// Composables
const { formatPrice, formatPercentage, suggestSellingPrice } = useVehiclePricing()

// État
const loading = ref(false)
const form = ref<VehiclePrice>({
  ...props.modelValue,
  vat_rate: props.modelValue.vat_rate || 20,
  repair_cost: props.modelValue.repair_cost || 0,
  frevo: props.modelValue.frevo || 0
})

// Computed
const totalCosts = computed(() => {
  return (
    (form.value.purchase_price_ht || 0) +
    (form.value.repair_cost || 0) +
    (form.value.frevo || 0)
  )
})

const vatAmount = computed(() => {
  return (form.value.selling_price_ht || 0) * (form.value.vat_rate || 20) / 100
})

const sellingPriceTtc = computed(() => {
  return (form.value.selling_price_ht || 0) + vatAmount.value
})

const marginHt = computed(() => {
  return (form.value.selling_price_ht || 0) - totalCosts.value
})

const marginPercentage = computed(() => {
  if (totalCosts.value === 0) return 0
  return (marginHt.value / totalCosts.value) * 100
})

// Watchers
watch(() => props.modelValue, (newValue) => {
  form.value = {
    ...newValue,
    vat_rate: newValue.vat_rate || 20,
    repair_cost: newValue.repair_cost || 0,
    frevo: newValue.frevo || 0
  }
}, { deep: true })

watch(form, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

// Méthodes
const handleSave = async () => {
  loading.value = true
  try {
    emit('save', form.value)
  } finally {
    loading.value = false
  }
}

const suggestPrice = () => {
  const suggestedPrice = suggestSellingPrice(
    form.value.purchase_price_ht || 0,
    15,
    {
      repair: form.value.repair_cost,
      frevo: form.value.frevo
    }
  )
  form.value.selling_price_ht = Math.round(suggestedPrice)
}
</script> 