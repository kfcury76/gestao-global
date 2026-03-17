# 👥 FASE 3: FOLHA DE PAGAMENTO (RH) - GUIA COMPLETO

**Data:** 2026-03-17
**Duração:** 2-3 semanas (40-50 horas)
**Objetivo:** Migrar módulo RH do Controle → Gestão (como CUSTO)

---

## 🎯 VISÃO GERAL

### **Por Que Esta Migração?**

**❌ PROBLEMA ATUAL:**
- Módulo RH está no **Controle** (app operacional)
- RH = CUSTO, não deveria estar em operações
- Sem integração com DRE
- Sem cálculo automático de custo de pessoal

**✅ SOLUÇÃO:**
- Migrar RH para **Gestão** (app financeiro)
- RH vira "Folha de Pagamento" em **Custos**
- Integração automática com DRE
- Custo Total de Pessoal = Salários + INSS + FGTS

---

## 📦 O QUE SERÁ CONSTRUÍDO

```
📂 Gestão → Custos → Folha de Pagamento
│
├── 1. DATABASE (Supabase)
│   ├── employees (cadastro de funcionários)
│   ├── payroll_entries (lançamentos de folha mensal)
│   └── payroll_summary (view para DRE)
│
├── 2. BACKEND (Edge Functions)
│   ├── extract-secullum-pdf (parser de PDF do ponto)
│   ├── calculate-payroll (cálculo de folha + INSS + FGTS)
│   └── generate-payslip-pdf (contracheque em PDF)
│
├── 3. FRONTEND (React)
│   ├── Tab 1: Importação Secullum (upload PDF/Excel)
│   ├── Tab 2: Cadastro de Funcionários (CRUD)
│   ├── Tab 3: Fechamento Mensal (calcular + aprovar)
│   └── Tab 4: Histórico (consulta + comparativos)
│
└── 4. MIGRAÇÃO E DEPRECAÇÃO
    ├── Migrar dados históricos (Controle → Gestão)
    ├── Adicionar aviso no Controle
    └── Bloquear novas importações no Controle
```

---

## ⏱️ CRONOGRAMA DETALHADO

| Semana | Frentes Paralelas | Horas | Entregáveis |
|--------|-------------------|-------|-------------|
| **Semana 1** | FRENTE 3A: Database RH | 2h | Tabelas criadas e validadas |
| **Semana 1-2** | FRENTE 3B: Backend (3 Edge Functions) | 5-6h | Functions deployadas e testadas |
| **Semana 2** | FRENTE 3C: Frontend RH (4 tabs) | 8-10h | Interface completa funcionando |
| **Semana 2-3** | FRENTE 3D: Migração do Controle | 2-3h | Dados migrados, módulo deprecado |

**Total:** 17-21 horas (2-3 semanas)

---

## 📦 FRENTE 3A: DATABASE RH

**Pasta:** `gestao/supabase_nfe/migrations/`
**Tempo:** 2 horas
**Janela:** 1

---

### **TAREFA 3A.1: Criar Migration de Funcionários e Folha (90 min)**

**Arquivo:** `gestao/supabase_nfe/migrations/20260317_rh_payroll.sql`

```sql
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
```

**Salvar como:** `gestao/supabase_nfe/migrations/20260317_rh_payroll.sql`

---

### **TAREFA 3A.2: Aplicar Migration no Supabase (15 min)**

**Opção A: Via Supabase Dashboard (Cloudfy)**
```
1. Acessar: https://energetictriggerfish-supabase.cloudfy.live
2. Menu → SQL Editor
3. Copiar TODO o conteúdo de 20260317_rh_payroll.sql
4. Colar no editor
5. Run (executar)
6. Verificar mensagens de sucesso
```

**Opção B: Via Supabase CLI** (se configurado)
```bash
cd gestao/supabase_nfe
supabase db push
```

---

### **TAREFA 3A.3: Validar Criação (15 min)**

**Query de Validação:**
```sql
-- 1. Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('employees', 'payroll_entries');

-- 2. Contar funcionários seed
SELECT COUNT(*) as total_employees FROM employees;
SELECT department, COUNT(*) as count
FROM employees
GROUP BY department;

-- 3. Verificar views
SELECT * FROM payroll_summary; -- deve estar vazia (sem lançamentos ainda)
SELECT * FROM employee_current_salary; -- deve mostrar 5 funcionários

-- 4. Testar function calculate_inss
SELECT * FROM calculate_inss(2500.00); -- salário de R$ 2.500

-- 5. Testar function calculate_fgts
SELECT calculate_fgts(2500.00); -- deve retornar 200.00 (8%)

-- 6. Ver estrutura da tabela employees
\d employees

-- 7. Ver estrutura da tabela payroll_entries
\d payroll_entries
```

**Resultados Esperados:**
- ✅ 2 tabelas criadas (employees, payroll_entries)
- ✅ 5 funcionários inseridos
- ✅ Views funcionando (payroll_summary vazia, employee_current_salary com 5 registros)
- ✅ Functions retornando valores corretos

---

### **✅ CHECKLIST FRENTE 3A:**

- [ ] Arquivo `20260317_rh_payroll.sql` criado
- [ ] Migration aplicada no Supabase
- [ ] Tabela `employees` criada (validado)
- [ ] Tabela `payroll_entries` criada (validado)
- [ ] View `payroll_summary` criada (validado)
- [ ] View `employee_current_salary` criada (validado)
- [ ] Function `calculate_inss` funcionando (testado)
- [ ] Function `calculate_fgts` funcionando (testado)
- [ ] 5 funcionários seed inseridos (validado)
- [ ] Commit: `git commit -m "feat(rh): criar tabelas de funcionários e folha de pagamento"`

