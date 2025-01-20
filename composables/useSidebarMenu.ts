// composables/useSidebarMenu.ts
import {
    HomeIcon,
    Users2Icon,
    Building2Icon,
    FileTextIcon,
    ShoppingCartIcon,
    CarIcon,
    BoxIcon,
    FolderIcon
} from 'lucide-vue-next'
import { useModuleStore } from '@/stores/useModuleStore'

export interface MenuItem {
    label: string
    icon: any
    path?: string
    module?: string
    children?: MenuItem[]
}

export interface MenuGroup {
    label: string
    icon: any
    collapsible?: boolean
    items: MenuItem[]
}

export const useSidebarMenu = () => {
    const moduleStore = useModuleStore()

    const menuGroups: MenuGroup[] = [
        {
            label: 'Navigation',
            icon: HomeIcon,
            items: [
                {
                    label: 'Dashboard',
                    icon: HomeIcon,
                    path: '/'
                }
            ]
        },
        {
            label: 'Entity',
            icon: FolderIcon,
            collapsible: true,
            items: [
                {
                    label: 'Companies',
                    icon: Building2Icon,
                    path: '/entity/companies'
                }
            ]
        },
        {
            label: 'ERP',
            icon: BoxIcon,
            collapsible: true,
            items: [
                {
                    label: 'Factures',
                    icon: FileTextIcon,
                    path: '/erp/factures'
                },
                {
                    label: 'Commandes',
                    icon: ShoppingCartIcon,
                    path: '/erp/commandes'
                },
                {
                    label: 'Gestion Web Stock',
                    icon: CarIcon,
                    path: '/erp/webstock',
                    module: 'webStock'
                }
            ]
        }
    ]

    // Filtrer les éléments de menu selon les droits d'accès
    const filteredMenuGroups = computed(() => {
        return menuGroups.map(group => ({
            ...group,
            items: group.items.filter(item =>
                !item.module || moduleStore.hasAccess(item.module)
            )
        })).filter(group => group.items.length > 0)  // Supprimer les groupes vides
    })

    return {
        menuGroups: filteredMenuGroups
    }
}