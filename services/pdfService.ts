import pdfMake from 'pdfmake/build/pdfmake'

async function loadFonts() {
  try {
    // Tenter d'utiliser l'importation dynamique
    const pdfFonts = await import('pdfmake/build/vfs_fonts')
    
    // Vérifier si pdfFonts.pdfMake existe
    if (pdfFonts.pdfMake) {
      pdfMake.vfs = pdfFonts.pdfMake.vfs
    } 
    // Si pdfFonts.pdfMake n'existe pas, essayer d'accéder directement à pdfFonts.vfs
    else if (pdfFonts.vfs) {
      pdfMake.vfs = pdfFonts.vfs
    }
    // Sinon, utiliser l'objet pdfFonts lui-même comme vfs
    else {
      pdfMake.vfs = pdfFonts
    }
  } catch (error) {
    console.error('Erreur lors du chargement des polices:', error)
    
    // Solution de secours: importer globalement
    try {
      // @ts-ignore
      if (window.pdfMake && window.pdfMake.vfs) {
        // Utiliser vfs global si disponible
        return
      }
      
      // Essayer d'importer via require si disponible (pour les environnements Node.js/CommonJS)
      // @ts-ignore
      if (typeof require !== 'undefined') {
        // @ts-ignore
        const pdfFonts = require('pdfmake/build/vfs_fonts')
        if (pdfFonts.pdfMake) {
          pdfMake.vfs = pdfFonts.pdfMake.vfs
        } else {
          pdfMake.vfs = pdfFonts
        }
      }
    } catch (fallbackError) {
      console.error('Erreur lors du chargement des polices (fallback):', fallbackError)
      throw new Error('Impossible de charger les polices pour pdfMake')
    }
  }
}

// Palette de couleurs étendue
const colors = {
  // Couleurs principales - conservées de l'original
  primary: '#2F3543',       // Couleur principale (bleu foncé/ardoise)
  lightBlue: '#ffffff',     // Fond léger
  darkGray: '#333333',      // Texte standard

  // Palette étendue
  secondary: '#4A6FBF',     // Bleu secondaire, plus clair que primary
  accent: '#3D5A80',        // Accent complémentaire, bleu légèrement plus profond
  highlight: '#1E88E5',     // Pour mise en évidence, bleu vif
  success: '#43A047',       // Vert pour éléments positifs
  warning: '#FF9800',       // Orange pour avertissements
  border: '#CFD8DC',        // Couleur de bordure légère
  tableHeader: '#324256',   // En-tête de tableau légèrement différent du primary
  tableHeaderLight: '#4F6176', // En-tête de tableau secondaire
  tableStripe: '#F5F9FF',   // Couleur pour lignes alternées
  signatureArea: '#ECEFF1', // Zone de signature
}

// Types
interface PdfConfig {
  pageSize?: string
  pageOrientation?: 'portrait' | 'landscape'
  pageMargins?: [number, number, number, number]
}