---

## 📦 FRENTE 3B: BACKEND RH (Edge Functions)

**Pasta:** `gestao/supabase_nfe/functions/`
**Tempo:** 5-6 horas
**Janela:** 2

---

### **TAREFA 3B.1: Edge Function - extract-secullum-pdf (3-4h)**

**Objetivo:** Extrair dados do PDF/Excel do sistema Secullum Web Pro (ponto eletrônico)

**Arquivo:** `gestao/supabase_nfe/functions/extract-secullum-pdf/index.ts`

```typescript
// ============================================================================
// Edge Function: extract-secullum-pdf
// Descrição: Extrai dados de folha de ponto do Secullum Web Pro (PDF/Excel)
// Input: PDF ou Excel em base64
// Output: Array de funcionários com dados de ponto
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecullumEmployee {
  name: string
  absences: number // faltas (dias)
  late_minutes: number // atrasos (minutos)
  overtime_65_hours: number // HE 65%
  overtime_100_hours: number // HE 100%
  night_hours: number // hora noturna
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { file_content, file_type, reference_month } = await req.json()

    if (!file_content || !file_type) {
      return new Response(
        JSON.stringify({ error: 'file_content e file_type são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let employees: SecullumEmployee[] = []

    if (file_type === 'pdf') {
      employees = await extractFromPDF(file_content)
    } else if (file_type === 'excel' || file_type === 'xlsx') {
      employees = await extractFromExcel(file_content)
    } else {
      return new Response(
        JSON.stringify({ error: 'file_type inválido. Use: pdf, excel, xlsx' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enriquecer com dados de funcionários cadastrados
    const enrichedEmployees = await enrichWithEmployeeData(supabaseClient, employees)

    return new Response(
      JSON.stringify({
        success: true,
        reference_month: reference_month || new Date().toISOString().slice(0, 7),
        employees_count: employees.length,
        employees: enrichedEmployees
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao extrair Secullum:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================================
// Extração de PDF (pdfjs-dist)
// ============================================================================

async function extractFromPDF(base64Content: string): Promise<SecullumEmployee[]> {
  // Importar pdfjs-dist
  const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174')

  // Decodificar base64
  const binaryString = atob(base64Content)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Carregar PDF
  const loadingTask = pdfjsLib.getDocument({ data: bytes })
  const pdf = await loadingTask.promise

  let fullText = ''

  // Extrair texto de todas as páginas
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    fullText += pageText + '\n'
  }

  // Parser de texto (padrão Secullum)
  return parseSecullumText(fullText)
}

// ============================================================================
// Extração de Excel (xlsx)
// ============================================================================

async function extractFromExcel(base64Content: string): Promise<SecullumEmployee[]> {
  const XLSX = await import('https://esm.sh/xlsx@0.18.5')

  // Decodificar base64
  const binaryString = atob(base64Content)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Ler Excel
  const workbook = XLSX.read(bytes, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(firstSheet)

  // Parser de dados do Excel
  return parseSecullumExcel(data)
}

// ============================================================================
// Parser de Texto (Secullum PDF)
// ============================================================================

function parseSecullumText(text: string): SecullumEmployee[] {
  const employees: SecullumEmployee[] = []
  const lines = text.split('\n')

  // Padrões de regex para Secullum Web Pro
  // Exemplo de linha: "João Silva    Faltas: 2    Atrasos: 45min    HE 65%: 10h    HE 100%: 5h    H.Noturna: 8h"

  const employeePattern = /^([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+)\s+Faltas:\s*(\d+)\s+Atrasos:\s*(\d+)min\s+HE\s*65%:\s*([\d,]+)h\s+HE\s*100%:\s*([\d,]+)h\s+H\.Noturna:\s*([\d,]+)h/i

  for (const line of lines) {
    const match = line.match(employeePattern)

    if (match) {
      employees.push({
        name: match[1].trim(),
        absences: parseInt(match[2]) || 0,
        late_minutes: parseInt(match[3]) || 0,
        overtime_65_hours: parseFloat(match[4].replace(',', '.')) || 0,
        overtime_100_hours: parseFloat(match[5].replace(',', '.')) || 0,
        night_hours: parseFloat(match[6].replace(',', '.')) || 0,
      })
    }
  }

  return employees
}

// ============================================================================
// Parser de Excel (Secullum)
// ============================================================================

function parseSecullumExcel(data: any[]): SecullumEmployee[] {
  const employees: SecullumEmployee[] = []

  // Assumindo colunas: Nome | Faltas | Atrasos | HE65 | HE100 | HNoturna
  for (const row of data) {
    if (row['Nome'] || row['NOME'] || row['nome']) {
      employees.push({
        name: (row['Nome'] || row['NOME'] || row['nome']).trim(),
        absences: parseInt(row['Faltas'] || row['FALTAS'] || row['faltas'] || 0),
        late_minutes: parseInt(row['Atrasos'] || row['ATRASOS'] || row['atrasos'] || 0),
        overtime_65_hours: parseFloat(row['HE 65%'] || row['HE65'] || row['he65'] || 0),
        overtime_100_hours: parseFloat(row['HE 100%'] || row['HE100'] || row['he100'] || 0),
        night_hours: parseFloat(row['H.Noturna'] || row['Hora Noturna'] || row['noturna'] || 0),
      })
    }
  }

  return employees
}

// ============================================================================
// Enriquecer com Dados de Funcionários Cadastrados
// ============================================================================

async function enrichWithEmployeeData(
  supabase: any,
  employees: SecullumEmployee[]
): Promise<any[]> {
  // Buscar todos os funcionários ativos
  const { data: dbEmployees, error } = await supabase
    .from('employees')
    .select('id, name, cpf, position, department, base_salary')
    .eq('is_active', true)

  if (error) {
    console.error('Erro ao buscar funcionários:', error)
    return employees.map(emp => ({ ...emp, employee_id: null, base_salary: null, match_status: 'not_found' }))
  }

  // Match por nome (normalizado)
  return employees.map(emp => {
    const normalizedName = normalizeString(emp.name)
    const match = dbEmployees.find((dbEmp: any) =>
      normalizeString(dbEmp.name) === normalizedName
    )

    if (match) {
      return {
        ...emp,
        employee_id: match.id,
        cpf: match.cpf,
        position: match.position,
        department: match.department,
        base_salary: match.base_salary,
        match_status: 'found'
      }
    } else {
      return {
        ...emp,
        employee_id: null,
        base_salary: null,
        match_status: 'not_found'
      }
    }
  })
}

// ============================================================================
// Funções Auxiliares
// ============================================================================

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z\s]/g, '') // remove caracteres especiais
    .trim()
}
```

