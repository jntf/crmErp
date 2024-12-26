<template>
    <div class="sticky top-0 z-50 flex h-16 w-full bg-background/95 backdrop-blur">
        <div class="flex items-center px-4">
            <SidebarTrigger />
        </div>

        <!-- Barre d'outils à droite -->
        <div class="ml-auto flex items-center space-x-4 px-4">
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

            <!-- Popover Notifications -->
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <BellIcon class="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" class="w-80">
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <h4 class="text-sm font-medium">Notifications</h4>
                            <Badge>Nouveau</Badge>
                        </div>
                        <ScrollArea class="h-[300px]">
                            <div class="space-y-4">
                                <p class="text-sm text-muted-foreground">Pas de notifications</p>
                            </div>
                        </ScrollArea>
                    </div>
                </PopoverContent>
            </Popover>

            <!-- Mode sombre -->
            <Button variant="ghost" size="icon" @click="toggleTheme">
                <SunIcon v-if="!isDark" class="h-5 w-5" />
                <MoonIcon v-else class="h-5 w-5" />
            </Button>
        </div>
    </div>
</template>

<script setup>
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    MailIcon,
    BellIcon,
    SunIcon,
    MoonIcon
} from 'lucide-vue-next'

// État du thème
const isDark = ref(false)

// Fonction pour basculer le thème
const toggleTheme = () => {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark')
}
</script>