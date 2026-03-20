-- ============================================================================
-- SEED DATA: Receitas, Vendas e Extratos
-- Data: 2026-03-20
-- Descrição: Dados de teste para o sistema financeiro
-- Autor: Sistema de Gestão Financeira
-- ============================================================================

-- ============================================================================
-- SEED: Categorias de Receita
-- ============================================================================

INSERT INTO revenue_categories (name, description, business_unit) VALUES
('Vendas Balcão', 'Vendas diretas no balcão da loja', 'both'),
('Delivery', 'Vendas por delivery (WhatsApp, Ifood, App)', 'both'),
('Buffet/Eventos', 'Serviços de buffet e eventos corporativos', 'cosi'),
('Marmitas B2B', 'Venda de marmitas para empresas (contrato)', 'marmitaria'),
('Outros', 'Outras receitas diversas', 'both')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED: Contas Bancárias
-- ============================================================================

INSERT INTO bank_accounts (bank_name, bank_code, account_number, account_type, business_unit) VALUES
('Banco do Brasil', '001', '12345-6', 'corrente', 'cosi'),
('Caixa Econômica', '104', '67890-1', 'corrente', 'marmitaria'),
('Mercado Pago', '323', '11111-1', 'pagamento', 'both')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED: Vendas de Exemplo (Últimos 7 dias)
-- ============================================================================

-- Vendas COSI
INSERT INTO sales (sale_date, business_unit, customer_name, gross_amount, discount_amount, net_amount, payment_method, revenue_category_id, status) VALUES
(CURRENT_DATE - INTERVAL '1 day', 'cosi', 'Cliente A', 150.00, 0, 150.00, 'pix',
  (SELECT id FROM revenue_categories WHERE name = 'Vendas Balcão' LIMIT 1), 'completed'),

(CURRENT_DATE - INTERVAL '1 day', 'cosi', 'Cliente B', 85.50, 5.50, 80.00, 'dinheiro',
  (SELECT id FROM revenue_categories WHERE name = 'Vendas Balcão' LIMIT 1), 'completed'),

(CURRENT_DATE - INTERVAL '2 days', 'cosi', 'Buffet Festa Aniversário', 1200.00, 0, 1200.00, 'pix',
  (SELECT id FROM revenue_categories WHERE name = 'Buffet/Eventos' LIMIT 1), 'completed'),

(CURRENT_DATE - INTERVAL '3 days', 'cosi', 'Cliente C', 220.00, 20.00, 200.00, 'debito',
  (SELECT id FROM revenue_categories WHERE name = 'Delivery' LIMIT 1), 'completed'),

(CURRENT_DATE, 'cosi', 'Cliente D', 95.00, 0, 95.00, 'credito',
  (SELECT id FROM revenue_categories WHERE name = 'Vendas Balcão' LIMIT 1), 'completed'),

-- Vendas MARMITARIA
(CURRENT_DATE - INTERVAL '2 days', 'marmitaria', 'Empresa XYZ Ltda', 450.00, 0, 450.00, 'pix',
  (SELECT id FROM revenue_categories WHERE name = 'Marmitas B2B' LIMIT 1), 'completed'),

(CURRENT_DATE - INTERVAL '1 day', 'marmitaria', 'Cliente E', 45.00, 0, 45.00, 'dinheiro',
  (SELECT id FROM revenue_categories WHERE name = 'Vendas Balcão' LIMIT 1), 'completed'),

(CURRENT_DATE, 'marmitaria', 'Cliente F', 65.00, 5.00, 60.00, 'pix',
  (SELECT id FROM revenue_categories WHERE name = 'Delivery' LIMIT 1), 'completed')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED: Extratos Bancários (Últimos 7 dias)
-- ============================================================================

-- Entradas (Vendas)
INSERT INTO bank_statements (bank_account_id, transaction_date, description, amount, balance, transaction_type, is_reconciled) VALUES
-- Banco do Brasil (Cosi)
((SELECT id FROM bank_accounts WHERE bank_name = 'Banco do Brasil' LIMIT 1),
  CURRENT_DATE - INTERVAL '1 day', 'PIX RECEBIDO - CLIENTE A', 150.00, 3250.00, 'credit', false),

((SELECT id FROM bank_accounts WHERE bank_name = 'Banco do Brasil' LIMIT 1),
  CURRENT_DATE - INTERVAL '2 days', 'TED RECEBIDA - BUFFET', 1200.00, 3100.00, 'credit', false),

