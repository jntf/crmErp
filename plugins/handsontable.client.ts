// plugins/handsontable.client.ts
import { defineNuxtPlugin } from '#app'
import { HotTable } from '@handsontable/vue3'
import { registerAllModules } from 'handsontable/registry'

export default defineNuxtPlugin(async (nuxtApp) => {
    // Attendre que le DOM soit prêt
    await new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve)
        } else {
            resolve(true)
        }
    })

    registerAllModules()
    nuxtApp.vueApp.component('HotTable', HotTable)
})