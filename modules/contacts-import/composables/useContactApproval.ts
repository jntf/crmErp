import { ref, computed, reactive } from 'vue'
import { useToast } from '@/components/ui/toast'
import { useContacts } from '~/modules/entity/composables/useContacts'
import { useCompanies } from '~/modules/entity/composables/useCompanies'
import type { ContactStaging } from '../types'
import type { SimilarCompany, SimilarContact, ApprovalResult } from '../types/approval.types'

export const useContactApproval = () => {
  const { toast } = useToast()
  const supabase = useSupabaseClient()
  
  // Importer les composables entity
  const { createContact } = useContacts()
  const { createCompany } = useCompanies()
  
  // État
  const loading = ref(false)
  const stagingContact = ref<ContactStaging | null>(null)
  const similarCompanies = ref<SimilarCompany[]>([])
  const similarContacts = ref<SimilarContact[]>([])
  const selectedCompany = ref<string | null>(null)
  const selectedContact = ref<string | null>(null)
  const showConfirmationDialog = ref(false)
  
  // Données des formulaires
  const companyFormData = ref({})
  const contactFormData = ref({})

  // Récupérer l'utilisateur actuel
  const user = useSupabaseUser();
  
  // États pour le dialogue d'approbation
  const approvalDialogState = reactive({
    contactId: '',
    open: false,
    loading: false
  });
  
  // Fonction utilitaire pour journaliser les paramètres RPC
  const logRPCParameters = (functionName: string, parameters: any) => {
    console.log(`Appel de la fonction RPC ${functionName} avec paramètres:`, JSON.stringify(parameters, null, 2))
  }
  
  /**
   * Charge les informations d'un contact en attente
   */
  const loadStagingContact = async (contactId: string): Promise<boolean> => {
    loading.value = true
    
    try {
      const { data, error } = await supabase
        .from('contacts_staging')
        .select('*')
        .eq('id', contactId)
        .eq('status', 'pending')
        .single()
      
      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les informations du contact',
          variant: 'destructive'
        })
        return false
      }
      
      stagingContact.value = data as ContactStaging
      return true
    } catch (error) {
      console.error('Erreur lors du chargement du contact:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement du contact',
        variant: 'destructive'
      })
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Recherche des entreprises similaires
   */
  const findSimilarCompanies = async (companyName: string): Promise<boolean> => {
    if (!companyName) {
      similarCompanies.value = []
      return true
    }
    
    loading.value = true
    
    try {
      // Préparer les paramètres
      const params = {
        company_name: companyName,
        similarity_threshold: 0.4
      }
      
      // Journaliser les paramètres
      logRPCParameters('find_similar_companies', params)
      
      // Appeler la fonction RPC
      const { data, error } = await supabase.rpc('find_similar_companies', params)
      
      if (error) {
        console.error('Erreur find_similar_companies:', error)
        toast({
          title: 'Erreur',
          description: 'Impossible de rechercher des entreprises similaires',
          variant: 'destructive'
        })
        return false
      }
      
      // Convertir les IDs numériques en chaînes
      similarCompanies.value = (data as any[]).map(item => ({
        ...item,
        id: String(item.id) // Convertir en chaîne
      })) as SimilarCompany[]
      
      // Si des entreprises similaires ont été trouvées, on sélectionne celle avec la plus grande similarité par défaut
      if (similarCompanies.value.length > 0) {
        // Trouver l'entreprise avec la plus grande similarité
        const bestMatch = similarCompanies.value.reduce((prev, current) => 
          prev.similarity > current.similarity ? prev : current
        )
        
        // Si la similarité est très élevée (> 0.8), on la sélectionne automatiquement
        if (bestMatch.similarity > 0.8) {
          selectedCompany.value = bestMatch.id
        } else {
          selectedCompany.value = 'new' // Par défaut, on crée une nouvelle entreprise
        }
      } else {
        selectedCompany.value = 'new'
      }
      
      return true
    } catch (error) {
      console.error('Erreur lors de la recherche d\'entreprises similaires:', error)
      similarCompanies.value = []
      selectedCompany.value = 'new'
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Recherche des contacts similaires
   */
  const findSimilarContacts = async (email: string, firstName: string, lastName: string): Promise<boolean> => {
    loading.value = true
    
    try {
      // Préparer les paramètres
      const params = {
        contact_email: email || '',
        contact_first_name: firstName || '',
        contact_last_name: lastName || '',
        similarity_threshold: 0.4
      }
      
      // Journaliser les paramètres
      logRPCParameters('find_similar_contacts', params)
      
      // Appeler la fonction RPC
      const { data, error } = await supabase.rpc('find_similar_contacts', params)
      
      if (error) {
        console.error('Erreur find_similar_contacts:', error)
        toast({
          title: 'Erreur',
          description: 'Impossible de rechercher des contacts similaires',
          variant: 'destructive'
        })
        return false
      }
      
      // Convertir les IDs numériques en chaînes
      similarContacts.value = (data as any[]).map(item => ({
        ...item,
        id: String(item.id) // Convertir en chaîne
      })) as SimilarContact[]
      
      // Si des contacts similaires ont été trouvés, on sélectionne celui avec la plus grande similarité
      if (similarContacts.value.length > 0) {
        // Trouver le contact avec la plus grande similarité
        const bestMatch = similarContacts.value.reduce((prev, current) => 
          prev.similarity > current.similarity ? prev : current
        )
        
        // Si la similarité est très élevée (> 0.8), on le sélectionne automatiquement
        if (bestMatch.similarity > 0.8) {
          selectedContact.value = bestMatch.id
        } else {
          selectedContact.value = 'new' // Par défaut, on crée un nouveau contact
        }
      } else {
        selectedContact.value = 'new'
      }
      
      return true
    } catch (error) {
      console.error('Erreur lors de la recherche de contacts similaires:', error)
      similarContacts.value = []
      selectedContact.value = 'new'
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Ouvre le dialogue d'approbation pour un contact
   */
  const startApproval = (contactId: string) => {
    approvalDialogState.contactId = contactId
    initApproval(contactId).then((result) => {
      if (!result) {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'initialiser le processus d\'approbation',
          variant: 'destructive'
        })
      } else {
        // Le dialogue s'ouvrira seulement s'il y a des similarités
        // La propriété showConfirmationDialog est mise à jour dans initApproval
      }
    })
  }
  
  /**
   * Initialise le processus d'approbation
   */
  const initApproval = async (contactId: string): Promise<boolean> => {
    resetState()
    console.log("Initialisation de l'approbation pour le contact:", contactId);
    
    // Charger les informations du contact
    const contactLoaded = await loadStagingContact(contactId)
    console.log("Contact chargé:", contactLoaded, stagingContact.value);
    if (!contactLoaded || !stagingContact.value) return false
    
    // Rechercher des entreprises similaires
    let companiesResult = true;
    if (stagingContact.value.company) {
      companiesResult = await findSimilarCompanies(stagingContact.value.company)
      console.log("Entreprises similaires trouvées:", similarCompanies.value.length);
    }
    
    // Rechercher des contacts similaires
    const contactsResult = await findSimilarContacts(
      stagingContact.value.email || '',
      stagingContact.value.first_name || '',
      stagingContact.value.last_name || ''
    )
    console.log("Contacts similaires trouvés:", similarContacts.value.length);
    
    // Définir si le dialogue de confirmation doit être affiché, mais ne pas l'ouvrir automatiquement
    const hasSimilarities = similarCompanies.value.length > 0 || similarContacts.value.length > 0;
    showConfirmationDialog.value = hasSimilarities;
    
    console.log("showConfirmationDialog:", showConfirmationDialog.value);
    
    // Si aucune correspondance n'est trouvée, informer l'utilisateur
    if (!hasSimilarities) {
      // Ne pas déclencher automatiquement la création, attendre l'action de l'utilisateur
      showConfirmationDialog.value = true; // On affiche quand même le dialogue pour permettre la saisie complète
    }
    
    return companiesResult && contactsResult;
  }
  
  /**
   * Finalise l'approbation du contact
   */
  const finalizeApproval = async (): Promise<ApprovalResult> => {
    if (!stagingContact.value) {
      return {
        success: false,
        message: 'Aucun contact à approuver'
      }
    }
    
    loading.value = true;
    approvalDialogState.loading = true;
    console.log('Début de la finalisation de l\'approbation');
    
    try {
      let companyId = null;
      let contactId = null;
      
      // 1. Gérer l'entreprise (créer une nouvelle ou utiliser une existante)
      if (stagingContact.value.company) {
        if (selectedCompany.value === 'new') {
          console.log('Création d\'une nouvelle entreprise:', stagingContact.value.company);
          try {
            // Utiliser les données du formulaire si disponibles
            const companyData = Object.keys(companyFormData.value).length > 0 
              ? {
                  name: stagingContact.value.company,
                  status: 'active',
                  domain: '',
                  industry: '',
                  email: '',
                  phone: '',
                  website: '',
                  is_supplier: false,
                  is_customer: true,
                  number_of_employees: 0,
                  social_capital: 0,
                  revenue: 0,
                  fleet_size: 0,
                  tax_number: '',
                  vat_number: '',
                  description: '',
                  created_by: user.value?.email || 'system',
                  updated_by: user.value?.email || 'system',
                  ...companyFormData.value
                }
              : {
                  name: stagingContact.value.company,
                  status: 'active',
                  domain: '',
                  industry: '',
                  email: '',
                  phone: '',
                  website: '',
                  is_supplier: false,
                  is_customer: true,
                  number_of_employees: 0,
                  social_capital: 0,
                  revenue: 0,
                  fleet_size: 0,
                  tax_number: '',
                  vat_number: '',
                  description: '',
                  created_by: user.value?.email || 'system',
                  updated_by: user.value?.email || 'system'
                };
                
            // Créer une nouvelle entreprise
            const newCompany = await createCompany(companyData);
            
            console.log('Nouvelle entreprise créée:', newCompany);
            companyId = newCompany.company.id;
          } catch (error) {
            console.error('Erreur lors de la création de l\'entreprise:', error);
            throw error;
          }
        } else if (selectedCompany.value) {
          // Utiliser une entreprise existante
          companyId = selectedCompany.value;
          console.log('Utilisation d\'une entreprise existante:', companyId);
        }
      }
      
      // 2. Gérer le contact (créer un nouveau ou utiliser un existant)
      if (selectedContact.value === 'new') {
        console.log('Création d\'un nouveau contact');
        try {
          // Utiliser les données du formulaire si disponibles
          const contactData = Object.keys(contactFormData.value).length > 0 
            ? { 
                first_name: stagingContact.value.first_name || '',
                last_name: stagingContact.value.last_name || '',
                email: stagingContact.value.email || '',
                phone: stagingContact.value.phone || '',
                job_title: stagingContact.value.job_title || '',
                status: 'active',
                ...contactFormData.value,
                company_id: companyId ? Number(companyId) : undefined 
              }
            : {
                first_name: stagingContact.value.first_name || '',
                last_name: stagingContact.value.last_name || '',
                email: stagingContact.value.email || '',
                phone: stagingContact.value.phone || '',
                job_title: stagingContact.value.job_title || '',
                status: 'active',
                company_id: companyId ? Number(companyId) : undefined
              };
          
          // Créer un nouveau contact
          const newContact = await createContact(contactData);
          
          console.log('Nouveau contact créé:', newContact);
          contactId = newContact.id;
        } catch (error) {
          console.error('Erreur lors de la création du contact:', error);
          throw error;
        }
      } else if (selectedContact.value) {
        // Utiliser un contact existant
        contactId = selectedContact.value;
        console.log('Utilisation d\'un contact existant:', contactId);
      }
      
      // 3. Mettre à jour le statut dans la table contacts_staging
      const updateData = {
        status: 'approved',
        approved_at: new Date().toISOString(),
        contact_id: contactId
        // Ne pas inclure company_id car la colonne n'existe pas dans la table
      };
      
      // Ajouter des logs pour le débogage
      console.log('Mise à jour du contact staging avec les données:', updateData);
      
      const { error: updateError } = await supabase
        .from('contacts_staging')
        .update(updateData)
        .eq('id', stagingContact.value.id);
      
      if (updateError) {
        console.error('Erreur lors de la mise à jour du statut:', updateError);
        throw updateError;
      } else {
        console.log('Mise à jour réussie du contact staging');
      }
      
      // 4. Renvoyer le résultat
      return {
        success: true,
        message: 'Contact approuvé et créé avec succès',
        contact_id: contactId,
        company_id: companyId
      };
      
    } catch (error: any) {
      console.error('Erreur lors de la finalisation de l\'approbation:', error);
      return {
        success: false,
        message: `Une erreur est survenue: ${error.message || 'Erreur inconnue'}`
      };
    } finally {
      loading.value = false;
      approvalDialogState.loading = false;
      showConfirmationDialog.value = false;
      approvalDialogState.open = false;
    }
  }
  
  /**
   * Réinitialise l'état
   */
  const resetState = () => {
    stagingContact.value = null
    similarCompanies.value = []
    similarContacts.value = []
    selectedCompany.value = null
    selectedContact.value = null
    showConfirmationDialog.value = false
    approvalDialogState.open = false
    companyFormData.value = {}
    contactFormData.value = {}
  }
  
  /**
   * Annule l'approbation
   */
  const cancelApproval = () => {
    resetState()
  }
  
  return {
    // État
    loading,
    stagingContact,
    similarCompanies,
    similarContacts,
    selectedCompany,
    selectedContact,
    showConfirmationDialog,
    approvalDialogState,
    companyFormData,
    contactFormData,
    
    // Méthodes
    loadStagingContact,
    findSimilarCompanies,
    findSimilarContacts,
    startApproval,
    initApproval,
    finalizeApproval,
    resetState,
    cancelApproval
  }
} 