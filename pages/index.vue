<template>
    <div>
        <h1 class="text-4xl font-bold mb-6">Bienvenue sur mon application</h1>
        <Button>Cliquez-moi</Button>
    </div>
</template>

<script setup>
import { Button } from "@/components/ui/button"
const user = useSupabaseUser()
</script>