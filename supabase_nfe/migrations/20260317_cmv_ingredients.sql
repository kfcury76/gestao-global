-- =====================================================
-- Migration: CMV - Ingredientes e Histórico de Preços
-- Data: 2026-03-17
-- Descrição: Sistema de controle de ingredientes com histórico de preços
-- =====================================================

-- =====================================================
-- 1. TABELA: ingredients
-- =====================================================
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('proteina', 'acompanhamento', 'embalagem', 'tempero', 'bebida', 'sobremesa', 'outro')),
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'g', 'litro', 'ml', 'unidade', 'pacote', 'duzia')),
  current_price DECIMAL(10,2),
  avg_price_3m DECIMAL(10,2), -- Média móvel dos últimos 3 meses
  supplier_name TEXT,
  supplier_contact TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_active ON ingredients(active);
CREATE INDEX idx_ingredients_name ON ingredients(name);

COMMENT ON TABLE ingredients IS 'Cadastro de ingredientes com preços e fornecedores';
COMMENT ON COLUMN ingredients.avg_price_3m IS 'Média móvel calculada automaticamente dos últimos 90 dias';

-- =====================================================
-- 2. TABELA: ingredient_price_history
-- =====================================================
CREATE TABLE IF NOT EXISTS ingredient_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  supplier_name TEXT,
  invoice_number TEXT, -- Número da NF-e
  invoice_date DATE,
  fiscal_invoice_id UUID, -- FK para NF-e (será adicionada depois quando a tabela fiscal_invoices existir)
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'nfe', 'import')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_price_history_ingredient ON ingredient_price_history(ingredient_id);
CREATE INDEX idx_price_history_date ON ingredient_price_history(invoice_date DESC);
-- CREATE INDEX idx_price_history_fiscal_invoice ON ingredient_price_history(fiscal_invoice_id); -- Desabilitado: FK será adicionada depois

COMMENT ON TABLE ingredient_price_history IS 'Histórico de compras de ingredientes (manual + NF-e)';

