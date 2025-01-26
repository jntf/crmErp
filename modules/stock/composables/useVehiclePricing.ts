import { ref, computed } from 'vue'
import type { Vehicle, VehiclePrice } from '../types'

interface PricingDetails {
  purchase_price_ht: number
  selling_price_ht: number
  vat_rate: number
  repair_cost?: number
  frevo?: number
  margin_ht: number
  margin_percentage: number
  total_costs: number
  selling_price_ttc: number
}

export const useVehiclePricing = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Calcule les détails de prix pour un véhicule
   */
  const calculatePricing = async (vehicleId: string): Promise<PricingDetails> => {
    loading.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()

      // Récupérer les données de prix
      const { data: priceData, error: priceError } = await supabase
        .from('vehicle_prices')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .single()

      if (priceError) throw priceError

      return computePricingDetails(priceData)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Met à jour les prix d'un véhicule
   */
  const updatePricing = async (
    vehicleId: string,
    pricing: Partial<VehiclePrice>
  ) => {
    loading.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()

      // Mettre à jour les prix
      const { error: updateError } = await supabase
        .from('vehicle_prices')
        .upsert({
          vehicle_id: vehicleId,
          ...pricing
        })

      if (updateError) throw updateError

      // Recalculer les détails de prix
      return await calculatePricing(vehicleId)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Calcule les détails de prix à partir des données brutes
   */
  const computePricingDetails = (priceData: VehiclePrice): PricingDetails => {
    const purchase_price_ht = priceData.purchase_price_ht || 0
    const selling_price_ht = priceData.selling_price_ht || 0
    const vat_rate = priceData.vat_rate || 20
    const repair_cost = priceData.repair_cost || 0
    const frevo = priceData.frevo || 0

    // Calcul des coûts totaux
    const total_costs = purchase_price_ht + repair_cost + frevo

    // Calcul de la marge
    const margin_ht = selling_price_ht - total_costs
    const margin_percentage = (margin_ht / total_costs) * 100

    // Calcul du prix TTC
    const selling_price_ttc = selling_price_ht * (1 + vat_rate / 100)

    return {
      purchase_price_ht,
      selling_price_ht,
      vat_rate,
      repair_cost,
      frevo,
      margin_ht,
      margin_percentage,
      total_costs,
      selling_price_ttc
    }
  }

  /**
   * Suggère un prix de vente basé sur les coûts et la marge cible
   */
  const suggestSellingPrice = (
    purchasePrice: number,
    targetMarginPercentage: number = 15,
    additionalCosts: { repair?: number; frevo?: number } = {}
  ): number => {
    const totalCosts =
      purchasePrice +
      (additionalCosts.repair || 0) +
      (additionalCosts.frevo || 0)

    return totalCosts * (1 + targetMarginPercentage / 100)
  }

  /**
   * Formate un prix en euros
   */
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  /**
   * Formate un pourcentage
   */
  const formatPercentage = (percentage: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(percentage / 100)
  }

  return {
    loading,
    error,
    calculatePricing,
    updatePricing,
    suggestSellingPrice,
    formatPrice,
    formatPercentage
  }
} 