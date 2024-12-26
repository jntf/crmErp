// modules/webStock/composables/useVehicles.ts
import { useMcAutomobilesVehicles } from '../connectors/mcautomobiles/composables/useVehicles'
import type { Vehicle } from '../types/vehicle.types'

export const useVehicles = () => {

    const mcaVehicles = useMcAutomobilesVehicles()
    // Vous pourrez ajouter d'autres sources ici
    // const otherSourceVehicles = useOtherSourceVehicles()

    // Agréger toutes les sources
    const vehicles = computed(() => [
        ...mcaVehicles.vehicles.value,
        // ...otherSourceVehicles.vehicles.value
    ])

    const loading = computed(() => 
        mcaVehicles.loading.value
        // || otherSourceVehicles.loading.value
    )

    const error = computed(() => 
        mcaVehicles.error.value 
        // || otherSourceVehicles.error.value
    )

    async function fetchAllVehicles() {
        await mcaVehicles.fetchVehicles()
        // await otherSourceVehicles.fetchVehicles()
    }

    return {
        vehicles: readonly(vehicles),
        loading: readonly(loading),
        error: readonly(error),
        fetchVehicles: fetchAllVehicles
    }
}