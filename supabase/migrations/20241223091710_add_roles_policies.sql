-- Add policies for roles table
DO $$
BEGIN
    -- Lecture pour tous les utilisateurs authentifiés
    DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON roles;
    CREATE POLICY "Roles are viewable by authenticated users"
    ON roles FOR SELECT
    TO authenticated
    USING (true);

    -- Modification uniquement pour superadmin
    DROP POLICY IF EXISTS "Roles are modifiable by superadmins only" ON roles;
    CREATE POLICY "Roles are modifiable by superadmins only"
    ON roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role_id = (SELECT id FROM roles WHERE name = 'superadmin' LIMIT 1)
        )
    );

    -- Policies for user_roles table
    DROP POLICY IF EXISTS "User roles are viewable by authenticated users" ON user_roles;
    CREATE POLICY "User roles are viewable by authenticated users"
    ON user_roles FOR SELECT
    TO authenticated
    USING (
        -- Permet à l'utilisateur de voir ses propres rôles
        user_id = auth.uid()
    );

    -- Modification pour superadmin uniquement
    DROP POLICY IF EXISTS "User roles are modifiable by superadmins only" ON user_roles;
    CREATE POLICY "User roles are modifiable by superadmins only"
    ON user_roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role_id = (SELECT id FROM roles WHERE name = 'superadmin' LIMIT 1)
        )
    );
END
$$;