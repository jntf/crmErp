/**
 * Composable pour gérer les opérations liées aux commandes
 * 
 * Ce composable fournit des fonctions utilitaires pour :
 * - Télécharger le PDF d'une commande
 * - Annuler une commande
 * - Valider une commande
 * - Marquer une commande comme payée
 */

import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { exportToPdf } from '~/utils/pdf'
import type { PdfExportData } from '~/utils/pdf'

export function useOrderOperations() {
  const { toast } = useToast()
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Télécharge le PDF d'une commande
   * @param orderId ID de la commande
   */
  const downloadOrderPdf = async (orderId: number) => {
    loading.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()
      const store = useOrderDetailStore()
      
      // Vérifier que la commande existe
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('order_number')
        .eq('id', orderId)
        .single()
      
      if (orderError) throw orderError

      // Charger les données complètes de la commande
      await store.fetchOrderById(orderId)
      
      if (!store.order) {
        throw new Error('Impossible de charger les données de la commande')
      }

      // Préparer les données pour le PDF
      const pdfData: PdfExportData = {
        template: 'order',
        data: {
          order: store.order,
          formattedBuyerAddress: store.formattedBuyerAddress,
          formattedSellerAddress: store.formattedSellerAddress,
          orderNumber: order.order_number,
          orderDate: store.order?.orderDate,
          totalHt: store.order?.totalHt,
          totalTtc: store.order?.totalTtc,
          items: store.order?.items || []
        },
        options: {
          title: `Bon de commande ${order.order_number}`,
          orientation: 'portrait',
          showDate: true,
          dateFormat: 'DD/MM/YYYY'
        }
      }
      
      console.log('📄 Données PDF préparées:', JSON.stringify(pdfData.template))
      
      // Générer et télécharger le PDF
      const success = await exportToPdf(pdfData)
      
      if (success) {
        toast({
          title: 'Téléchargement en cours',
          description: `Le PDF de la commande ${order.order_number} est en cours de téléchargement.`,
          variant: 'default'
        })
      } else {
        throw new Error('Erreur lors de la génération du PDF')
      }
      
      return true
    } catch (err) {
      console.error('Erreur lors du téléchargement du PDF:', err)
      error.value = (err as Error).message
      
      toast({
        title: 'Erreur',
        description: `Impossible de télécharger le PDF: ${error.value}`,
        variant: 'destructive'
      })
      
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Annule une commande
   * @param orderId ID de la commande
   */
  const cancelOrder = async (orderId: number) => {
    loading.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()
      
      // Vérifier que la commande existe
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('orderNumber, status')
        .eq('id', orderId)
        .single()
      
      if (orderError) throw orderError
      
      // Vérifier que la commande n'est pas déjà annulée
      if (order.status === 'CANCELLED') {
        throw new Error('Cette commande est déjà annulée')
      }
      
      // Mettre à jour le statut de la commande
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'CANCELLED' })
        .eq('id', orderId)
      
      if (updateError) throw updateError
      
      toast({
        title: 'Commande annulée',
        description: `La commande ${order.orderNumber} a été annulée avec succès.`,
        variant: 'default'
      })
      
      return true
    } catch (err) {
      console.error('Erreur lors de l\'annulation de la commande:', err)
      error.value = (err as Error).message
      
      toast({
        title: 'Erreur',
        description: `Impossible d'annuler la commande: ${error.value}`,
        variant: 'destructive'
      })
      
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Valide une commande
   * @param orderId ID de la commande
   */
  const validateOrder = async (orderId: number) => {
    loading.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()
      
      // Vérifier que la commande existe
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('order_number, status')
        .eq('id', orderId)
        .single()
      
      if (orderError) throw orderError
      
      // Vérifier que la commande est en brouillon
      if (order.status !== 'DRAFT') {
        throw new Error('Seules les commandes en brouillon peuvent être validées')
      }
      
      // Mettre à jour le statut de la commande
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'VALIDATED' })
        .eq('id', orderId)
      
      if (updateError) throw updateError
      
      toast({
        title: 'Commande validée',
        description: `La commande ${order.order_number} a été validée avec succès.`,
        variant: 'default'
      })
      
      return true
    } catch (err) {
      console.error('Erreur lors de la validation de la commande:', err)
      error.value = (err as Error).message
      
      toast({
        title: 'Erreur',
        description: `Impossible de valider la commande: ${error.value}`,
        variant: 'destructive'
      })
      
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Marque une commande comme payée
   * @param orderId ID de la commande
   */
  const markOrderAsPaid = async (orderId: number) => {
    loading.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()
      
      // Vérifier que la commande existe
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('orderNumber, status')
        .eq('id', orderId)
        .single()
      
      if (orderError) throw orderError
      
      // Vérifier que la commande est validée
      if (order.status !== 'VALIDATED') {
        throw new Error('Seules les commandes validées peuvent être marquées comme payées')
      }
      
      // Mettre à jour le statut de la commande
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'PAID' })
        .eq('id', orderId)
      
      if (updateError) throw updateError
      
      toast({
        title: 'Commande payée',
        description: `La commande ${order.orderNumber} a été marquée comme payée.`,
        variant: 'default'
      })
      
      return true
    } catch (err) {
      console.error('Erreur lors du marquage de la commande comme payée:', err)
      error.value = (err as Error).message
      
      toast({
        title: 'Erreur',
        description: `Impossible de marquer la commande comme payée: ${error.value}`,
        variant: 'destructive'
      })
      
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    downloadOrderPdf,
    cancelOrder,
    validateOrder,
    markOrderAsPaid
  }
} 