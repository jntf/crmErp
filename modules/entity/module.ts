import { defineNuxtModule, createResolver, addServerHandler } from '@nuxt/kit'

export default defineNuxtModule({
    meta: {
        name: 'entity',
        configKey: 'entity'
    },

    setup(options, nuxt) {
        const { resolve } = createResolver(import.meta.url)

        // Configuration des routes
        nuxt.hook('pages:extend', (pages) => {
            pages.push(
                {
                    name: 'entity-companies',
                    path: '/entity/companies',
                    file: resolve('./pages/companies/index.vue')
                },
                {
                    name: 'entity-company-create',
                    path: '/entity/company/create',
                    file: resolve('./pages/companies/create.vue')
                },
                {
                    name: 'entity-company-view',
                    path: '/entity/company/:id',
                    file: resolve('./pages/companies/[id].vue')
                }
            )
        })

        // Debug
        nuxt.hook('pages:extend', (pages) => {
            console.log('Routes WebStock configurées:',
                pages.filter(page => page.path.includes('webstock'))
            )
        })
    }
})