-- =============================================
-- SISTEMA DE AUTOMAÇÃO DE NOTAS FISCAIS
-- Data: 2026-03-04
-- Descrição: Tabelas para gestão de NF-e, custos, agenda de pagamentos e integração com estoque
-- =============================================

-- =============================================
-- 1. TABELA: fiscal_invoices (Notas Fiscais)
-- =============================================
CREATE TABLE IF NOT EXISTS fiscal_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Dados da NF-e
    nfe_key VARCHAR(44) UNIQUE NOT NULL, -- Chave de acesso da NF-e (44 dígitos)
    nfe_number VARCHAR(20) NOT NULL,
    nfe_series VARCHAR(10),
    nfe_model VARCHAR(10) DEFAULT '55', -- 55 = NF-e, 65 = NFC-e

    -- Fornecedor
    supplier_name VARCHAR(255) NOT NULL,
    supplier_cnpj VARCHAR(18),
    supplier_address TEXT,

    -- Datas
    issue_date TIMESTAMPTZ NOT NULL,
    entry_date TIMESTAMPTZ, -- Data de entrada da mercadoria
    due_date TIMESTAMPTZ, -- Data de vencimento

    -- Valores
    total_products DECIMAL(10,2) DEFAULT 0,
    total_tax DECIMAL(10,2) DEFAULT 0,
    total_discount DECIMAL(10,2) DEFAULT 0,
    total_freight DECIMAL(10,2) DEFAULT 0,
    total_value DECIMAL(10,2) NOT NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid, overdue

    -- Categorização
    cost_category VARCHAR(100), -- materia_prima, embalagens, insumos, servicos, outros
    business_unit VARCHAR(50) DEFAULT 'cosi', -- cosi, marmitaria

    -- XML e Processamento
    xml_data TEXT, -- XML completo da NF-e
    xml_url TEXT, -- URL do arquivo XML (se armazenado em storage)
    pdf_url TEXT, -- URL do DANFE em PDF

    -- Metadados
    processed_at TIMESTAMPTZ,
    processed_by UUID, -- FK para auth.users (futuramente)
    auto_processed BOOLEAN DEFAULT false, -- true se processado automaticamente
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_fiscal_invoices_nfe_key ON fiscal_invoices(nfe_key);
CREATE INDEX idx_fiscal_invoices_supplier_cnpj ON fiscal_invoices(supplier_cnpj);
CREATE INDEX idx_fiscal_invoices_issue_date ON fiscal_invoices(issue_date);
CREATE INDEX idx_fiscal_invoices_due_date ON fiscal_invoices(due_date);
CREATE INDEX idx_fiscal_invoices_status ON fiscal_invoices(status);
CREATE INDEX idx_fiscal_invoices_payment_status ON fiscal_invoices(payment_status);
CREATE INDEX idx_fiscal_invoices_business_unit ON fiscal_invoices(business_unit);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_fiscal_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fiscal_invoices_updated_at
    BEFORE UPDATE ON fiscal_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_fiscal_invoices_updated_at();

-- =============================================
-- 2. TABELA: fiscal_invoice_items (Itens da NF-e)
-- =============================================
CREATE TABLE IF NOT EXISTS fiscal_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES fiscal_invoices(id) ON DELETE CASCADE,

    -- Dados do Produto na NF-e
    item_number INTEGER, -- Número sequencial do item na NF
    product_code VARCHAR(100), -- Código do produto no fornecedor
    product_ean VARCHAR(14), -- Código de barras EAN
    product_name VARCHAR(500) NOT NULL,
    product_ncm VARCHAR(8), -- Nomenclatura Comum do Mercosul

    -- Quantidades e Unidades
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(10) NOT NULL, -- un, kg, lt, cx, dz, pc, etc
    unit_price DECIMAL(10,4) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,

    -- Impostos
    icms_value DECIMAL(10,2) DEFAULT 0,
    ipi_value DECIMAL(10,2) DEFAULT 0,
    pis_value DECIMAL(10,2) DEFAULT 0,
    cofins_value DECIMAL(10,2) DEFAULT 0,

    -- Mapeamento para Estoque
    mapped_product_id UUID, -- FK para inv_products (orçamentos)
    mapping_confidence DECIMAL(3,2), -- 0.00 a 1.00 (confiança do matching automático)
    mapping_method VARCHAR(50), -- auto_code, auto_name, manual
    mapped_at TIMESTAMPTZ,
    mapped_by UUID, -- FK para auth.users (futuramente)

    -- Conversão de Unidades
    converted_quantity DECIMAL(10,3), -- Quantidade convertida para unidade do estoque
    converted_unit VARCHAR(10), -- Unidade após conversão
    conversion_factor DECIMAL(10,4), -- Fator de conversão aplicado

    -- Status
    stock_updated BOOLEAN DEFAULT false,
    stock_updated_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_fiscal_invoice_items_invoice_id ON fiscal_invoice_items(invoice_id);
