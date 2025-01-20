<!-- components/edit/Principals.vue -->
<template>
    <div class="space-y-1">
        <p class="text-sm text-gray-500">{{ label }}</p>
        <div v-if="isEditing">
            <input v-if="type === 'text' || !type" type="text" :value="modelValue"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
                class="w-full rounded-md border p-2 text-sm" :placeholder="label" />
            <input v-else-if="type === 'email'" type="email" :value="modelValue"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
                class="w-full rounded-md border p-2 text-sm" :placeholder="label" />
            <input v-else-if="type === 'url'" type="url" :value="modelValue"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
                class="w-full rounded-md border p-2 text-sm" :placeholder="label" />
            <input v-else-if="type === 'tel'" type="tel" :value="modelValue"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
                class="w-full rounded-md border p-2 text-sm" :placeholder="label" />
        </div>
        <p v-else class="font-medium">{{ modelValue || '-' }}</p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string
    label: string
    type?: 'text' | 'email' | 'url' | 'tel'
    isEditing: boolean
}>()

defineEmits<{
    'update:modelValue': [value: string]
}>()
</script>