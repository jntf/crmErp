import { colors } from './colors'

// Styles pour les PDF
export const styles = {
  header: {
    fontSize: 16,
    bold: true,
    color: colors.primary,
    margin: [0, 0, 0, 10]
  },
  title: {
    fontSize: 14,
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
    fontSize: 16,
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
    margin: [3, 4, 3, 4]
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
    fontSize: 10,
    bold: true,
    margin: [3, 5, 3, 5],
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