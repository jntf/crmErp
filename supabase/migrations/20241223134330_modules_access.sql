-- Create modules access tables
CREATE TABLE IF NOT EXISTS module_role_access (
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    module_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, module_name)
);

CREATE TABLE IF NOT EXISTS module_user_access (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    module_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, module_name)
);

-- RLS Policies
ALTER TABLE module_role_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_user_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Module access is viewable by authenticated users"
ON module_role_access FOR SELECT TO authenticated USING (true);

CREATE POLICY "Module user access is viewable by authenticated users"
ON module_user_access FOR SELECT TO authenticated USING (true);

-- Function to check module access
CREATE OR REPLACE FUNCTION public.has_module_access(module_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check user-specific access first
    RETURN EXISTS (
        SELECT 1 FROM module_user_access
        WHERE user_id = auth.uid() AND module_name = $1
    ) OR EXISTS (
        -- Check role-based access if no user-specific access
        SELECT 1 FROM module_role_access mra 
        JOIN user_roles ur ON mra.role_id = ur.role_id
        WHERE ur.user_id = auth.uid() AND mra.module_name = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all accessible modules
CREATE OR REPLACE FUNCTION public.get_accessible_modules()
RETURNS TABLE (module_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT mra.module_name FROM module_role_access mra 
    JOIN user_roles ur ON mra.role_id = ur.role_id
    WHERE ur.user_id = auth.uid()
    UNION
    SELECT DISTINCT mua.module_name FROM module_user_access mua
    WHERE mua.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE module_role_access 
    ALTER COLUMN module_name TYPE TEXT;

ALTER TABLE module_user_access 
    ALTER COLUMN module_name TYPE TEXT;