/**
 * Fonction pour attendre que pdfMake soit disponible globalement
 */
export async function waitForPdfMake(): Promise<any> {
  return new Promise((resolve, reject) => {
    // Si pdfMake est déjà disponible, on le renvoie immédiatement
    if ((window as any).pdfMake && typeof (window as any).pdfMake.createPdf === 'function') {
      console.log('pdfMake déjà disponible');
      resolve((window as any).pdfMake);
      return;
    }

    // Sinon, on vérifie toutes les 100ms jusqu'à ce qu'il soit disponible
    const maxAttempts = 60; // 6 secondes max (60 * 100ms)
    let attempts = 0;

    console.log('En attente du chargement de pdfMake...');
    const checkInterval = setInterval(() => {
      attempts++;

      if ((window as any).pdfMake) {
        clearInterval(checkInterval);
        console.log(`pdfMake chargé avec succès après ${attempts} tentatives`);
        resolve((window as any).pdfMake);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error(`pdfMake n'a pas pu être chargé après ${attempts} tentatives`);
        reject(new Error('pdfMake n\'a pas pu être chargé après plusieurs tentatives'));
      }
    }, 100);
  });
}

/**
 * Fonction de groupement des véhicules par modèle
 */
export function groupByModel(items: any[]) {
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

/**
 * Fonction pour créer un watermark SVG
 */
export function createWatermark(text: string): string {
  return `
  <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="30" transform="rotate(30)" font-family="Helvetica" font-size="20" fill="#E0E0E0">${text}</text>
  </svg>
  `
}

/**
 * Interface pour la configuration des PDF
 */
export interface PdfConfig {
  pageSize?: string
  pageOrientation?: 'portrait' | 'landscape'
  pageMargins?: [number, number, number, number]
}