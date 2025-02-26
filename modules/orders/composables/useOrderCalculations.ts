import { computed } from 'vue'
import type { Ref } from 'vue'
import type { OrderItem, VehicleCommission } from '../types'

/**
 * Composable pour les calculs liés aux commandes et commissions
 * 
 * Ce composable fournit des fonctions et des propriétés calculées pour gérer
 * les calculs financiers des commandes, notamment les totaux, TVA, marges et commissions.
 * 
 * @param items - Référence réactive à la liste des articles de commande
 * @param commissions - Référence réactive à la liste des commissions (optionnel)
 * @returns Objet contenant les propriétés calculées et fonctions utilitaires
 */
export function useOrderCalculations(items: Ref<OrderItem[]>, commissions?: Ref<VehicleCommission[]>) {
  /**
   * Calcul du total HT de la commande
   * @returns Somme des prix de vente HT de tous les articles
   */
  const totalHT = computed(() => 
    items.value.reduce((sum, item) => sum + (item.quantity * item.sellingPriceHt), 0)
  )

  /**
   * Calcul de la TVA totale de la commande
   * @returns Somme des montants de TVA de tous les articles
   */
  const totalTVA = computed(() => 
    items.value.reduce((sum, item) => {
      const itemTotal = item.quantity * item.sellingPriceHt
      return sum + (itemTotal * (item.tvaRate / 100))
    }, 0)
  )

  /**
   * Calcul du total TTC de la commande
   * @returns Somme du total HT et de la TVA totale
   */
  const totalTTC = computed(() => totalHT.value + totalTVA.value)

  /**
   * Calcul de la marge totale (avant commissions)
   * @returns Différence entre prix de vente et prix d'achat pour tous les articles
   */
  const totalMargin = computed(() => 
    items.value.reduce((sum, item) => 
      sum + ((item.sellingPriceHt - (item.purchasePriceHt || 0)) * item.quantity), 0)
  )

  /**
   * Calcul du total des commissions
   * @returns Somme des montants de toutes les commissions
   */
  const totalCommissions = computed(() => 
    commissions?.value?.reduce((sum, commission) => sum + (commission.amount || 0), 0) || 0
  )

  /**
   * Calcul de la marge nette (après déduction des commissions)
   * @returns Différence entre la marge totale et le total des commissions
   */
  const netMargin = computed(() => totalMargin.value - totalCommissions.value)

  /**
   * Calcule les totaux pour un article de commande spécifique
   * @param item - Article de commande à calculer
   * @returns Objet contenant les totaux calculés (HT, TVA, TTC, marge)
   */
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