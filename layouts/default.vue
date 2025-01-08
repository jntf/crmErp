<template>
    <SidebarProvider>
        <div class="flex min-h-screen w-full">
            <LayoutsAppSidebar />
            <div class="flex-1 flex flex-col w-full">
                <LayoutsAppTopbar />
                <main class="flex-1 w-full p-8">
                    <NuxtPage />
                </main>
            </div>
        </div>
    </SidebarProvider>
</template>

<script setup>
import { SidebarProvider } from '@/components/ui/sidebar'
</script>