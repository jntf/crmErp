<template>
    <div class="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b"> <!-- Retiré flex h-16 -->
        <div class="flex h-16 items-center justify-between px-4"> <!-- Déplacé flex ici -->
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
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()

// Fonction pour initialiser le thème
onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
        isDark.value = true
        document.documentElement.classList.add('dark')
    }
})
</script>