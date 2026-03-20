-- ============================================================================
-- MIGRATION: Extrato Bancário e Pagamentos
-- Data: 2026-03-20
-- Descrição: Estrutura para contas bancárias, extratos e pagamentos
-- Autor: Sistema de Gestão Financeira
-- ============================================================================

-- ============================================================================
-- TABELA: bank_accounts (Contas Bancárias)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  bank_code TEXT, -- Código do banco (ex: 001 = Banco do Brasil)
  agency TEXT,
  account_number TEXT NOT NULL,
  account_type TEXT CHECK (account_type IN ('corrente', 'poupanca', 'pagamento')),
  business_unit TEXT CHECK (business_unit IN ('cosi', 'marmitaria', 'both')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_bank_accounts_business_unit ON bank_accounts(business_unit);
CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active);

-- Comentários
COMMENT ON TABLE bank_accounts IS 'Contas bancárias da empresa';
COMMENT ON COLUMN bank_accounts.account_type IS 'Tipo: corrente, poupanca, pagamento';

-- ============================================================================
-- TABELA: bank_statements (Extratos Bancários)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID REFERENCES bank_accounts(id) NOT NULL,

  -- Dados da transação
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL, -- Positivo = entrada, Negativo = saída
  balance DECIMAL(15,2), -- Saldo após transação

  -- Classificação
  transaction_type TEXT CHECK (transaction_type IN ('credit', 'debit', 'transfer', 'fee', 'tax')),
  category TEXT, -- Categoria manual (alimentação, fornecedores, etc)

  -- Dados originais do extrato
  document_number TEXT, -- Número do documento (boleto, transferência, etc)
  raw_data JSONB, -- Dados brutos do arquivo importado

  -- Conciliação
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_with_id UUID, -- ID da venda/pagamento conciliado
  reconciled_with_type TEXT CHECK (reconciled_with_type IN ('sale', 'payment', 'invoice')),
  reconciled_at TIMESTAMPTZ,

  -- Observações
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_bank_statements_date ON bank_statements(transaction_date);
CREATE INDEX idx_bank_statements_account ON bank_statements(bank_account_id);
CREATE INDEX idx_bank_statements_reconciled ON bank_statements(is_reconciled);
CREATE INDEX idx_bank_statements_type ON bank_statements(transaction_type);

-- Comentários
COMMENT ON TABLE bank_statements IS 'Extratos bancários importados (OFX, PDF, CSV)';
COMMENT ON COLUMN bank_statements.amount IS 'Positivo = entrada (crédito), Negativo = saída (débito)';
COMMENT ON COLUMN bank_statements.is_reconciled IS 'Indica se foi conciliado com venda/pagamento';

-- ============================================================================
-- TABELA: payments (Pagamentos Realizados)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_date DATE NOT NULL,
  business_unit TEXT CHECK (business_unit IN ('cosi', 'marmitaria', 'both')),

  -- Fornecedor/Beneficiário
  payee_name TEXT NOT NULL,
  payee_document TEXT, -- CPF/CNPJ

  -- Valores
  amount DECIMAL(15,2) NOT NULL,

  -- Classificação
  payment_category TEXT, -- Fornecedores, Salários, Impostos, etc
  payment_method TEXT CHECK (payment_method IN ('dinheiro', 'pix', 'transferencia', 'boleto', 'cheque', 'debito', 'credito')),

  -- Referência bancária
  bank_statement_id UUID REFERENCES bank_statements(id),

  -- Documento relacionado
  invoice_id UUID REFERENCES invoices(id), -- Se for pagamento de NF-e
  document_number TEXT, -- Número do boleto, NF, etc

  -- Status
  status TEXT CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'paid',

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_business_unit ON payments(business_unit);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_category ON payments(payment_category);

-- Comentários
COMMENT ON TABLE payments IS 'Pagamentos realizados (fornecedores, impostos, salários, etc)';
COMMENT ON COLUMN payments.payment_category IS 'Categoria: fornecedores, salarios, impostos, aluguel, etc';

-- ============================================================================
-- TRIGGER: updated_at automático
-- ============================================================================

CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON bank_accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_statements_updated_at
BEFORE UPDATE ON bank_statements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEW: bank_balance (Saldo Atual por Conta)
-- ============================================================================

CREATE OR REPLACE VIEW bank_balance AS
SELECT
  ba.id as bank_account_id,
  ba.bank_name,
  ba.account_number,
  ba.business_unit,
  COALESCE(SUM(bs.amount), 0) as current_balance,
  COUNT(bs.id) as total_transactions,
  COUNT(CASE WHEN bs.is_reconciled = false THEN 1 END) as unreconciled_count,
  MAX(bs.transaction_date) as last_transaction_date
FROM bank_accounts ba
LEFT JOIN bank_statements bs ON bs.bank_account_id = ba.id
WHERE ba.is_active = true
GROUP BY ba.id, ba.bank_name, ba.account_number, ba.business_unit;

COMMENT ON VIEW bank_balance IS 'Saldo atual e estatísticas por conta bancária';

-- ============================================================================
-- VIEW: payments_summary (Resumo de Pagamentos)
-- ============================================================================

CREATE OR REPLACE VIEW payments_summary AS
SELECT
  p.payment_date,
  p.business_unit,
  p.payment_category,
  COUNT(*) as payment_count,
  SUM(p.amount) as total_paid,
  COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as paid_count
FROM payments p
GROUP BY p.payment_date, p.business_unit, p.payment_category
ORDER BY p.payment_date DESC;

COMMENT ON VIEW payments_summary IS 'Resumo de pagamentos por data, unidade e categoria';

-- ============================================================================
-- VIEW: reconciliation_status (Status de Conciliação)
-- ============================================================================

CREATE OR REPLACE VIEW reconciliation_status AS
SELECT
  ba.bank_name,
  ba.account_number,
  COUNT(bs.id) as total_transactions,
  COUNT(CASE WHEN bs.is_reconciled THEN 1 END) as reconciled_count,
  COUNT(CASE WHEN NOT bs.is_reconciled THEN 1 END) as unreconciled_count,
  ROUND(
    CAST(COUNT(CASE WHEN bs.is_reconciled THEN 1 END) AS DECIMAL) /
    NULLIF(COUNT(bs.id), 0) * 100,
    2
  ) as reconciliation_percentage
FROM bank_accounts ba
LEFT JOIN bank_statements bs ON bs.bank_account_id = ba.id
WHERE ba.is_active = true
GROUP BY ba.bank_name, ba.account_number;

COMMENT ON VIEW reconciliation_status IS 'Percentual de conciliação bancária por conta';

-- ============================================================================
-- RLS (Row Level Security) - Políticas de Segurança
-- ============================================================================

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas: Permitir leitura para todos (anon)
CREATE POLICY "Allow read bank_accounts" ON bank_accounts
  FOR SELECT
  USING (true);

CREATE POLICY "Allow read bank_statements" ON bank_statements
  FOR SELECT
  USING (true);

CREATE POLICY "Allow read payments" ON payments
  FOR SELECT
  USING (true);

-- Políticas: Permitir insert/update/delete apenas para autenticados
CREATE POLICY "Allow all for authenticated on bank_accounts" ON bank_accounts
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated on bank_statements" ON bank_statements
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated on payments" ON payments
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Políticas temporárias: Permitir insert para anon (para testes e API)
CREATE POLICY "Allow anon insert on bank_accounts" ON bank_accounts
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon insert on bank_statements" ON bank_statements
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon insert on payments" ON payments
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================================================
-- GRANTS (Permissões)
-- ============================================================================

-- Permitir acesso às views para role anon e authenticated
GRANT SELECT ON bank_balance TO anon, authenticated;
GRANT SELECT ON payments_summary TO anon, authenticated;
GRANT SELECT ON reconciliation_status TO anon, authenticated;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Validação
DO $$
BEGIN
  RAISE NOTICE '✅ Migration extrato_bancario concluída com sucesso!';
  RAISE NOTICE '📊 Tabelas criadas: bank_accounts, bank_statements, payments';
  RAISE NOTICE '📈 Views criadas: bank_balance, payments_summary, reconciliation_status';
  RAISE NOTICE '🔒 RLS habilitado em todas as tabelas';
END $$;
