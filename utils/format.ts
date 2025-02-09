/**
 * Formate une date en format français
 */
// export const formatDate = (date: Date | string | undefined): string => {
//   if (!date) return ''
//   return new Date(date).toLocaleDateString('fr-FR', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric'
//   })
// }

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