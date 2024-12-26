<template>
    <SidebarProvider>
        <div class="flex min-h-screen w-full">
            <LayoutsAppSidebar />
            <main class="flex-1 min-w-0">
                <div class="p-8">
                    <LayoutsAppTopbar />
                    <NuxtPage />
                </div>
            </main>
        </div>
    </SidebarProvider>
</template>

<script setup>
import { SidebarProvider } from '@/components/ui/sidebar'
</script>