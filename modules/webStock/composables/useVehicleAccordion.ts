import { computed, type ComputedRef } from 'vue'
import { Wrench, Palette, List, ClipboardCheck } from 'lucide-vue-next'
import type { TransformedVehicle } from '../types'

export interface AccordionSection {
    id: string
    title: string
    icon?: any
    badge: ComputedRef<string>
}

export function useVehicleAccordion(vehicle: ComputedRef<TransformedVehicle | null>) {
    const sections: AccordionSection[] = [
        {
            id: 'technical',
            title: 'Fiche Technique',
            icon: Wrench,
            badge: computed(() =>
                vehicle.value ? `${vehicle.value.vehicleData.brand} ${vehicle.value.vehicleData.model}` : ''
            )
        },
        {
            id: 'colors',
            title: 'Couleurs',
            icon: Palette,
            badge: computed(() => vehicle.value?.vehicleData.color || '')
        },
        {
            id: 'equipment',
            title: 'Équipements',
            icon: List,
            badge: computed(() =>
                vehicle.value ? `${vehicle.value.equipments.length} équipements` : ''
            )
        },
        {
            id: 'expertise',
            title: 'Expertise',
            icon: ClipboardCheck,
            badge: computed(() =>
                vehicle.value?.expertise?.date || 'Non expertisé'
            )
        }
    ]

    return {
        sections
    }
}