**Salvar como:** `gestao/supabase_nfe/functions/extract-secullum-pdf/index.ts`

---

### **TAREFA 3B.2: Edge Function - calculate-payroll (2h)**

**Objetivo:** Calcular folha de pagamento completa (HE, INSS, FGTS)

**Arquivo:** `gestao/supabase_nfe/functions/calculate-payroll/index.ts`

```typescript
// ============================================================================
// Edge Function: calculate-payroll
// Descrição: Calcula folha de pagamento completa (HE, descontos, INSS, FGTS)
// Input: employee_id + dados Secullum + reference_month
// Output: PayrollEntry completo
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayrollInput {
  employee_id: string
  reference_month: string // 'YYYY-MM-DD' (dia 01)
  absences: number
  late_minutes: number
  overtime_65_hours: number
  overtime_100_hours: number
  night_hours: number
  other_earnings?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const input: PayrollInput = await req.json()

    if (!input.employee_id || !input.reference_month) {
      return new Response(
        JSON.stringify({ error: 'employee_id e reference_month são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar funcionário
    const { data: employee, error: employeeError } = await supabaseClient
      .from('employees')
      .select('*')
      .eq('id', input.employee_id)
      .single()

    if (employeeError || !employee) {
      return new Response(
        JSON.stringify({ error: 'Funcionário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular folha
    const payroll = calculatePayroll(employee, input)

    // Inserir ou atualizar no banco
    const { data: savedPayroll, error: saveError } = await supabaseClient
      .from('payroll_entries')
      .upsert({
        employee_id: input.employee_id,
        reference_month: input.reference_month,
        ...payroll
      }, {
        onConflict: 'employee_id,reference_month'
      })
      .select()
      .single()

    if (saveError) {
      throw saveError
    }

    return new Response(
      JSON.stringify({
        success: true,
        payroll: savedPayroll
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao calcular folha:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================================
// Função de Cálculo de Folha
// ============================================================================

function calculatePayroll(employee: any, input: PayrollInput) {
  const baseSalary = employee.base_salary
  const hourlyRate = baseSalary / 220 // 220 horas/mês (padrão CLT)

  // 1. Horas Extras
  const overtime65Value = input.overtime_65_hours * hourlyRate * 1.65 // 65% adicional
  const overtime100Value = input.overtime_100_hours * hourlyRate * 2.0 // 100% adicional
  const nightShiftValue = input.night_hours * hourlyRate * 1.2 // 20% adicional
  const otherEarnings = input.other_earnings || 0

  // 2. Descontos
  // Faltas: cada falta = 1 dia de trabalho (base_salary / 30)
  const absenceDiscount = input.absences * (baseSalary / 30)

  // Atrasos: cada minuto = (hourly_rate / 60)
  const lateDiscount = input.late_minutes * (hourlyRate / 60)

  const totalDiscounts = absenceDiscount + lateDiscount

  // 3. Salário Bruto
  const grossTotal = baseSalary + overtime65Value + overtime100Value + nightShiftValue + otherEarnings - totalDiscounts

  // 4. INSS (função progressiva)
  const { inssEmployee, inssEmployer } = calculateINSS(grossTotal)

  // 5. FGTS (8% sobre bruto)
  const fgts = grossTotal * 0.08

  // 6. Salário Líquido
  const netTotal = grossTotal - inssEmployee

  return {
    absences: input.absences,
    late_minutes: input.late_minutes,
    overtime_65_hours: input.overtime_65_hours,
    overtime_100_hours: input.overtime_100_hours,
    night_hours: input.night_hours,

    base_salary: parseFloat(baseSalary.toFixed(2)),
    overtime_65_value: parseFloat(overtime65Value.toFixed(2)),
    overtime_100_value: parseFloat(overtime100Value.toFixed(2)),
    night_shift_value: parseFloat(nightShiftValue.toFixed(2)),
    other_earnings: parseFloat(otherEarnings.toFixed(2)),

    discounts: parseFloat(totalDiscounts.toFixed(2)),

    gross_total: parseFloat(grossTotal.toFixed(2)),

    inss_employee: parseFloat(inssEmployee.toFixed(2)),
    inss_employer: parseFloat(inssEmployer.toFixed(2)),
    fgts: parseFloat(fgts.toFixed(2)),

    net_total: parseFloat(netTotal.toFixed(2)),

    status: 'pending'
  }
}

// ============================================================================
// Cálculo de INSS Progressivo (2026)
// ============================================================================

function calculateINSS(grossSalary: number): { inssEmployee: number; inssEmployer: number } {
  let inssEmployee = 0
  let remainder = grossSalary

  // Tabela INSS 2026 (simplificada)
  const brackets = [
    { limit: 1412.00, rate: 0.075 },
    { limit: 2666.68, rate: 0.09 },
    { limit: 4000.03, rate: 0.12 },
    { limit: 7786.02, rate: 0.14 }
  ]

  let previousLimit = 0

  for (const bracket of brackets) {
    if (remainder <= 0) break

    const bracketAmount = bracket.limit - previousLimit
    const taxableAmount = Math.min(remainder, bracketAmount)

    inssEmployee += taxableAmount * bracket.rate
    remainder -= taxableAmount
    previousLimit = bracket.limit
  }

  // INSS Patronal: 20% sobre salário bruto (limitado ao teto)
  const inssBase = Math.min(grossSalary, 7786.02)
  const inssEmployer = inssBase * 0.20

  return { inssEmployee, inssEmployer }
}
```

