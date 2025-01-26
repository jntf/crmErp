// composables/useSidebarMenu.ts
import {
    HomeIcon,
    Users2Icon,
    BuildingIcon,
    FileTextIcon,
    ShoppingCartIcon,
    CarIcon,
    ClipboardIcon,
    GlobeIcon
} from 'lucide-vue-next'
import { useModuleStore } from '@/stores/useModuleStore'
import { useSidebarStore } from '@/stores/useSidebarStore'
import { useAuthStore } from '@/stores/useAuthStore'

export interface MenuItem {
    label: string
    icon: any
    path?: string
    module?: string
    description?: string
    badge?: number | string
    roles?: string[]
}

export interface MenuSection {
    id: string
    label: string
    icon: any
    items: MenuItem[]
}

export const useSidebarMenu = () => {
    const moduleStore = useModuleStore()
    const sidebarStore = useSidebarStore()
    const authStore = useAuthStore()

    const menuSections: MenuSection[] = [
        {
            id: 'contacts',
            label: 'Contacts & Relations',
            icon: Users2Icon,
            items: [
                {
                    label: 'Entreprises',
                    icon: BuildingIcon,
                    path: '/entity/companies',
                    roles: ['admin']
                },
                {
                    label: 'Contacts',
                    icon: Users2Icon,
                    path: '/entity/contacts',
                    roles: ['user']
                }
            ]
        },
        {
            id: 'commercial',
            label: 'Commercial',
            icon: ClipboardIcon,
            items: [
                {
                    label: 'Factures',
                    icon: FileTextIcon,
                    path: '/erp/factures',
                    badge: 3,
                    roles: ['user']
                },
                {
                    label: 'Commandes',
                    icon: ShoppingCartIcon,
                    path: '/erp/commandes',
                    badge: 5,
                    roles: ['user']
                }
            ]
        },
        {
            id: 'stock',
            label: 'Stock & Véhicules',
            icon: CarIcon,
            items: [
                {
                    label: 'Gestion du stock',
                    icon: CarIcon,
                    path: '/stock',
                    description: 'Gestion du parc de véhicules',
                    module: 'stock',
                    roles: ['admin', 'manager']
                },
                {
                    label: 'Véhicules en ligne',
                    icon: GlobeIcon,
                    path: '/erp/webstock',
                    description: 'Gestion des véhicules sur le site web',
                    module: 'webStock',
                    roles: ['admin', 'manager']
                }
            ]
        }
    ]

    // Filtrer les sections et items selon les droits d'accès
    const filteredMenuSections = computed(() => {
        return menuSections
            .map(section => ({
                ...section,
                items: section.items.filter(item => {
                    const hasModuleAccess = !item.module || moduleStore.hasAccess(item.module)
                    const hasRoleAccess = !item.roles?.length || item.roles.some(role => authStore.hasRole(role))
                    return hasModuleAccess && hasRoleAccess
                })
            }))
            .filter(section => section.items.length > 0)
    })

    return {
        menuSections: filteredMenuSections,
        isCollapsed: computed(() => sidebarStore.isCollapsed),
        isMobile: computed(() => sidebarStore.isMobile),
        toggleCollapsed: () => sidebarStore.setCollapsed(!sidebarStore.isCollapsed)
    }
}