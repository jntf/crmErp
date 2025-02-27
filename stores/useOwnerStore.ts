import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOwnerStore = defineStore('owner', () => {
  // Etat réactif indiquant le chargement des données
  const estEnChargement = ref(false)
  // Stockage des données récupérées
  const donneesOwner = ref<any>(null)
  // Stockage de l'ID de l'owner
  const idOwnerActuel = ref<number | null>(null)
  const erreur = ref<string | null>(null)
  const commissionSettings = ref<any>(null)

  // Récupération de supabase via le composable (attention à ne pas importer depuis '#supabase/client')
  const supabase = useSupabaseClient()

  // Action pour charger les données owner via la fonction stockée get_owner_data
  async function chargerDonneesOwner() {
    console.log('Début du chargement des données owner...')
    try {
      estEnChargement.value = true
      erreur.value = null
      
      const { data, error } = await supabase.rpc('get_owner_data')
      
      if (error) throw error
      
      if (!data) {
        throw new Error('Aucune donnée reçue')
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors du chargement des données owner')
      }

      donneesOwner.value = data
      idOwnerActuel.value = data.owner?.id || null

      console.log('Données owner chargées:', donneesOwner.value)
      
      // Charger les settings de commission si on a un owner ID
      if (idOwnerActuel.value) {
        await chargerCommissionSettings()
      }

    } catch (error: any) {
      console.error("Erreur lors du chargement des données owner:", error)
      erreur.value = error.message
      donneesOwner.value = null
      idOwnerActuel.value = null
      commissionSettings.value = null
    } finally {
      estEnChargement.value = false
    }
  }

  async function chargerCommissionSettings() {
    console.log('Chargement des settings de commission...')
    try {
      if (!idOwnerActuel.value) {
        throw new Error('Aucun owner ID disponible')
      }

      const { data, error } = await supabase
        .from('owner_commission_settings')
        .select(`
          *,
          commission_type:commission_types(
            id,
            name,
            code,
            description
          )
        `)
        .eq('owner_id', idOwnerActuel.value)
        .eq('is_active', true)

      if (error) throw error

      commissionSettings.value = data
      console.log('Settings de commission chargés:', commissionSettings.value)
    } catch (error: any) {
      console.error("Erreur lors du chargement des settings de commission:", error)
      commissionSettings.value = null
      erreur.value = error.message
    }
  }

  return {
    estEnChargement,
    donneesOwner,
    idOwnerActuel,
    erreur,
    commissionSettings,
    chargerDonneesOwner,
    chargerCommissionSettings
  }
}) 