// Styles améliorés
const styles = {
  header: {
    fontSize: 16,
    bold: true,
    color: colors.primary,
    margin: [0, 0, 0, 10]
  },
  title: {
    fontSize: 14, // Légèrement plus grand
    bold: true,
    color: colors.primary,
    margin: [0, 5, 0, 10]
  },
  subheader: {
    fontSize: 10,
    margin: [0, 0, 0, 0],
    color: colors.darkGray
  },
  subheaderRight: {
    fontSize: 10,
    margin: [0, 2, 0, 2],
    alignment: 'right',
    color: colors.darkGray
  },
  titleHeaderRight: {
    fontSize: 16, // Légèrement plus grand
    bold: true,
    margin: [0, 2, 0, 5],
    alignment: 'right',
    color: colors.primary
  },
  tableHeader: {
    fontSize: 9,
    bold: true,
    color: 'white',
    fillColor: colors.tableHeader,
    margin: [3, 4, 3, 4] // Marges légèrement augmentées
  },
  tableHeaderSecondary: {
    fontSize: 9,
    bold: true,
    color: 'white',
    fillColor: colors.tableHeaderLight,
    margin: [3, 4, 3, 4]
  },
  tableCell: {
    fontSize: 9,
    margin: [3, 3, 3, 3],
    color: colors.darkGray
  },
  tableCellHighlight: {
    fontSize: 9,
    margin: [3, 3, 3, 3],
    color: colors.highlight
  },
  tableCellBold: {
    fontSize: 9,
    bold: true,
    margin: [3, 3, 3, 3],
    color: colors.primary
  },
  totalCell: {
    fontSize: 10, // Légèrement plus grand pour les totaux
    bold: true,
    margin: [3, 5, 3, 5], // Plus d'espace
    color: colors.primary
  },
  featureHeader: {
    fontSize: 9,
    bold: true,
    color: colors.accent,
    margin: [0, 5, 0, 2]
  },
  featureList: {
    fontSize: 8,
    color: colors.darkGray,
    italics: true
  },
  footer: {
    fontSize: 8,
    color: colors.primary,
    margin: [0, 10, 0, 0]
  },
  signatureBox: {
    fontSize: 8,
    color: colors.primary,
    margin: [0, 10, 0, 0],
    background: colors.signatureArea,
    padding: [5, 10, 5, 10],
    border: [0, 1, 0, 1],
    borderColor: colors.primary
  },
  legalText: {
    fontSize: 8,
    color: colors.darkGray,
    lineHeight: 1.3
  }
}

// Fonctions utilitaires - conservées, mais avec formatage amélioré
function formatDate(date: string | Date): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return ''
  return amount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).replace(',', '.') + ' €'
}

function formatAddress(address: string, postcode: string, city: string, country: string): string {
  return `${address || ''}, ${postcode || ''} ${city || ''}, ${country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '')
}

function isNationalTransaction(sellerCountry: string, buyerCountry: string): boolean {
  return sellerCountry === buyerCountry
}

function formattedSellerAddress(address: string, postcode: string, city: string, country: string): string {
  return `${address || ''}, ${postcode || ''} ${city || ''}, ${country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '')
}

