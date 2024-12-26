// modules/webStock/connectors/mcautomobiles/server/api.ts
export default defineEventHandler(async (event) => {
    console.log('API handler called')
    try {
        const response = await fetch('https://www.mcautomobiles.com/gestion/export/mca-stock.xml', {
            headers: {
                'Accept': 'application/xml',
                'User-Agent': 'Mozilla/5.0'
            }
        })

        if (!response.ok) {
            console.error('API error:', response.status, response.statusText)
            throw createError({
                statusCode: response.status,
                message: `Erreur lors de la récupération des données: ${response.statusText}`
            })
        }

        const xmlText = await response.text()
        console.log('API response received, length:', xmlText.length)
        return xmlText
    } catch (error) {
        console.error('API handler error:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Erreur lors de la récupération du stock'
        })
    }
})