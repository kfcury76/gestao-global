-- =====================================================
-- MIGRATION: Custos Fixos - Sistema de Gestão
-- Data: 2026-03-17
-- Descrição: Tabelas para controle de custos fixos mensais
-- =====================================================

-- =====================================================
-- 1. TABELA: categorias_custos_fixos
-- =====================================================
-- Categorias de custos fixos (ex: Aluguel, Energia, Água)

CREATE TABLE IF NOT EXISTS categorias_custos_fixos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  icone VARCHAR(50), -- Ex: 'zap', 'droplet', 'home', 'truck', etc (Lucide icons)
  cor VARCHAR(20) DEFAULT '#6366f1', -- Cor hex para UI (default: indigo)
  ordem INTEGER DEFAULT 0, -- Ordem de exibição
  ativo BOOLEAN DEFAULT TRUE,

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Índices
  CONSTRAINT categorias_custos_fixos_nome_check CHECK (LENGTH(nome) >= 3)
);

-- Índice para busca por nome
CREATE INDEX idx_categorias_custos_fixos_nome ON categorias_custos_fixos(nome);
CREATE INDEX idx_categorias_custos_fixos_ativo ON categorias_custos_fixos(ativo);

COMMENT ON TABLE categorias_custos_fixos IS 'Categorias de custos fixos (aluguel, energia, salários, etc)';

-- =====================================================
-- 2. TABELA: custos_fixos
-- =====================================================
-- Registros individuais de custos fixos

CREATE TABLE IF NOT EXISTS custos_fixos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referências
  categoria_id UUID NOT NULL REFERENCES categorias_custos_fixos(id) ON DELETE RESTRICT,

  -- Dados do custo
  descricao VARCHAR(200) NOT NULL,
  valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),

  -- Periodicidade
  tipo_periodicidade VARCHAR(20) NOT NULL CHECK (tipo_periodicidade IN ('mensal', 'anual', 'unico')),
  data_referencia DATE NOT NULL, -- Ex: 2026-03-01 (primeiro dia do mês)

  -- Controle de recorrência (para custos mensais/anuais)
  recorrente BOOLEAN DEFAULT TRUE,
  data_inicio DATE NOT NULL,
  data_fim DATE, -- NULL = sem data final (recorrente indefinidamente)

  -- Status de pagamento
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  data_pagamento DATE,
  forma_pagamento VARCHAR(50), -- Ex: 'pix', 'dinheiro', 'cartao_credito', 'boleto'

  -- Observações
  observacoes TEXT,
  anexos JSONB, -- URLs de comprovantes, notas fiscais, etc

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT custos_fixos_data_fim_check CHECK (data_fim IS NULL OR data_fim >= data_inicio),
  CONSTRAINT custos_fixos_valor_check CHECK (valor > 0)
);

-- Índices para performance
CREATE INDEX idx_custos_fixos_categoria ON custos_fixos(categoria_id);
CREATE INDEX idx_custos_fixos_data_referencia ON custos_fixos(data_referencia);
CREATE INDEX idx_custos_fixos_status ON custos_fixos(status);
CREATE INDEX idx_custos_fixos_recorrente ON custos_fixos(recorrente);
CREATE INDEX idx_custos_fixos_periodo ON custos_fixos(data_referencia, categoria_id);

COMMENT ON TABLE custos_fixos IS 'Registros de custos fixos mensais (aluguel, contas, salários)';
COMMENT ON COLUMN custos_fixos.tipo_periodicidade IS 'mensal = todo mês, anual = uma vez por ano, unico = não recorrente';
COMMENT ON COLUMN custos_fixos.data_referencia IS 'Data de referência do custo (ex: 2026-03-01 para março/2026)';

-- =====================================================
-- 3. FUNCTION: Atualizar updated_at automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para categorias_custos_fixos
CREATE TRIGGER update_categorias_custos_fixos_updated_at
  BEFORE UPDATE ON categorias_custos_fixos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para custos_fixos
