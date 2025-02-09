<template>
  <div class="container mx-auto p-6">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">Société</h1>
      <p class="text-muted-foreground">
        Gérez les informations et les paramètres de votre société
      </p>
    </header>

    <Card class="mt-6">
      <CardHeader>
        <CardTitle>Paramètres de l'entreprise</CardTitle>
        <CardDescription>
          Gérez les informations et les paramètres de votre entreprise
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- ... Contenu existant de SettingsCompanyForm ... -->
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

// ... Reste du script de SettingsCompanyForm ...
</script> 