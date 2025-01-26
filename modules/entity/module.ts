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
                // Routes des entreprises
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
                },
                // Routes des contacts
                {
                    name: 'entity-contacts',
                    path: '/entity/contacts',
                    file: resolve('./pages/contacts/index.vue')
                },
                {
                    name: 'entity-contact-create',
                    path: '/entity/contact/create',
                    file: resolve('./pages/contacts/create.vue')
                },
                {
                    name: 'entity-contact-view',
                    path: '/entity/contact/:id',
                    file: resolve('./pages/contacts/[id].vue')
                }
            )
        })
    }
})