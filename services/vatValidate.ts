interface CompanyInfo {
    name: string
    streetAddress: string
    zipCode: string
    city: string
    countryCode: string
    vatNumber: string
}

interface ValidationResult {
    isValid: boolean
    companyInfo?: CompanyInfo
    error?: string
}

const VAT_API_URL = 'https://api.vatcomply.com/vat'

/**
 * Parse une adresse pour en extraire la rue, le code postal et la ville
 */
const parseAddress = (address: string): { streetAddress: string; zipCode: string; city: string } => {
    const parts = address.split('\n')
    if (parts.length !== 2) {
        return { streetAddress: address, zipCode: '', city: '' }
    }

    const streetAddress = parts[0].trim()
    const zipCityPart = parts[1].trim()

    // Regex améliorée pour capturer les codes postaux avec ou sans tiret
    const zipCodeMatch = zipCityPart.match(/(\s|^)([A-Z]{1,2}-?\d{4,5}|[A-Z\d]{2,10})\s+/)
    
    if (!zipCodeMatch) {
        return { streetAddress, zipCode: '', city: zipCityPart }
    }

    const zipCode = zipCodeMatch[2].trim()
    // La ville est tout ce qui suit le code postal
    const city = zipCityPart.substring(zipCityPart.indexOf(zipCode) + zipCode.length).trim()

    return { streetAddress, zipCode, city }
}

/**
 * Valide un numéro de TVA et récupère les informations de l'entreprise
 * @param vatNumber - Le numéro de TVA à valider (ex: FR12345678901)
 * @returns Un objet contenant le résultat de la validation et les informations de l'entreprise
 */
export const validateVAT = async (vatNumber: string): Promise<ValidationResult> => {
    if (typeof vatNumber !== 'string' || vatNumber.trim() === '') {
        return { isValid: false, error: 'Numéro de TVA invalide ou vide' }
    }

    try {
        const response = await fetch(`${VAT_API_URL}?vat_number=${encodeURIComponent(vatNumber.trim())}`)
        
        if (!response.ok) {
            throw new Error('Erreur lors de la requête à l\'API de validation')
        }

        const data = await response.json()

        if (data.valid) {
            const { streetAddress, zipCode, city } = parseAddress(data.address)
            return {
                isValid: true,
                companyInfo: {
                    name: data.name,
                    streetAddress: streetAddress,
                    zipCode: zipCode,
                    city: city,
                    countryCode: data.country_code,
                    vatNumber: data.vat_number
                }
            }
        }

        return {
            isValid: false,
            error: 'Numéro TVA non valide'
        }

    } catch (error) {
        console.error('Erreur lors de la validation du numéro TVA:', error)
        return {
            isValid: false,
            error: 'Erreur lors de la validation du numéro TVA'
        }
    }
} 