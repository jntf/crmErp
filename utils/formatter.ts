export function formatPrice(price: number): string {
    return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function formatMileage(mileage: number): string {
    return mileage.toLocaleString('fr-FR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' km'
}

// Formatage des string format dd/mm/yyyy en date js pour data-table
export function formatDate(date: string): string {
    const [day, month, year] = date.split('/')
    if (day && month && year) { 
        return `${day}/${month}/${year}`
    }
    return 'en cours'
}

export function formatPriceHT(price: number): string {
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' € HT'
}

export function formatPriceTTC(price: number): string {
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' € TTC'
}

export function formatKilometers(mileage: number): string {
    return mileage.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' km'
}

export function formatKilometerRange(minKm: number, maxKm: number): string {
    return minKm === maxKm 
        ? formatKilometers(minKm)
        : `${formatKilometers(minKm)} - ${formatKilometers(maxKm)}`
}

export function formatMECDate(date: string): string {
    const dateObj = new Date(date)
    return dateObj.toLocaleString('fr-FR', { month: '2-digit', year: 'numeric' })
}

export interface FormattedFeatures {
    comfort: string[];
    exterior: string[];
    interior: string[];
    safety: string[];
}

export function formatFeatures(features: any): FormattedFeatures {
    if (!features) return {
        comfort: [],
        exterior: [],
        interior: [],
        safety: []
    }
    
    return {
        comfort: features.comfort?.map((f: string) => f.trim()) || [],
        exterior: features.exterior?.map((f: string) => f.trim()) || [],
        interior: features.interior?.map((f: string) => f.trim()) || [],
        safety: features.safety?.map((f: string) => f.trim()) || []
    }
}

export function formatColorCount(color: string, count: number): string {
    return `${count} x ${color}`
}

/**
 * Formate un montant en euros
 */
export const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined) return ''
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }
  
  /**
   * Formate un pourcentage
   */
  export const formatPercent = (value: number | undefined): string => {
    if (value === undefined) return ''
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100)
  } 

  /**
 * Formate une date en format français
 */
export const formatDate1 = (date: Date | string | undefined): string => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}