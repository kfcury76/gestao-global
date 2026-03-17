-- ============================================================================
-- MIGRATION: RH - Funcionários e Folha de Pagamento
-- Data: 2026-03-17
-- Descrição: Migração do módulo RH do Controle para Gestão (CUSTOS)
-- Autor: Sistema de Gestão Financeira
-- ============================================================================

-- ============================================================================
-- TABELA: employees (Cadastro de Funcionários)
-- ============================================================================

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  rg VARCHAR(20),
  admission_date DATE NOT NULL,
  termination_date DATE,

  -- Cargo e Departamento
  position VARCHAR(100), -- 'cozinheiro', 'atendente', 'entregador', 'gerente'
  department VARCHAR(100), -- 'cozinha', 'atendimento', 'entrega', 'administrativo'

  -- Dados Salariais
  salary_type VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'hourly'
  base_salary DECIMAL(10,2) NOT NULL,

  -- Dados Pessoais
  birth_date DATE,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Observações
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_employees_name ON employees(name);
CREATE INDEX idx_employees_cpf ON employees(cpf);
CREATE INDEX idx_employees_active ON employees(is_active);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_position ON employees(position);

-- Comentários
COMMENT ON TABLE employees IS 'Cadastro de funcionários (migrado do Controle)';
COMMENT ON COLUMN employees.salary_type IS 'Tipo de salário: monthly (mensal) ou hourly (por hora)';
COMMENT ON COLUMN employees.base_salary IS 'Salário base mensal ou valor da hora';

-- ============================================================================
-- TABELA: payroll_entries (Lançamentos de Folha de Pagamento)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE RESTRICT,
  reference_month DATE NOT NULL, -- '2026-03-01' (sempre dia 01)

  -- Dados do Secullum (importação de PDF/Excel)
  absences INTEGER DEFAULT 0, -- faltas (dias)
  late_minutes INTEGER DEFAULT 0, -- atrasos (minutos)
  overtime_65_hours DECIMAL(5,2) DEFAULT 0, -- HE 65%
  overtime_100_hours DECIMAL(5,2) DEFAULT 0, -- HE 100%
  night_hours DECIMAL(5,2) DEFAULT 0, -- hora noturna

  -- Cálculos (valores em R$)
  base_salary DECIMAL(10,2) NOT NULL, -- salário base do mês
  overtime_65_value DECIMAL(10,2) DEFAULT 0, -- valor HE 65%
  overtime_100_value DECIMAL(10,2) DEFAULT 0, -- valor HE 100%
  night_shift_value DECIMAL(10,2) DEFAULT 0, -- valor hora noturna
  other_earnings DECIMAL(10,2) DEFAULT 0, -- bonificações, comissões

  discounts DECIMAL(10,2) DEFAULT 0, -- faltas, atrasos

  gross_total DECIMAL(10,2) NOT NULL, -- total bruto (base + HE + outros - descontos)

  -- Encargos
  inss_employee DECIMAL(10,2) DEFAULT 0, -- INSS do funcionário (desconto)
  inss_employer DECIMAL(10,2) DEFAULT 0, -- INSS patronal (custo empresa)
  fgts DECIMAL(10,2) DEFAULT 0, -- FGTS (8% sobre gross_total)

  net_total DECIMAL(10,2) NOT NULL, -- líquido (gross_total - inss_employee)

  -- Custo Total para Empresa (para DRE)
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (
    gross_total + inss_employer + fgts
  ) STORED,

  -- Documentação
  pdf_url TEXT, -- URL do contracheque (Google Drive ou Supabase Storage)

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid
  payment_date DATE,
  payment_method VARCHAR(50), -- pix, transferencia, dinheiro

  -- Observações
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_payroll_month ON payroll_entries(reference_month);
CREATE INDEX idx_payroll_employee ON payroll_entries(employee_id);
CREATE INDEX idx_payroll_status ON payroll_entries(status);

-- Constraint: Único por funcionário + mês (evita duplicação)
CREATE UNIQUE INDEX idx_payroll_employee_month
ON payroll_entries(employee_id, reference_month);

