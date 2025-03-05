import { ref, computed } from 'vue'
import { waitForPdfMake } from '../utils/helpers'

/**
 * Hook composable pour la gestion de pdfMake dans l'application
 */
export function usePdfMake() {
  const isLoading = ref(false)
  const isReady = ref(false)
  const error = ref<Error | null>(null)
  const pdfMakeInstance = ref<any>(null)

  // Statut global
  const status = computed(() => {
    if (error.value) return 'error'
    if (isReady.value) return 'ready'
    if (isLoading.value) return 'loading'
    return 'idle'
  })

  /**
   * Charger pdfMake et le rendre disponible
   */
  const loadPdfMake = async () => {
    // Ne pas recharger si déjà prêt
    if (isReady.value && pdfMakeInstance.value) {
      return pdfMakeInstance.value
    }

    isLoading.value = true
    error.value = null

    try {
      const instance = await waitForPdfMake()
      pdfMakeInstance.value = instance
      isReady.value = true
      return instance
    } catch (err) {
      console.error('Erreur lors du chargement de pdfMake:', err)
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Générer un PDF à partir d'une définition de document
   */
  const generatePdf = async (docDefinition: any): Promise<Uint8Array> => {
    const pdfMake = await loadPdfMake()

    return new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition).getBuffer((buffer: Uint8Array) => {
          resolve(buffer)
        })
      } catch (err) {
        console.error('Erreur lors de la génération du PDF:', err)
        reject(err)
      }
    })
  }

  /**
   * Télécharger un PDF basé sur la définition fournie
   */
  const downloadPdf = async (docDefinition: any, filename: string = 'document.pdf'): Promise<void> => {
    const pdfMake = await loadPdfMake()
    pdfMake.createPdf(docDefinition).download(filename)
  }

  /**
   * Ouvrir un PDF basé sur la définition fournie dans un nouvel onglet
   */
  const openPdf = async (docDefinition: any): Promise<void> => {
    const pdfMake = await loadPdfMake()
    pdfMake.createPdf(docDefinition).open()
  }

  /**
   * Prévisualiser un PDF et retourner l'URL du blob
   */
  const previewPdf = async (docDefinition: any): Promise<string> => {
    const pdfMake = await loadPdfMake()
    
    return new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
          const url = URL.createObjectURL(blob)
          resolve(url)
        })
      } catch (err) {
        console.error('Erreur lors de la prévisualisation du PDF:', err)
        reject(err)
      }
    })
  }

  return {
    isLoading,
    isReady,
    error,
    status,
    loadPdfMake,
    generatePdf,
    downloadPdf,
    openPdf,
    previewPdf
  }
}