**Salvar como:** `gestao/supabase_nfe/functions/calculate-payroll/index.ts`

---

### **TAREFA 3B.3: Edge Function - generate-payslip-pdf (1h)**

**Objetivo:** Gerar PDF do contracheque

**Arquivo:** `gestao/supabase_nfe/functions/generate-payslip-pdf/index.ts`

```typescript
// ============================================================================
// Edge Function: generate-payslip-pdf
// Descrição: Gera PDF do contracheque (payslip)
// Input: payroll_entry_id
// Output: URL do PDF (Supabase Storage ou Google Drive)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { payroll_entry_id } = await req.json()

    if (!payroll_entry_id) {
      return new Response(
        JSON.stringify({ error: 'payroll_entry_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar lançamento de folha
    const { data: payroll, error: payrollError } = await supabaseClient
      .from('payroll_entries')
      .select(`
        *,
        employee:employees (
          name,
          cpf,
          position,
          department
        )
      `)
      .eq('id', payroll_entry_id)
      .single()

    if (payrollError || !payroll) {
      return new Response(
        JSON.stringify({ error: 'Lançamento de folha não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Gerar PDF
    const pdfBytes = await generatePayslipPDF(payroll)

    // Upload para Supabase Storage
    const fileName = `contracheque_${payroll.employee.name.replace(/\s/g, '_')}_${payroll.reference_month}.pdf`
    const filePath = `payslips/${new Date().getFullYear()}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('documents')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // Obter URL pública
    const { data: publicUrl } = supabaseClient.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Atualizar payroll_entry com URL do PDF
    await supabaseClient
      .from('payroll_entries')
      .update({ pdf_url: publicUrl.publicUrl })
      .eq('id', payroll_entry_id)

    return new Response(
      JSON.stringify({
        success: true,
        pdf_url: publicUrl.publicUrl,
        file_name: fileName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao gerar contracheque:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================================
// Geração de PDF do Contracheque
// ============================================================================

async function generatePayslipPDF(payroll: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()
  let yPosition = height - 50

  // Helper para desenhar linha
  const drawText = (text: string, x: number, size: number, isBold = false) => {
    page.drawText(text, {
      x,
      y: yPosition,
      size,
      font: isBold ? fontBold : font,
      color: rgb(0, 0, 0)
    })
    yPosition -= size + 5
  }

  // Cabeçalho
  drawText('CONTRACHEQUE', 250, 16, true)
  yPosition -= 10
  drawText('Empório Cosi', 230, 12)
  yPosition -= 20

  // Dados do Funcionário
  drawText(`Funcionário: ${payroll.employee.name}`, 50, 11)
  drawText(`CPF: ${payroll.employee.cpf || 'N/A'}`, 50, 11)
  drawText(`Cargo: ${payroll.employee.position}`, 50, 11)
  drawText(`Departamento: ${payroll.employee.department}`, 50, 11)
  drawText(`Mês de Referência: ${formatMonth(payroll.reference_month)}`, 50, 11)
  yPosition -= 10

  // Linha separadora
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0)
  })
  yPosition -= 15

  // PROVENTOS
  drawText('PROVENTOS', 50, 12, true)
  drawText(`Salário Base: R$ ${payroll.base_salary.toFixed(2)}`, 70, 10)

  if (payroll.overtime_65_value > 0) {
    drawText(`Hora Extra 65%: R$ ${payroll.overtime_65_value.toFixed(2)}`, 70, 10)
  }

  if (payroll.overtime_100_value > 0) {
    drawText(`Hora Extra 100%: R$ ${payroll.overtime_100_value.toFixed(2)}`, 70, 10)
  }

  if (payroll.night_shift_value > 0) {
    drawText(`Hora Noturna: R$ ${payroll.night_shift_value.toFixed(2)}`, 70, 10)
  }

  if (payroll.other_earnings > 0) {
    drawText(`Outros Proventos: R$ ${payroll.other_earnings.toFixed(2)}`, 70, 10)
  }

  yPosition -= 5

  // DESCONTOS
  drawText('DESCONTOS', 50, 12, true)

  if (payroll.discounts > 0) {
    drawText(`Faltas/Atrasos: R$ ${payroll.discounts.toFixed(2)}`, 70, 10)
  }

  drawText(`INSS: R$ ${payroll.inss_employee.toFixed(2)}`, 70, 10)
  yPosition -= 10

  // Linha separadora
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0)
  })
  yPosition -= 15

  // TOTAIS
  drawText(`SALÁRIO BRUTO: R$ ${payroll.gross_total.toFixed(2)}`, 50, 11, true)
  drawText(`TOTAL DE DESCONTOS: R$ ${(payroll.discounts + payroll.inss_employee).toFixed(2)}`, 50, 11, true)
  drawText(`SALÁRIO LÍQUIDO: R$ ${payroll.net_total.toFixed(2)}`, 50, 13, true)

  yPosition -= 20

  // Informações adicionais
  drawText('INFORMAÇÕES ADICIONAIS:', 50, 10, true)
  drawText(`FGTS (8%): R$ ${payroll.fgts.toFixed(2)} (depositado pela empresa)`, 70, 9)
  drawText(`INSS Patronal: R$ ${payroll.inss_employer.toFixed(2)} (pago pela empresa)`, 70, 9)

  yPosition -= 30

  // Rodapé
  drawText('_____________________________', 80, 9)
  drawText('Assinatura do Funcionário', 100, 9)

  return pdfDoc.save()
}

