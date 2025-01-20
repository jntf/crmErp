import { ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { useToast } from '@/components/ui/toast/use-toast'

export const useCompanySearch = () => {
    const loading = ref(false)
    const { toast } = useToast()
    const config = useRuntimeConfig()

    const searchCompanyBySiret = async (siret: string) => {
        if (!siret) {
            toast({
                title: "Erreur",
                description: "Veuillez entrer un numéro SIRET",
                variant: "destructive"
            })
            return null
        }

        loading.value = true

        try {
            const url = `${config.public.SOCIETE_INFO_API_URL}/${siret}?key=${config.public.SOCIETE_INFO_API_KEY}`
            console.log('URL de recherche:', url)
            const response = await fetch(url)
            const data = await response.json()
            console.log('Données API brutes:', data)
            
            if (data.success && data.result) {
                toast({
                    title: "Succès",
                    description: "Informations de l'entreprise récupérées",
                    variant: "success"
                })

                // Retourner les données brutes directement
                return data
            } else {
                toast({
                    title: "Erreur",
                    description: "Aucune entreprise trouvée avec ce numéro SIRET",
                    variant: "destructive"
                })
                return null
            }
        } catch (error) {
            console.error('Erreur lors de la recherche:', error)
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la recherche",
                variant: "destructive"
            })
            return null
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        searchCompanyBySiret
    }
}