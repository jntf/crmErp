-- Création des tables principales

-- Table des équipements de référence
CREATE TABLE IF NOT EXISTS public.equipment_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR NOT NULL,
    category VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name)
);

-- Table des photos de référence
CREATE TABLE IF NOT EXISTS public.photo_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url VARCHAR NOT NULL,
    type VARCHAR, -- 'vehicle', 'repair', etc.
    model_id VARCHAR, -- pour grouper les photos par modèle exact
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(url)
);

-- Table principale des véhicules exposés
CREATE TABLE IF NOT EXISTS public.exposed_vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id VARCHAR NOT NULL,
    source VARCHAR NOT NULL,
    type VARCHAR,
    body_type VARCHAR,
    brand VARCHAR NOT NULL,
    model VARCHAR NOT NULL,
    version VARCHAR,
    fuel_type VARCHAR,
    year VARCHAR,
    registration_date DATE,
    mileage INTEGER,
    doors INTEGER,
    seats INTEGER,
    color VARCHAR,
    transmission VARCHAR,
    power_hp INTEGER,
    power_fiscal INTEGER,
    base_price INTEGER,
    selling_price INTEGER NOT NULL,
    vat_rate NUMERIC,
    repair_cost INTEGER,
    co2_emissions INTEGER,
    stock_location VARCHAR,
    registration_number VARCHAR,
    vin VARCHAR,
    weight INTEGER,
    new_vehicle_price INTEGER,
    status VARCHAR DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vin) -- Si le VIN est disponible, il doit être unique
);

-- Table de liaison véhicules-équipements
CREATE TABLE IF NOT EXISTS public.vehicle_equipment_links (
    vehicle_id UUID REFERENCES public.exposed_vehicles(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES public.equipment_references(id) ON DELETE CASCADE,
    is_present BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (vehicle_id, equipment_id)
);

-- Table de liaison véhicules-photos
CREATE TABLE IF NOT EXISTS public.vehicle_photo_links (
    vehicle_id UUID REFERENCES public.exposed_vehicles(id) ON DELETE CASCADE,
    photo_id UUID REFERENCES public.photo_references(id) ON DELETE CASCADE,
    position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (vehicle_id, photo_id)
);

-- Table des expertises en format JSON
CREATE TABLE IF NOT EXISTS public.vehicle_expertise (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES public.exposed_vehicles(id) ON DELETE CASCADE,
    source VARCHAR NOT NULL,
    expertise_date DATE,
    expertise_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création des index pour les performances
CREATE INDEX IF NOT EXISTS idx_equipment_refs_name ON public.equipment_references(name);
CREATE INDEX IF NOT EXISTS idx_equipment_refs_category ON public.equipment_references(category);

CREATE INDEX IF NOT EXISTS idx_photo_refs_model ON public.photo_references(model_id);
CREATE INDEX IF NOT EXISTS idx_photo_refs_type ON public.photo_references(type);

CREATE INDEX IF NOT EXISTS idx_exposed_vehicles_brand ON public.exposed_vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_exposed_vehicles_model ON public.exposed_vehicles(model);
CREATE INDEX IF NOT EXISTS idx_exposed_vehicles_status ON public.exposed_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_exposed_vehicles_source ON public.exposed_vehicles(source);
CREATE INDEX IF NOT EXISTS idx_exposed_vehicles_price ON public.exposed_vehicles(selling_price);

CREATE INDEX IF NOT EXISTS idx_vehicle_equipment_vehicle ON public.vehicle_equipment_links(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_equipment_equipment ON public.vehicle_equipment_links(equipment_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_photo_vehicle ON public.vehicle_photo_links(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_photo_photo ON public.vehicle_photo_links(photo_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_expertise_vehicle ON public.vehicle_expertise(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_expertise_source ON public.vehicle_expertise(source);
CREATE INDEX IF NOT EXISTS idx_vehicle_expertise_data ON public.vehicle_expertise USING gin (expertise_data);

-- Création de la vue pour l'API
CREATE OR REPLACE VIEW public.api_vehicles AS
WITH equipment_json AS (
    SELECT 
        vel.vehicle_id,
        jsonb_agg(
            jsonb_build_object(
                'name', er.name,
                'category', er.category,
                'isPresent', vel.is_present
            )
        ) as equipments
    FROM public.vehicle_equipment_links vel
    JOIN public.equipment_references er ON vel.equipment_id = er.id
    GROUP BY vel.vehicle_id
),
photos_json AS (
    SELECT 
        vpl.vehicle_id,
        jsonb_agg(
            jsonb_build_object(
                'id', pr.id,
                'url', pr.url,
                'type', pr.type,
                'position', vpl.position
            ) ORDER BY vpl.position
        ) as photos
    FROM public.vehicle_photo_links vpl
    JOIN public.photo_references pr ON vpl.photo_id = pr.id
    GROUP BY vpl.vehicle_id
),
expertise_json AS (
    SELECT 
        vehicle_id,
        jsonb_object_agg(source, expertise_data) as expertise
    FROM public.vehicle_expertise
    GROUP BY vehicle_id
)
SELECT 
    v.*,
    e.equipments,
    p.photos,
    ex.expertise
FROM public.exposed_vehicles v
LEFT JOIN equipment_json e ON v.id = e.vehicle_id
LEFT JOIN photos_json p ON v.id = p.vehicle_id
LEFT JOIN expertise_json ex ON v.id = ex.vehicle_id
WHERE v.status = 'available'
AND v.selling_price > 0;

-- Fonction trigger pour mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Application des triggers
CREATE TRIGGER update_exposed_vehicles_updated_at
    BEFORE UPDATE ON public.exposed_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_expertise_updated_at
    BEFORE UPDATE ON public.vehicle_expertise
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ajout des commentaires pour la documentation
COMMENT ON TABLE public.equipment_references IS 'Table de référence des équipements uniques';
COMMENT ON TABLE public.photo_references IS 'Table de référence des photos uniques avec leur type';
COMMENT ON TABLE public.exposed_vehicles IS 'Table principale des véhicules exposés sur le site';
COMMENT ON TABLE public.vehicle_equipment_links IS 'Table de liaison entre les véhicules et leurs équipements';
COMMENT ON TABLE public.vehicle_photo_links IS 'Table de liaison entre les véhicules et leurs photos';
COMMENT ON TABLE public.vehicle_expertise IS 'Table des expertises des véhicules au format JSON par source';
COMMENT ON VIEW public.api_vehicles IS 'Vue publique pour l''API exposant les véhicules disponibles avec leurs détails';

-- Activation de la sécurité au niveau des lignes
ALTER TABLE public.equipment_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exposed_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_equipment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photo_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_expertise ENABLE ROW LEVEL SECURITY;

-- Création des politiques de sécurité de base
-- Politique de lecture pour les véhicules exposés
CREATE POLICY "Allow public read access" ON public.exposed_vehicles 
    FOR SELECT USING (status = 'available' AND selling_price > 0);

-- Politiques pour les tables liées
CREATE POLICY "Allow public read access equipment" ON public.equipment_references FOR SELECT USING (true);
CREATE POLICY "Allow public read access photos" ON public.photo_references FOR SELECT USING (true);
CREATE POLICY "Allow public read access equipment links" ON public.vehicle_equipment_links FOR SELECT USING (true);
CREATE POLICY "Allow public read access photo links" ON public.vehicle_photo_links FOR SELECT USING (true);
CREATE POLICY "Allow public read access expertise" ON public.vehicle_expertise FOR SELECT USING (true);