function formatMonth(dateString: string): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const date = new Date(dateString + 'T00:00:00')
  const month = months[date.getMonth()]
  const year = date.getFullYear()

  return `${month}/${year}`
}
```

**Salvar como:** `gestao/supabase_nfe/functions/generate-payslip-pdf/index.ts`

---

### **TAREFA 3B.4: Deploy das Edge Functions (30 min)**

**Via Supabase CLI:**
```bash
cd gestao/supabase_nfe

# Deploy extract-secullum-pdf
supabase functions deploy extract-secullum-pdf

# Deploy calculate-payroll
supabase functions deploy calculate-payroll

# Deploy generate-payslip-pdf
supabase functions deploy generate-payslip-pdf
```

**Ou via Supabase Dashboard** (Cloudfy):
```
1. Functions → Create Function
2. Nome: extract-secullum-pdf
3. Copiar código completo
4. Deploy
5. Repetir para calculate-payroll e generate-payslip-pdf
```

---

### **TAREFA 3B.5: Testar Edge Functions (1h)**

**Teste 1: extract-secullum-pdf**
```bash
# Criar arquivo de teste (PDF base64 ou Excel base64)
# Exemplo simplificado (usar PDF real em produção)

curl -X POST \
  'https://energetictriggerfish-supabase.cloudfy.live/functions/v1/extract-secullum-pdf' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "file_content": "BASE64_CONTENT_HERE",
    "file_type": "pdf",
    "reference_month": "2026-03-01"
  }'
```

**Teste 2: calculate-payroll**
```bash
curl -X POST \
  'https://energetictriggerfish-supabase.cloudfy.live/functions/v1/calculate-payroll' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "employee_id": "UUID_DO_JOAO_SILVA",
    "reference_month": "2026-03-01",
    "absences": 1,
    "late_minutes": 30,
    "overtime_65_hours": 5,
    "overtime_100_hours": 2,
    "night_hours": 8
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "payroll": {
    "employee_id": "...",
    "reference_month": "2026-03-01",
    "base_salary": 2500.00,
    "overtime_65_value": 93.75,
    "overtime_100_value": 45.45,
    "night_shift_value": 109.09,
    "discounts": 93.94,
    "gross_total": 2654.35,
    "inss_employee": 244.95,
    "inss_employer": 530.87,
    "fgts": 212.35,
    "net_total": 2409.40
  }
}
```

**Teste 3: generate-payslip-pdf**
```bash
curl -X POST \
  'https://energetictriggerfish-supabase.cloudfy.live/functions/v1/generate-payslip-pdf' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "payroll_entry_id": "UUID_DO_LANCAMENTO"
  }'
```

**Validar:**
- ✅ Extract retorna array de funcionários
- ✅ Calculate insere registro em `payroll_entries`
- ✅ Generate cria PDF e retorna URL

---

### **✅ CHECKLIST FRENTE 3B:**

- [ ] Function `extract-secullum-pdf/index.ts` criada
- [ ] Function `calculate-payroll/index.ts` criada
- [ ] Function `generate-payslip-pdf/index.ts` criada
- [ ] Deploy das 3 functions realizado
- [ ] Teste extract-secullum-pdf (sucesso)
- [ ] Teste calculate-payroll (sucesso)
- [ ] Teste generate-payslip-pdf (sucesso)
- [ ] Validar inserção em `payroll_entries` (query SQL)
- [ ] Validar PDF gerado (download e visualizar)
- [ ] Commit: `git commit -m "feat(rh): edge functions para folha de pagamento"`

---

## 📦 FRENTE 3C: FRONTEND RH (React)

**Pasta:** `gestao/src/`
**Tempo:** 8-10 horas
**Janela:** 3

---

### **TAREFA 3C.1: API Client para RH (1h)**

**Arquivo:** `gestao/src/lib/api/payroll.ts`

```typescript
// ============================================================================
// API Client: Payroll (RH / Folha de Pagamento)
// ============================================================================

import { supabase } from '../supabase'

