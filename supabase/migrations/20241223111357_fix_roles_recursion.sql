-- Supprimer d'abord toutes les politiques existantes
DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON roles;
DROP POLICY IF EXISTS "Roles are modifiable by superadmins only" ON roles;
DROP POLICY IF EXISTS "User roles are viewable by authenticated users" ON user_roles;
DROP POLICY IF EXISTS "User roles are modifiable by superadmins only" ON user_roles;

-- Créer une fonction pour vérifier le rôle superadmin sans récursion
CREATE OR REPLACE FUNCTION is_superadmin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id 
        WHERE ur.user_id = user_uuid 
        AND r.name = 'superadmin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer les politiques
CREATE POLICY "Roles are viewable by authenticated users"
ON roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Roles are modifiable by superadmins only"
ON roles FOR ALL
TO authenticated
USING (
    is_superadmin(auth.uid())
);

CREATE POLICY "User roles are viewable by authenticated users"
ON user_roles FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);

CREATE POLICY "User roles are modifiable by superadmins only"
ON user_roles FOR ALL
TO authenticated
USING (
    is_superadmin(auth.uid())
);