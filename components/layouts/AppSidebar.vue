// components/layouts/AppSidebar.vue
<template>
    <Sidebar>
        <SidebarHeader>
            <h2 class="text-lg font-semibold">CRM ERP</h2>
        </SidebarHeader>

        <SidebarContent>
            <template v-for="group in menuGroups" :key="group.label">
                <SidebarGroup>
                    <SidebarMenu>
                        <template v-if="!group.collapsible">
                            <template v-for="item in group.items" :key="item.label">
                                <SidebarMenuItem v-if="canShow(item)">
                                    <SidebarMenuButton asChild>
                                        <NuxtLink :to="item.path" class="flex items-center gap-2">
                                            <component :is="item.icon" class="w-4 h-4" />
                                            <span>{{ item.label }}</span>
                                        </NuxtLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </template>
                        </template>
                        <template v-else>
                            <SidebarMenuItem>
                                <Collapsible class="w-full" @update:model-value="updateCollapsed">
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton class="justify-between">
                                            <div class="flex items-center gap-2">
                                                <component :is="group.icon" class="w-4 h-4" />
                                                <span>{{ group.label }}</span>
                                            </div>
                                            <ChevronDownIcon class="w-4 h-4 transition-transform duration-200"
                                                :class="{ 'rotate-180': isOpen }" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <template v-for="item in group.items" :key="item.label">
                                                <SidebarMenuSubItem v-if="canShow(item)">
                                                    <SidebarMenuButton asChild>
                                                        <NuxtLink :to="item.path" class="flex items-center gap-2">
                                                            <component :is="item.icon" class="w-4 h-4" />
                                                            <span>{{ item.label }}</span>
                                                        </NuxtLink>
                                                    </SidebarMenuButton>
                                                </SidebarMenuSubItem>
                                            </template>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </Collapsible>
                            </SidebarMenuItem>
                        </template>
                    </SidebarMenu>
                </SidebarGroup>
            </template>
        </SidebarContent>
    </Sidebar>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from 'lucide-vue-next'
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem
} from '@/components/ui/sidebar'
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent
} from '@/components/ui/collapsible'

const isOpen = ref(false)
const { menuGroups } = useSidebarMenu()
const { hasAnyRole } = useRoles()

const moduleStore = useModuleStore()

// Charger les modules accessibles au montage
onMounted(async () => {
    await moduleStore.fetchAccessibleModules()
})

const updateCollapsed = (value: boolean) => {
    isOpen.value = value
}

const canShow = (item: MenuItem) => {
    if (!item.roles?.length) return true
    return hasAnyRole(item.roles)
}
</script>