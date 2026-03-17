# 🥕 FASE 1: CMV (Custo de Mercadoria Vendida) - GUIA COMPLETO

**Data:** 2026-03-17
**Duração:** 2-3 semanas (50-70 horas)
**Prioridade:** CRÍTICA (base de tudo)

---

## 🎯 VISÃO GERAL

### **Por Que CMV é Prioridade 1?**

O **CMV (Custo de Mercadoria Vendida)** é o **alicerce** de todo o sistema financeiro:

```
CMV = Base para TUDO
│
├─ Precificação (Preço de Venda = CMV × Margem)
├─ DRE (Receita - CMV = Lucro Bruto)
├─ Análise de Rentabilidade (Margem por Produto)
└─ Decisões Estratégicas (O que é lucrativo?)
```

**Sem CMV correto = Decisões erradas = Prejuízo**

---

## 📦 O QUE SERÁ CONSTRUÍDO

```
📂 CMV - Custo de Mercadoria Vendida
│
├── 1. DATABASE
│   ├── ingredients (ingredientes + preço atual/médio)
│   ├── ingredient_price_history (histórico de compras)
│   ├── product_recipes (receitas/BOM de produtos)
│   ├── recipe_items (ingredientes de cada receita)
│   └── product_cmv (VIEW com CMV calculado)
│
├── 2. BACKEND
│   ├── match-nfe-to-ingredients (match NF-e → ingredientes)
│   ├── calculate-product-cmv (cálculo detalhado de CMV)
│   └── bulk-update-prices (atualização em lote)
│
├── 3. FRONTEND
│   ├── Ingredientes (CRUD + histórico de preços)
│   ├── Receitas (CRUD + BOM + preview CMV)
│   └── Análise CMV (dashboards + gráficos)
│
└── 4. INTEGRAÇÃO
    └── NF-e → Atualização Automática de Preços
```

---

## ⏱️ CRONOGRAMA DETALHADO

| Semana | Frentes Paralelas | Horas | Entregáveis |
|--------|-------------------|-------|-------------|
| **Semana 1** | FRENTE 1A: Database + FRENTE 1B: Backend | 7-9h | Tabelas, Edge Functions |
| **Semana 2** | FRENTE 1C: Frontend Ingredientes | 5-6h | Interface CRUD completa |
| **Semana 2-3** | FRENTE 1D: Frontend Receitas | 6-8h | Interface BOM + Preview CMV |
| **Semana 3** | FRENTE 1E: Frontend Análise | 4-5h | Dashboards + Gráficos |

**Total:** 22-28 horas (2-3 semanas)

---

## 📦 FRENTE 1A: DATABASE CMV

**Pasta:** `gestao/supabase_nfe/migrations/`
**Tempo:** 3-4 horas
**Janela:** 1

---

### **TAREFA 1A.1: Migration - Ingredientes (90 min)**

**Arquivo:** `gestao/supabase_nfe/migrations/20260317_cmv_ingredients.sql`