-- =====================================================
-- 3. FUNCTION: Calcular média de preço (3 meses)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_avg_price_3m(p_ingredient_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_avg DECIMAL(10,2);
BEGIN
  SELECT AVG(price)::DECIMAL(10,2)
  INTO v_avg
  FROM ingredient_price_history
  WHERE ingredient_id = p_ingredient_id
    AND invoice_date >= CURRENT_DATE - INTERVAL '90 days';

  RETURN COALESCE(v_avg, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. TRIGGER: Atualizar preço atual e média ao inserir histórico
-- =====================================================
CREATE OR REPLACE FUNCTION update_ingredient_prices()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar current_price com o preço mais recente
  UPDATE ingredients
  SET
    current_price = NEW.price,
    avg_price_3m = calculate_avg_price_3m(NEW.ingredient_id),
    updated_at = NOW()
  WHERE id = NEW.ingredient_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ingredient_prices
  AFTER INSERT ON ingredient_price_history
  FOR EACH ROW
  EXECUTE FUNCTION update_ingredient_prices();

-- =====================================================
-- 5. FUNCTION: Obter histórico de preços de um ingrediente
-- =====================================================
CREATE OR REPLACE FUNCTION get_ingredient_price_history(
  p_ingredient_id UUID,
  p_months INT DEFAULT 6
)
RETURNS TABLE (
  date DATE,
  price DECIMAL(10,2),
  quantity DECIMAL(10,3),
  supplier TEXT,
  invoice TEXT,
  source TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    invoice_date::DATE,
    price,
    quantity,
    supplier_name,
    invoice_number,
    source
  FROM ingredient_price_history
  WHERE ingredient_id = p_ingredient_id
    AND invoice_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
  ORDER BY invoice_date DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. VIEW: Resumo de ingredientes com última compra
-- =====================================================
CREATE OR REPLACE VIEW ingredient_summary AS
SELECT
  i.id,
  i.name,
  i.category,
  i.unit,
  i.current_price,
  i.avg_price_3m,
  i.supplier_name,
  (SELECT COUNT(*)
   FROM ingredient_price_history h
   WHERE h.ingredient_id = i.id) AS total_purchases,
  (SELECT MAX(invoice_date)
   FROM ingredient_price_history h
   WHERE h.ingredient_id = i.id) AS last_purchase_date,
  (SELECT price
   FROM ingredient_price_history h
   WHERE h.ingredient_id = i.id
   ORDER BY invoice_date DESC
   LIMIT 1) AS last_purchase_price,
  i.active,
  i.created_at,
  i.updated_at
FROM ingredients i;

COMMENT ON VIEW ingredient_summary IS 'Resumo de ingredientes com estatísticas de compra';

-- =====================================================
-- 7. SEEDS: Ingredientes Iniciais (23 itens)
-- =====================================================
INSERT INTO ingredients (name, category, unit, current_price, supplier_name, notes) VALUES
-- Proteínas (8)
('Frango (peito)', 'proteina', 'kg', 14.90, 'Fornecedor A', 'Peito de frango sem osso'),
('Frango (coxa e sobrecoxa)', 'proteina', 'kg', 12.50, 'Fornecedor A', 'Coxa e sobrecoxa desossada'),
('Carne bovina (patinho)', 'proteina', 'kg', 28.90, 'Fornecedor B', 'Patinho para marmita'),
('Carne bovina (contrafilé)', 'proteina', 'kg', 35.00, 'Fornecedor B', 'Contrafilé'),
('Carne suína (lombo)', 'proteina', 'kg', 22.00, 'Fornecedor B', 'Lombo suíno'),
('Peixe (tilápia)', 'proteina', 'kg', 18.50, 'Fornecedor C', 'Filé de tilápia'),
('Linguiça (calabresa)', 'proteina', 'kg', 16.00, 'Fornecedor A', 'Linguiça calabresa'),
('Ovo', 'proteina', 'duzia', 8.50, 'Fornecedor D', 'Ovos brancos grandes'),

-- Acompanhamentos (9)
('Arroz (branco)', 'acompanhamento', 'kg', 4.50, 'Fornecedor E', 'Arroz tipo 1'),
('Feijão (carioca)', 'acompanhamento', 'kg', 7.20, 'Fornecedor E', 'Feijão carioca tipo 1'),
('Feijão (preto)', 'acompanhamento', 'kg', 7.80, 'Fornecedor E', 'Feijão preto'),
('Batata (inglesa)', 'acompanhamento', 'kg', 3.50, 'Fornecedor F', 'Batata inglesa'),
('Batata doce', 'acompanhamento', 'kg', 4.20, 'Fornecedor F', 'Batata doce'),
('Macarrão (espaguete)', 'acompanhamento', 'kg', 6.00, 'Fornecedor E', 'Macarrão espaguete'),
('Alface (americana)', 'acompanhamento', 'unidade', 2.50, 'Fornecedor F', 'Alface americana'),
('Tomate', 'acompanhamento', 'kg', 5.00, 'Fornecedor F', 'Tomate'),
('Cenoura', 'acompanhamento', 'kg', 3.80, 'Fornecedor F', 'Cenoura'),

-- Embalagens (3)
('Marmita P (500ml)', 'embalagem', 'unidade', 0.85, 'Fornecedor G', 'Marmita descartável 500ml'),
('Marmita M (750ml)', 'embalagem', 'unidade', 1.10, 'Fornecedor G', 'Marmita descartável 750ml'),
('Marmita G (1000ml)', 'embalagem', 'unidade', 1.35, 'Fornecedor G', 'Marmita descartável 1000ml'),

-- Temperos e Insumos (3)
('Óleo (soja)', 'tempero', 'litro', 8.50, 'Fornecedor E', 'Óleo de soja'),
('Sal (refinado)', 'tempero', 'kg', 1.50, 'Fornecedor E', 'Sal refinado'),
('Alho', 'tempero', 'kg', 25.00, 'Fornecedor F', 'Alho in natura')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 8. SEEDS: Histórico de Preços (exemplo - últimos 6 meses)
-- =====================================================
-- Inserir histórico para 3 ingredientes principais (Frango, Carne, Arroz)

-- Frango (peito) - 6 compras nos últimos 6 meses
INSERT INTO ingredient_price_history (ingredient_id, price, quantity, unit, supplier_name, invoice_date, source)
SELECT
  id,
  price,
  qty,
  'kg',
  'Fornecedor A',
  date,
  'manual'
FROM ingredients,
  (VALUES
    (CURRENT_DATE - INTERVAL '180 days', 13.50, 50.0),
    (CURRENT_DATE - INTERVAL '150 days', 14.00, 60.0),
    (CURRENT_DATE - INTERVAL '120 days', 14.20, 55.0),
    (CURRENT_DATE - INTERVAL '90 days', 14.50, 50.0),
    (CURRENT_DATE - INTERVAL '60 days', 14.80, 65.0),
    (CURRENT_DATE - INTERVAL '30 days', 14.90, 70.0)
  ) AS history(date, price, qty)
WHERE name = 'Frango (peito)';

-- Carne bovina (patinho) - 6 compras
INSERT INTO ingredient_price_history (ingredient_id, price, quantity, unit, supplier_name, invoice_date, source)
SELECT
  id,
  price,
  qty,
  'kg',
  'Fornecedor B',
  date,
  'manual'
FROM ingredients,
  (VALUES
    (CURRENT_DATE - INTERVAL '180 days', 26.00, 30.0),
    (CURRENT_DATE - INTERVAL '150 days', 26.50, 35.0),
    (CURRENT_DATE - INTERVAL '120 days', 27.00, 32.0),
    (CURRENT_DATE - INTERVAL '90 days', 27.80, 30.0),
    (CURRENT_DATE - INTERVAL '60 days', 28.50, 40.0),
    (CURRENT_DATE - INTERVAL '30 days', 28.90, 45.0)
  ) AS history(date, price, qty)
WHERE name = 'Carne bovina (patinho)';

-- Arroz (branco) - 6 compras
INSERT INTO ingredient_price_history (ingredient_id, price, quantity, unit, supplier_name, invoice_date, source)
SELECT
  id,
  price,
  qty,
  'kg',
  'Fornecedor E',
  date,
  'manual'
FROM ingredients,
  (VALUES
    (CURRENT_DATE - INTERVAL '180 days', 4.00, 100.0),
    (CURRENT_DATE - INTERVAL '150 days', 4.10, 120.0),
    (CURRENT_DATE - INTERVAL '120 days', 4.20, 110.0),
    (CURRENT_DATE - INTERVAL '90 days', 4.30, 100.0),
    (CURRENT_DATE - INTERVAL '60 days', 4.40, 130.0),
    (CURRENT_DATE - INTERVAL '30 days', 4.50, 140.0)
  ) AS history(date, price, qty)
WHERE name = 'Arroz (branco)';

-- =====================================================
-- 9. RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_price_history ENABLE ROW LEVEL SECURITY;

-- Política: Authenticated users podem ler tudo
CREATE POLICY "Authenticated users can read ingredients"
  ON ingredients FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read price history"
  ON ingredient_price_history FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Service role pode fazer tudo
CREATE POLICY "Service role full access ingredients"
  ON ingredients FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access price history"
  ON ingredient_price_history FOR ALL
  USING (auth.role() = 'service_role');

-- Política: Authenticated users podem inserir/atualizar
CREATE POLICY "Authenticated users can insert ingredients"
  ON ingredients FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update ingredients"
  ON ingredients FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert price history"
  ON ingredient_price_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 10. GRANTS
-- =====================================================
GRANT SELECT ON ingredients TO anon, authenticated;
GRANT SELECT ON ingredient_price_history TO anon, authenticated;
GRANT INSERT, UPDATE ON ingredients TO authenticated;
GRANT INSERT ON ingredient_price_history TO authenticated;
GRANT SELECT ON ingredient_summary TO anon, authenticated;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
