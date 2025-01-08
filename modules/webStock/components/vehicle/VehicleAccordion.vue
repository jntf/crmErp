<template>
    <Accordion type="single" :value="modelValue" class="w-full"
        @update:value="(value: string) => $emit('update:modelValue', value)" collapsible>
        <AccordionItem v-for="section in sections" :key="section.id" :value="section.id" class="border-b">
            <AccordionTrigger class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <component :is="section.icon" v-if="section.icon" class="h-4 w-4" />
                    {{ section.title }}
                </div>
                <Badge v-if="section.badge" variant="outline" class="ml-2 pointer-events-none">
                    {{ section.badge }}
                </Badge>
            </AccordionTrigger>
            <AccordionContent>
                <div class="pt-4">
                    <slot :name="section.id" v-bind="{ section }">
                        <div class="p-4 text-muted-foreground">
                            Contenu non défini pour la section {{ section.title }}
                        </div>
                    </slot>
                </div>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
</template>

<script setup lang="ts">
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import type { AccordionSection } from '../../composables/useVehicleAccordion'

// Props
interface Props {
    modelValue: string
    sections: AccordionSection[]
}

const props = defineProps<Props>()

defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()
</script>