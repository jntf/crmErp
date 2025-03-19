export default defineNuxtConfig({
  ssr: true,
  build: {
    transpile: ['xlsx']
  },
  css: [
    'handsontable/dist/handsontable.full.min.css',
    'handsontable/styles/ht-theme-main.min.css'
  ],
  vite: {
    optimizeDeps: {
      include: ['@handsontable/vue3', 'handsontable', 'xlsx'],
      exclude: []
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }
  },
  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    './modules/webStock',
    './modules/entity',
    './modules/stock',
    './modules/orders',
    './modules/contacts-import'
  ],
  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },
  supabase: {
    redirect: false
  },
  nitro: {
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  },
  runtimeConfig: {
    public: {
      SOCIETE_INFO_API_KEY: process.env.PUBLIC_SOCIETE_INFO_API_KEY,
      SOCIETE_INFO_API_URL: process.env.PUBLIC_SOCIETE_INFO_API_URL,
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY
    }
  },
  compatibilityDate: '2024-12-24',
  components: {
    dirs: [
      '~/components',
      {
        path: '~/modules',
        pattern: '**/composants/pdf/*.vue',
        global: true,
        prefix: 'Pdf'
      }
    ]
  }
})