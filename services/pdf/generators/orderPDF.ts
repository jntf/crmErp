import { waitForPdfMake, groupByModel } from '../utils/helpers'
import { formatDate, formatCurrency, isNationalTransaction } from '../utils/formatters'
import { styles } from '../utils/styles'
import { colors } from '../utils/colors'

/**
 * Génère un PDF de bon de commande
 */
export async function generateOrderPDF(orderData: any): Promise<Uint8Array> {
  try {
    // Attendre que pdfMake soit disponible
    const pdfMake = await waitForPdfMake()

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
        pdfMake.createPdf(docDefinition).getBuffer((buffer: Uint8Array) => {
          resolve(buffer)
        })
      } catch (error) {
        console.error('Erreur lors de la création du PDF:', error)
        reject(error)
      }
    })
  } catch (error) {
    console.error('Erreur dans generateOrderPDF:', error)
    throw error
  }
} 