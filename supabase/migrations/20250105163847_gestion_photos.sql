-- Fonction pour ajouter une nouvelle photo
CREATE OR REPLACE FUNCTION add_vehicle_photo(
    p_exposed_vehicle_id VARCHAR,
    p_url VARCHAR,
    p_type VARCHAR DEFAULT 'vehicle'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_photo_id UUID;
    v_max_position INTEGER;
BEGIN
    -- Récupérer la position maximale actuelle avec cast en UUID
    SELECT COALESCE(MAX(position), -1) + 1
    INTO v_max_position
    FROM public.vehicle_photo_links
    WHERE vehicle_id = p_exposed_vehicle_id::UUID;

    -- Insérer ou récupérer la photo dans la table de référence
    INSERT INTO public.photo_references (url, type)
    VALUES (p_url, p_type)
    ON CONFLICT (url) DO UPDATE SET url = EXCLUDED.url
    RETURNING id INTO v_photo_id;

    -- Créer le lien avec le véhicule avec cast en UUID
    INSERT INTO public.vehicle_photo_links (vehicle_id, photo_id, position)
    VALUES (p_exposed_vehicle_id::UUID, v_photo_id, v_max_position);

    RETURN v_photo_id;
END;
$$;

-- Fonction pour mettre à jour l'ordre des photos
CREATE OR REPLACE FUNCTION update_photos_order(
    p_exposed_vehicle_id VARCHAR,
    p_source VARCHAR,
    p_photo_order VARCHAR[]
) RETURNS SETOF vehicle_photo_links
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_vehicle_id UUID;
BEGIN
    -- Récupérer l'UUID du véhicule depuis exposed_vehicle
    SELECT id INTO v_vehicle_id
    FROM exposed_vehicles
    WHERE vehicle_id = p_exposed_vehicle_id 
    AND source = p_source;

    -- Vérifier si le véhicule existe
    IF v_vehicle_id IS NULL THEN
        RAISE EXCEPTION 'Vehicle not found';
    END IF;

    -- Parcourir le tableau des IDs de photos dans l'ordre souhaité
    FOR i IN 1..array_length(p_photo_order, 1)
    LOOP
        UPDATE public.vehicle_photo_links
        SET position = i - 1
        WHERE vehicle_id = v_vehicle_id
        AND photo_id = p_photo_order[i]::UUID;
    END LOOP;

    RETURN QUERY
    SELECT * FROM vehicle_photo_links 
    WHERE vehicle_id = v_vehicle_id
    ORDER BY position;
END;
$$;

-- Fonction pour définir une photo comme principale
CREATE OR REPLACE FUNCTION set_main_photo(
    p_exposed_vehicle_id VARCHAR,
    p_source VARCHAR,
    p_photo_id VARCHAR
) RETURNS SETOF vehicle_photo_links
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_vehicle_id UUID;
BEGIN
    -- Récupérer l'UUID du véhicule depuis exposed_vehicle
    SELECT id INTO v_vehicle_id
    FROM exposed_vehicles
    WHERE vehicle_id = p_exposed_vehicle_id 
    AND source = p_source;

    -- Vérifier si le véhicule existe
    IF v_vehicle_id IS NULL THEN
        RAISE EXCEPTION 'Vehicle not found';
    END IF;

    -- Mettre la photo sélectionnée en position 0
    UPDATE public.vehicle_photo_links
    SET position = 0
    WHERE vehicle_id = v_vehicle_id 
    AND photo_id = p_photo_id::uuid;

    -- Réorganiser toutes les autres photos séquentiellement
    WITH numbered_photos AS (
        SELECT 
            photo_id,
            ROW_NUMBER() OVER (ORDER BY position, photo_id) AS new_position
        FROM public.vehicle_photo_links
        WHERE vehicle_id = v_vehicle_id
        AND photo_id != p_photo_id::uuid
    )
    UPDATE public.vehicle_photo_links vpl
    SET position = np.new_position
    FROM numbered_photos np
    WHERE vpl.vehicle_id = v_vehicle_id
    AND vpl.photo_id = np.photo_id;

    RETURN QUERY
    SELECT * FROM vehicle_photo_links 
    WHERE vehicle_id = v_vehicle_id
    ORDER BY position;
END;
$$;

-- Fonction pour supprimer une photo
CREATE OR REPLACE FUNCTION delete_vehicle_photo(
    p_exposed_vehicle_id VARCHAR,
    p_photo_id VARCHAR
) RETURNS SETOF vehicle_photo_links
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_position INTEGER;
BEGIN
    -- Cast des paramètres en UUID
    SELECT position INTO v_deleted_position
    FROM public.vehicle_photo_links
    WHERE vehicle_id = p_exposed_vehicle_id::UUID 
    AND photo_id = p_photo_id::UUID;

    -- Supprimer le lien avec cast en UUID
    DELETE FROM public.vehicle_photo_links
    WHERE vehicle_id = p_exposed_vehicle_id::UUID 
    AND photo_id = p_photo_id::UUID;

    -- Réorganiser les positions des photos restantes
    UPDATE public.vehicle_photo_links
    SET position = position - 1
    WHERE vehicle_id = p_exposed_vehicle_id::UUID
    AND position > v_deleted_position;
    
    -- Nettoyer les photos orphelines
    DELETE FROM public.photo_references
    WHERE id = p_photo_id::UUID
    AND NOT EXISTS (
        SELECT 1 FROM public.vehicle_photo_links
        WHERE photo_id = p_photo_id::UUID
    );

    RETURN QUERY
    SELECT * FROM vehicle_photo_links 
    WHERE vehicle_id = p_exposed_vehicle_id::UUID
    ORDER BY position;
END;
$$;

-- Fonction pour supprimer toutes les photos d'un véhicule
CREATE OR REPLACE FUNCTION delete_all_vehicle_photos(
    p_exposed_vehicle_id VARCHAR
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Supprimer tous les liens avec cast en UUID
    DELETE FROM public.vehicle_photo_links
    WHERE vehicle_id = p_exposed_vehicle_id::UUID;
    
    -- Nettoyer les photos orphelines
    DELETE FROM public.photo_references pr
    WHERE NOT EXISTS (
        SELECT 1 FROM public.vehicle_photo_links vpl
        WHERE vpl.photo_id = pr.id
    );

    RETURN true;
END;
$$;