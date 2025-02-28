/**
 * Composable pour gérer la logique des ventes d'intermédiation
 * 
 * Ce composable fournit des fonctions utilitaires pour :
 * - Déterminer si un type de vente est de l'intermédiation
 * - Identifier les parties impliquées selon le type d'intermédiation
 * - Préparer les données de commande pour l'intermédiation
 * - Calculer la TVA selon les règles d'intermédiation
 */

import { computed } from 'vue'
import type { SaleType, OrderFormData, OrderItem, VehicleCommission } from '../types'

export function useOrderIntermediation() {
  /**
   * Détermine si un type de vente est de l'intermédiation
   */
  const isIntermediationType = (type: SaleType | null | undefined) => {
    return ['B2B2B', 'B2B2C', 'C2B2C', 'C2B2B'].includes(type || '')
  }
  
  /**
   * Retourne les informations sur les parties impliquées selon le type d'intermédiation
   */
  const getIntermediationParties = (type: SaleType) => {
    return {
      buyerIsCompany: ['B2B2B', 'C2B2B'].includes(type),
      sellerIsCompany: ['B2B2B', 'B2B2C'].includes(type),
      buyerIsContact: ['B2B2C', 'C2B2C'].includes(type),
      sellerIsContact: ['C2B2C', 'C2B2B'].includes(type)
    }
  }
  
  /**
   * Vérifie si les parties requises sont présentes selon le type d'intermédiation
   */
  const validateIntermediationParties = (formData: OrderFormData) => {
    const type = formData.saleType
    const parties = getIntermediationParties(type)
    
    const errors: string[] = []
    
    if (parties.buyerIsCompany && !formData.buyerCompanyId) {
      errors.push("L'entreprise acheteuse est requise")
    }
    
    if (parties.sellerIsCompany && !formData.sellerCompanyId) {
      errors.push("L'entreprise vendeuse est requise")
    }
    
    if (parties.buyerIsContact && !formData.contactId) {
      errors.push("Le contact acheteur est requis")
    }
    
    if (parties.sellerIsContact && !formData.sellerContactId) {
      errors.push("Le contact vendeur est requis")
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Prépare les données de commande pour l'intermédiation
   */
  const prepareIntermediationOrderData = (formData: OrderFormData) => {
    const type = formData.saleType
    const parties = getIntermediationParties(type)
    
    // Ajouter les métadonnées spécifiques à l'intermédiation
    const metadata: Record<string, any> = {
      intermediation_type: type,
      commission_payer: formData.metadata?.commission_payer || 'seller', // Par défaut, le vendeur paie
    }
    
    // Pour les types qui impliquent un contact vendeur, stocker l'ID dans les métadonnées
    // car le modèle de données actuel ne prévoit pas de champ sellerContactId
    if (parties.sellerIsContact) {
      metadata.seller_contact_id = formData.sellerContactId
    }
    
    return {
      ...formData,
      metadata: {
        ...formData.metadata,
        ...metadata
      }
    }
  }
  
  /**
   * Calcule le taux de TVA applicable selon les règles d'intermédiation
   * Basé sur le diagramme de calcul de TVA fourni
   */
  const calculateIntermediationVat = (
    type: SaleType,
    buyerCountry: string,
    sellerCountry: string,
    buyerIsCompany: boolean,
    sellerIsCompany: boolean
  ) => {
    // Vérifier si les pays sont dans l'UE
    const isEUCountry = (country: string) => {
      const euCountries = ['FR', 'DE', 'IT', 'ES', 'BE', 'NL', 'LU', 'PT', 'AT', 'FI', 'IE', 'GR', 'SE', 'DK', 'PL', 'CZ', 'HU', 'SK', 'SI', 'EE', 'LV', 'LT', 'BG', 'RO', 'HR', 'CY', 'MT']
      return euCountries.includes(country)
    }
    
    // Même pays pour les entreprises
    const sameCountry = buyerCountry === sellerCountry
    
    // Tous dans l'UE
    const allInEU = isEUCountry(buyerCountry) && isEUCountry(sellerCountry)
    
    // Entre entreprises
    const isBetweenCompanies = buyerIsCompany && sellerIsCompany
    
    // Logique de calcul de TVA selon le diagramme
    if (sameCountry) {
      // Taux local du pays
      return { rate: 20, country: buyerCountry, explanation: 'Taux local (même pays)' } // Taux par défaut à 20%, à adapter selon le pays
    } else if (allInEU) {
      if (isBetweenCompanies) {
        // Pas de TVA (0%) entre entreprises de l'UE
        return { rate: 0, country: null, explanation: 'Pas de TVA (0%) - B2B intra-UE' }
      } else {
        // Taux du pays du vendeur
        return { rate: 20, country: sellerCountry, explanation: 'Taux du pays du vendeur (UE)' } // Taux par défaut à 20%, à adapter selon le pays
      }
    } else {
      // Taux du pays du vendeur pour les cas hors UE
      return { rate: 20, country: sellerCountry, explanation: 'Taux du pays du vendeur (hors UE)' } // Taux par défaut à 20%, à adapter selon le pays
    }
  }
  
  /**
   * Associe les commissions aux articles de commande en utilisant le vehicleId
   * Cette fonction est utile lors de la préparation des données pour la sauvegarde
   * 
   * @param items - Les articles de commande
   * @param commissions - Les commissions à associer
   * @returns Les commissions avec les order_item_id corrects
   */
  const associateCommissionsWithItems = (
    items: OrderItem[],
    commissions: VehicleCommission[]
  ): VehicleCommission[] => {
    return commissions.map(commission => {
      // Si la commission a déjà un order_item_id valide (différent de 0), on le conserve
      if (commission.order_item_id && commission.order_item_id !== 0) {
        return commission
      }
      
      // Sinon, on essaie de trouver l'article correspondant au vehicleId
      if (commission.vehicleId) {
        const matchingItem = items.find(item => 
          item.vehicleId === commission.vehicleId?.toString() || 
          Number(item.vehicleId) === commission.vehicleId
        )
        
        if (matchingItem) {
          return {
            ...commission,
            order_item_id: matchingItem.id
          }
        }
      }
      
      // Si on n'a pas pu associer la commission, on retourne la commission inchangée
      return commission
    })
  }

  return {
    isIntermediationType,
    getIntermediationParties,
    validateIntermediationParties,
    prepareIntermediationOrderData,
    calculateIntermediationVat,
    associateCommissionsWithItems
  }
} 