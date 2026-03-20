-- ============================================================================
-- MIGRATION: Receitas e Vendas
-- Data: 2026-03-20
-- Descrição: Estrutura para vendas, notas fiscais e receitas
-- Autor: Sistema de Gestão Financeira
-- ============================================================================

-- ============================================================================
-- TABELA: revenue_categories (Categorias de Receita)
-- ============================================================================

CREATE TABLE IF NOT EXISTS revenue_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  business_unit TEXT CHECK (business_unit IN ('cosi', 'marmitaria', 'both')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_revenue_categories_business_unit ON revenue_categories(business_unit);
CREATE INDEX idx_revenue_categories_active ON revenue_categories(is_active);

-- Comentários
COMMENT ON TABLE revenue_categories IS 'Categorias de receita (vendas balcão, delivery, buffet, etc)';
COMMENT ON COLUMN revenue_categories.business_unit IS 'Unidade de negócio: cosi, marmitaria ou both';

-- ============================================================================
-- TABELA: invoices (Notas Fiscais)
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  invoice_type TEXT CHECK (invoice_type IN ('nfe', 'nfce', 'nfse', 'manual')),
  issue_date DATE NOT NULL,
  business_unit TEXT CHECK (business_unit IN ('cosi', 'marmitaria', 'both')),

  -- Cliente/Fornecedor
  customer_name TEXT,
  customer_document TEXT, -- CPF/CNPJ

  -- Valores
  gross_amount DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,

  -- Categoria
  revenue_category_id UUID REFERENCES revenue_categories(id),

  -- XML original (NF-e)
  xml_content TEXT,
  xml_key TEXT, -- Chave de acesso da NF-e (44 dígitos)

  -- Status
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'confirmed',

  -- Observações
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_business_unit ON invoices(business_unit);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_xml_key ON invoices(xml_key);

-- Comentários
COMMENT ON TABLE invoices IS 'Notas fiscais de entrada/saída (NF-e, NFC-e, NFS-e)';
COMMENT ON COLUMN invoices.invoice_type IS 'Tipo: nfe (eletrônica), nfce (consumidor), nfse (serviço), manual';
COMMENT ON COLUMN invoices.xml_key IS 'Chave de acesso da NF-e (44 dígitos)';

-- ============================================================================
-- TABELA: sales (Vendas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date DATE NOT NULL,
  business_unit TEXT CHECK (business_unit IN ('cosi', 'marmitaria', 'both')),

  -- Referência NF-e (se houver)
  invoice_id UUID REFERENCES invoices(id),

  -- Cliente
  customer_name TEXT,
  customer_document TEXT,

  -- Valores
  gross_amount DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) NOT NULL,

  -- Forma de pagamento
  payment_method TEXT CHECK (payment_method IN ('dinheiro', 'pix', 'debito', 'credito', 'vale')),

  -- Categoria
  revenue_category_id UUID REFERENCES revenue_categories(id),

  -- Status
  status TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'completed',

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_sales_business_unit ON sales(business_unit);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);

-- Comentários
COMMENT ON TABLE sales IS 'Vendas realizadas (com ou sem NF-e vinculada)';
COMMENT ON COLUMN sales.payment_method IS 'Forma de pagamento: dinheiro, pix, debito, credito, vale';

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

CREATE TRIGGER update_revenue_categories_updated_at
BEFORE UPDATE ON revenue_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEW: daily_sales_summary (Resumo Diário de Vendas)
-- ============================================================================

CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT
  s.sale_date,
  s.business_unit,
  COUNT(*) as total_sales,
  SUM(s.gross_amount) as total_gross,
  SUM(s.discount_amount) as total_discount,
  SUM(s.net_amount) as total_net,

  -- Por forma de pagamento
  SUM(CASE WHEN s.payment_method = 'dinheiro' THEN s.net_amount ELSE 0 END) as cash_total,
  SUM(CASE WHEN s.payment_method = 'pix' THEN s.net_amount ELSE 0 END) as pix_total,
  SUM(CASE WHEN s.payment_method = 'debito' THEN s.net_amount ELSE 0 END) as debit_total,
  SUM(CASE WHEN s.payment_method = 'credito' THEN s.net_amount ELSE 0 END) as credit_total,
  SUM(CASE WHEN s.payment_method = 'vale' THEN s.net_amount ELSE 0 END) as voucher_total

FROM sales s
WHERE s.status = 'completed'
GROUP BY s.sale_date, s.business_unit
ORDER BY s.sale_date DESC;

COMMENT ON VIEW daily_sales_summary IS 'Resumo diário de vendas por unidade de negócio';

-- ============================================================================
-- VIEW: revenue_by_category (Receita por Categoria)
-- ============================================================================

CREATE OR REPLACE VIEW revenue_by_category AS
SELECT
  rc.name as category_name,
  rc.business_unit,
  COUNT(s.id) as sales_count,
  SUM(s.net_amount) as total_revenue,
  AVG(s.net_amount) as avg_ticket
FROM sales s
JOIN revenue_categories rc ON rc.id = s.revenue_category_id
WHERE s.status = 'completed'
GROUP BY rc.name, rc.business_unit
ORDER BY total_revenue DESC;

COMMENT ON VIEW revenue_by_category IS 'Receita total e ticket médio por categoria';

-- ============================================================================
-- RLS (Row Level Security) - Políticas de Segurança
-- ============================================================================

ALTER TABLE revenue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Políticas: Permitir leitura para todos (anon)
CREATE POLICY "Allow read revenue_categories" ON revenue_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Allow read invoices" ON invoices
  FOR SELECT
  USING (true);

CREATE POLICY "Allow read sales" ON sales
  FOR SELECT
  USING (true);

-- Políticas: Permitir insert/update/delete apenas para autenticados
CREATE POLICY "Allow all for authenticated on revenue_categories" ON revenue_categories
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated on invoices" ON invoices
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated on sales" ON sales
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Políticas temporárias: Permitir insert para anon (para testes e API)
CREATE POLICY "Allow anon insert on revenue_categories" ON revenue_categories
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon insert on invoices" ON invoices
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon insert on sales" ON sales
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================================================
-- GRANTS (Permissões)
-- ============================================================================

-- Permitir acesso às views para role anon e authenticated
GRANT SELECT ON daily_sales_summary TO anon, authenticated;
GRANT SELECT ON revenue_by_category TO anon, authenticated;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Validação
DO $$
BEGIN
  RAISE NOTICE '✅ Migration receitas_vendas concluída com sucesso!';
  RAISE NOTICE '📊 Tabelas criadas: revenue_categories, invoices, sales';
  RAISE NOTICE '📈 Views criadas: daily_sales_summary, revenue_by_category';
  RAISE NOTICE '🔒 RLS habilitado em todas as tabelas';
END $$;
