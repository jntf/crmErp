/**
 * Formate une date en format français
 */
export function formatDate(date: string | Date): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formate un montant en euros
 */
export function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return ''
  return amount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).replace(',', '.') + ' €'
}

/**
 * Formate une adresse complète
 */
export function formatAddress(address: string, postcode: string, city: string, country: string): string {
  return `${address || ''}, ${postcode || ''} ${city || ''}, ${country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '')
}

/**
 * Formate l'adresse du vendeur
 */
export function formattedSellerAddress(address: string, postcode: string, city: string, country: string): string {
  return formatAddress(address, postcode, city, country)
}

/**
 * Formate l'adresse de l'acheteur
 */
export function formattedBuyerAddress(address: string, postcode: string, city: string, country: string): string {
  return formatAddress(address, postcode, city, country)
}

/**
 * Vérifie si la transaction est nationale (même pays)
 */
export function isNationalTransaction(sellerCountry: string, buyerCountry: string): boolean {
  return sellerCountry === buyerCountry
}

/**
 * Formate les valeurs des cellules pour les tableaux de véhicules
 */
export function formatCellValue(value: any, columnId: string, item?: any): string {
  if (value === null || value === undefined) return '-'

  switch (columnId) {
    case 'model':
      return `${value}${item.version ? ` - ${item.version}` : ''}`
    case 'vehicle_selling_price_ht':
      const priceHT = Number(value)
      const priceTTC = priceHT * 1.2
      return `${formatCurrency(priceTTC)} TTC\n(${formatCurrency(priceHT)} HT)`
    case 'vehicle_frevo':
      const frevo = Number(value)
      return frevo ? formatCurrency(frevo) : '-'
    case 'registration_date':
      return formatDate(value)
    case 'mileage':
      return value.toLocaleString('fr-FR') + ' km'
    case 'co2_emissions':
      return value ? `${value}g/km` : '-'
    case 'fuel_type':
      // Formattage spécifique pour les types de carburant avec icônes
      switch (value?.toLowerCase()) {
        case 'diesel': return 'Diesel ⛽'
        case 'essence': return 'Essence 🚗'
        case 'hybrid': return 'Hybride ♻️'
        case 'electric': return 'Électrique ⚡'
        default: return String(value)
      }
    default:
      return String(value)
  }
}

/**
 * Formate les options des véhicules
 */
export function formatOptions(options: string | null): string {
  if (!options) return '-'
  const optionsArray = options.split(',')
  return optionsArray.length > 0 ? '📋 Options: ' + optionsArray.join(' • ') : '-'
} 