import { waitForPdfMake } from '../utils/helpers'
import { formatDate, formatCellValue, formatOptions } from '../utils/formatters'
import { styles } from '../utils/styles'
import { colors } from '../utils/colors'

/**
 * Génère un PDF de liste de véhicules
 */
export async function generateVehicleListPDF(data: any[], columns: any[], options: any = {}): Promise<Uint8Array> {
  try {
    // Attendre que pdfMake soit disponible
    const pdfMake = await waitForPdfMake()

    // Nettoyer les données
    // 1. Filtrer les colonnes à inclure (exclure actions ou colonnes sans id)
    const validColumns = columns.filter((col: any) =>
      col &&
      typeof col === 'object' &&
      col.id &&
      col.id !== 'actions'
    );

    if (validColumns.length === 0) {
      throw new Error('Aucune colonne valide pour générer le PDF');
    }

    // 2. S'assurer que chaque item de données est valide
    const validData = data.filter((item: any) => item && typeof item === 'object');

    if (validData.length === 0) {
      throw new Error('Aucune donnée valide pour générer le PDF');
    }

    // 3. Créer les largeurs de colonnes (si non définies, utiliser taille égale)
    const columnWidths = validColumns.map((col: any) => {
      // Limiter la taille maximale à 200pt
      if (col.width && parseInt(col.width) > 200) return 200;
      // Si la largeur est définie et valide, l'utiliser
      if (col.width && !isNaN(parseInt(col.width))) return parseInt(col.width);
      // Sinon, utiliser une répartition égale
      return '*';
    });

    // Construction du document PDF
    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: options.orientation || 'landscape',
      pageMargins: [30, 60, 30, 40],
      defaultStyle: { fontSize: 9 },
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

      // Pied de page
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
                {
                  text: options.title || 'Liste des Véhicules',
                  style: 'header',
                  alignment: 'center'
                },
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
                {
                  text: options.subtitle || `État au ${formatDate(new Date())}`,
                  style: 'tableCell',
                  alignment: 'center'
                }
              ]
            },
            {
              width: 200,
              stack: [
                {
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        text: 'Votre conseiller',
                        style: 'tableCellBold',
                        alignment: 'center',
                        fillColor: colors.accent,
                        color: 'white'
                      }],
                      [{
                        stack: [
                          {
                            text: options.user?.name || 'Utilisateur',
                            style: 'tableCell',
                            alignment: 'center',
                            margin: [0, 5, 0, 2]
                          },
                          {
                            text: options.user?.mobile || 'Mobile: 06-07-62-67-13',
                            style: 'tableCell',
                            alignment: 'center',
                            margin: [0, 2, 0, 2]
                          },
                          {
                            text: `Mail: ${options.email || 'julien@njiauto.com'}`,
                            style: 'tableCell',
                            alignment: 'center',
                            margin: [0, 2, 0, 5]
                          }
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
            widths: columnWidths,
            body: getTableBody(validData, validColumns)
          },
          layout: {
            hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
            vLineWidth: () => 0.5,
            hLineColor: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? colors.highlight : colors.border,
            vLineColor: () => colors.border,
            paddingTop: () => 5,
            paddingBottom: () => 5
          }
        }
      ]
    };

    // Fonction pour construire les données du tableau de manière sécurisée
    function getTableBody(items: any[], cols: any[]) {
      try {
        // En-tête du tableau
        const headerRow = cols.map((col: any, i: number) => ({
          text: col.title || '',
          style: 'tableHeader',
          alignment: col.align || 'left',
          fillColor: i % 2 === 0 ? colors.tableHeader : colors.tableHeaderLight
        }));

        const rows = [headerRow];

        // Lignes de données
        for (let rowIndex = 0; rowIndex < items.length; rowIndex++) {
          const item = items[rowIndex];

          // Création d'une ligne pour l'élément actuel
          const currentRow = cols.map((col: any) => {
            let cellValue = '-';

            try {
              if (item[col.id] !== undefined && item[col.id] !== null) {
                cellValue = formatCellValue(item[col.id], col.id, item);
              }
            } catch (error) {
              console.error(`Erreur de formatage pour la colonne ${col.id}:`, error);
            }

            return {
              text: cellValue,
              style: col.id === 'vehicle_selling_price_ht' ? 'tableCellBold' : 'tableCell',
              alignment: col.align || 'left',
              fillColor: rowIndex % 2 === 0 ? colors.tableStripe : null
            };
          });

          rows.push(currentRow);

          // Ajout des options si disponibles
          if (item.vehicle_options) {
            const optionsRow = [{
              text: formatOptions(item.vehicle_options),
              style: 'tableCell',
              colSpan: cols.length,
              italics: true,
              color: colors.accent,
              margin: [5, 3, 5, 3],
              fillColor: '#FAFAFA'
            }];

            // Compléter la ligne avec des cellules vides pour atteindre la longueur requise
            for (let i = 1; i < cols.length; i++) {
              optionsRow.push({});
            }

            rows.push(optionsRow);
          }
        }

        return rows;
      } catch (error) {
        console.error('Erreur lors de la génération du corps du tableau:', error);
        // Retourner un tableau minimal en cas d'erreur
        return [
          [{ text: 'Erreur de génération', style: 'tableHeader' }],
          [{ text: 'Impossible de générer les données du tableau', style: 'tableCell' }]
        ];
      }
    }

    return new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition).getBuffer((buffer: Uint8Array) => {
          resolve(buffer);
        });
      } catch (error) {
        console.error('Erreur lors de la création du PDF:', error);
        reject(error);
      }
    });
  } catch (error) {
    console.error('Erreur dans generateVehicleListPDF:', error);
    throw error;
  }
}