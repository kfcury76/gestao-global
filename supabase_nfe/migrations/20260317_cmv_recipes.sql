-- =====================================================
-- Migration: CMV - Receitas de Produtos (BOM)
-- Data: 2026-03-17
-- Descrição: Sistema de receitas (Bill of Materials) com cálculo automático de CMV
-- =====================================================

-- =====================================================
-- 1. TABELA: product_recipes
-- =====================================================
CREATE TABLE IF NOT EXISTS product_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  product_code TEXT UNIQUE, -- Código SKU (ex: MARM-P-FRANGO)
  category TEXT NOT NULL CHECK (category IN ('marmita', 'prato', 'lanche', 'bebida', 'sobremesa', 'combo', 'outro')),
  size TEXT CHECK (size IN ('P', 'M', 'G', 'GG', 'unico')),
  yield_quantity INT DEFAULT 1 CHECK (yield_quantity > 0), -- Rendimento (quantas unidades a receita produz)
  description TEXT,
  preparation_notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_recipes_category ON product_recipes(category);
CREATE INDEX idx_recipes_active ON product_recipes(active);
CREATE INDEX idx_recipes_product_code ON product_recipes(product_code);

COMMENT ON TABLE product_recipes IS 'Receitas de produtos (Bill of Materials)';
COMMENT ON COLUMN product_recipes.yield_quantity IS 'Quantidade de unidades que a receita produz (ex: 1 receita = 10 marmitas)';

-- =====================================================
-- 2. TABELA: recipe_items
-- =====================================================
CREATE TABLE IF NOT EXISTS recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES product_recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL, -- Deve ser compatível com ingredients.unit
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: Não permitir ingrediente duplicado na mesma receita
  UNIQUE(recipe_id, ingredient_id)
);

-- Índices
CREATE INDEX idx_recipe_items_recipe ON recipe_items(recipe_id);
CREATE INDEX idx_recipe_items_ingredient ON recipe_items(ingredient_id);

COMMENT ON TABLE recipe_items IS 'Itens (ingredientes) de cada receita';

