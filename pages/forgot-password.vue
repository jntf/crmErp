<template>
    <div class="space-y-6">
        <div class="text-center">
            <h2 class="text-2xl font-bold text-gray-900">Mot de passe oublié</h2>
            <p class="mt-2 text-sm text-gray-600">
                Entrez votre email pour réinitialiser votre mot de passe
            </p>
        </div>

        <form class="space-y-6" @submit.prevent="handleResetPassword">
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                <input id="email" type="email" v-model="email" required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>

            <button type="submit" :disabled="loading"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                {{ loading ? 'Envoi...' : 'Envoyer les instructions' }}
            </button>

            <div v-if="message" class="text-center">
                <p :class="{ 'text-green-500': !error, 'text-red-500': error }" class="text-sm">
                    {{ message }}
                </p>
            </div>

            <div class="text-center">
                <NuxtLink to="/login" class="text-sm text-indigo-600 hover:text-indigo-500">
                    Retour à la connexion
                </NuxtLink>
            </div>
        </form>
    </div>
</template>

<script setup>
definePageMeta({
    layout: 'auth'
})
const client = useSupabaseClient()
const redirectTo = 'http://localhost:3000/reset-password'  // Ajustez selon votre configuration

const email = ref('')
const loading = ref(false)
const message = ref('')
const error = ref(false)

async function handleResetPassword() {
    try {
        loading.value = true
        message.value = ''
        error.value = false

        const { error: resetError } = await client.auth.resetPasswordForEmail(email.value, {
            redirectTo
        })

        if (resetError) {
            throw resetError
        }

        message.value = 'Les instructions de réinitialisation ont été envoyées à votre email'
    } catch (err) {
        message.value = err.message
        error.value = true
    } finally {
        loading.value = false
    }
}
</script>