import { ref } from 'vue'
import { useReferenceStore } from '../stores/useReferenceStore'
import type { Contact, Company, Vehicle } from '../types'

export const useReferenceData = () => {
  const store = useReferenceStore()
  const contacts = ref<Contact[]>([])
  const companies = ref<Company[]>([])
  const vehicles = ref<Vehicle[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchContacts = async () => {
    loading.value = true
    error.value = null
    try {
      await store.fetchContacts()
      contacts.value = store.contacts
    } catch (err) {
      error.value = 'Erreur lors du chargement des contacts'
      console.error('Erreur lors du chargement des contacts:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchCompanies = async () => {
    loading.value = true
    error.value = null
    try {
      await store.fetchCompanies()
      companies.value = store.companies
    } catch (err) {
      error.value = 'Erreur lors du chargement des entreprises'
      console.error('Erreur lors du chargement des entreprises:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchVehicles = async () => {
    loading.value = true
    error.value = null
    try {
      await store.fetchVehicles()
      vehicles.value = store.vehicles
    } catch (err) {
      error.value = 'Erreur lors du chargement des véhicules'
      console.error('Erreur lors du chargement des véhicules:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchAll = async () => {
    loading.value = true
    error.value = null
    try {
      await Promise.all([
        fetchContacts(),
        fetchCompanies(),
        fetchVehicles()
      ])
    } catch (err) {
      error.value = 'Erreur lors du chargement des données de référence'
      console.error('Erreur lors du chargement des données de référence:', err)
    } finally {
      loading.value = false
    }
  }

  const getContactById = (id: number) => {
    return contacts.value.find(contact => contact.id === id)
  }

  const getCompanyById = (id: number) => {
    return companies.value.find(company => company.id === id)
  }

  const getVehicleById = (id: string) => {
    return vehicles.value.find(vehicle => vehicle.id === id)
  }

  return {
    contacts,
    companies,
    vehicles,
    loading,
    error,
    fetchContacts,
    fetchCompanies,
    fetchVehicles,
    fetchAll,
    getContactById,
    getCompanyById,
    getVehicleById
  }
} 