-- Comentários
COMMENT ON TABLE payroll_entries IS 'Lançamentos de folha de pagamento mensal';
COMMENT ON COLUMN payroll_entries.reference_month IS 'Mês de referência (sempre dia 01)';
COMMENT ON COLUMN payroll_entries.total_cost IS 'Custo total para empresa (gross + INSS patronal + FGTS) - usado no DRE';

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

CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_entries_updated_at
BEFORE UPDATE ON payroll_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEW: payroll_summary (Resumo Mensal para DRE)
-- ============================================================================

CREATE OR REPLACE VIEW payroll_summary AS
SELECT
  pe.reference_month,
  COUNT(DISTINCT pe.employee_id) AS employee_count,

  -- Totais de Valores
  SUM(pe.base_salary) AS total_base_salary,
  SUM(pe.overtime_65_value + pe.overtime_100_value + pe.night_shift_value + pe.other_earnings) AS total_earnings,
  SUM(pe.discounts) AS total_discounts,
  SUM(pe.gross_total) AS total_gross,

  -- Totais de Encargos
  SUM(pe.inss_employee) AS total_inss_employee,
  SUM(pe.inss_employer) AS total_inss_employer,
  SUM(pe.fgts) AS total_fgts,

  -- Totais Finais
  SUM(pe.net_total) AS total_net,
  SUM(pe.total_cost) AS total_cost, -- IMPORTANTE: Este valor vai para o DRE

  -- Totais por Status
  SUM(CASE WHEN pe.status = 'paid' THEN pe.net_total ELSE 0 END) AS total_paid,
  SUM(CASE WHEN pe.status = 'pending' THEN pe.net_total ELSE 0 END) AS total_pending,

  -- Contadores
  COUNT(CASE WHEN pe.status = 'paid' THEN 1 END) AS count_paid,
  COUNT(CASE WHEN pe.status = 'pending' THEN 1 END) AS count_pending

FROM payroll_entries pe
GROUP BY pe.reference_month
ORDER BY pe.reference_month DESC;

COMMENT ON VIEW payroll_summary IS 'Resumo mensal de folha (total_cost é usado no DRE como Custo de Pessoal)';

-- ============================================================================
-- VIEW: employee_current_salary (Salário Atual dos Funcionários Ativos)
-- ============================================================================

CREATE OR REPLACE VIEW employee_current_salary AS
SELECT
  e.id,
  e.name,
  e.cpf,
  e.position,
  e.department,
  e.admission_date,
  e.base_salary,
  e.salary_type,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.admission_date)) AS years_employed,
  EXTRACT(MONTH FROM AGE(CURRENT_DATE, e.admission_date)) AS months_employed,
  e.is_active
FROM employees e
WHERE e.is_active = true
ORDER BY e.department, e.name;

COMMENT ON VIEW employee_current_salary IS 'Funcionários ativos com salário e tempo de casa';

-- ============================================================================
-- FUNCTION: calculate_inss (Cálculo de INSS Progressivo)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_inss(gross_salary DECIMAL)
RETURNS TABLE (
  inss_employee DECIMAL(10,2),
  inss_employer DECIMAL(10,2)
) AS $$
DECLARE
  v_inss_employee DECIMAL(10,2) := 0;
  v_inss_employer DECIMAL(10,2) := 0;
  v_remainder DECIMAL(10,2) := gross_salary;
