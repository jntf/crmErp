<template>
    <div class="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b">
        <div class="flex h-16 items-center justify-between px-4">
            <div class="flex items-center">
                <SidebarTrigger />
            </div>

            <div class="flex items-center space-x-4">
                <!-- Mail Dropdown -->
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MailIcon class="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-80">
                        <DropdownMenuLabel>Messages</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <ScrollArea class="h-[400px]">
                            <div class="p-4">
                                <p class="text-sm text-muted-foreground">Pas de nouveaux messages</p>
                            </div>
                        </ScrollArea>
                    </DropdownMenuContent>
                </DropdownMenu>

                <!-- Dropdown Notifications -->
                <DropdownMenu v-if="isMounted">
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" class="relative">
                            <BellIcon class="h-5 w-5" />
                            <Badge 
                                v-if="totalUnread > 0" 
                                variant="destructive" 
                                class="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] min-w-[20px]"
                            >
                                {{ totalUnread > 99 ? '99+' : totalUnread }}
                            </Badge>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end" :alignOffset="0" class="w-80 p-0">
                        <client-only>
                            <NotificationsList @close="closeDropdown" @refresh="refreshNotifications" :compact="true" />
                        </client-only>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <NuxtLink to="/notifications" class="w-full cursor-pointer">
                                <ArrowRightIcon class="mr-2 h-4 w-4" />
                                Voir toutes les notifications
                            </NuxtLink>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <!-- Mode sombre -->
                <Button variant="ghost" size="icon" @click="toggleTheme">
                    <SunIcon v-if="!isDark" class="h-5 w-5" />
                    <MoonIcon v-else class="h-5 w-5" />
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    MailIcon,
    BellIcon,
    SunIcon,
    MoonIcon,
    ArrowRightIcon
} from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useNotifications } from '@/composables/notifications/useNotifications'
// Lazy load pour optimiser le chargement initial
const NotificationsList = defineAsyncComponent(() => import('@/components/notifications/NotificationsList.vue'))

const { isDark, toggleTheme } = useTheme()
const isMounted = ref(false)
const totalUnread = ref(0)
const user = useSupabaseUser()
const { countUnreadNotifications } = useNotifications()

// Fonction pour initialiser le thème
onMounted(() => {
    isMounted.value = true
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
        isDark.value = true
        document.documentElement.classList.add('dark')
    }

    // Initialiser le compteur de notifications
    refreshNotifications()
})

// Fonction pour rafraîchir les notifications
const refreshNotifications = async () => {
    if (!user.value) return
    
    try {
        // Utiliser la fonction qui prend en compte les rôles
        totalUnread.value = await countUnreadNotifications(user.value.email || '')
    } catch (error) {
        console.error('Erreur lors du comptage des notifications:', error)
    }
}

// Fermer le dropdown après une action
const closeDropdown = () => {
    // La fermeture est automatique car nous utilisons un DropdownMenu
    // qui se ferme après un clic
    refreshNotifications()
}

// Surveiller les changements d'utilisateur
watch(user, () => {
    refreshNotifications()
})
</script>