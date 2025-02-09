/**
 * Formate un montant en euros avec le format français
 * @param value - Le montant à formater
 * @returns La chaîne formatée
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

/**
 * Convertit une valeur en chaîne de caractères de manière sûre
 * @param value - La valeur à convertir
 * @returns La chaîne convertie
 */
export const safeToString = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return ''
  return String(value)
}

/**
 * Convertit une valeur en nombre de manière sûre
 * @param value - La valeur à convertir
 * @returns Le nombre converti ou 0 si invalide
 */
export const safeToNumber = (value: string | number | boolean | null | undefined): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'boolean') return value ? 1 : 0
  const num = Number(value)
  return isNaN(num) ? 0 : num
} 