```sql
-- ============================================================================
-- MIGRATION: CMV - Ingredientes e Histórico de Preços
-- Data: 2026-03-17
-- Descrição: Cadastro de ingredientes com controle de preços
-- ============================================================================

-- ============================================================================
-- TABELA: ingredients (Cadastro de Ingredientes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100), -- 'proteinas', 'acompanhamentos', 'saladas', 'embalagens', 'temperos'
  unit VARCHAR(20) NOT NULL, -- 'kg', 'un', 'litro', 'g', 'ml'
  current_price DECIMAL(10,2) DEFAULT 0, -- último preço de compra
  avg_price DECIMAL(10,2) DEFAULT 0, -- média móvel (últimos 3 meses)
  supplier_name VARCHAR(255), -- fornecedor padrão
  min_stock DECIMAL(10,3), -- estoque mínimo (alertas)
  max_stock DECIMAL(10,3), -- estoque máximo
  current_stock DECIMAL(10,3) DEFAULT 0, -- estoque atual (opcional)
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_active ON ingredients(is_active);
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_supplier ON ingredients(supplier_name);

-- Comentários
COMMENT ON TABLE ingredients IS 'Cadastro de ingredientes para cálculo de CMV';
COMMENT ON COLUMN ingredients.current_price IS 'Último preço de compra registrado';
COMMENT ON COLUMN ingredients.avg_price IS 'Preço médio dos últimos 3 meses (calculado automaticamente)';
COMMENT ON COLUMN ingredients.unit IS 'Unidade de medida: kg, un (unidade), litro, g (gramas), ml (mililitros)';

-- ============================================================================
-- TABELA: ingredient_price_history (Histórico de Preços de Compra)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ingredient_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,3), -- quantidade comprada
  unit VARCHAR(20), -- kg, un, litro
  supplier_name VARCHAR(255),
  purchase_date DATE NOT NULL,
  nfe_key VARCHAR(44), -- chave da NF-e (se houver) - FK para fiscal_invoices
  invoice_number VARCHAR(20), -- número da NF-e
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'nfe', 'import'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_price_history_ingredient ON ingredient_price_history(ingredient_id);
CREATE INDEX idx_price_history_date ON ingredient_price_history(purchase_date DESC);
CREATE INDEX idx_price_history_nfe ON ingredient_price_history(nfe_key);
CREATE INDEX idx_price_history_supplier ON ingredient_price_history(supplier_name);

-- Comentários
COMMENT ON TABLE ingredient_price_history IS 'Histórico de preços de compra de ingredientes';
COMMENT ON COLUMN ingredient_price_history.source IS 'Origem do registro: manual (digitado), nfe (automático), import (planilha)';
COMMENT ON COLUMN ingredient_price_history.nfe_key IS 'Chave da NF-e (44 dígitos) - permite rastrear origem da compra';

-- ============================================================================
-- TRIGGER: Atualizar current_price do ingrediente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ingredient_current_price()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza current_price com o preço mais recente
  UPDATE ingredients
  SET
    current_price = NEW.price,
    updated_at = NOW()
  WHERE id = NEW.ingredient_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ingredient_current_price
AFTER INSERT ON ingredient_price_history
FOR EACH ROW
EXECUTE FUNCTION update_ingredient_current_price();

COMMENT ON FUNCTION update_ingredient_current_price IS 'Atualiza current_price do ingrediente quando um novo histórico é inserido';

-- ============================================================================
-- FUNCTION: Calcular preço médio (últimos 3 meses)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_avg_price(p_ingredient_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_avg_price DECIMAL(10,2);
BEGIN
  SELECT COALESCE(AVG(price), 0)
  INTO v_avg_price
  FROM ingredient_price_history
  WHERE ingredient_id = p_ingredient_id
    AND purchase_date >= (CURRENT_DATE - INTERVAL '3 months');

  RETURN v_avg_price;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_avg_price IS 'Calcula preço médio do ingrediente nos últimos 3 meses';

-- ============================================================================
-- FUNCTION: Atualizar avg_price de todos os ingredientes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_all_avg_prices()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_ingredient RECORD;
BEGIN
  FOR v_ingredient IN SELECT id FROM ingredients WHERE is_active = true LOOP
    UPDATE ingredients
    SET avg_price = calculate_avg_price(v_ingredient.id)
    WHERE id = v_ingredient.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_all_avg_prices IS 'Atualiza avg_price de todos os ingredientes ativos (executar mensalmente via cron)';

-- ============================================================================
-- TRIGGER: updated_at automático
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ingredients_updated_at
BEFORE UPDATE ON ingredients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED: Ingredientes Básicos (Exemplos)
-- ============================================================================

INSERT INTO ingredients (name, category, unit, current_price, supplier_name) VALUES
-- PROTEÍNAS
('Peito de Frango', 'proteinas', 'kg', 17.50, 'Fornecedor A'),
('Carne Moída', 'proteinas', 'kg', 22.00, 'Fornecedor A'),
('Bisteca Suína', 'proteinas', 'kg', 19.00, 'Fornecedor A'),
('Ovo', 'proteinas', 'un', 0.80, 'Fornecedor B'),
('Picanha', 'proteinas', 'kg', 89.00, 'Fornecedor A'),
('File de Tilápia', 'proteinas', 'kg', 28.00, 'Fornecedor A'),
('Linguiça Calabresa', 'proteinas', 'kg', 24.00, 'Fornecedor A'),

-- ACOMPANHAMENTOS
('Arroz Branco', 'acompanhamentos', 'kg', 4.00, 'Fornecedor C'),
('Feijão Carioca', 'acompanhamentos', 'kg', 6.00, 'Fornecedor C'),
('Batata', 'acompanhamentos', 'kg', 3.50, 'Fornecedor D'),
('Mandioca', 'acompanhamentos', 'kg', 4.50, 'Fornecedor D'),
('Macarrão', 'acompanhamentos', 'kg', 5.00, 'Fornecedor C'),
('Farofa Pronta', 'acompanhamentos', 'kg', 8.00, 'Fornecedor C'),
('Purê de Batata (pó)', 'acompanhamentos', 'kg', 12.00, 'Fornecedor C'),

-- SALADAS/VERDURAS
('Alface', 'saladas', 'un', 2.50, 'Fornecedor D'),
('Tomate', 'saladas', 'kg', 5.00, 'Fornecedor D'),
('Cenoura', 'saladas', 'kg', 3.00, 'Fornecedor D'),
('Repolho', 'saladas', 'kg', 2.80, 'Fornecedor D'),
('Pepino', 'saladas', 'kg', 4.00, 'Fornecedor D'),
('Cebola', 'temperos', 'kg', 4.00, 'Fornecedor D'),
('Beterraba', 'saladas', 'kg', 3.50, 'Fornecedor D'),

-- EMBALAGENS
('Marmita P (500ml)', 'embalagens', 'un', 1.20, 'Fornecedor E'),
('Marmita M (750ml)', 'embalagens', 'un', 1.50, 'Fornecedor E'),
('Marmita G (1000ml)', 'embalagens', 'un', 1.80, 'Fornecedor E'),
('Tampa para Marmita', 'embalagens', 'un', 0.30, 'Fornecedor E'),
('Sacola Delivery', 'embalagens', 'un', 0.25, 'Fornecedor E'),
('Talher Descartável (kit)', 'embalagens', 'un', 0.15, 'Fornecedor E'),
('Guardanapo', 'embalagens', 'un', 0.05, 'Fornecedor E'),

-- TEMPEROS/CONDIMENTOS
('Sal Refinado', 'temperos', 'kg', 2.00, 'Fornecedor C'),
('Óleo de Soja', 'temperos', 'litro', 8.00, 'Fornecedor C'),
('Alho', 'temperos', 'kg', 25.00, 'Fornecedor D'),
('Colorau', 'temperos', 'kg', 15.00, 'Fornecedor C'),
('Tempero Completo', 'temperos', 'kg', 12.00, 'Fornecedor C'),
('Vinagre', 'temperos', 'litro', 4.50, 'Fornecedor C'),
('Azeite', 'temperos', 'litro', 35.00, 'Fornecedor C')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SEED: Histórico de Preços (Exemplos)
-- ============================================================================

INSERT INTO ingredient_price_history (ingredient_id, price, quantity, unit, supplier_name, purchase_date, source)
SELECT
  id,
  current_price,
  10.0,
  unit,
  supplier_name,
  CURRENT_DATE - INTERVAL '30 days',
  'import'
FROM ingredients
WHERE current_price > 0
ON CONFLICT DO NOTHING;

-- Atualizar avg_price inicial
SELECT update_all_avg_prices();

-- ============================================================================
-- RLS (Row Level Security) - Políticas de Segurança
-- ============================================================================

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_price_history ENABLE ROW LEVEL SECURITY;

-- Políticas: Permitir leitura para todos (anon e authenticated)
CREATE POLICY "Allow read ingredients" ON ingredients
  FOR SELECT
  USING (true);

CREATE POLICY "Allow read price history" ON ingredient_price_history
  FOR SELECT
  USING (true);

-- Políticas: Permitir insert/update/delete apenas para authenticated
CREATE POLICY "Allow all for authenticated on ingredients" ON ingredients
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated on price_history" ON ingredient_price_history
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- GRANTS (Permissões)
-- ============================================================================

GRANT SELECT ON ingredients TO anon, authenticated;
GRANT SELECT ON ingredient_price_history TO anon, authenticated;

-- ============================================================================
-- FIM DA MIGRATION: Ingredientes
-- ============================================================================

-- Validação
DO $$
DECLARE
  v_ingredient_count INTEGER;
  v_history_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_ingredient_count FROM ingredients;
  SELECT COUNT(*) INTO v_history_count FROM ingredient_price_history;

  RAISE NOTICE '✅ Migration de Ingredientes concluída!';
  RAISE NOTICE '📊 Ingredientes cadastrados: %', v_ingredient_count;
  RAISE NOTICE '📈 Registros de histórico: %', v_history_count;
END $$;
```