CREATE INDEX idx_fiscal_invoice_items_product_code ON fiscal_invoice_items(product_code);
CREATE INDEX idx_fiscal_invoice_items_mapped_product_id ON fiscal_invoice_items(mapped_product_id);
CREATE INDEX idx_fiscal_invoice_items_stock_updated ON fiscal_invoice_items(stock_updated);

-- Trigger para updated_at
CREATE TRIGGER fiscal_invoice_items_updated_at
    BEFORE UPDATE ON fiscal_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_fiscal_invoices_updated_at();

-- =============================================
-- 3. TABELA: product_unit_conversions (Conversões de Unidade)
-- =============================================
CREATE TABLE IF NOT EXISTS product_unit_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Unidades
    from_unit VARCHAR(10) NOT NULL, -- Unidade de origem (da NF-e)
    to_unit VARCHAR(10) NOT NULL, -- Unidade de destino (do estoque)
    conversion_factor DECIMAL(10,4) NOT NULL, -- Fator de conversão

    -- Produto específico (opcional)
    product_id UUID, -- Se NULL, aplica-se a todos produtos com essas unidades
    product_name VARCHAR(255), -- Nome do produto (para referência)

    -- Metadados
    description TEXT, -- Ex: "1 caixa = 12 unidades"
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Prioridade (conversões específicas > genéricas)

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: combinação única
    UNIQUE(from_unit, to_unit, product_id)
);

-- Índices
CREATE INDEX idx_product_unit_conversions_units ON product_unit_conversions(from_unit, to_unit);
CREATE INDEX idx_product_unit_conversions_product_id ON product_unit_conversions(product_id);
CREATE INDEX idx_product_unit_conversions_active ON product_unit_conversions(is_active);

-- =============================================
-- 4. TABELA: payment_schedule (Agenda de Pagamentos)
-- =============================================
CREATE TABLE IF NOT EXISTS payment_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES fiscal_invoices(id) ON DELETE CASCADE,

    -- Dados do Pagamento
    installment_number INTEGER DEFAULT 1, -- Número da parcela (1, 2, 3...)
    due_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(100), -- dinheiro, pix, transferencia, cartao, boleto, etc
    payment_reference VARCHAR(255), -- Número do comprovante, TID, etc

    -- Notificações
    notification_sent_at TIMESTAMPTZ,
    notification_count INTEGER DEFAULT 0,
    last_notification_at TIMESTAMPTZ,

    -- Observações
    notes TEXT,
    attachment_url TEXT, -- URL do comprovante de pagamento

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_payment_schedule_invoice_id ON payment_schedule(invoice_id);
CREATE INDEX idx_payment_schedule_due_date ON payment_schedule(due_date);
CREATE INDEX idx_payment_schedule_status ON payment_schedule(status);
CREATE INDEX idx_payment_schedule_overdue ON payment_schedule(due_date, status)
    WHERE status = 'pending';

-- Trigger para updated_at
CREATE TRIGGER payment_schedule_updated_at
    BEFORE UPDATE ON payment_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_fiscal_invoices_updated_at();

-- =============================================
-- 5. TABELA: cost_entries (Lançamentos de Custo)
-- =============================================
CREATE TABLE IF NOT EXISTS cost_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES fiscal_invoices(id) ON DELETE SET NULL,

    -- Dados do Custo
    description VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL, -- materia_prima, embalagens, insumos, servicos, outros
    amount DECIMAL(10,2) NOT NULL,
    entry_date DATE NOT NULL,

    -- Classificação
    business_unit VARCHAR(50) DEFAULT 'cosi', -- cosi, marmitaria
    cost_center VARCHAR(100), -- producao, administrativo, vendas, etc

    -- Relacionamento
    supplier_name VARCHAR(255),
    supplier_cnpj VARCHAR(18),

    -- Observações
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cost_entries_invoice_id ON cost_entries(invoice_id);
CREATE INDEX idx_cost_entries_entry_date ON cost_entries(entry_date);
CREATE INDEX idx_cost_entries_category ON cost_entries(category);
CREATE INDEX idx_cost_entries_business_unit ON cost_entries(business_unit);

