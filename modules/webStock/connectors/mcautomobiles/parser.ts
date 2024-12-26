// modules/webStock/connectors/mcautomobiles/parser.ts
import * as xml2js from 'xml2js'
import type {
    McAutomobilesXMLResponse,
    McAutomobilesVehicle,
    TransformedVehicle,
    ExpertiseElement
} from './types'

/**
 * Extrait en toute sécurité une valeur d'un tableau
 */
function safeGetValue(arr?: any[]): string {
    return Array.isArray(arr) ? arr[0]?.toString() || '' : '';
}

/**
 * Parse les équipements depuis la chaîne brute
 */
function parseEquipments(equipmentString: string): TransformedVehicle['equipments'] {
    if (!equipmentString) return [];

    return equipmentString
        .split('/')
        .map(e => e.trim())
        .filter(Boolean)
        .map(equipment => {
            const isSans = equipment.startsWith('SANS');
            const name = isSans ? equipment.replace('SANS', '').trim() : equipment;

            let category: string | null = null;

            if (name.match(/airbag|abs|esp|frein/i)) {
                category = 'Sécurité';
            } else if (name.match(/clim|siege|chauffant|ventil/i)) {
                category = 'Confort';
            } else if (name.match(/gps|nav|connect|bluetooth|apple|android/i)) {
                category = 'Connectivité';
            } else if (name.match(/phare|feu|eclairage|led|xenon/i)) {
                category = 'Éclairage';
            } else if (name.match(/jante|roue|pneu/i)) {
                category = 'Roues';
            } else if (name.match(/audio|sound|speaker|haut[\s-]parleur/i)) {
                category = 'Audio';
            }

            return {
                name: name.replace(/\([^)]+\)/, '').trim(),
                category,
                isPresent: !isSans
            };
        });
}

/**
 * Parse les photos avec leur type et position
 */
function parsePhotos(vehicle: McAutomobilesVehicle, modelId: string): TransformedVehicle['photos'] {
    const photos: TransformedVehicle['photos'] = [];

    // Photos principales
    if (vehicle.photos?.[0]?.photo) {
        vehicle.photos[0].photo.forEach((url, index) => {
            if (url) {
                photos.push({
                    url,
                    type: 'vehicle',
                    model_id: modelId,
                    position: index
                });
            }
        });
    }

    // Photos des réparations
    if (vehicle.photos_frais?.[0]?.photo) {
        vehicle.photos_frais[0].photo.forEach((url, index) => {
            if (url) {
                photos.push({
                    url,
                    type: 'repair',
                    model_id: modelId,
                    position: index
                });
            }
        });
    }

    return photos;
}

/**
 * Parse les détails d'expertise
 */
function parseExpertise(expertiseDetails: any): TransformedVehicle['expertise'] {
    const expertise: TransformedVehicle['expertise'] = {
        date: '',
        details: {},
        summary: {
            exterior: {},
            interior: {},
            technical: {},
            equipment: {}
        }
    };

    if (!expertiseDetails?.element) return expertise;

    try {
        expertiseDetails.element.forEach((element: ExpertiseElement) => {
            if (!element.nom?.[0]) return;

            const key = element.nom[0];
            const value = element._ ? safeGetValue(element._) : '';

            // Stockage dans details
            expertise.details[key] = value;

            // Date d'expertise
            if (key === 'date_expertise') {
                expertise.date = value;
                return;
            }

            // Catégorisation des éléments
            if (key.match(/pare[- ]?choc|aile|porte|calandre|capot|retroviseur/i)) {
                expertise.summary.exterior[key] = value;
            }
            else if (key.match(/siege|sellerie|pavillon|tapis|tableau/i)) {
                expertise.summary.interior[key] = value;
            }
            else if (key.match(/pneu|moteur|boite|transmission|batterie/i)) {
                expertise.summary.technical[key] = value;
            }
            else if (key.match(/clim|gps|radio|bluetooth|equipement/i)) {
                expertise.summary.equipment[key] = value;
            }
        });
    } catch (error) {
        console.warn('Erreur lors du parsing de l\'expertise:', error);
    }

    return expertise;
}

/**
 * Transforme une entrée du XML en véhicule structuré
 */
function transformVehicle(item: McAutomobilesVehicle): TransformedVehicle {
    // Création d'un identifiant unique pour le modèle
    const modelId = `${safeGetValue(item.marque)}_${safeGetValue(item.modele)}_${safeGetValue(item.version)}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_');

    return {
        vehicleData: {
            id: safeGetValue(item.reference),
            source: 'mcautomobiles',
            type: safeGetValue(item.type),
            body_type: safeGetValue(item.carrosserie),
            brand: safeGetValue(item.marque),
            model: safeGetValue(item.modele),
            version: safeGetValue(item.version),
            fuel_type: safeGetValue(item.energie),
            year: safeGetValue(item.millesime),
            registration_date: formatDate(safeGetValue(item.date_mec)),
            mileage: parseInt(safeGetValue(item.kilometrage)) || 0,
            doors: parseInt(safeGetValue(item.nb_portes)) || 0,
            seats: parseInt(safeGetValue(item.nb_places)) || 0,
            color: safeGetValue(item.couleur),
            transmission: safeGetValue(item.boite_de_vitesse),
            power_hp: parseInt(safeGetValue(item.puissance_reelle)) || 0,
            power_fiscal: parseInt(safeGetValue(item.puissance_fiscale)) || 0,
            base_price: parseInt(safeGetValue(item.prix)) || 0,
            vat_rate: parseFloat(safeGetValue(item.taux_tva)) || 0,
            repair_cost: parseInt(safeGetValue(item.frais)) || 0,
            co2_emissions: parseInt(safeGetValue(item.emission_co2)) || 0,
            stock_location: safeGetValue(item.stock),
            registration_number: safeGetValue(item.immat),
            vin: safeGetValue(item.vin),
            weight: parseInt(safeGetValue(item.poids)) || 0,
            new_vehicle_price: parseInt(safeGetValue(item.valeur_neuve)) || 0,
            status: 'available'
        },
        equipments: parseEquipments(safeGetValue(item.equipements)),
        photos: parsePhotos(item, modelId),
        expertise: parseExpertise(item.expertise_details?.[0])
    };
}

/**
 * Parse le XML McAutomobiles complet
 */
export async function parseMcAutomobilesXML(xmlText: string): Promise<TransformedVehicle[]> {
    try {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xmlText) as McAutomobilesXMLResponse;

        if (!result?.client?.annonce) {
            throw new Error('Format XML McAutomobiles invalide');
        }

        return result.client.annonce
            .filter(item => item.reference?.length > 0) // Ignore les annonces sans référence
            .map(transformVehicle);
    } catch (error) {
        console.error('Erreur de parsing XML McAutomobiles:', error);
        throw new Error(`Erreur de parsing: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
}