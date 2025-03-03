/**
 * Composable pour gérer les notifications toast
 * 
 * Ce composable utilise le système de notification de shadcn-vue
 */

import { useToast as useShadcnToast } from '@/components/ui/toast/use-toast'

export function useToast() {
  const { toast } = useShadcnToast()
  
  return {
    toast
  }
} 