**Salvar como:** `gestao/supabase_nfe/migrations/20260317_cmv_ingredients.sql`

---

### **TAREFA 1A.2: Migration - Receitas de Produtos (90 min)**

**Arquivo:** `gestao/supabase_nfe/migrations/20260317_cmv_recipes.sql`

```sql
-- ============================================================================
-- MIGRATION: CMV - Receitas de Produtos (BOM - Bill of Materials)
-- Data: 2026-03-17
-- Descrição: Receitas (Bill of Materials) para cálculo de CMV por produto
-- ============================================================================

-- ============================================================================
-- TABELA: product_recipes (Receitas de Produtos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(50), -- SKU ou código interno
  category VARCHAR(100), -- 'marmitas', 'encomendas', 'corporativo', 'sobremesas', 'bebidas'
  size VARCHAR(20), -- 'P', 'M', 'G', null (se não aplicável)
  description TEXT,

  -- Rendimento (yield)
  yield_quantity DECIMAL(10,3) DEFAULT 1, -- ex: 1 bolo = 12 fatias
  yield_unit VARCHAR(20), -- 'un', 'fatia', 'porção', 'kg'

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_recipes_product_name ON product_recipes(product_name);
CREATE INDEX idx_recipes_category ON product_recipes(category);
CREATE INDEX idx_recipes_active ON product_recipes(is_active);
CREATE INDEX idx_recipes_code ON product_recipes(product_code);

-- Trigger updated_at
CREATE TRIGGER update_product_recipes_updated_at
BEFORE UPDATE ON product_recipes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE product_recipes IS 'Receitas de produtos (Bill of Materials para cálculo de CMV)';
COMMENT ON COLUMN product_recipes.yield_quantity IS 'Rendimento: quantidade produzida (ex: 1 bolo rende 12 fatias)';
COMMENT ON COLUMN product_recipes.yield_unit IS 'Unidade do rendimento (un, fatia, porção, kg)';

-- ============================================================================
-- TABELA: recipe_items (Ingredientes da Receita)
-- ============================================================================

CREATE TABLE IF NOT EXISTS recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES product_recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity DECIMAL(10,3) NOT NULL, -- 0.200 (200g), 1 (1 unidade)
  unit VARCHAR(20) NOT NULL, -- 'kg', 'un', 'litro', 'g', 'ml'
  notes TEXT, -- observações (ex: 'cozido', 'grelhado', 'cru', 'picado')
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_recipe_items_recipe ON recipe_items(recipe_id);
CREATE INDEX idx_recipe_items_ingredient ON recipe_items(ingredient_id);

-- Comentários
COMMENT ON TABLE recipe_items IS 'Ingredientes de cada receita (lista de materiais)';
COMMENT ON COLUMN recipe_items.quantity IS 'Quantidade do ingrediente usada na receita';
COMMENT ON COLUMN recipe_items.notes IS 'Observações sobre o preparo (cozido, grelhado, etc)';

-- ============================================================================
-- VIEW: product_cmv (CMV Calculado por Produto)
-- ============================================================================

CREATE OR REPLACE VIEW product_cmv AS
SELECT
  pr.id AS recipe_id,
  pr.product_name,
  pr.product_code,
  pr.category,
  pr.size,
  pr.yield_quantity,
  pr.yield_unit,
  COALESCE(SUM(ri.quantity * i.current_price), 0) AS cmv_current,
  COALESCE(SUM(ri.quantity * i.avg_price), 0) AS cmv_avg,
  COUNT(ri.id) AS ingredient_count,
  pr.is_active,
  pr.created_at,
  pr.updated_at
FROM product_recipes pr
LEFT JOIN recipe_items ri ON pr.id = ri.recipe_id
LEFT JOIN ingredients i ON ri.ingredient_id = i.id
GROUP BY pr.id, pr.product_name, pr.product_code, pr.category, pr.size,
         pr.yield_quantity, pr.yield_unit, pr.is_active, pr.created_at, pr.updated_at;

COMMENT ON VIEW product_cmv IS 'CMV calculado por produto (current_price e avg_price)';

-- ============================================================================
-- FUNCTION: get_recipe_cmv (Detalhamento de CMV de uma receita)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_recipe_cmv(p_recipe_id UUID)
RETURNS TABLE (
  ingredient_name VARCHAR(255),
  category VARCHAR(100),
  quantity DECIMAL(10,3),
  unit VARCHAR(20),
  price_current DECIMAL(10,2),
  price_avg DECIMAL(10,2),
  subtotal_current DECIMAL(10,2),
  subtotal_avg DECIMAL(10,2),
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.name,
    i.category,
    ri.quantity,
    ri.unit,
    i.current_price,
    i.avg_price,
    ROUND((ri.quantity * i.current_price)::numeric, 2) AS subtotal_current,
    ROUND((ri.quantity * i.avg_price)::numeric, 2) AS subtotal_avg,
    ri.notes
  FROM recipe_items ri
  JOIN ingredients i ON ri.ingredient_id = i.id
  WHERE ri.recipe_id = p_recipe_id
  ORDER BY i.category, i.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_recipe_cmv IS 'Retorna detalhamento de CMV de uma receita específica (ingrediente por ingrediente)';

-- ============================================================================
-- FUNCTION: duplicate_recipe (Duplicar receita)
-- ============================================================================

CREATE OR REPLACE FUNCTION duplicate_recipe(
  p_source_recipe_id UUID,
  p_new_product_name VARCHAR(255),
  p_new_size VARCHAR(20) DEFAULT NULL,
  p_quantity_multiplier DECIMAL(10,3) DEFAULT 1.0
)
RETURNS UUID AS $$
DECLARE
  v_new_recipe_id UUID;
  v_recipe_item RECORD;
BEGIN
  -- Criar nova receita (cópia)
  INSERT INTO product_recipes (
    product_name,
    product_code,
    category,
    size,
    description,
    yield_quantity,
    yield_unit,
    is_active
  )
  SELECT
    p_new_product_name,
    product_code || '-' || COALESCE(p_new_size, 'COPY'),
    category,
    COALESCE(p_new_size, size),
    description || ' (Duplicado)',
    yield_quantity,
    yield_unit,
    is_active
  FROM product_recipes
  WHERE id = p_source_recipe_id
  RETURNING id INTO v_new_recipe_id;

  -- Copiar ingredientes (ajustando quantidades se necessário)
  FOR v_recipe_item IN
    SELECT ingredient_id, quantity, unit, notes
    FROM recipe_items
    WHERE recipe_id = p_source_recipe_id
  LOOP
    INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, notes)
    VALUES (
      v_new_recipe_id,
      v_recipe_item.ingredient_id,
      v_recipe_item.quantity * p_quantity_multiplier,
      v_recipe_item.unit,
      v_recipe_item.notes
    );
  END LOOP;

  RETURN v_new_recipe_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION duplicate_recipe IS 'Duplica uma receita com ajuste de quantidades (ex: P → M com multiplicador 1.5)';

-- ============================================================================
-- SEED: Receitas Básicas (Exemplos)
-- ============================================================================

-- Receita 1: Marmita P - Frango Grelhado
DO $$
DECLARE
  v_recipe_id UUID;
  v_frango_id UUID;
  v_arroz_id UUID;
  v_feijao_id UUID;
  v_alface_id UUID;
  v_tomate_id UUID;
  v_marmita_p_id UUID;
  v_talher_id UUID;
BEGIN
  -- Buscar IDs dos ingredientes
  SELECT id INTO v_frango_id FROM ingredients WHERE name = 'Peito de Frango';
  SELECT id INTO v_arroz_id FROM ingredients WHERE name = 'Arroz Branco';
  SELECT id INTO v_feijao_id FROM ingredients WHERE name = 'Feijão Carioca';
  SELECT id INTO v_alface_id FROM ingredients WHERE name = 'Alface';
  SELECT id INTO v_tomate_id FROM ingredients WHERE name = 'Tomate';
  SELECT id INTO v_marmita_p_id FROM ingredients WHERE name = 'Marmita P (500ml)';
  SELECT id INTO v_talher_id FROM ingredients WHERE name = 'Talher Descartável (kit)';

  -- Criar receita
  INSERT INTO product_recipes (product_name, product_code, category, size, yield_quantity, yield_unit)
  VALUES ('Marmita Frango Grelhado', 'MARM-P-FRANGO', 'marmitas', 'P', 1, 'un')
  RETURNING id INTO v_recipe_id;

  -- Adicionar ingredientes
  INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, notes) VALUES
  (v_recipe_id, v_frango_id, 0.200, 'kg', 'grelhado'),
  (v_recipe_id, v_arroz_id, 0.150, 'kg', 'cozido'),
  (v_recipe_id, v_feijao_id, 0.100, 'kg', 'cozido'),
  (v_recipe_id, v_alface_id, 0.030, 'kg', 'crua'),
  (v_recipe_id, v_tomate_id, 0.050, 'kg', 'cru em rodelas'),
  (v_recipe_id, v_marmita_p_id, 1, 'un', null),
  (v_recipe_id, v_talher_id, 1, 'un', null);
END $$;

-- Receita 2: Marmita M - Carne Moída
DO $$
DECLARE
  v_recipe_id UUID;
  v_carne_id UUID;
  v_arroz_id UUID;
  v_feijao_id UUID;
  v_batata_id UUID;
  v_alface_id UUID;
  v_marmita_m_id UUID;
  v_talher_id UUID;
BEGIN
  SELECT id INTO v_carne_id FROM ingredients WHERE name = 'Carne Moída';
  SELECT id INTO v_arroz_id FROM ingredients WHERE name = 'Arroz Branco';
  SELECT id INTO v_feijao_id FROM ingredients WHERE name = 'Feijão Carioca';
  SELECT id INTO v_batata_id FROM ingredients WHERE name = 'Batata';
  SELECT id INTO v_alface_id FROM ingredients WHERE name = 'Alface';
  SELECT id INTO v_marmita_m_id FROM ingredients WHERE name = 'Marmita M (750ml)';
  SELECT id INTO v_talher_id FROM ingredients WHERE name = 'Talher Descartável (kit)';

  INSERT INTO product_recipes (product_name, product_code, category, size, yield_quantity, yield_unit)
  VALUES ('Marmita Carne Moída', 'MARM-M-CARNE', 'marmitas', 'M', 1, 'un')
  RETURNING id INTO v_recipe_id;

  INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, notes) VALUES
  (v_recipe_id, v_carne_id, 0.250, 'kg', 'refogada'),
  (v_recipe_id, v_arroz_id, 0.200, 'kg', 'cozido'),
  (v_recipe_id, v_feijao_id, 0.150, 'kg', 'cozido'),
  (v_recipe_id, v_batata_id, 0.100, 'kg', 'frita'),
  (v_recipe_id, v_alface_id, 0.040, 'kg', 'crua'),
  (v_recipe_id, v_marmita_m_id, 1, 'un', null),
  (v_recipe_id, v_talher_id, 1, 'un', null);
END $$;

-- Receita 3: Marmita G - Picanha (usar função duplicate_recipe)
DO $$
DECLARE
  v_marmita_m_id UUID;
  v_marmita_g_id UUID;
BEGIN
  -- Buscar ID da Marmita M
  SELECT id INTO v_marmita_m_id FROM product_recipes WHERE product_code = 'MARM-M-CARNE';

  -- Duplicar com multiplicador 1.5 (M → G)
  SELECT duplicate_recipe(
    v_marmita_m_id,
    'Marmita Carne Moída',
    'G',
    1.5
  ) INTO v_marmita_g_id;

  -- Atualizar product_code
  UPDATE product_recipes
  SET product_code = 'MARM-G-CARNE'
  WHERE id = v_marmita_g_id;
END $$;

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read recipes" ON product_recipes FOR SELECT USING (true);
CREATE POLICY "Allow read recipe items" ON recipe_items FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated on recipes" ON product_recipes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated on recipe_items" ON recipe_items
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON product_recipes TO anon, authenticated;
GRANT SELECT ON recipe_items TO anon, authenticated;

-- ============================================================================
-- FIM DA MIGRATION: Receitas
-- ============================================================================

DO $$
DECLARE
  v_recipe_count INTEGER;
  v_item_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_recipe_count FROM product_recipes;
  SELECT COUNT(*) INTO v_item_count FROM recipe_items;

  RAISE NOTICE '✅ Migration de Receitas concluída!';
  RAISE NOTICE '📊 Receitas criadas: %', v_recipe_count;
  RAISE NOTICE '📈 Ingredientes nas receitas: %', v_item_count;
  RAISE NOTICE '💡 Use SELECT * FROM product_cmv para ver CMV calculado!';
END $$;
```

