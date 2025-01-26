// stores/useSidebarStore.ts
import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', {
    state: () => ({
        isCollapsed: useCookie('sidebar:state').value === 'true',
        openGroups: new Set<string>(),
        isMobile: false
    }),

    actions: {
        setCollapsed(value: boolean) {
            this.isCollapsed = value
            useCookie('sidebar:state').value = String(value)
        },

        toggleGroup(groupLabel: string) {
            if (this.openGroups.has(groupLabel)) {
                this.openGroups.delete(groupLabel)
            } else {
                this.openGroups.add(groupLabel)
            }
        },

        initMobileDetection() {
            if (process.client) {
                this.isMobile = window.innerWidth < 1024
                window.addEventListener('resize', () => {
                    this.isMobile = window.innerWidth < 1024
                })
            }
        }
    }
})