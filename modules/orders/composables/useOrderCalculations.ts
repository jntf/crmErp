import { computed } from 'vue'
import type { Ref } from 'vue'
import type { OrderItem, VehicleCommission, Order, OrderFormData } from '../types'
import { useTaxRules } from './useTaxRules'
import { useReferenceStore } from '../stores/useReferenceStore'

/**
 * Type générique pour accepter à la fois Order et OrderFormData
 */
type OrderLike = {
  items?: Array<any>;
  saleType?: string;
  contactId?: number | null;
  buyerCompanyId?: number | null;
  sellerCompanyId?: number | null;
  sellerContactId?: number | null;
  [key: string]: any; // Accepter toutes les propriétés supplémentaires
};

/**
 * Calcule les totaux d'une commande en appliquant les règles fiscales
 * @param order - Objet commande ou formulaire de commande
 * @returns Objet contenant les totaux calculés
 */
export function calculateOrderTotals(order: OrderLike) {
  const { getApplicableTaxRate } = useTaxRules()
  
  // Initialiser les totaux
  let totalHt = 0;
  let totalTva = 0;
  let totalTtc = 0;

  // Vérifier si les items existent
  if (!order.items || order.items.length === 0) {
    return { totalHt, totalTva, totalTtc, items: [] };
  }

  // Calculer les totaux pour chaque article
  const updatedItems = order.items.map(item => {
    // Calculer les totaux de l'article
    const itemTotalHt = item.sellingPriceHt * item.quantity;

    // Déterminer le taux de TVA à appliquer en fonction des règles fiscales
    const applicableTaxRate = getApplicableTaxRate(
      item,
      order.contactId,
      order.buyerCompanyId,
      order.sellerCompanyId
    );

    // Mettre à jour le taux de TVA de l'article
    const updatedItem = { ...item, tvaRate: applicableTaxRate };

    // Calculer la TVA et le total TTC
    const itemTotalTva = itemTotalHt * (applicableTaxRate / 100);
    const itemTotalTtc = itemTotalHt + itemTotalTva;

    // Mettre à jour les totaux de l'article
    updatedItem.totalHt = itemTotalHt;
    updatedItem.totalTva = itemTotalTva;
    updatedItem.totalTtc = itemTotalTtc;

    // Ajouter aux totaux de la commande
    totalHt += itemTotalHt;
    totalTva += itemTotalTva;
    totalTtc += itemTotalTtc;
    
    return updatedItem;
  });

  return {
    totalHt,
    totalTva,
    totalTtc,
    items: updatedItems
  };
}

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