**Salvar como:** `gestao/supabase_nfe/migrations/20260317_cmv_recipes.sql`

---

### **TAREFA 1A.3: Aplicar Migrations no Supabase (30 min)**

**Opção A: Via Supabase Dashboard (Cloudfy)**
```
1. Acessar: https://energetictriggerfish-supabase.cloudfy.live
2. Menu → SQL Editor
3. Copiar TODO o conteúdo de 20260317_cmv_ingredients.sql
4. Colar e executar (Run)
5. Aguardar mensagem de sucesso
6. Copiar TODO o conteúdo de 20260317_cmv_recipes.sql
7. Colar e executar (Run)
8. Aguardar mensagem de sucesso
```

**Opção B: Via Supabase CLI** (se configurado)
```bash
cd gestao/supabase_nfe
supabase db push
```

---

### **TAREFA 1A.4: Validar Criação das Tabelas (30 min)**

**Query de Validação:**
```sql
-- 1. Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ingredients', 'ingredient_price_history', 'product_recipes', 'recipe_items');

-- 2. Contar ingredientes por categoria
SELECT category, COUNT(*) as total
FROM ingredients
GROUP BY category
ORDER BY total DESC;

-- 3. Ver ingredientes cadastrados
SELECT name, category, unit, current_price, avg_price, supplier_name
FROM ingredients
ORDER BY category, name
LIMIT 10;

-- 4. Verificar view product_cmv
SELECT product_name, size, cmv_current, cmv_avg, ingredient_count
FROM product_cmv
ORDER BY cmv_current DESC;

-- 5. Testar function get_recipe_cmv
SELECT *
FROM get_recipe_cmv(
  (SELECT id FROM product_recipes WHERE product_name LIKE '%Frango%' LIMIT 1)
);

-- 6. Ver estrutura da tabela ingredients
\d ingredients

-- 7. Ver estrutura da tabela product_recipes
\d product_recipes

-- 8. Verificar histórico de preços
SELECT COUNT(*) as total_historico
FROM ingredient_price_history;

-- 9. Testar function calculate_avg_price
SELECT calculate_avg_price(
  (SELECT id FROM ingredients WHERE name = 'Peito de Frango')
);

-- 10. Testar function duplicate_recipe
SELECT duplicate_recipe(
  (SELECT id FROM product_recipes WHERE product_code = 'MARM-P-FRANGO'),
  'Marmita Frango Grelhado (Teste)',
  'P',
  1.0
);
```

