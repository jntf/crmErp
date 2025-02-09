<template>
    <div class="container mx-auto p-6 pr-16 space-y-6">
        <header class="space-y-2">
            <h1 class="text-3xl font-bold tracking-tight">Paramètres</h1>
            <p class="text-muted-foreground">
                Gérez les paramètres de votre compte et de l'application
            </p>
        </header>

        <!-- Contenu principal -->
        <div class="w-full">
            <div v-if="activeTab === 'profile'">
                <ProfileForm />
            </div>
            <div v-if="activeTab === 'company'">
                <CompanyForm />
            </div>
            <div v-if="activeTab === 'commissions'">
                <CommissionsList />
            </div>
        </div>

        <!-- Barre latérale droite -->
        <div class="fixed right-0 top-1/4 bg-background border-l h-auto py-4 shadow-sm z-10 w-12">
            <div class="flex flex-col space-y-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="w-12 h-12 rounded-none hover:bg-accent"
                                :class="{ 'bg-accent': activeTab === 'profile' }"
                                @click="activeTab = 'profile'"
                            >
                                <UserIcon class="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p>Profil</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="w-12 h-12 rounded-none hover:bg-accent"
                                :class="{ 'bg-accent': activeTab === 'notifications' }"
                                @click="activeTab = 'notifications'"
                            >
                                <BellIcon class="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p>Notifications</p>
                        </TooltipContent>
                    </Tooltip>

                    <template v-if="authStore.hasRole('admin')">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="w-12 h-12 rounded-none hover:bg-accent"
                                    :class="{ 'bg-accent': activeTab === 'company' }"
                                    @click="activeTab = 'company'"
                                >
                                    <BuildingIcon class="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Entreprise</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="w-12 h-12 rounded-none hover:bg-accent"
                                    :class="{ 'bg-accent': activeTab === 'commissions' }"
                                    @click="activeTab = 'commissions'"
                                >
                                    <PercentIcon class="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Commissions</p>
                            </TooltipContent>
                        </Tooltip>
                    </template>

                    <template v-if="authStore.hasRole('superadmin')">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="w-12 h-12 rounded-none hover:bg-accent"
                                    :class="{ 'bg-accent': activeTab === 'admin' }"
                                    @click="activeTab = 'admin'"
                                >
                                    <ShieldIcon class="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Administration</p>
                            </TooltipContent>
                        </Tooltip>
                    </template>
                </TooltipProvider>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
    UserIcon, 
    BuildingIcon, 
    PercentIcon,
    BellIcon,
    ShieldIcon
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/useAuthStore'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import ProfileForm from '@/components/profile/ProfileForm.vue'
import CompanyForm from '@/components/company/CompanyForm.vue'
import CommissionsList from '@/components/commissions/CommissionsList.vue'

definePageMeta({
    middleware: ['auth']
})

const authStore = useAuthStore()
const activeTab = ref('profile')
</script> 