BEGIN
  -- Tabela INSS 2026 (valores aproximados - ATUALIZAR conforme legislação)
  -- Faixa 1: Até R$ 1.412,00 → 7,5%
  -- Faixa 2: De R$ 1.412,01 até R$ 2.666,68 → 9%
  -- Faixa 3: De R$ 2.666,69 até R$ 4.000,03 → 12%
  -- Faixa 4: De R$ 4.000,04 até R$ 7.786,02 → 14%
  -- Teto: R$ 7.786,02

  -- Faixa 1
  IF v_remainder > 1412.00 THEN
    v_inss_employee := v_inss_employee + (1412.00 * 0.075);
    v_remainder := v_remainder - 1412.00;
  ELSE
    v_inss_employee := v_inss_employee + (v_remainder * 0.075);
    v_remainder := 0;
  END IF;

  -- Faixa 2
  IF v_remainder > 0 THEN
    IF v_remainder > (2666.68 - 1412.00) THEN
      v_inss_employee := v_inss_employee + ((2666.68 - 1412.00) * 0.09);
      v_remainder := v_remainder - (2666.68 - 1412.00);
    ELSE
      v_inss_employee := v_inss_employee + (v_remainder * 0.09);
      v_remainder := 0;
    END IF;
  END IF;

  -- Faixa 3
  IF v_remainder > 0 THEN
    IF v_remainder > (4000.03 - 2666.68) THEN
      v_inss_employee := v_inss_employee + ((4000.03 - 2666.68) * 0.12);
      v_remainder := v_remainder - (4000.03 - 2666.68);
    ELSE
      v_inss_employee := v_inss_employee + (v_remainder * 0.12);
      v_remainder := 0;
    END IF;
  END IF;

  -- Faixa 4 (até o teto)
  IF v_remainder > 0 THEN
    IF v_remainder > (7786.02 - 4000.03) THEN
      v_inss_employee := v_inss_employee + ((7786.02 - 4000.03) * 0.14);
    ELSE
      v_inss_employee := v_inss_employee + (v_remainder * 0.14);
    END IF;
  END IF;

  -- INSS Patronal: 20% sobre o salário bruto (teto: R$ 7.786,02)
  IF gross_salary > 7786.02 THEN
    v_inss_employer := 7786.02 * 0.20;
  ELSE
    v_inss_employer := gross_salary * 0.20;
  END IF;

  RETURN QUERY SELECT v_inss_employee, v_inss_employer;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_inss IS 'Calcula INSS progressivo (funcionário e patronal) conforme tabela 2026';

-- ============================================================================
-- FUNCTION: calculate_fgts (Cálculo de FGTS)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_fgts(gross_salary DECIMAL)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  -- FGTS: 8% sobre o salário bruto
  RETURN ROUND(gross_salary * 0.08, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_fgts IS 'Calcula FGTS (8% sobre salário bruto)';

-- ============================================================================
-- SEED: Funcionários Exemplo
-- ============================================================================

INSERT INTO employees (name, cpf, admission_date, position, department, salary_type, base_salary) VALUES
('João Silva', '123.456.789-00', '2024-01-15', 'Cozinheiro', 'cozinha', 'monthly', 2500.00),
('Maria Santos', '987.654.321-00', '2024-02-01', 'Atendente', 'atendimento', 'monthly', 1800.00),
('Pedro Costa', '111.222.333-44', '2024-03-10', 'Entregador', 'entrega', 'monthly', 1500.00),
('Ana Oliveira', '555.666.777-88', '2023-11-20', 'Gerente', 'administrativo', 'monthly', 4000.00),
('Carlos Pereira', '999.888.777-66', '2025-01-05', 'Ajudante de Cozinha', 'cozinha', 'monthly', 1600.00)
ON CONFLICT (cpf) DO NOTHING;

-- ============================================================================
-- RLS (Row Level Security) - Políticas de Segurança
-- ============================================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;

-- Políticas: Permitir leitura para todos autenticados
CREATE POLICY "Allow read employees" ON employees
  FOR SELECT
  USING (true);

CREATE POLICY "Allow read payroll" ON payroll_entries
  FOR SELECT
  USING (true);

-- Políticas: Permitir insert/update/delete apenas para autenticados
CREATE POLICY "Allow all for authenticated on employees" ON employees
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated on payroll" ON payroll_entries
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- GRANTS (Permissões)
-- ============================================================================

-- Permitir acesso à view para role anon e authenticated
GRANT SELECT ON payroll_summary TO anon, authenticated;
GRANT SELECT ON employee_current_salary TO anon, authenticated;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Validação
DO $$
BEGIN
  RAISE NOTICE '✅ Migration concluída com sucesso!';
  RAISE NOTICE '📊 Tabelas criadas: employees, payroll_entries';
  RAISE NOTICE '📈 Views criadas: payroll_summary, employee_current_salary';
  RAISE NOTICE '🔢 Functions criadas: calculate_inss, calculate_fgts';
  RAISE NOTICE '👥 Funcionários seed: 5 exemplos';
END $$;
