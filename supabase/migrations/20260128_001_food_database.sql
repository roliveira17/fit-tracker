-- ============================================
-- Migration: Food Database (TBCA) + Barcode Cache
-- Created: 2026-01-27
-- Description: Tabelas para busca de alimentos brasileiros
-- ============================================

-- Habilitar extensão para busca fuzzy
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================
-- Tabela: food_database (TBCA - 5.668 alimentos)
-- ============================================

CREATE TABLE IF NOT EXISTS food_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  tbca_id VARCHAR(20) UNIQUE,            -- ID original da TBCA (ex: C0113T)
  name VARCHAR(500) NOT NULL,             -- Nome do alimento
  name_normalized VARCHAR(500) NOT NULL,  -- Nome sem acentos, lowercase
  category VARCHAR(100),                  -- Categoria (Leguminosas, Carnes, etc)

  -- Macronutrientes (por 100g)
  energy_kcal DECIMAL(8,2),
  protein_g DECIMAL(8,2),
  carbs_g DECIMAL(8,2),
  fat_g DECIMAL(8,2),
  fiber_g DECIMAL(8,2),

  -- Micronutrientes (por 100g)
  sodium_mg DECIMAL(8,2),
  potassium_mg DECIMAL(8,2),
  calcium_mg DECIMAL(8,2),
  iron_mg DECIMAL(8,2),
  zinc_mg DECIMAL(8,2),
  magnesium_mg DECIMAL(8,2),
  phosphorus_mg DECIMAL(8,2),

  -- Vitaminas
  vitamin_a_mcg DECIMAL(8,2),
  vitamin_c_mg DECIMAL(8,2),
  vitamin_d_mcg DECIMAL(8,2),
  vitamin_b12_mcg DECIMAL(8,2),
  folate_mcg DECIMAL(8,2),

  -- Outros
  cholesterol_mg DECIMAL(8,2),
  saturated_fat_g DECIMAL(8,2),

  -- Metadados
  source VARCHAR(50) DEFAULT 'tbca',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_food_name_trgm ON food_database USING gin (name_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_food_category ON food_database (category);
CREATE INDEX IF NOT EXISTS idx_food_tbca_id ON food_database (tbca_id);

-- ============================================
-- Tabela: barcode_cache (Open Food Facts)
-- ============================================

CREATE TABLE IF NOT EXISTS barcode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  barcode VARCHAR(50) UNIQUE NOT NULL,   -- EAN-13, UPC, etc

  -- Dados do produto
  product_name VARCHAR(500),
  brand VARCHAR(255),
  quantity VARCHAR(100),                  -- "200g", "1L"

  -- Nutrição (por 100g)
  energy_kcal DECIMAL(8,2),
  protein_g DECIMAL(8,2),
  carbs_g DECIMAL(8,2),
  fat_g DECIMAL(8,2),
  fiber_g DECIMAL(8,2),
  sodium_mg DECIMAL(8,2),
  sugar_g DECIMAL(8,2),

  -- Classificações
  nutriscore VARCHAR(1),                  -- A, B, C, D, E
  nova_group INTEGER,                     -- 1, 2, 3, 4

  -- Imagem
  image_url TEXT,

  -- Metadados
  source VARCHAR(50) DEFAULT 'openfoodfacts',
  hit_count INTEGER DEFAULT 1,            -- Quantas vezes foi buscado
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);

-- Índice para busca por barcode
CREATE UNIQUE INDEX IF NOT EXISTS idx_barcode ON barcode_cache (barcode);

-- ============================================
-- Função: search_food (busca fuzzy)
-- ============================================

CREATE OR REPLACE FUNCTION search_food(
  search_term TEXT,
  limit_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  tbca_id VARCHAR,
  name VARCHAR,
  category VARCHAR,
  energy_kcal DECIMAL,
  protein_g DECIMAL,
  carbs_g DECIMAL,
  fat_g DECIMAL,
  fiber_g DECIMAL,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.tbca_id,
    f.name,
    f.category,
    f.energy_kcal,
    f.protein_g,
    f.carbs_g,
    f.fat_g,
    f.fiber_g,
    similarity(f.name_normalized, lower(unaccent(search_term))) as similarity
  FROM food_database f
  WHERE
    f.name_normalized % lower(unaccent(search_term))
    OR f.name_normalized ILIKE '%' || lower(unaccent(search_term)) || '%'
  ORDER BY similarity DESC, f.name
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Função: get_food_by_id
-- ============================================

CREATE OR REPLACE FUNCTION get_food_by_tbca_id(food_id VARCHAR)
RETURNS TABLE (
  id UUID,
  tbca_id VARCHAR,
  name VARCHAR,
  category VARCHAR,
  energy_kcal DECIMAL,
  protein_g DECIMAL,
  carbs_g DECIMAL,
  fat_g DECIMAL,
  fiber_g DECIMAL,
  sodium_mg DECIMAL,
  calcium_mg DECIMAL,
  iron_mg DECIMAL,
  vitamin_c_mg DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.tbca_id,
    f.name,
    f.category,
    f.energy_kcal,
    f.protein_g,
    f.carbs_g,
    f.fat_g,
    f.fiber_g,
    f.sodium_mg,
    f.calcium_mg,
    f.iron_mg,
    f.vitamin_c_mg
  FROM food_database f
  WHERE f.tbca_id = food_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Função: get_or_create_barcode
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_barcode(
  p_barcode VARCHAR,
  p_product_name VARCHAR DEFAULT NULL,
  p_brand VARCHAR DEFAULT NULL,
  p_energy_kcal DECIMAL DEFAULT NULL,
  p_protein_g DECIMAL DEFAULT NULL,
  p_carbs_g DECIMAL DEFAULT NULL,
  p_fat_g DECIMAL DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL
)
RETURNS barcode_cache AS $$
DECLARE
  result barcode_cache;
BEGIN
  -- Tenta encontrar existente
  SELECT * INTO result FROM barcode_cache WHERE barcode = p_barcode;

  IF FOUND THEN
    -- Incrementa hit count
    UPDATE barcode_cache
    SET hit_count = hit_count + 1, updated_at = NOW()
    WHERE barcode = p_barcode;
    RETURN result;
  END IF;

  -- Se passou dados, insere novo
  IF p_product_name IS NOT NULL THEN
    INSERT INTO barcode_cache (
      barcode, product_name, brand, energy_kcal,
      protein_g, carbs_g, fat_g, image_url
    ) VALUES (
      p_barcode, p_product_name, p_brand, p_energy_kcal,
      p_protein_g, p_carbs_g, p_fat_g, p_image_url
    )
    RETURNING * INTO result;
    RETURN result;
  END IF;

  -- Não encontrou e não tem dados para criar
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS Policies (barcode_cache é público para leitura)
-- ============================================

-- food_database: leitura pública (dados oficiais)
ALTER TABLE food_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_database_select_policy" ON food_database
  FOR SELECT USING (true);

-- barcode_cache: leitura pública, escrita autenticada
ALTER TABLE barcode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "barcode_cache_select_policy" ON barcode_cache
  FOR SELECT USING (true);

CREATE POLICY "barcode_cache_insert_policy" ON barcode_cache
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "barcode_cache_update_policy" ON barcode_cache
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- Comentários
-- ============================================

COMMENT ON TABLE food_database IS 'Base de alimentos TBCA (5.668 alimentos brasileiros)';
COMMENT ON TABLE barcode_cache IS 'Cache de produtos escaneados via Open Food Facts';
COMMENT ON FUNCTION search_food IS 'Busca fuzzy de alimentos com pg_trgm';
