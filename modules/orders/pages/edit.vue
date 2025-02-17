async function saveOrder() {
  try {
    console.log('Début de la sauvegarde de la commande')
    const orderData = {
      // ... existing code ...
    }

    console.log('Données de la commande préparées:', orderData)
    const result = await orderStore.createOrderWithFunction(orderData)
    console.log('Résultat de la création:', result)

    if (result?.success) {
      console.log('Commande créée avec succès, redirection...')
      navigateTo('/orders')
    } else {
      console.error('Échec de la création de la commande:', result)
      throw new Error('Erreur lors de la création de la commande')
    }
  } catch (error) {
    console.error('Erreur détaillée lors de la sauvegarde:', error)
    errorMessage.value = `Erreur lors de la création de la commande: ${(error as Error).message}`
  }
} 