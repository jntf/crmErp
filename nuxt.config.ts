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
    './modules/webStock'
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
  compatibilityDate: '2024-12-24'
})