-- Trigger para updated_at
CREATE TRIGGER cost_entries_updated_at
    BEFORE UPDATE ON cost_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_fiscal_invoices_updated_at();

-- =============================================
-- 6. INSERIR CONVERSÕES PADRÃO
-- =============================================
INSERT INTO product_unit_conversions (from_unit, to_unit, conversion_factor, description, priority) VALUES
-- Peso
('kg', 'g', 1000, '1 kg = 1000 g', 10),
('g', 'kg', 0.001, '1 g = 0.001 kg', 10),
('ton', 'kg', 1000, '1 tonelada = 1000 kg', 10),

-- Volume
('lt', 'ml', 1000, '1 litro = 1000 ml', 10),
('ml', 'lt', 0.001, '1 ml = 0.001 lt', 10),

-- Quantidade
('dz', 'un', 12, '1 dúzia = 12 unidades', 10),
('un', 'dz', 0.0833, '1 unidade = 0.0833 dúzias', 10),
('cx12', 'un', 12, '1 caixa (12 un) = 12 unidades', 5),
('cx6', 'un', 6, '1 caixa (6 un) = 6 unidades', 5),
('pc', 'un', 1, '1 peça = 1 unidade', 10),
('un', 'pc', 1, '1 unidade = 1 peça', 10),

-- Embalagens comuns
('fd', 'un', 1, '1 fardo = 1 unidade (verificar)', 1),
('sc', 'kg', 50, '1 saco = 50 kg (padrão)', 1),
('bl', 'un', 1, '1 balde = 1 unidade', 1)
ON CONFLICT (from_unit, to_unit, product_id) DO NOTHING;

-- =============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS nas tabelas
ALTER TABLE fiscal_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_unit_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;

-- Policies (permitir tudo por enquanto - ajustar conforme necessário)
CREATE POLICY "Enable all for authenticated users" ON fiscal_invoices
    FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON fiscal_invoice_items
    FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON product_unit_conversions
    FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON payment_schedule
    FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON cost_entries
    FOR ALL USING (true);

-- =============================================
-- 8. VIEWS ÚTEIS
-- =============================================

-- View: Notas fiscais com total de itens e pagamentos
CREATE OR REPLACE VIEW v_fiscal_invoices_summary AS
SELECT
    fi.*,
    COUNT(DISTINCT fii.id) as items_count,
    COUNT(DISTINCT ps.id) as payments_count,
    SUM(CASE WHEN ps.status = 'paid' THEN ps.amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN ps.status = 'pending' THEN ps.amount ELSE 0 END) as total_pending
FROM fiscal_invoices fi
LEFT JOIN fiscal_invoice_items fii ON fii.invoice_id = fi.id
LEFT JOIN payment_schedule ps ON ps.invoice_id = fi.id
GROUP BY fi.id;

-- View: Pagamentos vencendo nos próximos 7 dias
CREATE OR REPLACE VIEW v_upcoming_payments AS
SELECT
    ps.*,
    fi.supplier_name,
    fi.nfe_number,
    fi.total_value as invoice_total,
    (ps.due_date - CURRENT_DATE) as days_until_due
FROM payment_schedule ps
JOIN fiscal_invoices fi ON fi.id = ps.invoice_id
WHERE ps.status = 'pending'
  AND ps.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY ps.due_date ASC;

-- View: Pagamentos vencidos
CREATE OR REPLACE VIEW v_overdue_payments AS
SELECT
    ps.*,
    fi.supplier_name,
    fi.nfe_number,
    fi.total_value as invoice_total,
    (CURRENT_DATE - ps.due_date) as days_overdue
FROM payment_schedule ps
JOIN fiscal_invoices fi ON fi.id = ps.invoice_id
WHERE ps.status = 'pending'
  AND ps.due_date < CURRENT_DATE
ORDER BY ps.due_date ASC;

-- =============================================
-- COMENTÁRIOS NAS TABELAS
-- =============================================

COMMENT ON TABLE fiscal_invoices IS 'Armazena notas fiscais eletrônicas (NF-e) recebidas';
COMMENT ON TABLE fiscal_invoice_items IS 'Itens das notas fiscais com mapeamento para produtos do estoque';
COMMENT ON TABLE product_unit_conversions IS 'Regras de conversão entre unidades de medida (NF-e → Estoque)';
COMMENT ON TABLE payment_schedule IS 'Agenda de pagamentos das notas fiscais com notificações';
COMMENT ON TABLE cost_entries IS 'Lançamentos de custos baseados nas notas fiscais';

-- =============================================
-- FIM DA MIGRATION
-- =============================================
