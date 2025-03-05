import { defineNuxtModule, createResolver, addServerHandler } from '@nuxt/kit'

/**
 * Module Nuxt pour la gestion des commandes
 * 
 * Ce module configure les routes, composants et imports pour le module Orders.
 * Il s'intègre dans l'application Nuxt et expose les fonctionnalités de gestion
 * des commandes et commissions.
 */
export default defineNuxtModule({
  meta: {
    name: 'orders',
    configKey: 'orders'
  },

  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // Configuration des routes
    nuxt.hook('pages:extend', (pages) => {
      pages.push(
        {
          name: 'orders',
          path: '/orders',
          file: resolve('./pages/index.vue')
        },
        {
          name: 'orders-commissions',
          path: '/orders/commissions',
          file: resolve('./pages/commissions/index.vue')
        },
        {
          name: 'orders-new',
          path: '/orders/new',
          file: resolve('./pages/[id]/create.vue')
        },
        {
          name: 'orders-create',
          path: '/orders/:id/create',
          file: resolve('./pages/[id]/create.vue')
        },
        {
          name: 'orders-view',
          path: '/orders/:id',
          file: resolve('./pages/[id].vue')
        },
        {
          name: 'orders-edit',
          path: '/orders/:id/edit',
          file: resolve('./pages/[id]/edit.vue')
        }
      )
    })

    // Ajout des composants
    nuxt.hook('components:dirs', (dirs) => {
      dirs.push({
        path: resolve('./components'),
        prefix: 'Order'
      })
    })

    // Ajout des composables et stores
    nuxt.hook('imports:dirs', (dirs) => {
      dirs.push(resolve('./composables'))
      dirs.push(resolve('./stores'))
    })
  }
}) 