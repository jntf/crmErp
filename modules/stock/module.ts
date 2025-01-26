import { defineNuxtModule, createResolver, addServerHandler } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'stock',
    configKey: 'stock'
  },

  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // Configuration des routes
    nuxt.hook('pages:extend', (pages) => {
      pages.push(
        {
          name: 'stock',
          path: '/stock',
          file: resolve('./pages/index.vue')
        }
      )
    })

    // Ajout des composants
    nuxt.hook('components:dirs', (dirs) => {
      dirs.push({
        path: resolve('./components'),
        prefix: 'Stock'
      })
    })

    // Ajout des composables et stores
    nuxt.hook('imports:dirs', (dirs) => {
      dirs.push(resolve('./composables'))
      dirs.push(resolve('./stores'))
    })
  }
}) 