**Resultados Esperados:**
- ✅ 4 tabelas criadas
- ✅ ~35 ingredientes inseridos
- ✅ 3 receitas criadas (P, M, G)
- ✅ ~21 ingredientes em receitas
- ✅ View `product_cmv` mostrando 3 produtos com CMV calculado
- ✅ Function `get_recipe_cmv` retornando detalhamento
- ✅ Histórico de preços com ~35 registros

---

### **✅ CHECKLIST FRENTE 1A:**

- [ ] Arquivo `20260317_cmv_ingredients.sql` criado
- [ ] Arquivo `20260317_cmv_recipes.sql` criado
- [ ] Migrations aplicadas no Supabase
- [ ] Tabela `ingredients` criada (validado)
- [ ] Tabela `ingredient_price_history` criada (validado)
- [ ] Tabela `product_recipes` criada (validado)
- [ ] Tabela `recipe_items` criada (validado)
- [ ] View `product_cmv` criada (validado)
- [ ] ~35 ingredientes seed inseridos (validado)
- [ ] 3 receitas seed inseridas (validado)
- [ ] Function `get_recipe_cmv` testada (sucesso)
- [ ] Function `calculate_avg_price` testada (sucesso)
- [ ] Function `duplicate_recipe` testada (sucesso)
- [ ] Commit: `git commit -m "feat(cmv): criar tabelas de ingredientes e receitas"`

---

**🎉 FIM DA FRENTE 1A - Database CMV criado com sucesso!**

Tempo total: ~3-4 horas

Próximo passo: **FRENTE 1B - Backend (Edge Functions)**

---

*(Continua com FRENTE 1B, 1C, 1D, 1E... documento muito extenso, criarei em blocos)*

Devido ao tamanho, vou criar um arquivo separado com o restante da FASE 1. Este documento já tem a parte mais crítica (Database).

**Quer que eu continue com as FRENTES 1B, 1C, 1D, 1E neste mesmo arquivo, ou está bom assim e passo para a FASE 2?**