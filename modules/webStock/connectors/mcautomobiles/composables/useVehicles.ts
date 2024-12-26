// modules/webStock/connectors/mcautomobiles/composables/useVehicles.ts
import { parseMcAutomobilesXML } from '../parser'
import type { Vehicle } from '../../../types/vehicle.types'

export const useMcAutomobilesVehicles = () => {
    const vehicles = useState<Vehicle[]>('mcautomobiles-vehicles', () => [])
    const loading = useState<boolean>('mcautomobiles-loading', () => false)
    const error = useState<string | null>('mcautomobiles-error', () => null)

    async function fetchVehicles() {
        loading.value = true
        error.value = null

        try {
            const response = await fetch('/api/webstock/mcautomobiles')
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            const xmlText = await response.text()
            vehicles.value = await parseMcAutomobilesXML(xmlText)
        } catch (err) {
            console.error('Erreur lors du fetch McAutomobiles:', err)
            error.value = err instanceof Error ? err.message : "Erreur lors de la récupération des véhicules McAutomobiles"
        } finally {
            loading.value = false
        }
    }

    return {
        vehicles: readonly(vehicles),
        loading: readonly(loading),
        error: readonly(error),
        fetchVehicles
    }
}