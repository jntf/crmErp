// composables/useColors.ts
import { ref, onMounted } from 'vue'

interface Color {
  id: number
  name: string
  hex_code: string
  background_class: string
  text_class: string
}

interface ColorVariant {
  id: number
  color_id: number
  variant_name: string
}

interface CacheData {
  colors: Color[]
  colorVariants: ColorVariant[]
  timestamp: number
}

const CACHE_KEY = 'vehicle_colors_cache'
const CACHE_DURATION = 1000 * 60 * 60 * 24 // 24 heures

export function useColors() {
  const supabase = useSupabaseClient()
  const colors = ref<Color[]>([])
  const colorVariants = ref<ColorVariant[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetch = ref<number>(0)

  // Fonctions de gestion du cache
  function saveToCache(data: CacheData) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch (err) {
      console.warn('Erreur lors de la sauvegarde du cache:', err)
    }
  }

  function loadFromCache(): CacheData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const data = JSON.parse(cached) as CacheData
      
      // Vérifier si le cache est expiré
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY)
        return null
      }

      return data
    } catch (err) {
      console.warn('Erreur lors de la lecture du cache:', err)
      return null
    }
  }

  // Fonction pour forcer le rafraîchissement du cache
  async function refreshCache() {
    loading.value = true
    error.value = null

    try {
      // Récupérer les couleurs
      const { data: colorsData, error: colorsError } = await supabase
        .from('colors')
        .select('*')
      if (colorsError) throw colorsError

      // Récupérer les variantes
      const { data: variantsData, error: variantsError } = await supabase
        .from('color_variants')
        .select('*')
      if (variantsError) throw variantsError

      colors.value = colorsData
      colorVariants.value = variantsData
      lastFetch.value = Date.now()

      // Mettre à jour le cache
      saveToCache({
        colors: colorsData,
        colorVariants: variantsData,
        timestamp: Date.now()
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la récupération des couleurs'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fonction principale pour obtenir les couleurs
  async function fetchColors(forceRefresh = false) {
    if (loading.value) return

    try {
      // Vérifier le cache si on ne force pas le rafraîchissement
      if (!forceRefresh) {
        const cached = loadFromCache()
        if (cached) {
          colors.value = cached.colors
          colorVariants.value = cached.colorVariants
          lastFetch.value = cached.timestamp
          return
        }
      }

      await refreshCache()
    } catch (err) {
      console.error('Erreur lors du chargement des couleurs:', err)
      // En cas d'erreur, essayer de charger depuis le cache même si forceRefresh était true
      const cached = loadFromCache()
      if (cached) {
        colors.value = cached.colors
        colorVariants.value = cached.colorVariants
        lastFetch.value = cached.timestamp
      }
    }
  }

  // Trouver les classes de style pour une couleur donnée
  function findColorClasses(colorName: string): { background: string; text: string } {
    // Si pas de couleurs chargées, retourner des valeurs par défaut
    if (!colors.value.length || !colorVariants.value.length) {
      return { background: 'bg-gray-100', text: 'text-gray-800' }
    }

    const normalizedColor = colorName.toLowerCase().trim()
    
    // Trouver la variante correspondante
    const variant = colorVariants.value.find(v => 
      normalizedColor.includes(v.variant_name.toLowerCase())
    )
    console.log("Variente de la couleur", variant)   
    
    if (!variant) return { background: 'bg-gray-100', text: 'text-gray-800' }
    
    // Trouver la couleur correspondante
    const color = colors.value.find(c => c.id === variant.color_id)
    console.log("Couleur correspondante", color)
    if (!color) return { background: 'bg-gray-100', text: 'text-gray-800' }
    
    return {
      background: color.background_class,
      text: color.text_class
    }
  }

  // Charger les données au montage du composant
  onMounted(async () => {
    await fetchColors()
  })

  return {
    colors: readonly(colors),
    colorVariants: readonly(colorVariants),
    loading: readonly(loading),
    error: readonly(error),
    lastFetch: readonly(lastFetch),
    fetchColors,
    refreshCache,
    findColorClasses
  }
}