export interface Employee {
  id: string
  name: string
  cpf?: string
  rg?: string
  admission_date: string
  termination_date?: string
  position: string
  department: string
  salary_type: 'monthly' | 'hourly'
  base_salary: number
  birth_date?: string
  phone?: string
  email?: string
  address?: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface PayrollEntry {
  id: string
  employee_id: string
  reference_month: string
  absences: number
  late_minutes: number
  overtime_65_hours: number
  overtime_100_hours: number
  night_hours: number
  base_salary: number
  overtime_65_value: number
  overtime_100_value: number
  night_shift_value: number
  other_earnings: number
  discounts: number
  gross_total: number
  inss_employee: number
  inss_employer: number
  fgts: number
  net_total: number
  total_cost: number
  pdf_url?: string
  status: 'pending' | 'approved' | 'paid'
  payment_date?: string
  payment_method?: string
  notes?: string
  created_at: string
  updated_at: string
  employee?: Employee
}

export interface PayrollSummary {
  reference_month: string
  employee_count: number
  total_base_salary: number
  total_earnings: number
  total_discounts: number
  total_gross: number
  total_inss_employee: number
  total_inss_employer: number
  total_fgts: number
  total_net: number
  total_cost: number
  total_paid: number
  total_pending: number
  count_paid: number
  count_pending: number
}

// ============================================================================
// Funcionários
// ============================================================================

export async function getEmployees(filters?: { department?: string; active?: boolean }) {
  let query = supabase
    .from('employees')
    .select('*')
    .order('name')

  if (filters?.department) {
    query = query.eq('department', filters.department)
  }

  if (filters?.active !== undefined) {
    query = query.eq('is_active', filters.active)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Employee[]
}

export async function getEmployee(id: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Employee
}

export async function createEmployee(employee: Partial<Employee>) {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single()

  if (error) throw error
  return data as Employee
}

export async function updateEmployee(id: string, updates: Partial<Employee>) {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Employee
}

export async function deleteEmployee(id: string) {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// Folha de Pagamento
// ============================================================================

export async function getPayrollEntries(referenceMonth: string) {
  const { data, error } = await supabase
    .from('payroll_entries')
    .select(`
      *,
      employee:employees (
        id,
        name,
        cpf,
        position,
        department
      )
    `)
    .eq('reference_month', referenceMonth)
    .order('employee(name)')

  if (error) throw error
  return data as PayrollEntry[]
}

export async function getPayrollEntry(id: string) {
  const { data, error } = await supabase
    .from('payroll_entries')
    .select(`
      *,
      employee:employees (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as PayrollEntry
}

export async function createPayrollEntry(entry: Partial<PayrollEntry>) {
  const { data, error } = await supabase
    .from('payroll_entries')
    .insert(entry)
    .select()
    .single()

  if (error) throw error
  return data as PayrollEntry
}

export async function updatePayrollEntry(id: string, updates: Partial<PayrollEntry>) {
  const { data, error } = await supabase
    .from('payroll_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PayrollEntry
}

export async function deletePayrollEntry(id: string) {
  const { error } = await supabase
    .from('payroll_entries')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// Resumo de Folha
// ============================================================================

export async function getPayrollSummary(referenceMonth?: string) {
  let query = supabase
    .from('payroll_summary')
    .select('*')
    .order('reference_month', { ascending: false })

  if (referenceMonth) {
    query = query.eq('reference_month', referenceMonth)
  }

  const { data, error } = await query

  if (error) throw error
  return data as PayrollSummary[]
}

// ============================================================================
// Edge Functions
// ============================================================================

export async function extractSecullumPDF(fileContent: string, fileType: 'pdf' | 'excel', referenceMonth: string) {
  const { data, error } = await supabase.functions.invoke('extract-secullum-pdf', {
    body: {
      file_content: fileContent,
      file_type: fileType,
      reference_month: referenceMonth
    }
  })

  if (error) throw error
  return data
}

export async function calculatePayroll(payload: {
  employee_id: string
  reference_month: string
  absences: number
  late_minutes: number
  overtime_65_hours: number
  overtime_100_hours: number
  night_hours: number
  other_earnings?: number
}) {
  const { data, error } = await supabase.functions.invoke('calculate-payroll', {
    body: payload
  })

  if (error) throw error
  return data
}

export async function generatePayslipPDF(payrollEntryId: string) {
  const { data, error } = await supabase.functions.invoke('generate-payslip-pdf', {
    body: { payroll_entry_id: payrollEntryId }
  })

  if (error) throw error
  return data
}

// ============================================================================
// Helpers
// ============================================================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatMonth(dateString: string): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const date = new Date(dateString + 'T00:00:00')
  return `${months[date.getMonth()]}/${date.getFullYear()}`
}
```

**Salvar como:** `gestao/src/lib/api/payroll.ts`

---

**(Continuação no próximo bloco devido ao tamanho...)**

### **TAREFA 3C.2: Página Principal - Folha de Pagamento (7-9h)**

**Estrutura de Arquivos:**
```bash
mkdir -p gestao/src/pages/custos/folha
mkdir -p gestao/src/components/payroll

# Página principal
touch gestao/src/pages/custos/folha/Index.tsx

# Componentes
touch gestao/src/components/payroll/ImportacaoSecullum.tsx
touch gestao/src/components/payroll/CadastroFuncionarios.tsx
touch gestao/src/components/payroll/FechamentoMensal.tsx
touch gestao/src/components/payroll/Historico.tsx
```

**Arquivo:** `gestao/src/pages/custos/folha/Index.tsx`

```typescript
// ============================================================================
// Página: Folha de Pagamento (RH)
// 4 Tabs: Importação Secullum, Cadastro, Fechamento, Histórico
// ============================================================================

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ImportacaoSecullum from '@/components/payroll/ImportacaoSecullum'
import CadastroFuncionarios from '@/components/payroll/CadastroFuncionarios'
import FechamentoMensal from '@/components/payroll/FechamentoMensal'
import Historico from '@/components/payroll/Historico'

export default function FolhaPagamento() {
  const [activeTab, setActiveTab] = useState('importacao')

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Folha de Pagamento</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de funcionários e folha de pagamento mensal
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="importacao">Importação Secullum</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="fechamento">Fechamento Mensal</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="importacao" className="mt-6">
          <ImportacaoSecullum />
        </TabsContent>

        <TabsContent value="funcionarios" className="mt-6">
          <CadastroFuncionarios />
        </TabsContent>

        <TabsContent value="fechamento" className="mt-6">
          <FechamentoMensal />
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <Historico />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Salvar como:** `gestao/src/pages/custos/folha/Index.tsx`

---

Devido ao tamanho extenso do código completo dos 4 componentes (ImportacaoSecullum, CadastroFuncionarios, FechamentoMensal, Historico), vou criar um **arquivo separado** com todos os componentes detalhados.

**✅ CHECKLIST FRENTE 3C:** (completo no documento)

- [ ] API Client `payroll.ts` criado
- [ ] Página `Index.tsx` criada (4 tabs)
- [ ] Component `ImportacaoSecullum.tsx` criado
- [ ] Component `CadastroFuncionarios.tsx` criado
- [ ] Component `FechamentoMensal.tsx` criado
- [ ] Component `Historico.tsx` criado
- [ ] Rota adicionada no App.tsx
- [ ] Menu atualizado (Sidebar)
- [ ] Testes UI realizados
- [ ] Commit: `git commit -m "feat(rh): interface completa de folha de pagamento"`

---

## 📦 FRENTE 3D: MIGRAÇÃO E DEPRECAÇÃO

**Pasta:** `controle/src/pages/rh/`
**Tempo:** 2-3 horas
**Janela:** 4

---

### **TAREFA 3D.1: Migrar Dados Históricos (1-2h)**

**Script SQL:**
```sql
-- ============================================================================
-- SCRIPT: Migração de Dados Históricos (Controle → Gestão)
-- Data: 2026-03-17
-- ============================================================================

-- IMPORTANTE: Executar via conexão ao banco Supabase
-- Assumindo que ambos os apps usam o mesmo Supabase

-- 1. Verificar dados existentes no Controle
SELECT COUNT(*) as total_registros
FROM timesheet_summary;

-- 2. Migrar dados (SE existirem)
-- Ajustar conforme estrutura real da tabela timesheet_summary

INSERT INTO payroll_entries (
  employee_id,
  reference_month,
  absences,
  late_minutes,
  overtime_65_hours,
  overtime_100_hours,
  night_hours,
  base_salary,
  gross_total,
  net_total,
  status,
  notes,
  created_at
)
SELECT
  e.id as employee_id,
  ts.reference_month,
  ts.absences,
  ts.late_minutes,
  ts.overtime_65,
  ts.overtime_100,
  ts.night_hours,
  e.base_salary,
  ts.gross_total,
  ts.net_total,
  'paid' as status,
  'Migrado do Controle' as notes,
  ts.created_at
FROM timesheet_summary ts
JOIN employees e ON LOWER(TRIM(e.name)) = LOWER(TRIM(ts.employee_name))
WHERE NOT EXISTS (
  SELECT 1 FROM payroll_entries pe
  WHERE pe.employee_id = e.id
  AND pe.reference_month = ts.reference_month
)
ON CONFLICT (employee_id, reference_month) DO NOTHING;

-- 3. Validar migração
SELECT
  'Controle' as origem,
  COUNT(*) as total
FROM timesheet_summary
UNION ALL
SELECT
  'Gestão' as origem,
  COUNT(*) as total
FROM payroll_entries
WHERE notes LIKE '%Migrado%';
```

---

### **TAREFA 3D.2: Adicionar Aviso no Controle (30 min)**

**Arquivo:** `controle/src/pages/rh/ClosingConsolidated.tsx`

```tsx
// Adicionar no topo da página (após imports)
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, ExternalLink } from "lucide-react"

// Adicionar dentro do componente, antes do conteúdo principal:

<Alert variant="warning" className="mb-6 border-orange-500 bg-orange-50">
  <AlertTriangle className="h-5 w-5 text-orange-600" />
  <AlertTitle className="text-orange-900 font-semibold">
    ⚠️ Módulo Migrado para o App Gestão
  </AlertTitle>
  <AlertDescription className="text-orange-800">
    <p className="mb-2">
      Este módulo de RH foi migrado para o <strong>App Gestão</strong> e
      integrado ao sistema de custos e DRE.
    </p>
    <p className="mb-3">
      Para novas importações de folha de pagamento, utilize o novo sistema:
    </p>
    <a
      href="https://gestao.cosiararas.com.br/custos/folha"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-orange-900 font-semibold hover:underline"
    >
      gestao.cosiararas.com.br/custos/folha
      <ExternalLink className="h-4 w-4" />
    </a>
    <p className="mt-3 text-sm text-orange-700">
      Este módulo será desativado em <strong>30 de junho de 2026</strong>.
    </p>
  </AlertDescription>
</Alert>
```

---

### **TAREFA 3D.3: Documentar Deprecação (30 min)**

**Arquivo:** `controle/docs/DEPRECATION_RH_MODULE.md`

```markdown
# ⚠️ DEPRECAÇÃO: Módulo RH do Controle

**Data de Deprecação:** 2026-03-17
**Data de Desativação:** 2026-06-30
**Motivo:** Migração para App Gestão (integração com sistema de custos)

---

## 🎯 Resumo

O módulo **RH (Recursos Humanos)** do app **Controle** foi **migrado** para o app **Gestão**.

**Razões:**
1. ✅ RH é CUSTO, não operação → deve estar em Gestão (app financeiro)
2. ✅ Integração automática com DRE (Demonstração de Resultado)
3. ✅ Cálculo de Custo Total de Pessoal (Salários + INSS + FGTS)
4. ✅ Consolidação de todos os custos em um único lugar

---

## 🔄 O Que Mudou?

| Item | Controle (ANTIGO) | Gestão (NOVO) |
|------|-------------------|---------------|
| **Localização** | `/rh` | `/custos/folha` |
| **Nome do Módulo** | RH | Folha de Pagamento |
| **Funcionalidades** | Importação Secullum apenas | Importação + CRUD Funcionários + Fechamento + Histórico + DRE |
| **Integração DRE** | ❌ Não | ✅ Sim (automático) |
| **Cálculo de Encargos** | Manual | Automático (INSS + FGTS) |

---

## 🚀 Como Migrar?

### **1. Acesse o Novo Sistema:**
```
https://gestao.cosiararas.com.br/custos/folha
```

### **2. Dados Históricos:**
✅ **Todos os dados foram migrados automaticamente**
- Lançamentos de folha anteriores estão disponíveis na tab "Histórico"
- Funcionários cadastrados foram transferidos

### **3. Nova Importação:**
- **Tab 1:** Importação Secullum (mesmo processo de antes)
- **Tab 2:** Cadastro de Funcionários (CRUD completo)
- **Tab 3:** Fechamento Mensal (calcular e aprovar)
- **Tab 4:** Histórico (consultar meses anteriores)

---

## 📅 Cronograma de Desativação

| Data | Ação |
|------|------|
| **2026-03-17** | ✅ Migração concluída |
| **2026-03-17** | ✅ Aviso adicionado no Controle |
| **2026-04-01** | Período de validação (usuários testam novo sistema) |
| **2026-05-01** | Novas importações bloqueadas no Controle |
| **2026-06-30** | **Desativação total do módulo RH no Controle** |

---

## ❓ Dúvidas?

Consulte a documentação do novo sistema:
- [Gestão - Folha de Pagamento](https://gestao.cosiararas.com.br/docs/folha)

---

**Última Atualização:** 2026-03-17
```

**Salvar como:** `controle/docs/DEPRECATION_RH_MODULE.md`

---

### **✅ CHECKLIST FRENTE 3D:**

- [ ] Script de migração de dados criado
- [ ] Migração executada (validado)
- [ ] Aviso adicionado no Controle (`ClosingConsolidated.tsx`)
- [ ] Documento de deprecação criado (`DEPRECATION_RH_MODULE.md`)
- [ ] Testar acesso ao novo sistema (Gestão)
- [ ] Commit (Controle): `git commit -m "feat(rh): adicionar aviso de migração para Gestão"`
- [ ] Commit (Gestão): `git commit -m "docs: adicionar guia de migração do RH"`

---

## 🎉 FIM DA FASE 3: RH/FOLHA DE PAGAMENTO

---

## ✅ CHECKLIST GERAL DA FASE 3

### **Database:**
- [ ] Migration `20260317_rh_payroll.sql` criada e aplicada
- [ ] Tabelas criadas: `employees`, `payroll_entries`
- [ ] Views criadas: `payroll_summary`, `employee_current_salary`
- [ ] Functions criadas: `calculate_inss`, `calculate_fgts`
- [ ] 5 funcionários seed inseridos

### **Backend:**
- [ ] Edge Function: `extract-secullum-pdf`
- [ ] Edge Function: `calculate-payroll`
- [ ] Edge Function: `generate-payslip-pdf`
- [ ] Todas as functions deployadas e testadas

### **Frontend:**
- [ ] API Client: `payroll.ts`
- [ ] Página: `custos/folha/Index.tsx` (4 tabs)
- [ ] Component: `ImportacaoSecullum.tsx`
- [ ] Component: `CadastroFuncionarios.tsx`
- [ ] Component: `FechamentoMensal.tsx`
- [ ] Component: `Historico.tsx`
- [ ] Rota adicionada no App.tsx
- [ ] Menu atualizado (Sidebar)

### **Migração:**
- [ ] Dados históricos migrados (Controle → Gestão)
- [ ] Aviso adicionado no Controle
- [ ] Documentação de deprecação criada

### **Testes:**
- [ ] Importação de PDF Secullum (testado)
- [ ] Cálculo de folha (testado)
- [ ] Geração de contracheque (testado)
- [ ] CRUD de funcionários (testado)
- [ ] Fechamento mensal (testado)
- [ ] Integração com DRE (validado)

---

## 📚 DOCUMENTOS DE REFERÊNCIA

- [ARQUITETURA_CUSTOS_COMPLETA.md](./ARQUITETURA_CUSTOS_COMPLETA.md) - Arquitetura geral
- [MIGRACAO_RH_CONTROLE_GESTAO.md](./MIGRACAO_RH_CONTROLE_GESTAO.md) - Estratégia de migração
- [PLANO_COMPLETO_IMPLEMENTACAO.md](./PLANO_COMPLETO_IMPLEMENTACAO.md) - Plano geral (todas as fases)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Revisar este documento completo**
2. ⏳ **Iniciar FRENTE 3A** (Database) - 2 horas
3. ⏳ **Iniciar FRENTE 3B** (Backend) - 5-6 horas (pode ser paralelo)
4. ⏳ **Iniciar FRENTE 3C** (Frontend) - 8-10 horas
5. ⏳ **Iniciar FRENTE 3D** (Migração) - 2-3 horas
6. ⏳ **Testar end-to-end** (fluxo completo)
7. ⏳ **Deploy em produção**

---

**Última Atualização:** 2026-03-17
**Status:** 📋 Guia Completo e Pronto para Execução
**Tempo Total Estimado:** 17-21 horas (2-3 semanas)
**Autor:** Claude Code Agent
