<!-- components/layouts/AppSidebar.vue -->
<template>
    <Sidebar class="flex flex-col h-screen bg-background border-r">
        <!-- Logo et titre -->
        <div class="px-4 py-2 bg-gray-200 flex items-center justify-between border-b">
            <div class="mx-auto">
                <img src="/logo.png" alt="Logo" class="w-auto h-12" />
            </div>
            <Button variant="ghost" size="icon" @click="toggleCollapsed" class="lg:hidden">
                <MenuIcon v-if="isCollapsed" class="h-4 w-4" />
                <XIcon v-else class="h-4 w-4" />
            </Button>
        </div>

        <!-- Menu principal -->
        <ScrollArea class="flex-1 py-2">
            <div class="space-y-1 p-2">
                <!-- Dashboard -->
                <NuxtLink to="/"
                    class="flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-accent"
                    :class="{ 'bg-accent': isActiveRoute('/') }">
                    <HomeIcon class="w-4 h-4" />
                    <span>Tableau de bord</span>
                </NuxtLink>

                <!-- Sections principales -->
                <div v-for="section in menuSections" :key="section.id" class="pt-2">
                    <Collapsible>
                        <CollapsibleTrigger class="flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent/50 group">
                            <component :is="section.icon" class="w-4 h-4" />
                            <span class="flex-1 text-left">{{ section.label }}</span>
                            <ChevronDownIcon class="w-4 h-4 transition-transform duration-200 text-muted-foreground group-data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent class="pl-3">
                            <div class="pt-1 pl-4 space-y-1">
                                <NuxtLink v-for="item in section.items" 
                                    :key="item.path"
                                    :to="item.path"
                                    class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-accent group"
                                    :class="{ 'bg-accent': isActiveRoute(item.path) }">
                                    <component :is="item.icon" class="w-4 h-4" />
                                    <div class="flex flex-col">
                                        <span>{{ item.label }}</span>
                                        <span v-if="item.description" class="text-xs text-muted-foreground">{{ item.description }}</span>
                                    </div>
                                    <Badge v-if="item.badge" variant="secondary" class="ml-auto">
                                        {{ item.badge }}
                                    </Badge>
                                </NuxtLink>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </div>
        </ScrollArea>

        <!-- Profil utilisateur -->
        <div class="border-t p-4">
            <DropdownMenu>
                <DropdownMenuTrigger class="w-full">
                    <Button variant="ghost" class="w-full justify-start gap-3">
                        <div class="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                            <UserIcon v-if="!user.avatar" class="w-4 h-4" />
                            <img v-else :src="user.avatar" :alt="user.name"
                                class="w-full h-full rounded-full object-cover" />
                        </div>
                        <div class="flex flex-col items-start text-sm">
                            <span class="font-medium">{{ user.name }}</span>
                            <span class="text-xs text-muted-foreground">{{ user.email }}</span>
                        </div>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" class="w-56">
                    <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <NuxtLink to="/profile">
                        <DropdownMenuItem>
                            <UserIcon class="w-4 h-4 mr-2" />
                            <span>Profil</span>
                        </DropdownMenuItem>
                    </NuxtLink>
                    
                    <NuxtLink to="/settings">
                        <DropdownMenuItem>
                            <SettingsIcon class="w-4 h-4 mr-2" />
                            <span>Paramètres</span>
                        </DropdownMenuItem>
                    </NuxtLink>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem @click="handleLogout" class="text-destructive">
                        <LogOutIcon class="w-4 h-4 mr-2" />
                        <span>Se déconnecter</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </Sidebar>
</template>

<script setup lang="ts">
import {
    LogOutIcon,
    MenuIcon,
    SettingsIcon,
    UserIcon,
    XIcon,
    HomeIcon,
    ChevronDownIcon
} from 'lucide-vue-next'
import { useSidebarMenu } from '@/composables/useSidebarMenu'
import { useAuthStore } from '@/stores/useAuthStore'

const route = useRoute()
const { menuSections, isCollapsed, toggleCollapsed } = useSidebarMenu()
const authStore = useAuthStore()

const user = computed(() => authStore.user || { name: '', email: '', avatar: null })

const isActiveRoute = (path: string) => {
    return route.path === path
}

const handleLogout = async () => {
    await authStore.logout()
}
</script>