function formattedBuyerAddress(address: string, postcode: string, city: string, country: string): string {
  return `${address || ''}, ${postcode || ''} ${city || ''}, ${country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '')
}

// Fonction de groupement des véhicules par modèle
function groupByModel(items: any[]) {
  const grouped: { [key: string]: any } = {}

  items.forEach(item => {
    if (!item.vehicle) {
      console.warn('Warning: item.vehicle is undefined', item);
      return;
    }
    const vehicle = item.vehicle
    const options = vehicle.vehicle_features && vehicle.vehicle_features.features.options
      ? Object.values(vehicle.vehicle_features.features.options)
      : ''
    const serie = vehicle.vehicle_features.features && vehicle.vehicle_features.features.serie
      ? vehicle.vehicle_features.features.serie
      : ''

    const features = `${options.length > 0 ? `Options : ${options}` : ''}\n${serie.length > 0 ? `Serie : ${serie}` : ''}`

    const key = `${vehicle.brand}|${vehicle.model}|${vehicle.fuel_type || 'N/A'}|${vehicle.version}|${features}`

    if (!grouped[key]) {
      grouped[key] = {
        brand: vehicle.brand,
        model: vehicle.model,
        motorisation: vehicle.fuel_type || 'N/A',
        version: vehicle.version,
        features: features,
        vehicles: [],
        totalHT: 0
      }
    }

    grouped[key].vehicles.push({
      immatriculation: vehicle.registration_number,
      chassis: vehicle.vin || vehicle.chassis,
      dateImmatriculation: vehicle.registration_date,
      kms: vehicle.mileage,
      color: vehicle.color,
      prixHT: item.totalHt || item.total_ht || 0,
      prixTTC: item.totalTtc || item.total_ttc || 0,
      tva: item.totalTva || item.total_tva || 0,
      moyenneFrais: vehicle.vehicle_prices?.frevo || 0,
      emissionCO2: vehicle.co2_emissions || ''
    })

    grouped[key].totalHT += item.totalHt || item.total_ht || 0
  })

  return Object.values(grouped)
}

// Fonction pour créer un watermark SVG
function createWatermark(text: string): string {
  return `
  <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="30" transform="rotate(30)" font-family="Helvetica" font-size="20" fill="#E0E0E0">${text}</text>
  </svg>
  `
}

// Fonction principale de génération de PDF pour les commandes
export async function generateOrderPDF(orderData: any): Promise<Uint8Array> {
  await loadFonts()

  const isNational = isNationalTransaction(
    orderData.order.sellerCompany?.country_id,
    orderData.order.buyerCompany?.country_id
  )

  // Vérifier si c'est une intermédiation
  const isIntermediation = orderData.order.metadata &&
    orderData.order.metadata.intermediation_type

  // Formater les adresses
  const sellerAddress = orderData.formattedSellerAddress ? orderData.formattedSellerAddress : "Adresse non spécifiée"
  const buyerAddress = orderData.formattedBuyerAddress ? orderData.formattedBuyerAddress : "Adresse non spécifiée"

  // Grouper les véhicules
  const groupedVehicles = groupByModel(orderData.items)

  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape' as const,
    // Ajuster les marges pour assurer que le footer est visible
    pageMargins: [40, 40, 40, 40],
    defaultStyle: {
      fontSize: 9,
      color: colors.darkGray
    },
    styles,
    // Fond avec bandes colorées ajustées
    background: function (currentPage: number, pageSize: any) {
      return {
        canvas: [
          // Fond principal
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: pageSize.width,
            h: pageSize.height,
            color: colors.lightBlue
          },
          // Bande horizontale en haut
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: pageSize.width,
            h: 15,
            color: colors.lightBlue
          }
        ]
      }
    },
    // Footer reconfiguré pour correspondre à l'original
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: [
            isIntermediation ? 'Document édité par NjiAuto' : ''
          ],
          alignment: 'left',
          margin: [40, 0, 0, 0],
          fontSize: 8,
          color: colors.primary
        },
        {
          text: `Page ${currentPage} sur ${pageCount}`,
          alignment: 'right',
          margin: [0, 0, 40, 0],
          fontSize: 8,
          color: colors.primary
        }
      ]
    }),
    content: [
      // En-tête avec informations vendeur et acheteur - mise en page améliorée
      {
        margin: [0, 5, 0, 15],
        columns: [
          {
            width: '48%',
            stack: [
              { text: orderData.order.sellerCompany?.name || '', style: 'header' },
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 165,
                    h: 2,
                    color: colors.accent
                  }
                ],
                margin: [0, 0, 0, 5]
              },
              // Adresse du vendeur
              {
                text: sellerAddress,
                style: 'subheader',
                margin: [0, 0, 0, 5]
              },
              // Informations TVA et bancaires dans un tableau pour alignement cohérent
              {
                table: {
                  widths: [50, '*'],
                  body: [
                    [
                      { text: 'TVA:', style: 'subheader', bold: true, color: colors.accent, border: [0, 0, 0, 0] },
                      { text: orderData.order.sellerCompany?.vat_number || '', style: 'subheader', border: [0, 0, 0, 0] }
                    ],
                    [
                      { text: 'IBAN:', style: 'subheader', bold: true, color: colors.accent, border: [0, 0, 0, 0] },
                      { text: 'FR76-1234-5678-9012-3456-7890', style: 'subheader', border: [0, 0, 0, 0] }
                    ],
                    [
                      { text: 'SWIFT:', style: 'subheader', bold: true, color: colors.accent, border: [0, 0, 0, 0] },
                      { text: 'CEPAFRPP751', style: 'subheader', border: [0, 0, 0, 0] }
                    ]
                  ]
                },
                layout: 'noBorders'
              }
            ]
          },
          { width: '4%', text: '' }, // Espace central
          {
            width: '48%',
            stack: [
              // Information bon de commande avec style simplifié
              {
                text: 'Bon de commande',
                style: 'title',
                alignment: 'right',
                color: colors.highlight
              },
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 200,  // Position à droite
                    y: 0,
                    w: 165,
                    h: 2,
                    color: colors.highlight
                  }
                ],
                margin: [0, 0, 0, 5]
              },
              // Numéro et date sur une seule ligne chacun
              {
                text: 'N° : ' + orderData.orderNumber,
                style: 'subheader',
                alignment: 'right',
                margin: [0, 2, 0, 2],
                color: colors.accent
              },
              {
                text: 'Date : ' + formatDate(orderData.orderDate),
                style: 'subheader',
                alignment: 'right',
                margin: [0, 2, 0, 10],
                color: colors.accent
              },
              // Informations acheteur
              { text: orderData.order.buyerCompany?.name || '', style: 'titleHeaderRight' },
              // Numéro TVA acheteur
              {
                text: 'N° TVA : ' + (orderData.order.buyerCompany?.vat_number || ''),
                style: 'subheader',
                alignment: 'right',
                margin: [0, 2, 0, 5],
                color: colors.accent
              },
              // Adresse acheteur
              {
                text: buyerAddress,
                style: 'subheaderRight',
                margin: [0, 0, 0, 0]
              }
            ]
          }
        ]
      },
      // Ligne de séparation avec dégradé
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 5,
            x2: 760,
            y2: 5,
            lineWidth: 2,
            lineColor: colors.accent
          }
        ],
        margin: [0, 0, 0, 2]
      },

      // Commentaires (si présents) avec un style amélioré
      orderData.order.comments ? [
        {
          stack: [
            {
              text: 'Commentaires',
              bold: true,
              color: colors.accent,
              fontSize: 10,
              margin: [0, 5, 0, 5]
            },
            {
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      text: orderData.order.comments,
                      fontSize: 7,
                      color: colors.darkGray,
                      margin: [5, 5, 5, 5]
                    }
                  ]
                ]
              },
              layout: {
                hLineWidth: (i: number) => 1,
                vLineWidth: (i: number) => 1,
                hLineColor: () => colors.border,
                vLineColor: () => colors.border,
                fillColor: () => '#FAFAFA'
              },
              margin: [0, 0, 0, 10]
            }
          ]
        }
      ] : [],

      // Tableaux des véhicules groupés avec style amélioré
      ...groupedVehicles.map((group: any, index: number) => [{
        unbreakable: true,
        stack: [
          {
            text: `${group.brand} ${group.model} ${group.version} - ${(group.motorisation || 'N/A').toUpperCase()}`,
            style: 'title',
            margin: [0, 10, 0, 0],
            alignment: 'center',
            color: index % 2 === 0 ? colors.primary : colors.accent // Alternance des couleurs
          },
          // Badge pour l'équipement
          group.features ? {
            stack: [
              {
                text: 'Équipements',
                style: 'featureHeader',
                margin: [0, 0, 0, 3]
              },
              {
                table: {
                  widths: ['*'],
                  body: [
                    [
                      {
                        text: group.features,
                        style: 'featureList',
                        margin: [5, 5, 5, 5]
                      }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => colors.border,
                  vLineColor: () => colors.border,
                  fillColor: () => '#FAFAFA'
                },
                margin: [0, 0, 0, 10]
              }
            ]
          } : null,
          {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*', 'auto', isNational ? 'auto' : 0].filter(Boolean),
              body: [
                [
                  { text: 'VIN', style: 'tableHeader', alignment: 'center' },
                  { text: 'DATE MEC', style: 'tableHeader', alignment: 'center' },
                  { text: 'KILOMÈTRES', style: 'tableHeader', alignment: 'center' },
                  { text: 'COULEUR', style: 'tableHeader', alignment: 'center' },
                  { text: 'FREVO HT', style: 'tableHeader', alignment: 'center' },
                  { text: 'CO2', style: 'tableHeader', alignment: 'center' },
                  { text: 'PRIX HT', style: 'tableHeader', alignment: 'right' },
                  { text: 'TVA', style: 'tableHeader', alignment: 'right' },
                  isNational ? { text: 'PRIX TTC', style: 'tableHeader', alignment: 'right' } : null
                ].filter(Boolean),
                ...group.vehicles.map((vehicle: any, i: number) => [
                  {
                    text: vehicle.chassis || 'En cours d\'attribution',
                    alignment: 'center',
                    fillColor: i % 2 === 0 ? colors.tableStripe : null
                  },
                  {
                    text: formatDate(vehicle.dateImmatriculation),
                    alignment: 'center',
                    fillColor: i % 2 === 0 ? colors.tableStripe : null
                  },
                  {
                    text: vehicle.kms?.toString() || '0',
                    alignment: 'center',
                    fillColor: i % 2 === 0 ? colors.tableStripe : null
                  },
                  {
                    text: vehicle.color || '',
                    alignment: 'center',
                    fillColor: i % 2 === 0 ? colors.tableStripe : null
                  },
                  {
                    text: formatCurrency(vehicle.moyenneFrais),
                    alignment: 'center',
                    fillColor: i % 2 === 0 ? colors.tableStripe : null
                  },
                  {
                    text: vehicle.emissionCO2?.toString() || '',
                    alignment: 'center',
                    fillColor: i % 2 === 0 ? colors.tableStripe : null
                  },
                  {
                    text: formatCurrency(vehicle.prixHT),
                    alignment: 'right',
                    bold: true,
                    color: colors.primary,
                    fillColor: i % 2 === 0 ? colors.tableStripe : null
                  },
                  {
                    text: formatCurrency(vehicle.tva),
                    alignment: 'right',
                    fillColor: i % 2 === 0 ? colors.tableStripe : null
                  },
                  isNational ? {
                    text: formatCurrency(vehicle.prixTTC),
                    alignment: 'right',
                    bold: true,
                    color: colors.primary,
                    fillColor: i % 2 === 0 ? colors.tableStripe : null
                  } : null
                ].filter(Boolean))
              ]
            },
            layout: {
              hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
              vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length) ? 0 : 0.5,
              hLineColor: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? colors.primary : colors.border,
              vLineColor: (i: number, node: any) => (i === 0 || i === node.table.widths.length) ? colors.primary : colors.border,
              paddingLeft: () => 5,
              paddingRight: () => 5,
              paddingTop: () => 3,
              paddingBottom: () => 3,
              fillColor: (rowIndex: number) => (rowIndex === 0) ? colors.tableHeader : null
            }
          },
          { text: '', margin: [0, 20, 0, 0] }
        ]
      }]).flat().filter(Boolean),

      // Totaux avec style amélioré et centrage
      {
        unbreakable: true,
        margin: [0, 10, 0, 30],
        stack: [
          {
            columns: [
              { width: '*', text: '' },
              {
                width: 250,
                table: {
                  widths: ['*', 100],
                  body: [
                    [
                      {
                        text: 'TOTAL HT',
                        style: 'totalCell',
                        alignment: 'right',
                        fillColor: colors.primary,
                        color: 'white'
                      },
                      {
                        text: formatCurrency(orderData.order.total_ht),
                        style: 'totalCell',
                        alignment: 'right',
                        fillColor: '#F5F5F5'
                      }
                    ],
                    [
                      {
                        text: 'TVA',
                        style: 'tableCell',
                        alignment: 'right',
                        fillColor: colors.tableHeaderLight,
                        color: 'white'
                      },
                      {
                        text: formatCurrency(orderData.order.total_tva),
                        style: 'tableCell',
                        alignment: 'right',
                        fillColor: '#F5F5F5'
                      }
                    ],
                    [
                      {
                        text: 'TOTAL TTC',
                        style: 'totalCell',
                        alignment: 'right',
                        fillColor: colors.highlight,
                        color: 'white'
                      },
                      {
                        text: formatCurrency(orderData.order.total_ttc),
                        style: 'totalCell',
                        alignment: 'right',
                        fillColor: '#F5F5F5',
                        color: colors.highlight
                      }
                    ]
                  ].filter(row => row && row.length > 0)
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => colors.border,
                  vLineColor: () => colors.border
                }
              },
              { width: '0%', text: '' } // Marge à droite pour équilibrer
            ]
          }
        ]
      },

      // Signatures avec design amélioré selon les nouvelles spécifications
      {
        columns: [
          // Signature vendeur (collée à gauche)
          {
            width: '57%',
            stack: [
              // Cadre de signature avec contenu positionné de manière spécifique
              {
                table: {
                  widths: [250],
                  heights: [80],
                  body: [
                    [
                      {
                        stack: [
                          // Date en haut à gauche
                          {
                            text: 'Date : ____/____/________',
                            alignment: 'left',
                            margin: [5, 5, 0, 0],
                            color: colors.accent,
                            fontSize: 8
                          },
                          // Texte au centre - vide pour laisser de la place pour la signature
                          {
                            text: ' ',
                            alignment: 'center',
                            margin: [0, 15, 0, 0]
                          },
                          // Mention Vendeur en bas à droite
                          {
                            text: 'Signature et cachet du vendeur',
                            alignment: 'right',
                            margin: [0, 10, 5, 0],
                            color: colors.accent,
                            fontSize: 8,
                            italics: true
                          }
                        ],
                        fillColor: colors.signatureArea
                      }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => colors.border,
                  vLineColor: () => colors.border,
                  paddingLeft: () => 0,
                  paddingTop: () => 0,
                  paddingRight: () => 0,
                  paddingBottom: () => 0
                }
              }
            ]
          },
          // Espace central
          { width: '10%', text: '' },
          // Signature acheteur (collée à droite)
          {
            width: '45%',
            stack: [

              // Cadre de signature avec contenu positionné de manière spécifique
              {
                table: {
                  widths: [250],
                  heights: [80],
                  body: [
                    [
                      {
                        stack: [
                          // Date en haut à gauche
                          {
                            text: 'Date : ____/____/________',
                            alignment: 'left',
                            margin: [5, 5, 0, 0],
                            color: colors.accent,
                            fontSize: 8
                          },
                          // Texte au centre - vide pour laisser de la place pour la signature
                          {
                            text: ' ',
                            alignment: 'center',
                            margin: [0, 15, 0, 0]
                          },
                          // Mention Acheteur en bas à droite
                          {
                            text: 'Signature et cachet de l\'acheteur',
                            alignment: 'right',
                            margin: [0, 10, 5, 0],
                            color: colors.accent,
                            fontSize: 8,
                            italics: true
                          }
                        ],
                        fillColor: colors.signatureArea
                      }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => colors.border,
                  vLineColor: () => colors.border,
                  paddingLeft: () => 0,
                  paddingTop: () => 0,
                  paddingRight: () => 0,
                  paddingBottom: () => 0
                }
              }
            ]
          }
        ],
        margin: [0, 20, 0, 15]
      },

      // Conditions générales de vente avec style amélioré
      {
        text: 'Conditions générales de vente',
        style: 'title',
        margin: [0, 20, 0, 10],
        color: colors.primary,
        pageBreak: 'before'
      },
      {
        stack: [
          {
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    stack: [
                      {
                        text: '1. COMMANDES',
                        bold: true,
                        color: colors.accent,
                        margin: [0, 5, 0, 5]
                      },
                      {
                        text: 'Toute commande implique l\'adhésion sans réserve aux présentes conditions générales de vente. Les commandes ne sont définitives qu\'après acceptation écrite par le vendeur et versement de l\'acompte prévu.',
                        style: 'legalText',
                        margin: [0, 0, 0, 10]
                      },
                      {
                        text: '2. PRIX ET PAIEMENT',
                        bold: true,
                        color: colors.accent,
                        margin: [0, 5, 0, 5]
                      },
                      {
                        text: 'Les prix s\'entendent hors taxes, départ usine. Le paiement s\'effectue selon les modalités prévues dans la commande. Tout retard de paiement entraînera l\'application d\'une pénalité égale à trois fois le taux d\'intérêt légal.',
                        style: 'legalText',
                        margin: [0, 0, 0, 10]
                      },
                      {
                        text: '3. LIVRAISONS',
                        bold: true,
                        color: colors.accent,
                        margin: [0, 5, 0, 5]
                      },
                      {
                        text: 'Les délais de livraison sont donnés à titre indicatif. Aucune pénalité ne pourra être appliquée en cas de retard. La livraison est effectuée départ usine, le transfert des risques s\'opérant dès la mise à disposition des marchandises.',
                        style: 'legalText',
                        margin: [0, 0, 0, 10]
                      },
                      {
                        text: '4. RÉSERVE DE PROPRIÉTÉ',
                        bold: true,
                        color: colors.accent,
                        margin: [0, 5, 0, 5]
                      },
                      {
                        text: 'Le vendeur conserve la propriété des biens vendus jusqu\'au paiement intégral du prix, en principal et accessoires. Le défaut de paiement de l\'une quelconque des échéances pourra entraîner la revendication des biens.',
                        style: 'legalText',
                        margin: [0, 0, 0, 10]
                      },
                      {
                        text: '5. GARANTIE',
                        bold: true,
                        color: colors.accent,
                        margin: [0, 5, 0, 5]
                      },
                      {
                        text: 'La garantie est limitée au remplacement des pièces reconnues défectueuses, à l\'exclusion de toute indemnité pour quelque cause que ce soit.',
                        style: 'legalText',
                        margin: [0, 0, 0, 10]
                      },
                      {
                        text: '6. RÉCLAMATIONS',
                        bold: true,
                        color: colors.accent,
                        margin: [0, 5, 0, 5]
                      },
                      {
                        text: 'Toute réclamation concernant les marchandises livrées devra être formulée par écrit dans les 8 jours suivant la réception des marchandises.',
                        style: 'legalText',
                        margin: [0, 0, 0, 10]
                      },
                      {
                        text: '7. DROIT APPLICABLE ET JURIDICTION',
                        bold: true,
                        color: colors.accent,
                        margin: [0, 5, 0, 5]
                      },
                      {
                        text: 'Les présentes conditions sont régies par le droit français. Tout litige relatif à l\'interprétation ou à l\'exécution des présentes sera de la compétence exclusive du Tribunal de Commerce de Paris.',
                        style: 'legalText',
                        margin: [0, 0, 0, 10]
                      }
                    ],
                    margin: [10, 10, 10, 10]
                  }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => colors.border,
              vLineColor: () => colors.border
            }
          }
        ]
      }
    ]
  }

  return new Promise((resolve, reject) => {
    try {
      // @ts-ignore
      pdfMake.createPdf(docDefinition).getBuffer((buffer: Uint8Array) => {
        resolve(buffer)
      })
    } catch (error) {
      console.error('Erreur lors de la création du PDF:', error)
      reject(error)
    }
  })
}

// Fonction de génération de PDF pour la liste des véhicules
export async function generateVehicleListPDF(data: any[], columns: any[], options: any = {}): Promise<Uint8Array> {
  await loadFonts()

  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape' as const,
    pageMargins: [30, 60, 30, 40],
    defaultStyle: {},
    styles,
    // Fond avec bande colorée
    background: function (currentPage: number, pageSize: any) {
      return {
        canvas: [
          // Bande horizontale en haut
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: pageSize.width,
            h: 15,
            color: colors.primary
          },
          // Bande latérale
          {
            type: 'rect',
            x: 0,
            y: 15,
            w: 15,
            h: pageSize.height - 30,
            color: colors.secondary
          },
          // Bande horizontale en bas
          {
            type: 'rect',
            x: 0,
            y: pageSize.height - 15,
            w: pageSize.width,
            h: 15,
            color: colors.primary
          }
        ]
      }
    },
    // Pied de page amélioré
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: options.user?.name || 'Votre conseiller commercial',
          alignment: 'left',
          margin: [40, 5, 0, 0],
          fontSize: 8,
          color: 'white'
        },
        {
          text: `Page ${currentPage} sur ${pageCount}`,
          alignment: 'right',
          margin: [0, 5, 40, 0],
          fontSize: 8,
          color: 'white'
        }
      ]
    }),
    content: [
      // En-tête avec design amélioré
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Liste des Véhicules à Marchand', style: 'header', alignment: 'center' },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 150,
                    y1: 5,
                    x2: 450,
                    y2: 5,
                    lineWidth: 2,
                    lineColor: colors.accent
                  }
                ],
                margin: [0, 0, 0, 5]
              },
              { text: `État au ${formatDate(new Date())}`, style: 'tableCell', alignment: 'center' }
            ]
          },
          {
            width: 200,
            stack: [
              {
                table: {
                  widths: ['*'],
                  body: [
                    [{ text: 'Votre conseiller', style: 'tableCellBold', alignment: 'center', fillColor: colors.accent, color: 'white' }],
                    [{
                      stack: [
                        { text: options.user?.name || 'Utilisateur', style: 'tableCell', alignment: 'center', margin: [0, 5, 0, 2] },
                        { text: 'Mobile: 06-07-62-67-13', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                        { text: `Mail: ${options.email || 'julien@njiauto.com'}`, style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 5] }
                      ],
                      fillColor: '#F5F9FF'
                    }]
                  ]
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => colors.border,
                  vLineColor: () => colors.border
                }
              }
            ]
          }
        ]
      },

      // Ligne de séparation
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 5,
            x2: 780,
            y2: 5,
            lineWidth: 1,
            lineColor: colors.border
          }
        ],
        margin: [0, 5, 0, 15]
      },

      // Tableau des véhicules
      {
        margin: [0, 20, 0, 0],
        table: {
          headerRows: 1,
          widths: columns.map((col: any) => col.width || '*'),
          body: [
            // En-tête du tableau
            columns.map((col: any, i: number) => ({
              text: col.title,
              style: 'tableHeader',
              alignment: col.align || 'left',
              fillColor: i % 2 === 0 ? colors.tableHeader : colors.tableHeaderLight // Alternance des couleurs
            })),
            // Lignes de données avec alternance de couleurs
            ...data.map((item: any, rowIndex: number) => {
              const row = columns.map((col: any) => ({
                text: formatCellValue(item[col.id], col.id, item),
                style: col.id === 'vehicle_selling_price_ht' ? 'tableCellBold' : 'tableCell',
                alignment: col.align || 'left',
                fillColor: rowIndex % 2 === 0 ? colors.tableStripe : null // Lignes alternées
              }))

              // Ajouter les options en dessous avec style amélioré
              if (item.vehicle_options) {
                return [
                  row,
                  [{
                    stack: [
                      {
                        text: formatOptions(item.vehicle_options),
                        style: 'tableCell',
                        colSpan: columns.length,
                        italics: true,
                        color: colors.accent,
                        margin: [5, 3, 5, 3]
                      }
                    ],
                    fillColor: '#FAFAFA'
                  }]
                ]
              }
              return [row]
            }).flat()
          ]
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: (i: number, node: any) => 0.5,
          hLineColor: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? colors.highlight : colors.border,
          vLineColor: (i: number, node: any) => colors.border,
          paddingTop: (i: number, node: any) => 5,
          paddingBottom: (i: number, node: any) => 5
        }
      }
    ]
  }

  return new Promise((resolve, reject) => {
    try {
      // @ts-ignore
      pdfMake.createPdf(docDefinition).getBuffer((buffer: Uint8Array) => {
        resolve(buffer)
      })
    } catch (error) {
      console.error('Erreur lors de la création du PDF:', error)
      reject(error)
    }
  })
}

// Fonctions utilitaires pour la liste des véhicules - formattage amélioré
function formatCellValue(value: any, columnId: string, item?: any): string {
  if (value === null || value === undefined) return '-'

  switch (columnId) {
    case 'model':
      return `${value}${item.version ? ` - ${item.version}` : ''}`
    case 'vehicle_selling_price_ht':
      const priceHT = Number(value)
      const priceTTC = priceHT * 1.2
      return `${formatCurrency(priceTTC)} TTC\n(${formatCurrency(priceHT)} HT)`
    case 'vehicle_frevo':
      const frevo = Number(value)
      return frevo ? formatCurrency(frevo) : '-'
    case 'registration_date':
      return formatDate(value)
    case 'mileage':
      return value.toLocaleString('fr-FR') + ' km'
    case 'co2_emissions':
      return value ? `${value}g/km` : '-'
    case 'fuel_type':
      // Formattage spécifique pour les types de carburant avec icônes
      switch (value?.toLowerCase()) {
        case 'diesel': return 'Diesel ⛽'
        case 'essence': return 'Essence 🚗'
        case 'hybrid': return 'Hybride ♻️'
        case 'electric': return 'Électrique ⚡'
        default: return String(value)
      }
    default:
      return String(value)
  }
}

function formatOptions(options: string | null): string {
  if (!options) return '-'
  const optionsArray = options.split(',')
  return optionsArray.length > 0 ? '📋 Options: ' + optionsArray.join(' • ') : '-'
}