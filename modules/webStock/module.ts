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
            pages.push(
                {
                    name: 'webstock',
                    path: '/erp/webstock',
                    file: resolve('./pages/vehicles.vue')
                },
                {
                    name: 'webstock-publish',
                    path: '/erp/webstock/publish',
                    file: resolve('./pages/publish.vue')
                },
                {
                    name: 'webstock-edit',
                    path: '/erp/webstock/edit/:source/:id',
                    file: resolve('./pages/[source]/[id].vue')
                }
            )
        })
    }
})