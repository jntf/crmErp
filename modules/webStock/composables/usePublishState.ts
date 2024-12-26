// modules/webStock/composables/usePublishState.ts
import { ref } from 'vue'
import type { TransformedVehicle } from '../connectors/mcautomobiles/types'

const selectedVehiclesForPublish = ref<TransformedVehicle[]>([])

export const usePublishState = () => {
    function setVehiclesForPublish(vehicles: TransformedVehicle[]) {
        selectedVehiclesForPublish.value = vehicles
    }

    return {
        selectedVehiclesForPublish,
        setVehiclesForPublish
    }
}