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