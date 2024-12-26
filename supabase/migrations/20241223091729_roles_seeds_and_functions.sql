-- Seed initial roles if they don't exist
INSERT INTO roles (name)
SELECT name
FROM (
    VALUES 
        ('superadmin'),
        ('admin'),
        ('user')
) AS new_roles(name)
WHERE NOT EXISTS (
    SELECT 1 FROM roles 
    WHERE roles.name = new_roles.name
);

-- Fonction pour vérifier si un utilisateur a un rôle spécifique
CREATE OR REPLACE FUNCTION public.has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = role_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les rôles d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid UUID)
RETURNS TABLE (role_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name
    FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour ajouter un rôle à un utilisateur
CREATE OR REPLACE FUNCTION public.assign_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    role_id BIGINT;
BEGIN
    -- Vérifier si l'utilisateur qui exécute est superadmin
    IF NOT public.has_role('superadmin') THEN
        RAISE EXCEPTION 'Only superadmin can assign roles';
    END IF;

    -- Récupérer l'ID du rôle
    SELECT id INTO role_id FROM roles WHERE name = role_name;
    IF role_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Insérer le rôle s'il n'existe pas déjà
    INSERT INTO user_roles (user_id, role_id)
    VALUES (user_uuid, role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour retirer un rôle à un utilisateur
CREATE OR REPLACE FUNCTION public.remove_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    role_id BIGINT;
BEGIN
    -- Vérifier si l'utilisateur qui exécute est superadmin
    IF NOT public.has_role('superadmin') THEN
        RAISE EXCEPTION 'Only superadmin can remove roles';
    END IF;

    -- Empêcher la suppression du dernier superadmin
    IF role_name = 'superadmin' THEN
        IF (
            SELECT COUNT(*)
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name = 'superadmin'
        ) <= 1 THEN
            RAISE EXCEPTION 'Cannot remove the last superadmin';
        END IF;
    END IF;

    -- Récupérer l'ID du rôle
    SELECT id INTO role_id FROM roles WHERE name = role_name;
    IF role_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Supprimer le rôle
    DELETE FROM user_roles 
    WHERE user_id = user_uuid 
    AND role_id = role_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;