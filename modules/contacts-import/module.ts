import { defineNuxtModule, createResolver } from '@nuxt/kit'

/**
 * Module pour la gestion des contacts importés
 * 
 * Ce module permet de gérer les contacts importés depuis des sources externes
 * et d'afficher les notifications associées.
 */
export default defineNuxtModule({
  meta: {
    name: 'contacts-import',
    configKey: 'contactsImport'
  },

  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // Configuration des routes
    nuxt.hook('pages:extend', (pages) => {
      pages.push(
        {
          name: 'contacts-import',
          path: '/contacts/import',
          file: resolve('./pages/index.vue')
        },
        {
          name: 'contacts-import-view',
          path: '/contacts/import/:id',
          file: resolve('./pages/[id].vue')
        }
      )
    })

    // Ajout des composants
    nuxt.hook('components:dirs', (dirs) => {
      dirs.push({
        path: resolve('./components'),
        prefix: 'ContactsImport'
      })
    })

    // Ajout des composables et stores
    nuxt.hook('imports:dirs', (dirs) => {
      dirs.push(resolve('./composables'))
      dirs.push(resolve('./stores'))
    })
  }
}) 