-- =====================================================
-- 3. FUNCTION: Calcular CMV de uma receita
-- =====================================================
CREATE OR REPLACE FUNCTION get_recipe_cmv(p_recipe_id UUID)
RETURNS TABLE (
  ingredient_name TEXT,
  quantity DECIMAL(10,3),
  unit TEXT,
  price_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.name::TEXT,
    ri.quantity,
    ri.unit::TEXT,
    COALESCE(i.current_price, 0)::DECIMAL(10,2) AS price_per_unit,
    (ri.quantity * COALESCE(i.current_price, 0))::DECIMAL(10,2) AS total_cost
  FROM recipe_items ri
  JOIN ingredients i ON ri.ingredient_id = i.id
  WHERE ri.recipe_id = p_recipe_id
  ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_recipe_cmv IS 'Retorna detalhamento de CMV de uma receita (ingrediente a ingrediente)';

-- =====================================================
-- 4. FUNCTION: Calcular CMV total de uma receita
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_recipe_total_cmv(p_recipe_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_total DECIMAL(10,2);
BEGIN
  SELECT SUM(ri.quantity * COALESCE(i.current_price, 0))
  INTO v_total
  FROM recipe_items ri
  JOIN ingredients i ON ri.ingredient_id = i.id
  WHERE ri.recipe_id = p_recipe_id;

  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. VIEW: product_cmv (CMV consolidado por produto)
-- =====================================================
CREATE OR REPLACE VIEW product_cmv AS
SELECT
  pr.id AS recipe_id,
  pr.product_name,
  pr.product_code,
  pr.category,
  pr.size,
  pr.yield_quantity,
  calculate_recipe_total_cmv(pr.id) AS total_cmv,
  (calculate_recipe_total_cmv(pr.id) / pr.yield_quantity)::DECIMAL(10,2) AS cmv_per_unit,
  (SELECT COUNT(*) FROM recipe_items WHERE recipe_id = pr.id) AS total_ingredients,
  pr.active,
  pr.created_at,
  pr.updated_at
FROM product_recipes pr;

COMMENT ON VIEW product_cmv IS 'CMV consolidado de todos os produtos';

-- =====================================================
-- 6. FUNCTION: Obter receita completa (para exibição)
-- =====================================================
CREATE OR REPLACE FUNCTION get_recipe_detail(p_recipe_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'recipe', (
      SELECT row_to_json(pr)
      FROM product_recipes pr
      WHERE pr.id = p_recipe_id
    ),
    'items', (
      SELECT json_agg(
        json_build_object(
          'ingredient_id', ri.ingredient_id,
          'ingredient_name', i.name,
          'quantity', ri.quantity,
          'unit', ri.unit,
          'price_per_unit', i.current_price,
          'total_cost', (ri.quantity * COALESCE(i.current_price, 0))::DECIMAL(10,2),
          'notes', ri.notes
        )
      )
      FROM recipe_items ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = p_recipe_id
    ),
    'total_cmv', calculate_recipe_total_cmv(p_recipe_id)
  )
  INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_recipe_detail IS 'Retorna receita completa com itens e CMV total (formato JSON)';

-- =====================================================
-- 7. TRIGGER: Atualizar timestamp em product_recipes
-- =====================================================
CREATE OR REPLACE FUNCTION update_recipe_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_timestamp
  BEFORE UPDATE ON product_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_timestamp();

-- =====================================================
-- 8. SEEDS: Receitas de Exemplo
-- =====================================================

-- Receita 1: Marmita P - Frango Grelhado
DO $$
DECLARE
  v_recipe_id UUID;
  v_frango_id UUID;
  v_arroz_id UUID;
  v_feijao_id UUID;
  v_batata_id UUID;
  v_alface_id UUID;
  v_tomate_id UUID;
  v_marmita_p_id UUID;
BEGIN
  -- Criar receita
  INSERT INTO product_recipes (product_name, product_code, category, size, yield_quantity, description, preparation_notes)
  VALUES (
    'Marmita P - Frango Grelhado',
    'MARM-P-FRANGO',
    'marmita',
    'P',
    1,
    'Marmita pequena com frango grelhado, arroz, feijão e salada',
    'Grelhar o frango com temperos. Servir com arroz branco e feijão carioca.'
  )
  RETURNING id INTO v_recipe_id;

  -- Obter IDs dos ingredientes
  SELECT id INTO v_frango_id FROM ingredients WHERE name = 'Frango (peito)';
  SELECT id INTO v_arroz_id FROM ingredients WHERE name = 'Arroz (branco)';
  SELECT id INTO v_feijao_id FROM ingredients WHERE name = 'Feijão (carioca)';
  SELECT id INTO v_batata_id FROM ingredients WHERE name = 'Batata (inglesa)';
  SELECT id INTO v_alface_id FROM ingredients WHERE name = 'Alface (americana)';
  SELECT id INTO v_tomate_id FROM ingredients WHERE name = 'Tomate';
  SELECT id INTO v_marmita_p_id FROM ingredients WHERE name = 'Marmita P (500ml)';

  -- Inserir itens da receita
  INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, notes) VALUES
    (v_recipe_id, v_frango_id, 0.150, 'kg', '150g de peito de frango'),
    (v_recipe_id, v_arroz_id, 0.100, 'kg', '100g de arroz cozido'),
    (v_recipe_id, v_feijao_id, 0.080, 'kg', '80g de feijão cozido'),
    (v_recipe_id, v_batata_id, 0.100, 'kg', '100g de batata cozida'),
    (v_recipe_id, v_alface_id, 0.050, 'kg', '50g de alface'),
    (v_recipe_id, v_tomate_id, 0.050, 'kg', '50g de tomate'),
    (v_recipe_id, v_marmita_p_id, 1, 'unidade', 'Embalagem');
END $$;

-- Receita 2: Marmita M - Carne de Panela
DO $$
DECLARE
  v_recipe_id UUID;
  v_carne_id UUID;
  v_arroz_id UUID;
  v_feijao_id UUID;
  v_batata_doce_id UUID;
  v_cenoura_id UUID;
  v_alface_id UUID;
  v_marmita_m_id UUID;
BEGIN
  -- Criar receita
  INSERT INTO product_recipes (product_name, product_code, category, size, yield_quantity, description, preparation_notes)
  VALUES (
    'Marmita M - Carne de Panela',
    'MARM-M-CARNE',
    'marmita',
    'M',
    1,
    'Marmita média com carne de panela, arroz, feijão, batata doce e salada',
    'Carne de panela com molho. Servir com arroz, feijão preto e batata doce cozida.'
  )
  RETURNING id INTO v_recipe_id;

  -- Obter IDs dos ingredientes
  SELECT id INTO v_carne_id FROM ingredients WHERE name = 'Carne bovina (patinho)';
  SELECT id INTO v_arroz_id FROM ingredients WHERE name = 'Arroz (branco)';
  SELECT id INTO v_feijao_id FROM ingredients WHERE name = 'Feijão (preto)';
  SELECT id INTO v_batata_doce_id FROM ingredients WHERE name = 'Batata doce';
  SELECT id INTO v_cenoura_id FROM ingredients WHERE name = 'Cenoura';
  SELECT id INTO v_alface_id FROM ingredients WHERE name = 'Alface (americana)';
  SELECT id INTO v_marmita_m_id FROM ingredients WHERE name = 'Marmita M (750ml)';

  -- Inserir itens da receita
  INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, notes) VALUES
    (v_recipe_id, v_carne_id, 0.200, 'kg', '200g de carne de panela'),
    (v_recipe_id, v_arroz_id, 0.150, 'kg', '150g de arroz cozido'),
    (v_recipe_id, v_feijao_id, 0.120, 'kg', '120g de feijão preto'),
    (v_recipe_id, v_batata_doce_id, 0.120, 'kg', '120g de batata doce'),
    (v_recipe_id, v_cenoura_id, 0.060, 'kg', '60g de cenoura cozida'),
    (v_recipe_id, v_alface_id, 0.050, 'kg', '50g de alface'),
    (v_recipe_id, v_marmita_m_id, 1, 'unidade', 'Embalagem');
END $$;

-- =====================================================
-- 9. RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;

-- Políticas: Authenticated users podem ler
CREATE POLICY "Authenticated users can read recipes"
  ON product_recipes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read recipe items"
  ON recipe_items FOR SELECT
  USING (auth.role() = 'authenticated');

-- Políticas: Service role full access
CREATE POLICY "Service role full access recipes"
  ON product_recipes FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access recipe items"
  ON recipe_items FOR ALL
  USING (auth.role() = 'service_role');

-- Políticas: Authenticated users podem inserir/atualizar
CREATE POLICY "Authenticated users can insert recipes"
  ON product_recipes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update recipes"
  ON product_recipes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert recipe items"
  ON recipe_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update recipe items"
  ON recipe_items FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete recipe items"
  ON recipe_items FOR DELETE
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 10. GRANTS
-- =====================================================
GRANT SELECT ON product_recipes TO anon, authenticated;
GRANT SELECT ON recipe_items TO anon, authenticated;
GRANT INSERT, UPDATE ON product_recipes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON recipe_items TO authenticated;
GRANT SELECT ON product_cmv TO anon, authenticated;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
