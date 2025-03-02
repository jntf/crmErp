import type { Contact, Company, Vehicle, CountryInfo } from '../types'
import { useReferenceStore } from '../stores/useReferenceStore'

export function useTaxRules() {
  const referenceStore = useReferenceStore()

  /**
   * Détermine si le véhicule a un taux de TVA applicable
   */
  const hasVehicleVAT = (vehicle: Vehicle | undefined): boolean => {
    if (!vehicle) return false;
    const vatRate = vehicle.vehicle_prices?.vat_rate;
    return vatRate !== null && vatRate !== undefined && vatRate > 0;
  }

  /**
   * Vérifie si le véhicule est considéré comme neuf (< 6 mois)
   */
  const isNewVehicle = (vehicle: Vehicle | undefined): boolean => {
    if (!vehicle || !vehicle.registration_date) return true; // Si pas de date d'immatriculation, considéré comme neuf
    
    const registrationDate = new Date(vehicle.registration_date);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return registrationDate > sixMonthsAgo;
  }

  /**
   * Vérifie si c'est une commande usine
   */
  const isFactoryOrder = (vehicle: Vehicle | undefined): boolean => {
    // Utiliser le stock_type calculé dans useReferenceStore
    return vehicle?.stock_type === 'factory_order';
  }

  /**
   * Détermine si la TVA doit être appliquée selon les règles
   */
  const shouldApplyVAT = (
    buyerCountry: CountryInfo | null,
    sellerCountry: CountryInfo | null,
    isB2B: boolean,
    vehicle: Vehicle | undefined
  ): boolean => {
    // Sans information de pays, on applique toujours la TVA
    if (!buyerCountry || !sellerCountry) {
      return true;
    }
    
    // Cas 2: Même pays - TVA locale applicable
    if (buyerCountry.id === sellerCountry.id) {
      return true;
    }
    
    // Cas 3: Pays différents, tous deux membres de l'UE
    if (buyerCountry.is_eu_member && sellerCountry.is_eu_member) {
      // B2B intracommunautaire: pas de TVA (reverse charge)
      if (isB2B) {
        return false;
      }
      
      // B2C intracommunautaire
      // Véhicule sans TVA, vente TTC
      if (!hasVehicleVAT(vehicle)) {
        return true; // TVA du pays vendeur
      }
      
      // Véhicule avec TVA
      // Pour particulier:
      // - Si neuf (<6 mois) ou commande usine: pas de TVA
      if (isNewVehicle(vehicle) || isFactoryOrder(vehicle)) {
        return false;
      }
      
      // Sinon, TVA du pays vendeur
      return true;
    }
    
    // Cas 4: Par défaut, TVA applicable
    return true;
  }

  /**
   * Détermine le taux de TVA applicable
   */
  const getApplicableTaxRate = (
    item: any,
    buyerContactId?: number | null,
    buyerCompanyId?: number | null,
    sellerCompanyId?: number | null
  ): number => {
    // Récupérer le véhicule
    const vehicle = referenceStore.getVehicleById(item.vehicleId);
    
    // Récupérer les informations de contact et d'entreprise
    const buyerContact = buyerContactId ? referenceStore.getContactById(buyerContactId) : null;
    const buyerCompany = buyerCompanyId ? referenceStore.getCompanyById(buyerCompanyId) : null;
    const sellerCompany = sellerCompanyId ? referenceStore.getCompanyById(sellerCompanyId) : null;
    
    // Déterminer les pays de l'acheteur et du vendeur
    const buyerCountry = buyerCompany?.country || buyerContact?.country || null;
    const sellerCountry = sellerCompany?.country || null;
    
    // Déterminer si c'est une vente B2B (entre entreprises)
    const isB2B = !!buyerCompanyId;
    
    // Vérifier si la TVA doit être appliquée
    const applyVAT = shouldApplyVAT(buyerCountry, sellerCountry, isB2B, vehicle);
    
    if (!applyVAT) {
      return 0; // Pas de TVA applicable
    }
    
    // Utiliser le taux de TVA du véhicule s'il existe
    const vehicleVatRate = vehicle?.vehicle_prices?.vat_rate;
    if (vehicleVatRate !== undefined && vehicleVatRate !== null) {
      return vehicleVatRate;
    }
    
    // Sinon, utiliser le taux de TVA du pays vendeur, de l'article ou le taux par défaut
    return sellerCountry?.tva_rate || item.tvaRate || 20;
  }

  return {
    hasVehicleVAT,
    isNewVehicle,
    isFactoryOrder,
    shouldApplyVAT,
    getApplicableTaxRate
  }
} 