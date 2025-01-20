//components/ui/dialog/ConfirmDialog.vue
<template>
    <Teleport to="body">
        <Transition enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0">
            <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto" @click="handleBackdropClick">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black bg-opacity-25 transition-opacity" />

                <!-- Dialog -->
                <div class="flex min-h-full items-center justify-center p-4">
                    <div class="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
                        @click.stop>
                        <!-- Header -->
                        <div class="mb-4">
                            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                                {{ title }}
                            </h3>
                            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {{ message }}
                            </p>
                        </div>

                        <!-- Actions -->
                        <div class="mt-4 flex justify-end gap-3">
                            <Button variant="outline" size="sm" @click="handleCancel">
                                {{ cancelText }}
                            </Button>
                            <Button variant="destructive" size="sm" @click="handleConfirm">
                                <slot name="confirm-icon"></slot>
                                {{ confirmText }}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'

const props = defineProps<{
    modelValue: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    closeOnBackdrop?: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'confirm': []
    'cancel': []
}>()

const handleConfirm = () => {
    emit('confirm')
    emit('update:modelValue', false)
}

const handleCancel = () => {
    emit('cancel')
    emit('update:modelValue', false)
}

const handleBackdropClick = () => {
    if (props.closeOnBackdrop) {
        handleCancel()
    }
}
</script>