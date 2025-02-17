import { computed, Ref } from 'vue'
import type { OrderItem, VehicleCommission } from '../types'

export function useOrderCalculations(items: Ref<OrderItem[]>, commissions?: Ref<VehicleCommission[]>) {
  // Calcul du total HT
  const totalHT = computed(() => 
    items.value.reduce((sum, item) => sum + (item.quantity * item.sellingPriceHt), 0)
  )

  // Calcul de la TVA totale
  const totalTVA = computed(() => 
    items.value.reduce((sum, item) => {
      const itemTotal = item.quantity * item.sellingPriceHt
      return sum + (itemTotal * (item.tvaRate / 100))
    }, 0)
  )

  // Calcul du total TTC
  const totalTTC = computed(() => totalHT.value + totalTVA.value)

  // Calcul de la marge totale
  const totalMargin = computed(() => 
    items.value.reduce((sum, item) => 
      sum + ((item.sellingPriceHt - (item.purchasePriceHt || 0)) * item.quantity), 0)
  )

  // Calcul du total des commissions
  const totalCommissions = computed(() => 
    commissions?.value?.reduce((sum, commission) => sum + (commission.amount || 0), 0) || 0
  )

  // Calcul de la marge nette (après commissions)
  const netMargin = computed(() => totalMargin.value - totalCommissions.value)

  // Calcul des totaux par article
  const calculateItemTotals = (item: OrderItem) => {
    const totalHt = item.quantity * item.sellingPriceHt
    const totalTva = totalHt * (item.tvaRate / 100)
    const totalTtc = totalHt + totalTva
    const margin = (item.sellingPriceHt - (item.purchasePriceHt || 0)) * item.quantity

    return {
      totalHt,
      totalTva,
      totalTtc,
      margin
    }
  }

  return {
    totalHT,
    totalTVA,
    totalTTC,
    totalMargin,
    totalCommissions,
    netMargin,
    calculateItemTotals
  }
} 