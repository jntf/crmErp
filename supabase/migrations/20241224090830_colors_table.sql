-- migration: 20241224090830_colors_table.sql

-- Create colors table
CREATE TABLE IF NOT EXISTS colors (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(50) NOT NULL,
    hex_code VARCHAR(7) NOT NULL,
    background_class VARCHAR(50) NOT NULL,
    text_class VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les variantes de couleurs
CREATE TABLE IF NOT EXISTS color_variants (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    color_id BIGINT NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_colors_updated_at 
    BEFORE UPDATE ON colors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_color_variants_updated_at 
    BEFORE UPDATE ON color_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertion des données initiales
INSERT INTO colors (name, hex_code, background_class, text_class) VALUES
    ('BLANC', '#FFFFFF', 'bg-white', 'text-black'),
    ('NOIR', '#000000', 'bg-black', 'text-white'),
    ('GRIS', '#808080', 'bg-gray-500', 'text-white'),
    ('BLEU', '#0000FF', 'bg-blue-600', 'text-white'),
    ('ROUGE', '#FF0000', 'bg-red-600', 'text-white'),
    ('VERT', '#008000', 'bg-green-600', 'text-white'),
    ('MARRON', '#800000', 'bg-amber-900', 'text-white');

-- Insertion des variantes
-- BLANC
INSERT INTO color_variants (color_id, variant_name)
SELECT id, unnest(ARRAY['blanc', 'white', 'crystal white'])
FROM colors WHERE name = 'BLANC';

-- NOIR
INSERT INTO color_variants (color_id, variant_name)
SELECT id, unnest(ARRAY['noir', 'black', 'deep black'])
FROM colors WHERE name = 'NOIR';

-- GRIS
INSERT INTO color_variants (color_id, variant_name)
SELECT id, unnest(ARRAY['gris', 'grey', 'gray', 'gris manhattan', 'gris foncé', 'gris clair'])
FROM colors WHERE name = 'GRIS';

-- BLEU
INSERT INTO color_variants (color_id, variant_name)
SELECT id, unnest(ARRAY['bleu', 'blue', 'bleu marine', 'bleu nuit'])
FROM colors WHERE name = 'BLEU';

-- ROUGE
INSERT INTO color_variants (color_id, variant_name)
SELECT id, unnest(ARRAY['rouge', 'red', 'rouge passion', 'rouge intense'])
FROM colors WHERE name = 'ROUGE';

-- VERT
INSERT INTO color_variants (color_id, variant_name)
SELECT id, unnest(ARRAY['vert', 'green', 'vert foncé', 'vert emeraude'])
FROM colors WHERE name = 'VERT';

-- MARRON
INSERT INTO color_variants (color_id, variant_name)
SELECT id, unnest(ARRAY['marron', 'brown', 'marron glacé'])
FROM colors WHERE name = 'MARRON';