CREATE TRIGGER update_custos_fixos_updated_at
  BEFORE UPDATE ON custos_fixos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. FUNCTION: Calcular total de custos fixos por mês
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_custo_fixo_mensal(
  mes INTEGER,
  ano INTEGER
)
RETURNS TABLE (
  categoria_nome VARCHAR,
  total DECIMAL,
  quantidade_lancamentos BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.nome AS categoria_nome,
    COALESCE(SUM(cf.valor), 0)::DECIMAL AS total,
    COUNT(cf.id) AS quantidade_lancamentos
  FROM categorias_custos_fixos c
  LEFT JOIN custos_fixos cf ON cf.categoria_id = c.id
    AND EXTRACT(MONTH FROM cf.data_referencia) = mes
    AND EXTRACT(YEAR FROM cf.data_referencia) = ano
    AND cf.status != 'cancelado'
  WHERE c.ativo = TRUE
  GROUP BY c.id, c.nome, c.ordem
  ORDER BY c.ordem, c.nome;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_custo_fixo_mensal IS 'Retorna total de custos fixos agrupados por categoria para um mês/ano específico';

-- =====================================================
-- 5. FUNCTION: Gerar custos recorrentes automaticamente
-- =====================================================
-- Esta função cria automaticamente os lançamentos mensais
-- baseados nos custos recorrentes cadastrados

CREATE OR REPLACE FUNCTION gerar_custos_recorrentes(
  mes INTEGER,
  ano INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  contador INTEGER := 0;
  custo_recorrente RECORD;
  data_ref DATE;
BEGIN
  -- Data de referência (primeiro dia do mês)
  data_ref := make_date(ano, mes, 1);

  -- Loop pelos custos recorrentes ativos
  FOR custo_recorrente IN
    SELECT * FROM custos_fixos
    WHERE recorrente = TRUE
      AND data_inicio <= data_ref
      AND (data_fim IS NULL OR data_fim >= data_ref)
      AND tipo_periodicidade = 'mensal'
  LOOP
    -- Verifica se já existe lançamento para este mês
    IF NOT EXISTS (
      SELECT 1 FROM custos_fixos
      WHERE categoria_id = custo_recorrente.categoria_id
        AND descricao = custo_recorrente.descricao
        AND data_referencia = data_ref
    ) THEN
      -- Cria novo lançamento
      INSERT INTO custos_fixos (
        categoria_id,
        descricao,
        valor,
        tipo_periodicidade,
        data_referencia,
        recorrente,
        data_inicio,
        data_fim,
        status,
        created_by
      ) VALUES (
        custo_recorrente.categoria_id,
        custo_recorrente.descricao,
        custo_recorrente.valor,
        'mensal',
        data_ref,
        FALSE, -- Lançamento gerado não é recorrente (evita duplicação)
        data_ref,
        NULL,
        'pendente',
        custo_recorrente.created_by
      );

      contador := contador + 1;
    END IF;
  END LOOP;

  RETURN contador;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION gerar_custos_recorrentes IS 'Gera automaticamente lançamentos mensais baseados nos custos recorrentes';

-- =====================================================
-- 6. RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE categorias_custos_fixos ENABLE ROW LEVEL SECURITY;
ALTER TABLE custos_fixos ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias_custos_fixos
CREATE POLICY "Permitir leitura de categorias para usuários autenticados"
  ON categorias_custos_fixos FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Permitir inserção de categorias para usuários autenticados"
  ON categorias_custos_fixos FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Permitir atualização de categorias para usuários autenticados"
  ON categorias_custos_fixos FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Permitir exclusão de categorias para usuários autenticados"
  ON categorias_custos_fixos FOR DELETE
  TO authenticated
  USING (TRUE);

-- Políticas para custos_fixos
CREATE POLICY "Permitir leitura de custos fixos para usuários autenticados"
  ON custos_fixos FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Permitir inserção de custos fixos para usuários autenticados"
  ON custos_fixos FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Permitir atualização de custos fixos para usuários autenticados"
  ON custos_fixos FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Permitir exclusão de custos fixos para usuários autenticados"
  ON custos_fixos FOR DELETE
  TO authenticated
  USING (TRUE);

-- =====================================================
-- 7. SEED DATA: Categorias Padrão
-- =====================================================

INSERT INTO categorias_custos_fixos (nome, descricao, icone, cor, ordem) VALUES
  ('Aluguel', 'Aluguel de imóveis comerciais e residenciais', 'home', '#8b5cf6', 1),
  ('Energia Elétrica', 'Conta de luz', 'zap', '#eab308', 2),
  ('Água', 'Conta de água', 'droplet', '#3b82f6', 3),
  ('Gás', 'Gás de cozinha e aquecimento', 'flame', '#ef4444', 4),
  ('Internet', 'Provedor de internet', 'wifi', '#06b6d4', 5),
  ('Telefone', 'Telefonia fixa e móvel', 'phone', '#10b981', 6),
  ('Segurança', 'Alarmes, câmeras, seguro', 'shield', '#f59e0b', 7),
  ('Limpeza', 'Produtos de limpeza e serviços', 'sparkles', '#a855f7', 8),
  ('Manutenção', 'Manutenção predial e equipamentos', 'wrench', '#64748b', 9),
  ('Transporte', 'Combustível, fretes, motoboy', 'truck', '#f97316', 10),
  ('Marketing', 'Publicidade, redes sociais, anúncios', 'megaphone', '#ec4899', 11),
  ('Contabilidade', 'Contador, impostos, taxas', 'calculator', '#14b8a6', 12),
  ('Software', 'Licenças, SaaS, sistemas', 'code', '#6366f1', 13),
  ('Outros', 'Custos diversos não categorizados', 'ellipsis', '#94a3b8', 99)
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- 8. SEED DATA: Exemplos de Custos Fixos
-- =====================================================
-- (Opcional - remover após testes)

DO $$
DECLARE
  cat_aluguel UUID;
  cat_energia UUID;
  cat_agua UUID;
  cat_internet UUID;
BEGIN
  -- Pega IDs das categorias
  SELECT id INTO cat_aluguel FROM categorias_custos_fixos WHERE nome = 'Aluguel';
  SELECT id INTO cat_energia FROM categorias_custos_fixos WHERE nome = 'Energia Elétrica';
  SELECT id INTO cat_agua FROM categorias_custos_fixos WHERE nome = 'Água';
  SELECT id INTO cat_internet FROM categorias_custos_fixos WHERE nome = 'Internet';

  -- Insere exemplos (março/2026)
  INSERT INTO custos_fixos (categoria_id, descricao, valor, tipo_periodicidade, data_referencia, recorrente, data_inicio, status) VALUES
    (cat_aluguel, 'Aluguel Loja Centro', 3500.00, 'mensal', '2026-03-01', TRUE, '2026-01-01', 'pago'),
    (cat_energia, 'Conta de Luz - Loja Centro', 450.00, 'mensal', '2026-03-01', TRUE, '2026-01-01', 'pendente'),
    (cat_agua, 'Conta de Água - Loja Centro', 120.00, 'mensal', '2026-03-01', TRUE, '2026-01-01', 'pendente'),
    (cat_internet, 'Internet Fibra 500MB', 99.90, 'mensal', '2026-03-01', TRUE, '2026-01-01', 'pago');
END $$;

-- =====================================================
-- 9. VIEWS ÚTEIS
-- =====================================================

-- View: Resumo de custos fixos por mês
CREATE OR REPLACE VIEW vw_custos_fixos_mensal AS
SELECT
  DATE_TRUNC('month', cf.data_referencia) AS mes_referencia,
  EXTRACT(YEAR FROM cf.data_referencia)::INTEGER AS ano,
  EXTRACT(MONTH FROM cf.data_referencia)::INTEGER AS mes,
  c.nome AS categoria,
  c.cor AS categoria_cor,
  c.icone AS categoria_icone,
  COUNT(cf.id) AS total_lancamentos,
  SUM(cf.valor) AS total_valor,
  SUM(CASE WHEN cf.status = 'pago' THEN cf.valor ELSE 0 END) AS total_pago,
  SUM(CASE WHEN cf.status = 'pendente' THEN cf.valor ELSE 0 END) AS total_pendente,
  SUM(CASE WHEN cf.status = 'atrasado' THEN cf.valor ELSE 0 END) AS total_atrasado
FROM custos_fixos cf
JOIN categorias_custos_fixos c ON c.id = cf.categoria_id
WHERE cf.status != 'cancelado'
GROUP BY DATE_TRUNC('month', cf.data_referencia), c.nome, c.cor, c.icone, c.ordem
ORDER BY mes_referencia DESC, c.ordem;

COMMENT ON VIEW vw_custos_fixos_mensal IS 'Resumo agregado de custos fixos agrupados por mês e categoria';

-- View: Custos fixos em atraso
CREATE OR REPLACE VIEW vw_custos_fixos_atrasados AS
SELECT
  cf.id,
  cf.descricao,
  cf.valor,
  cf.data_referencia,
  c.nome AS categoria,
  c.cor AS categoria_cor,
  (CURRENT_DATE - cf.data_referencia) AS dias_atraso
FROM custos_fixos cf
JOIN categorias_custos_fixos c ON c.id = cf.categoria_id
WHERE cf.status = 'atrasado'
  OR (cf.status = 'pendente' AND cf.data_referencia < CURRENT_DATE)
ORDER BY cf.data_referencia ASC;

COMMENT ON VIEW vw_custos_fixos_atrasados IS 'Custos fixos pendentes ou em atraso';

-- =====================================================
-- 10. GRANTS (Permissões)
-- =====================================================

-- Conceder acesso às tabelas para usuários autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON categorias_custos_fixos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON custos_fixos TO authenticated;

-- Conceder acesso às views
GRANT SELECT ON vw_custos_fixos_mensal TO authenticated;
GRANT SELECT ON vw_custos_fixos_atrasados TO authenticated;

-- Conceder execução das funções
GRANT EXECUTE ON FUNCTION calcular_custo_fixo_mensal TO authenticated;
GRANT EXECUTE ON FUNCTION gerar_custos_recorrentes TO authenticated;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Para aplicar:
-- supabase db push
--
-- Para reverter:
-- DROP VIEW IF EXISTS vw_custos_fixos_atrasados CASCADE;
-- DROP VIEW IF EXISTS vw_custos_fixos_mensal CASCADE;
-- DROP FUNCTION IF EXISTS gerar_custos_recorrentes CASCADE;
-- DROP FUNCTION IF EXISTS calcular_custo_fixo_mensal CASCADE;
-- DROP TABLE IF EXISTS custos_fixos CASCADE;
-- DROP TABLE IF EXISTS categorias_custos_fixos CASCADE;
