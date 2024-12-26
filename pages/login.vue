<template>
    <div class="space-y-6">
        <div class="text-center">
            <h2 class="text-2xl font-bold text-gray-900">Connexion</h2>
        </div>

        <form class="space-y-6" @submit.prevent="handleLogin">
            <div class="space-y-4">
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                    <input id="email" type="email" v-model="email" required
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Mot de passe</label>
                    <input id="password" type="password" v-model="password" required
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
            </div>

            <div class="flex items-center justify-between">
                <NuxtLink to="/forgot-password" class="text-sm text-indigo-600 hover:text-indigo-500">
                    Mot de passe oublié ?
                </NuxtLink>
            </div>

            <button type="submit" :disabled="loading"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                {{ loading ? 'Connexion...' : 'Se connecter' }}
            </button>

            <div v-if="error" class="text-red-500 text-sm text-center">
                {{ error }}
            </div>
        </form>
    </div>
</template>

<script setup>
definePageMeta({
    layout: 'auth'
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref(null)
const loading = ref(false)

// Redirection si déjà connecté
watchEffect(() => {
    if (user.value) {
        router.push('/')
    }
})

async function handleLogin() {
    try {
        loading.value = true
        error.value = null

        const { error: signInError } = await client.auth.signInWithPassword({
            email: email.value,
            password: password.value
        })

        if (signInError) throw signInError

    } catch (err) {
        error.value = err.message
    } finally {
        loading.value = false
    }
}
</script>