((SELECT id FROM bank_accounts WHERE bank_name = 'Banco do Brasil' LIMIT 1),
  CURRENT_DATE - INTERVAL '3 days', 'DEBITO VISA - CLIENTE C', 200.00, 1900.00, 'credit', false),

-- Mercado Pago (Both)
((SELECT id FROM bank_accounts WHERE bank_name = 'Mercado Pago' LIMIT 1),
  CURRENT_DATE - INTERVAL '2 days', 'PIX RECEBIDO - EMPRESA XYZ', 450.00, 1850.00, 'credit', false),

((SELECT id FROM bank_accounts WHERE bank_name = 'Mercado Pago' LIMIT 1),
  CURRENT_DATE, 'PIX RECEBIDO - CLIENTE F', 60.00, 1910.00, 'credit', false)

ON CONFLICT DO NOTHING;

-- Saídas (Despesas)
INSERT INTO bank_statements (bank_account_id, transaction_date, description, amount, balance, transaction_type, category, is_reconciled) VALUES
-- Banco do Brasil (Cosi)
((SELECT id FROM bank_accounts WHERE bank_name = 'Banco do Brasil' LIMIT 1),
  CURRENT_DATE - INTERVAL '3 days', 'TED ENVIADA - FORNECEDOR ABC', -350.00, 1550.00, 'debit', 'Fornecedores', false),

((SELECT id FROM bank_accounts WHERE bank_name = 'Banco do Brasil' LIMIT 1),
  CURRENT_DATE - INTERVAL '1 day', 'BOLETO PAGTO - ENERGIA', -280.00, 2970.00, 'debit', 'Energia', false),

((SELECT id FROM bank_accounts WHERE bank_name = 'Banco do Brasil' LIMIT 1),
  CURRENT_DATE - INTERVAL '5 days', 'PIX ENVIADO - ALUGUEL', -1500.00, 400.00, 'debit', 'Aluguel', false)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED: Pagamentos Realizados
-- ============================================================================

INSERT INTO payments (payment_date, business_unit, payee_name, payee_document, amount, payment_category, payment_method, status) VALUES
(CURRENT_DATE - INTERVAL '3 days', 'cosi', 'Fornecedor ABC Alimentos Ltda', '12.345.678/0001-90', 350.00, 'Fornecedores', 'pix', 'paid'),
(CURRENT_DATE - INTERVAL '1 day', 'cosi', 'CPFL Energia', '02.998.898/0001-35', 280.00, 'Energia Elétrica', 'boleto', 'paid'),
(CURRENT_DATE - INTERVAL '5 days', 'cosi', 'Imobiliária XYZ', '11.222.333/0001-44', 1500.00, 'Aluguel', 'pix', 'paid'),
(CURRENT_DATE - INTERVAL '2 days', 'marmitaria', 'Distribuidora Alimentos SA', '22.333.444/0001-55', 280.00, 'Fornecedores', 'pix', 'paid'),
(CURRENT_DATE, 'both', 'Telefônica Brasil SA', '02.558.157/0001-62', 120.00, 'Telefonia/Internet', 'debito', 'paid')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIM DO SEED DATA
-- ============================================================================

-- Validação
DO $$
DECLARE
  v_categories_count INT;
  v_accounts_count INT;
  v_sales_count INT;
  v_statements_count INT;
  v_payments_count INT;
BEGIN
  SELECT COUNT(*) INTO v_categories_count FROM revenue_categories;
  SELECT COUNT(*) INTO v_accounts_count FROM bank_accounts;
  SELECT COUNT(*) INTO v_sales_count FROM sales;
  SELECT COUNT(*) INTO v_statements_count FROM bank_statements;
  SELECT COUNT(*) INTO v_payments_count FROM payments;

  RAISE NOTICE '✅ Seed data concluído com sucesso!';
  RAISE NOTICE '📊 Categorias de receita: %', v_categories_count;
  RAISE NOTICE '🏦 Contas bancárias: %', v_accounts_count;
  RAISE NOTICE '💰 Vendas: %', v_sales_count;
  RAISE NOTICE '📋 Extratos bancários: %', v_statements_count;
  RAISE NOTICE '💸 Pagamentos: %', v_payments_count;
END $$;
