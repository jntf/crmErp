-- Supprimer l'ancienne contrainte d'unicité sur le VIN
ALTER TABLE public.exposed_vehicles DROP CONSTRAINT IF EXISTS exposed_vehicles_vin_key;

-- Ajouter la nouvelle contrainte d'unicité sur source + vehicle_id
ALTER TABLE public.exposed_vehicles 
    ADD CONSTRAINT unique_source_vehicle_id UNIQUE (source, vehicle_id);

-- Mettre à jour le commentaire de la table pour refléter ce changement
COMMENT ON TABLE public.exposed_vehicles IS 'Table principale des véhicules exposés sur le site. Identifiant unique : combinaison source + vehicle_id';

-- Fonction améliorée pour la gestion des dates
CREATE OR REPLACE FUNCTION public.safe_to_date(date_text text)
RETURNS date
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si la date est nulle, vide ou invalide
    IF date_text IS NULL 
        OR date_text = '' 
        OR date_text = 'Not valid date'
        OR date_text !~ '[0-9]' -- Ne contient aucun chiffre
        OR length(regexp_replace(date_text, '[^0-9]', '', 'g')) < 8 -- Pas assez de chiffres pour une date valide
    THEN
        RETURN NULL;
    END IF;

    -- Essaie d'abord le format français DD-MM-YYYY
    BEGIN
        RETURN to_date(
            regexp_replace(date_text, '[^0-9-]', '', 'g'),
            'DD-MM-YYYY'
        );
    EXCEPTION WHEN OTHERS THEN
        -- Essaie ensuite le format ISO YYYY-MM-DD
        BEGIN
            RETURN to_date(
                regexp_replace(date_text, '[^0-9-]', '', 'g'),
                'YYYY-MM-DD'
            );
        EXCEPTION WHEN OTHERS THEN
            -- Essaie le format DD/MM/YYYY
            BEGIN
                RETURN to_date(
                    regexp_replace(date_text, '[^0-9/]', '', 'g'),
                    'DD/MM/YYYY'
                );
            EXCEPTION WHEN OTHERS THEN
                -- Si aucun format ne fonctionne, retourne NULL
                RETURN NULL;
            END;
        END;
    END;
END;
$$;

COMMENT ON FUNCTION public.safe_to_date(text) IS 'Convertit en toute sécurité une chaîne de date en date PostgreSQL. 
Gère les formats DD-MM-YYYY, YYYY-MM-DD, et DD/MM/YYYY. 
Retourne NULL pour les dates invalides ou mal formatées.';

