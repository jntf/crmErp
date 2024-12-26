// modules/webStock/module.ts
import { defineNuxtModule, createResolver, addServerHandler } from '@nuxt/kit'

export default defineNuxtModule({
    meta: {
        name: 'webstock',
        configKey: 'webstock'
    },

    setup(options, nuxt) {
        const { resolve } = createResolver(import.meta.url)

        // Ajout de la route API
        addServerHandler({
            route: '/api/webstock/mcautomobiles',
            handler: resolve('./connectors/mcautomobiles/server/api.ts')
        })

        // Configuration des routes
        nuxt.hook('pages:extend', (pages) => {
            pages.push({
                name: 'webstock',
                path: '/erp/webstock',
                file: resolve('./pages/vehicles.vue')
            })
        })

        // Debug
        nuxt.hook('pages:extend', (pages) => {
            console.log('Routes WebStock configurées:', 
                pages.filter(page => page.path.includes('webstock'))
            )
        })
    }
})