<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
            <!-- Logo ou titre du site -->
            <div class="text-center">
                <h1 class="text-4xl font-bold text-gray-900">CRM ERP</h1>
            </div>

            <!-- Contenu dynamique -->
            <slot />
        </div>
    </div>
</template>