-- Fonction principale de publication
CREATE OR REPLACE FUNCTION public.insert_vehicles(
    vehicles jsonb,
    price_strategy text,
    price_modifier numeric,
    selling_price numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    vehicle_record jsonb;
    vehicle_data jsonb;
    equipments jsonb;
    photos jsonb;
    expertise jsonb;
    inserted_vehicle_id uuid;
    final_price numeric;
    results jsonb = jsonb_build_object('success', '[]'::jsonb, 'errors', '[]'::jsonb);
    registration_date_parsed date;
BEGIN
    -- Validation des entrées
    IF jsonb_array_length(vehicles) = 0 THEN
        RAISE EXCEPTION 'Aucun véhicule à insérer';
    END IF;

    -- Pour chaque véhicule dans le tableau
    FOR vehicle_record IN SELECT * FROM jsonb_array_elements(vehicles)
    LOOP
        BEGIN
            -- Extraction des données
            vehicle_data := vehicle_record -> 'vehicleData';
            equipments := vehicle_record -> 'equipments';
            photos := vehicle_record -> 'photos';
            expertise := vehicle_record -> 'expertise';

            -- Parse de la date d'immatriculation
            registration_date_parsed := public.safe_to_date(vehicle_data ->> 'registration_date');

            -- Calcul du prix de vente
            final_price := CASE price_strategy
                WHEN 'fixed' THEN COALESCE(selling_price, 0)
                WHEN 'margin' THEN COALESCE((vehicle_data ->> 'base_price')::numeric, 0) + COALESCE(price_modifier, 0)
                WHEN 'percentage' THEN COALESCE((vehicle_data ->> 'base_price')::numeric, 0) * (1 + COALESCE(price_modifier, 0) / 100)
                ELSE COALESCE((vehicle_data ->> 'base_price')::numeric, 0)
            END;

            -- Insertion du véhicule
            INSERT INTO public.exposed_vehicles (
                vehicle_id,
                source,
                type,
                body_type,
                brand,
                model,
                version,
                fuel_type,
                year,
                registration_date,
                mileage,
                doors,
                seats,
                color,
                transmission,
                power_hp,
                power_fiscal,
                base_price,
                selling_price,
                vat_rate,
                repair_cost,
                co2_emissions,
                stock_location,
                registration_number,
                vin,
                weight,
                new_vehicle_price,
                status
            ) VALUES (
                (vehicle_data ->> 'id'),
                (vehicle_data ->> 'source'),
                (vehicle_data ->> 'type'),
                (vehicle_data ->> 'body_type'),
                (vehicle_data ->> 'brand'),
                (vehicle_data ->> 'model'),
                (vehicle_data ->> 'version'),
                (vehicle_data ->> 'fuel_type'),
                (vehicle_data ->> 'year'),
                registration_date_parsed,
                NULLIF((vehicle_data ->> 'mileage'), '')::integer,
                NULLIF((vehicle_data ->> 'doors'), '')::integer,
                NULLIF((vehicle_data ->> 'seats'), '')::integer,
                (vehicle_data ->> 'color'),
                (vehicle_data ->> 'transmission'),
                NULLIF((vehicle_data ->> 'power_hp'), '')::integer,
                NULLIF((vehicle_data ->> 'power_fiscal'), '')::integer,
                NULLIF((vehicle_data ->> 'base_price'), '')::numeric,
                final_price,
                NULLIF((vehicle_data ->> 'vat_rate'), '')::numeric,
                NULLIF((vehicle_data ->> 'repair_cost'), '')::numeric,
                NULLIF((vehicle_data ->> 'co2_emissions'), '')::integer,
                (vehicle_data ->> 'stock_location'),
                (vehicle_data ->> 'registration_number'),
                (vehicle_data ->> 'vin'),
                NULLIF((vehicle_data ->> 'weight'), '')::integer,
                NULLIF((vehicle_data ->> 'new_vehicle_price'), '')::numeric,
                'available'
            )
            RETURNING id INTO inserted_vehicle_id;

            -- Insertion des équipements si présents
            IF equipments IS NOT NULL AND jsonb_array_length(equipments) > 0 THEN
                WITH equipment_inserts AS (
                    INSERT INTO public.equipment_references (name, category)
                    SELECT 
                        e ->> 'name',
                        e ->> 'category'
                    FROM jsonb_array_elements(equipments) e
                    WHERE (e ->> 'name') IS NOT NULL
                    ON CONFLICT (name) DO UPDATE 
                    SET category = EXCLUDED.category
                    RETURNING id, (jsonb_array_elements(equipments) ->> 'name') as name
                )
                INSERT INTO public.vehicle_equipment_links (vehicle_id, equipment_id, is_present)
                SELECT 
                    inserted_vehicle_id,
                    ei.id,
                    COALESCE((e ->> 'isPresent')::boolean, true)
                FROM jsonb_array_elements(equipments) e
                JOIN equipment_inserts ei ON ei.name = (e ->> 'name')
                WHERE (e ->> 'name') IS NOT NULL;
            END IF;

            -- Insertion des photos si présentes
            IF photos IS NOT NULL AND jsonb_array_length(photos) > 0 THEN
                WITH photo_inserts AS (
                    INSERT INTO public.photo_references (url, type, model_id)
                    SELECT 
                        p ->> 'url',
                        p ->> 'type',
                        p ->> 'model_id'
                    FROM jsonb_array_elements(photos) p
                    WHERE (p ->> 'url') IS NOT NULL
                    ON CONFLICT (url) DO UPDATE 
                    SET type = EXCLUDED.type
                    RETURNING id, (jsonb_array_elements(photos) ->> 'url') as url
                )
                INSERT INTO public.vehicle_photo_links (vehicle_id, photo_id, position)
                SELECT 
                    inserted_vehicle_id,
                    pi.id,
                    COALESCE((p ->> 'position')::integer, 0)
                FROM jsonb_array_elements(photos) p
                JOIN photo_inserts pi ON pi.url = (p ->> 'url')
                WHERE (p ->> 'url') IS NOT NULL;
            END IF;

            -- Insertion de l'expertise si présente
            IF expertise IS NOT NULL AND expertise != 'null'::jsonb THEN
                INSERT INTO public.vehicle_expertise (
                    vehicle_id,
                    source,
                    expertise_date,
                    expertise_data
                ) VALUES (
                    inserted_vehicle_id,
                    vehicle_data ->> 'source',
                    public.safe_to_date(expertise ->> 'date'),
                    expertise
                );
            END IF;

            -- Ajout à la liste des succès
            results := jsonb_set(
                results,
                '{success}',
                (results -> 'success') || to_jsonb(inserted_vehicle_id)
            );

        EXCEPTION WHEN OTHERS THEN
            -- Gestion des erreurs par véhicule
            results := jsonb_set(
                results,
                '{errors}',
                (results -> 'errors') || jsonb_build_object(
                    'id', vehicle_data ->> 'id',
                    'error', SQLERRM
                )::jsonb
            );
        END;
    END LOOP;

    RETURN results;
END;
$$;

-- Politique pour la fonction RPC
CREATE POLICY "Autoriser insert_vehicles pour les utilisateurs authentifiés" 
ON public.exposed_vehicles 
FOR ALL 
TO authenticated 
USING (true);

-- Politiques pour les tables liées
CREATE POLICY "Autoriser l'accès aux équipements pour les utilisateurs authentifiés"
ON public.equipment_references
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Autoriser l'accès aux photos pour les utilisateurs authentifiés"
ON public.photo_references
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Autoriser les liens équipements pour les utilisateurs authentifiés"
ON public.vehicle_equipment_links
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Autoriser les liens photos pour les utilisateurs authentifiés"
ON public.vehicle_photo_links
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Autoriser l'accès aux expertises pour les utilisateurs authentifiés"
ON public.vehicle_expertise
FOR ALL
TO authenticated
USING (true);

-- Autoriser l'invocation de la fonction RPC
GRANT EXECUTE ON FUNCTION public.insert_vehicles TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_to_date TO authenticated;