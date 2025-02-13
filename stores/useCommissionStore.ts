import { defineStore } from 'pinia'
import type { 
  CommissionType, 
  CommissionSettings,
  CommissionFormState
} from '@/types/commission'

export const useCommissionStore = defineStore('commission', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // États
  const types = ref<CommissionType[]>([])
  const settings = ref<Record<number, CommissionSettings>>({})
  const isLoading = ref(false)
  const currentOwnerId = ref<number | null>(null)
  const error = ref<string | null>(null)

  // Getters
  const activeTypes = computed(() => 
    types.value.filter(type => type.is_active)
  )

  const getTypeSettings = computed(() => (typeId: number) => {
    console.log('getTypeSettings called for typeId:', typeId)
    console.log('current settings:', settings.value)
    return settings.value[typeId] || {
      is_active: false,
      settings: {
        calculationType: 'fixed_amount',
        percentage: null,
        fixedAmount: 0,
        hasMinAmount: false,
        minAmount: 0,
        hasMaxAmount: false,
        maxAmount: null
      }
    };
  })

  // Actions
  const fetchCurrentOwnerId = async () => {
    console.log('fetchCurrentOwnerId called, user:', user.value)
    if (!user.value) {
      console.warn('No user found, authentication required')
      return null
    }

    try {
      console.log('Fetching owner ID for user:', user.value.id)
      
      // D'abord, essayons de récupérer depuis la table users
      const { data, error: err } = await supabase
        .from('users')
        .select('owner_id, email')
        .eq('id', user.value.id)
        .single()

      console.log('Users table query result:', { data, err })

      if (err) {
        console.error('Error fetching from users table:', err)
        throw err
      }

      if (!data?.owner_id) {
        console.warn('No owner_id found for user:', data?.email)
        error.value = 'Utilisateur non associé à une société'
        return null
      }

      console.log('Owner ID found:', data.owner_id)
      currentOwnerId.value = data.owner_id
      return data.owner_id

    } catch (err) {
      console.error('Error in fetchCurrentOwnerId:', err)
      error.value = 'Impossible de récupérer l\'identifiant de la société'
      return null
    }
  }

  interface OwnerSettingsResponse {
    owner: {
      id: number
      name: string
    }
    is_active: boolean
  }

  interface CommissionTypeResponse extends Omit<CommissionType, 'active_owners'> {
    owner_settings: OwnerSettingsResponse[]
  }

  const fetchCommissionTypes = async () => {
    try {
      isLoading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('commission_types')
        .select(`
          id,
          name,
          code,
          description,
          settings_schema,
          is_active,
          created_at,
          updated_at,
          owner_settings:owner_commission_settings(
            owner:owners(id, name),
            is_active
          )
        `)
        .returns<CommissionTypeResponse[]>()
        .order('name')

      if (err) throw err
      
      // Transformer les données pour inclure active_owners
      types.value = (data || []).map(type => {
        // Parser le settings_schema s'il est en string
        const schema = typeof type.settings_schema === 'string'
          ? JSON.parse(type.settings_schema)
          : type.settings_schema

        return {
          id: type.id,
          name: type.name,
          code: type.code,
          description: type.description,
          settings_schema: {
            percentage: schema?.percentage ?? false,
            fixed_amount: schema?.fixed_amount ?? false,
            min_amount: schema?.min_amount ?? false,
            max_amount: schema?.max_amount ?? false
          },
          is_active: type.is_active,
          created_at: type.created_at,
          updated_at: type.updated_at,
          active_owners: type.owner_settings
            ?.filter(s => s.is_active)
            .map(s => s.owner) || []
        }
      })

      // Charger les paramètres si un owner est défini
      if (currentOwnerId.value) {
        await fetchCommissionSettings()
      }

      return data
    } catch (err) {
      console.error('Error fetching commission types:', err)
      error.value = 'Impossible de charger les types de commissions'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchCommissionSettings = async () => {
    try {
      console.log('fetchCommissionSettings called with currentOwnerId:', currentOwnerId.value)
      if (!currentOwnerId.value) {
        throw new Error('Aucune société sélectionnée')
      }

      const { data, error: err } = await supabase
        .from('owner_commission_settings')
        .select('*')
        .eq('owner_id', currentOwnerId.value)

      if (err) throw err

      console.log('Commission settings fetched from DB:', data)

      // Réinitialiser les paramètres
      settings.value = {}
      
      // Mettre à jour les paramètres en conservant les valeurs exactes de la base de données
      data?.forEach(setting => {
        console.log('Processing setting for commission_type_id:', setting.commission_type_id)
        settings.value[setting.commission_type_id] = {
          id: setting.id,
          owner_id: setting.owner_id,
          commission_type_id: setting.commission_type_id,
          is_active: setting.is_active,
          settings: setting.settings || {
            calculationType: 'fixed_amount',
            percentage: null,
            fixedAmount: 0,
            hasMinAmount: false,
            minAmount: 0,
            hasMaxAmount: false,
            maxAmount: null
          },
          created_at: setting.created_at,
          updated_at: setting.updated_at
        }
      })

      console.log('Updated settings in store:', settings.value)
      return data
    } catch (err) {
      console.error('Error fetching commission settings:', err)
      error.value = 'Impossible de charger les paramètres des commissions'
      throw err
    }
  }

  const updateCommissionSettings = async (
    typeId: number, 
    newSettings: Partial<CommissionFormState>,
    isActive?: boolean
  ) => {
    try {
      if (!currentOwnerId.value) {
        throw new Error('Aucune société sélectionnée')
      }

      const currentSettings = settings.value[typeId]
      const updatedSettings = {
        owner_id: currentOwnerId.value,
        commission_type_id: typeId,
        settings: {
          ...(currentSettings?.settings || {}),
          ...newSettings,
          calculationType: newSettings.calculationType || currentSettings?.settings.calculationType || 'percentage',
          percentage: newSettings.percentage ?? currentSettings?.settings.percentage ?? 0,
          fixedAmount: newSettings.fixedAmount ?? currentSettings?.settings.fixedAmount ?? 0,
          hasMinAmount: newSettings.hasMinAmount ?? currentSettings?.settings.hasMinAmount ?? false,
          minAmount: newSettings.minAmount ?? currentSettings?.settings.minAmount ?? 0,
          hasMaxAmount: newSettings.hasMaxAmount ?? currentSettings?.settings.hasMaxAmount ?? false,
          maxAmount: newSettings.maxAmount ?? currentSettings?.settings.maxAmount ?? 0
        },
        is_active: isActive ?? currentSettings?.is_active ?? false
      }

      const { data, error: err } = await supabase
        .from('owner_commission_settings')
        .upsert(updatedSettings)
        .select()
        .single()

      if (err) throw err

      // Mettre à jour le store local
      if (data) {
        settings.value[typeId] = {
          ...updatedSettings,
          id: data.id,
          created_at: data.created_at,
          updated_at: data.updated_at
        }
      }

      return data
    } catch (err) {
      console.error('Error updating commission settings:', err)
      error.value = 'Impossible de mettre à jour les paramètres de la commission'
      throw err
    }
  }

  const calculateCommission = async (
    typeId: number,
    baseAmount: number,
    customSettings?: Partial<CommissionFormState>
  ) => {
    try {
      const settingsToUse = customSettings || settings.value[typeId]?.settings
      if (!settingsToUse) {
        throw new Error('Paramètres de commission non trouvés')
      }

      const { data, error: err } = await supabase
        .rpc('calculate_commission', {
          p_data: {
            base_amount: baseAmount,
            settings: settingsToUse
          }
        })

      if (err) throw err
      return data
    } catch (err) {
      console.error('Error calculating commission:', err)
      error.value = 'Impossible de calculer la commission'
      throw err
    }
  }

  const deleteCommissionType = async (typeId: number, force: boolean = false) => {
    try {
      const { data, error: err } = await supabase
        .rpc('delete_commission_type', {
          p_data: {
            commission_type_id: typeId,
            force
          }
        })

      if (err) throw err

      if (!data.success) {
        error.value = data.error
        return data
      }

      // Mettre à jour le store local
      types.value = types.value.filter(t => t.id !== typeId)
      delete settings.value[typeId]

      return data
    } catch (err) {
      console.error('Error deleting commission type:', err)
      error.value = 'Impossible de supprimer le type de commission'
      throw err
    }
  }

  // Initialisation
  const initialize = async () => {
    console.log('Store initialization started')
    await fetchCurrentOwnerId()
    console.log('Current owner ID fetched:', currentOwnerId.value)
    
    if (currentOwnerId.value) {
      try {
        await fetchCommissionTypes()
        console.log('Commission types fetched:', types.value)
      } catch (error) {
        console.error('Error fetching commission types:', error)
      }

      try {
        await fetchCommissionSettings()
        console.log('Commission settings fetched')
      } catch (error) {
        console.error('Error fetching commission settings:', error)
      }
    } else {
      console.warn('No owner ID found, skipping data fetch')
    }
  }

  return {
    // États
    types,
    settings,
    isLoading,
    currentOwnerId,
    error,

    // Getters
    activeTypes,
    getTypeSettings,

    // Actions
    initialize,
    fetchCurrentOwnerId,
    fetchCommissionTypes,
    fetchCommissionSettings,
    updateCommissionSettings,
    calculateCommission,
    deleteCommissionType
  }
}) 