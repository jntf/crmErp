// modules/webStock/connectors/mcautomobiles/types/index.ts

// Type pour un élément d'expertise
export interface ExpertiseElement {
    nom: string[];
    _?: string[];  // Pour les valeurs directes
}

// Interface pour les photos
export interface PhotoSection {
    photo: string[];
}

// Type pour les détails d'expertise
export interface ExpertiseDetails {
    element: ExpertiseElement[];
}

// Type pour une annonce individuelle
export interface McAutomobilesVehicle {
    reference: string[];
    type: string[];
    carrosserie: string[];
    marque: string[];
    modele: string[];
    version: string[];
    energie: string[];
    millesime: string[];
    date_mec: string[];
    kilometrage: string[];
    nb_portes: string[];
    nb_places: string[];
    couleur: string[];
    boite_de_vitesse: string[];
    puissance_reelle: string[];
    puissance_fiscale: string[];
    prix: string[];
    taux_tva: string[];
    frais: string[];
    equipements: string[];
    emission_co2: string[];
    photos: PhotoSection[];
    stock: string[];
    immat: string[];
    vin: string[];
    poids: string[];
    valeur_neuve: string[];
    expertise_details: ExpertiseDetails[];
    photos_frais: PhotoSection[];
}

// Type principal pour la réponse XML
export interface McAutomobilesXMLResponse {
    client: {
        annonce: McAutomobilesVehicle[];
    };
}

// Type pour les données déjà transformées
export interface TransformedVehicle {
    vehicleData: {
        id: string;
        source: string;
        type: string;
        body_type: string;
        brand: string;
        model: string;
        version: string;
        fuel_type: string;
        year: string;
        registration_date: string;
        mileage: number;
        doors: number;
        seats: number;
        color: string;
        transmission: string;
        power_hp: number;
        power_fiscal: number;
        base_price: number;
        vat_rate: number;
        repair_cost: number;
        co2_emissions: number;
        stock_location: string;
        registration_number: string;
        vin: string;
        weight: number;
        new_vehicle_price: number;
        status?: string;
    };
    equipments: {
        name: string;
        category: string | null;
        isPresent: boolean;
    }[];
    photos: {
        url: string;
        type: 'vehicle' | 'repair';
        model_id?: string;
        position: number;
    }[];
    expertise: {
        date: string;
        details: Record<string, string>;
        summary: {
            exterior: Record<string, string>;
            interior: Record<string, string>;
            technical: Record<string, string>;
            equipment: Record<string, string>;
        };
    };
}