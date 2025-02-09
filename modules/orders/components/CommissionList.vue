<template>
  <Card>
    <CardHeader class="flex justify-between items-center">
      <CardTitle class="text-base font-semibold">Commissions</CardTitle>
      <Button type="button" variant="outline" size="sm" @click="addCommission">
        <PlusIcon class="h-4 w-4 mr-2" />
        Ajouter
      </Button>
    </CardHeader>
    <CardContent class="p-0">
      <Table>
        <TableHeader>
          <TableRow class="bg-muted/50 hover:bg-muted/50">
            <TableHead class="text-xs font-medium">Type</TableHead>
            <TableHead class="text-xs font-medium">Bénéficiaire</TableHead>
            <TableHead class="text-xs font-medium w-24 text-center">Taux (%)</TableHead>
            <TableHead class="text-xs font-medium w-32 text-right">Montant</TableHead>
            <TableHead class="text-xs font-medium w-32 text-center">Statut</TableHead>
            <TableHead class="text-xs font-medium">Date de paiement</TableHead>
            <TableHead class="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="(commission, index) in modelValue" :key="commission.id" class="text-xs">
            <TableCell>
              <Select v-model="commission.commissionType">
                <SelectTrigger class="w-32">
                  <SelectValue :placeholder="'Type'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem v-for="type in availableCommissionTypes" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <SearchableSelect
                :model-value="commission.beneficiaryId?.toString()"
                @update:model-value="updateBeneficiary(commission, $event)"
                :options="beneficiaryOptions"
                placeholder="Sélectionner..."
              />
            </TableCell>
            <TableCell class="text-center">
              <Input
                v-model.number="commission.rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="w-16 h-8 text-xs text-center"
                @input="updateCommissionAmount(index)"
              />
            </TableCell>
            <TableCell class="text-right font-medium">
              {{ formatCurrency(commission.amount) }}
            </TableCell>
            <TableCell class="text-center">
              <Badge :variant="commission.isPaid ? 'default' : 'secondary'">
                {{ commission.isPaid ? 'Payée' : 'En attente' }}
              </Badge>
            </TableCell>
            <TableCell>
              {{ commission.paymentDate ? formatDate(commission.paymentDate) : '-' }}
            </TableCell>
            <TableCell>
              <Button type="button" variant="ghost" size="icon" class="h-8 w-8" @click="removeCommission(index)">
                <Trash2Icon class="h-4 w-4 text-red-500" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
        <tfoot>
          <tr>
            <td colspan="3" class="text-right font-medium pr-4">Total commissions</td>
            <td class="text-right font-bold">{{ formatCurrency(totalCommissions) }}</td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </Table>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PlusIcon, Trash2Icon } from 'lucide-vue-next'
import type { VehicleCommission, SaleType, CommissionType } from '../types'
import { formatCurrency, formatDate } from '~/utils/format'
import SearchableSelect from '../components/ui/SearchableSelect.vue'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '#components'

const props = defineProps<{
  modelValue: VehicleCommission[]
  saleType: SaleType
  totalHt: number
  contacts: any[]
  companies: any[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: VehicleCommission[]): void
}>()

// Types de commission disponibles selon le type de vente
const availableCommissionTypes = computed(() => {
  switch (props.saleType) {
    case 'B2B2B':
      return [
        { value: 'MANDATE', label: 'Mandat' },
        { value: 'INTERMEDIARY', label: 'Intermédiaire' }
      ]
    case 'B2P':
      return [
        { value: 'MANDATE', label: 'Mandat' }
      ]
    case 'P2P':
      return [
        { value: 'PRIVATE_SALE', label: 'Vente particulier' }
      ]
    default:
      return []
  }
})

// Options pour le sélecteur de bénéficiaire
const beneficiaryOptions = computed(() => {
  const options = []
  
  // Ajouter les entreprises
  options.push(...props.companies.map(company => ({
    value: `company_${company.id}`,
    label: `🏢 ${company.name}`
  })))
  
  // Ajouter les contacts pour les ventes P2P
  if (props.saleType === 'P2P') {
    options.push(...props.contacts.map(contact => ({
      value: `contact_${contact.id}`,
      label: `👤 ${contact.name}`
    })))
  }
  
  return options
})

const totalCommissions = computed(() => {
  return props.modelValue.reduce((sum, commission) => sum + commission.amount, 0)
})

const updateBeneficiary = (commission: VehicleCommission, value: string) => {
  const [type, id] = value.split('_')
  commission.beneficiaryId = parseInt(id)
}

const updateCommissionAmount = (index: number) => {
  const commission = props.modelValue[index]
  if (!commission) return

  commission.amount = props.totalHt * (commission.rate / 100)
  emit('update:modelValue', [...props.modelValue])
}

const addCommission = () => {
  const newCommission: VehicleCommission = {
    id: 0,
    orderItemId: 0,
    amount: 0,
    rate: 0,
    beneficiaryId: 0,
    commissionType: availableCommissionTypes.value[0]?.value as CommissionType,
    isPaid: false
  }
  
  emit('update:modelValue', [...props.modelValue, newCommission])
}

const removeCommission = (index: number) => {
  const commissions = [...props.modelValue]
  commissions.splice(index, 1)
  emit('update:modelValue', commissions)
}
</script> 