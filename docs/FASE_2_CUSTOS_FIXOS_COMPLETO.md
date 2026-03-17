# 🏢 FASE 2: CUSTOS FIXOS - GUIA COMPLETO

**Data:** 2026-03-17
**Duração:** 1-2 semanas (20-30 horas)
**Prioridade:** ALTA

---

## 🎯 VISÃO GERAL

### **O Que São Custos Fixos?**

Custos Fixos são despesas mensais **recorrentes** que **NÃO variam** com a quantidade produzida:

```
Custos Fixos = Despesas que existem mesmo sem vender nada

Exemplos:
├─ Aluguel (sempre R$ 3.000/mês)
├─ Energia Elétrica (~R$ 800/mês)
├─ Água (~R$ 200/mês)
├─ Internet (~R$ 150/mês)
├─ Contador (~R$ 500/mês)
└─ Seguros (anual / 12)
```

**Por que controlar?**
- ✅ Entender "ponto de equilíbrio" (quanto preciso vender para cobrir custos fixos)
- ✅ Detectar aumentos anormais
- ✅ Integração com DRE

---

## 📦 O QUE SERÁ CONSTRUÍDO

```
📂 Custos Fixos
│
├── 1. DATABASE
│   ├── fixed_cost_categories (categorias padrão)
│   ├── fixed_costs (lançamentos mensais)
│   └── fixed_costs_summary (VIEW para resumo)
│
├── 2. BACKEND
│   ├── classify-fixed-cost (AI para classificar PDFs)
│   └── update-payment-status (cron para status atrasado)
│
└── 3. FRONTEND
    ├── Tab 1: Lançamentos (CRUD + status de pagamento)
    ├── Tab 2: Categorias (CRUD)
    └── Tab 3: Histórico (gráficos + comparativos)
```

---

## ⏱️ CRONOGRAMA

| Semana | Frentes Paralelas | Horas | Entregáveis |
|--------|-------------------|-------|-------------|
| **Semana 4** | FRENTE 2A: Database + FRENTE 2B: Backend + FRENTE 2C: Frontend | 9-11h | Sistema completo |

**Total:** 9-11 horas (1-2 semanas se trabalhadas em paralelo com outras fases)

---

## 📦 FRENTE 2A: DATABASE CUSTOS FIXOS

**Pasta:** `gestao/supabase_nfe/migrations/`
**Tempo:** 2 horas
**Janela:** 1

---

### **TAREFA 2A.1: Migration - Custos Fixos (90 min)**

**Arquivo:** `gestao/supabase_nfe/migrations/20260317_custos_fixos.sql`

```sql
-- ============================================================================
-- MIGRATION: Custos Fixos
-- Data: 2026-03-17
-- Descrição: Sistema de controle de custos fixos mensais
-- ============================================================================

-- ============================================================================
-- TABELA: fixed_cost_categories (Categorias de Custos Fixos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fixed_cost_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50) DEFAULT 'monthly', -- monthly, quarterly, annual
  expected_value DECIMAL(10,2), -- valor esperado mensal
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_fixed_cost_categories_name ON fixed_cost_categories(name);
CREATE INDEX idx_fixed_cost_categories_type ON fixed_cost_categories(type);
CREATE INDEX idx_fixed_cost_categories_active ON fixed_cost_categories(is_active);

-- Trigger
CREATE TRIGGER update_fixed_cost_categories_updated_at
BEFORE UPDATE ON fixed_cost_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE fixed_cost_categories IS 'Categorias de custos fixos (aluguel, energia, etc)';
COMMENT ON COLUMN fixed_cost_categories.type IS 'Frequência: monthly (mensal), quarterly (trimestral), annual (anual)';
COMMENT ON COLUMN fixed_cost_categories.expected_value IS 'Valor médio esperado por mês (para alertas)';

-- ============================================================================
-- SEED: Categorias Padrão
-- ============================================================================

INSERT INTO fixed_cost_categories (name, type, expected_value, description) VALUES
('Aluguel', 'monthly', 3000.00, 'Aluguel do ponto comercial'),
('Energia Elétrica', 'monthly', 800.00, 'Conta de luz'),
('Água e Esgoto', 'monthly', 200.00, 'Conta de água'),
('Internet', 'monthly', 150.00, 'Internet banda larga'),
('Gás', 'monthly', 300.00, 'Gás encanado ou botijão'),
('Telefone', 'monthly', 100.00, 'Telefone fixo/celular'),
('Contador', 'monthly', 500.00, 'Honorários contábeis'),
('Seguros', 'annual', 2400.00, 'Seguro contra incêndio, roubo, etc (R$ 200/mês)'),
('IPTU', 'annual', 1200.00, 'Imposto Predial (R$ 100/mês)'),
('Alvará', 'annual', 500.00, 'Alvará de funcionamento (R$ 42/mês)'),
('Manutenção Equipamentos', 'monthly', 200.00, 'Manutenção preventiva e corretiva'),
('Limpeza e Higiene', 'monthly', 300.00, 'Produtos de limpeza'),
('Material de Escritório', 'monthly', 150.00, 'Papel, caneta, etc'),
('Marketing e Publicidade', 'monthly', 500.00, 'Anúncios, redes sociais, etc'),
('Taxas Bancárias', 'monthly', 100.00, 'Taxas de conta, TEDs, etc'),
('Software e Licenças', 'monthly', 250.00, 'ERP, sistemas, etc')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- TABELA: fixed_costs (Lançamentos de Custos Fixos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fixed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_month DATE NOT NULL, -- '2026-03-01' (sempre dia 01)
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100), -- detalhamento opcional
  description TEXT,
  value DECIMAL(10,2) NOT NULL,

  -- Datas e Status de Pagamento
  due_date DATE, -- vencimento
  payment_date DATE, -- data do pagamento
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, canceled
  payment_method VARCHAR(50), -- pix, boleto, cartao, dinheiro, transferencia

  -- Documentação
  document_url TEXT, -- URL do PDF (boleto, nota, recibo)

  -- Observações
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_fixed_costs_month ON fixed_costs(reference_month);
CREATE INDEX idx_fixed_costs_category ON fixed_costs(category);
CREATE INDEX idx_fixed_costs_status ON fixed_costs(payment_status);
CREATE INDEX idx_fixed_costs_due_date ON fixed_costs(due_date);

-- Trigger
CREATE TRIGGER update_fixed_costs_updated_at
BEFORE UPDATE ON fixed_costs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE fixed_costs IS 'Lançamentos de custos fixos mensais';
COMMENT ON COLUMN fixed_costs.reference_month IS 'Mês de referência (sempre dia 01)';
COMMENT ON COLUMN fixed_costs.payment_status IS 'Status: pending (pendente), paid (pago), overdue (atrasado), canceled (cancelado)';

-- ============================================================================
-- VIEW: fixed_costs_summary (Resumo Mensal)
-- ============================================================================

CREATE OR REPLACE VIEW fixed_costs_summary AS
SELECT
  reference_month,
  COUNT(*) AS total_entries,
  SUM(value) AS total_value,
  SUM(CASE WHEN payment_status = 'paid' THEN value ELSE 0 END) AS paid_value,
  SUM(CASE WHEN payment_status = 'pending' THEN value ELSE 0 END) AS pending_value,
  SUM(CASE WHEN payment_status = 'overdue' THEN value ELSE 0 END) AS overdue_value,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) AS paid_count,
  COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) AS pending_count,
  COUNT(CASE WHEN payment_status = 'overdue' THEN 1 END) AS overdue_count
FROM fixed_costs
WHERE payment_status != 'canceled'
GROUP BY reference_month
ORDER BY reference_month DESC;

COMMENT ON VIEW fixed_costs_summary IS 'Resumo mensal de custos fixos (para DRE e dashboards)';

-- ============================================================================
-- FUNCTION: mark_overdue_costs (Marcar contas atrasadas)
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_overdue_costs()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE fixed_costs
  SET payment_status = 'overdue'
  WHERE payment_status = 'pending'
    AND due_date < CURRENT_DATE;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_overdue_costs IS 'Atualiza status de contas vencidas para "overdue" (executar diariamente via cron)';

-- ============================================================================
-- FUNCTION: get_category_comparison (Comparar categoria mês atual vs anterior)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_category_comparison(p_category VARCHAR(100))
RETURNS TABLE (
  current_month DATE,
  current_total DECIMAL(10,2),
  previous_month DATE,
  previous_total DECIMAL(10,2),
  difference DECIMAL(10,2),
  difference_percent DECIMAL(5,2)
) AS $$
DECLARE
  v_current_month DATE;
  v_previous_month DATE;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE);
  v_previous_month := v_current_month - INTERVAL '1 month';

  RETURN QUERY
  SELECT
    v_current_month,
    COALESCE((SELECT SUM(value) FROM fixed_costs WHERE category = p_category AND reference_month = v_current_month), 0),
    v_previous_month,
    COALESCE((SELECT SUM(value) FROM fixed_costs WHERE category = p_category AND reference_month = v_previous_month), 0),
    COALESCE((SELECT SUM(value) FROM fixed_costs WHERE category = p_category AND reference_month = v_current_month), 0) -
    COALESCE((SELECT SUM(value) FROM fixed_costs WHERE category = p_category AND reference_month = v_previous_month), 0),
    CASE
      WHEN COALESCE((SELECT SUM(value) FROM fixed_costs WHERE category = p_category AND reference_month = v_previous_month), 0) = 0 THEN 0
      ELSE ROUND(((COALESCE((SELECT SUM(value) FROM fixed_costs WHERE category = p_category AND reference_month = v_current_month), 0) -
                  COALESCE((SELECT SUM(value) FROM fixed_costs WHERE category = p_category AND reference_month = v_previous_month), 0)) /
                  COALESCE((SELECT SUM(value) FROM fixed_costs WHERE category = p_category AND reference_month = v_previous_month), 1)) * 100, 2)
    END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_category_comparison IS 'Compara valor de uma categoria no mês atual vs anterior (percentual de variação)';

-- ============================================================================
-- SEED: Lançamentos de Exemplo (Mês Atual)
-- ============================================================================

DO $$
DECLARE
  v_current_month DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
  INSERT INTO fixed_costs (reference_month, category, description, value, due_date, payment_status) VALUES
  (v_current_month, 'Aluguel', 'Aluguel mês ' || TO_CHAR(v_current_month, 'MM/YYYY'), 3000.00, v_current_month + INTERVAL '5 days', 'paid'),
  (v_current_month, 'Energia Elétrica', 'Conta de luz - CPFL', 850.00, v_current_month + INTERVAL '10 days', 'pending'),
  (v_current_month, 'Água e Esgoto', 'Conta de água - SAAE', 180.00, v_current_month + INTERVAL '15 days', 'pending'),
  (v_current_month, 'Internet', 'Internet fibra 300MB', 150.00, v_current_month + INTERVAL '8 days', 'paid'),
  (v_current_month, 'Contador', 'Honorários contábeis', 500.00, v_current_month + INTERVAL '20 days', 'pending');
END $$;

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE fixed_cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read categories" ON fixed_cost_categories FOR SELECT USING (true);
CREATE POLICY "Allow read fixed costs" ON fixed_costs FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated on categories" ON fixed_cost_categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated on costs" ON fixed_costs
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON fixed_cost_categories TO anon, authenticated;
GRANT SELECT ON fixed_costs TO anon, authenticated;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

DO $$
DECLARE
  v_category_count INTEGER;
  v_cost_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_category_count FROM fixed_cost_categories;
  SELECT COUNT(*) INTO v_cost_count FROM fixed_costs;

  RAISE NOTICE '✅ Migration de Custos Fixos concluída!';
  RAISE NOTICE '📊 Categorias criadas: %', v_category_count;
  RAISE NOTICE '📈 Lançamentos de exemplo: %', v_cost_count;
  RAISE NOTICE '💡 Use SELECT * FROM fixed_costs_summary para ver resumo!';
END $$;
```

**Salvar como:** `gestao/supabase_nfe/migrations/20260317_custos_fixos.sql`

---

### **TAREFA 2A.2: Aplicar Migration (15 min)**

```
1. Supabase Dashboard → SQL Editor
2. Copiar 20260317_custos_fixos.sql
3. Executar (Run)
```

---

### **TAREFA 2A.3: Validar (15 min)**

```sql
-- Ver categorias
SELECT * FROM fixed_cost_categories ORDER BY name;

-- Ver lançamentos do mês
SELECT * FROM fixed_costs ORDER BY due_date;

-- Ver resumo
SELECT * FROM fixed_costs_summary;

-- Testar function de comparação
SELECT * FROM get_category_comparison('Aluguel');

-- Testar marcar contas atrasadas (se houver)
SELECT mark_overdue_costs();
```

---

### **✅ CHECKLIST FRENTE 2A:**

- [ ] Migration `20260317_custos_fixos.sql` criada
- [ ] Aplicada no Supabase
- [ ] 16 categorias inseridas
- [ ] 5 lançamentos de exemplo inseridos
- [ ] View `fixed_costs_summary` funcionando
- [ ] Functions testadas
- [ ] Commit: `git commit -m "feat(custos-fixos): criar tabelas de custos fixos"`

---

## 📦 FRENTE 2B: BACKEND CUSTOS FIXOS

**Pasta:** `gestao/supabase_nfe/functions/`
**Tempo:** 2-3 horas
**Janela:** 2

---

### **TAREFA 2B.1: Edge Function - classify-fixed-cost (2h)**

**Arquivo:** `gestao/supabase_nfe/functions/classify-fixed-cost/index.ts`

```typescript
// ============================================================================
// Edge Function: classify-fixed-cost
// Descrição: Classifica custos fixos usando AI (GPT-4o ou Gemini)
// Input: texto extraído de PDF/boleto
// Output: categoria sugerida + confidence
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClassificationResult {
  category: string
  subcategory?: string
  value?: number
  due_date?: string
  confidence: number // 0-100
  reasoning: string
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

    const { text, extracted_value, extracted_due_date } = await req.json()

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'text é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Buscar categorias disponíveis
    const { data: categories } = await supabaseClient
      .from('fixed_cost_categories')
      .select('name, description')
      .eq('is_active', true)

    // 2. Classificar com AI (OpenAI GPT-4o)
    const classification = await classifyWithAI(text, categories || [], extracted_value, extracted_due_date)

    return new Response(
      JSON.stringify({
        success: true,
        classification
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao classificar custo:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================================
// Classificação com OpenAI GPT-4o
// ============================================================================

async function classifyWithAI(
  text: string,
  categories: any[],
  value?: number,
  dueDate?: string
): Promise<ClassificationResult> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY não configurada')
  }

  const categoryList = categories.map(c => `- ${c.name}: ${c.description || ''}`).join('\n')

  const prompt = `Você é um assistente de contabilidade. Analise o texto abaixo e classifique em uma das categorias de custos fixos.

CATEGORIAS DISPONÍVEIS:
${categoryList}

TEXTO DO DOCUMENTO:
${text}

${value ? `VALOR EXTRAÍDO: R$ ${value}` : ''}
${dueDate ? `VENCIMENTO EXTRAÍDO: ${dueDate}` : ''}

Retorne APENAS um JSON válido com:
{
  "category": "nome exato da categoria",
  "subcategory": "subcategoria opcional",
  "value": número (se não foi fornecido, tente extrair),
  "due_date": "YYYY-MM-DD" (se não foi fornecido, tente extrair),
  "confidence": número de 0-100,
  "reasoning": "breve explicação da classificação"
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Você é um assistente de contabilidade especializado em classificação de custos.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`)
  }

  const content = data.choices[0].message.content
  const result = JSON.parse(content)

  return result as ClassificationResult
}
```

**Salvar como:** `gestao/supabase_nfe/functions/classify-fixed-cost/index.ts`

---

### **TAREFA 2B.2: Edge Function - update-payment-status (1h)**

**Arquivo:** `gestao/supabase_nfe/functions/update-payment-status/index.ts`

```typescript
// ============================================================================
// Edge Function: update-payment-status (Cron Job)
// Descrição: Atualiza status de contas vencidas para "overdue"
// Execução: Diária (cron: 0 6 * * * - 6h da manhã)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // usar service role para bypass RLS
    )

    // Chamar function SQL
    const { data, error } = await supabaseClient.rpc('mark_overdue_costs')

    if (error) throw error

    console.log(`✅ ${data} contas marcadas como atrasadas`)

    return new Response(
      JSON.stringify({
        success: true,
        updated_count: data,
        executed_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Salvar como:** `gestao/supabase_nfe/functions/update-payment-status/index.ts`

---

### **TAREFA 2B.3: Deploy e Testar (30 min)**

```bash
cd gestao/supabase_nfe

# Deploy
supabase functions deploy classify-fixed-cost
supabase functions deploy update-payment-status

# Teste classify-fixed-cost
curl -X POST \
  'https://energetictriggerfish-supabase.cloudfy.live/functions/v1/classify-fixed-cost' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "CPFL ENERGIA Referencia: 03/2026 Vencimento: 15/03/2026 Valor: R$ 850,00",
    "extracted_value": 850.00,
    "extracted_due_date": "2026-03-15"
  }'

# Teste update-payment-status
curl -X POST \
  'https://energetictriggerfish-supabase.cloudfy.live/functions/v1/update-payment-status' \
  -H 'Authorization: Bearer SERVICE_ROLE_KEY'
```

---

### **✅ CHECKLIST FRENTE 2B:**

- [ ] Function `classify-fixed-cost` criada
- [ ] Function `update-payment-status` criada
- [ ] Deploy realizado
- [ ] Testes realizados (curl)
- [ ] Validação de classificação AI
- [ ] Commit: `git commit -m "feat(custos-fixos): edge functions para classificação"`

---

## 📦 FRENTE 2C: FRONTEND CUSTOS FIXOS

**Pasta:** `gestao/src/`
**Tempo:** 5-6 horas
**Janela:** 3

---

### **TAREFA 2C.1: API Client (1h)**

**Arquivo:** `gestao/src/lib/api/fixedCosts.ts`

```typescript
import { supabase } from '../supabase'

export interface FixedCostCategory {
  id: string
  name: string
  type: 'monthly' | 'quarterly' | 'annual'
  expected_value?: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FixedCost {
  id: string
  reference_month: string
  category: string
  subcategory?: string
  description?: string
  value: number
  due_date?: string
  payment_date?: string
  payment_status: 'pending' | 'paid' | 'overdue' | 'canceled'
  payment_method?: string
  document_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export async function getFixedCostCategories() {
  const { data, error } = await supabase
    .from('fixed_cost_categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data as FixedCostCategory[]
}

export async function getFixedCosts(referenceMonth: string) {
  const { data, error } = await supabase
    .from('fixed_costs')
    .select('*')
    .eq('reference_month', referenceMonth)
    .order('due_date')

  if (error) throw error
  return data as FixedCost[]
}

export async function createFixedCost(cost: Partial<FixedCost>) {
  const { data, error } = await supabase
    .from('fixed_costs')
    .insert(cost)
    .select()
    .single()

  if (error) throw error
  return data as FixedCost
}

export async function updateFixedCost(id: string, updates: Partial<FixedCost>) {
  const { data, error } = await supabase
    .from('fixed_costs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as FixedCost
}

export async function deleteFixedCost(id: string) {
  const { error } = await supabase
    .from('fixed_costs')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function classifyFixedCost(text: string, value?: number, dueDate?: string) {
  const { data, error } = await supabase.functions.invoke('classify-fixed-cost', {
    body: { text, extracted_value: value, extracted_due_date: dueDate }
  })

  if (error) throw error
  return data
}
```

**Salvar como:** `gestao/src/lib/api/fixedCosts.ts`

---

### **TAREFA 2C.2: Página Principal (4-5h)**

**Arquivo:** `gestao/src/pages/custos/fixos/Index.tsx`

```typescript
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import { getFixedCosts, getFixedCostCategories } from '@/lib/api/fixedCosts'

export default function CustosFixos() {
  const [activeTab, setActiveTab] = useState('lancamentos')
  const [referenceMonth, setReferenceMonth] = useState(
    new Date().toISOString().slice(0, 7) + '-01'
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Custos Fixos</h1>
          <p className="text-sm text-muted-foreground">
            Controle de despesas mensais recorrentes
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lançamento
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="lancamentos" className="mt-6">
          {/* Tab 1: Lançamentos - implementar componente */}
          <p>Tabela de lançamentos + filtros + indicadores</p>
        </TabsContent>

        <TabsContent value="categorias" className="mt-6">
          {/* Tab 2: Categorias - CRUD */}
          <p>CRUD de categorias</p>
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          {/* Tab 3: Histórico - gráficos */}
          <p>Gráficos + comparativos</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Salvar como:** `gestao/src/pages/custos/fixos/Index.tsx`

---

### **TAREFA 2C.3: Adicionar Rota (10 min)**

```typescript
// gestao/src/App.tsx
import CustosFixos from './pages/custos/fixos/Index'

<Route path="/custos/fixos" element={<CustosFixos />} />
```

---

### **✅ CHECKLIST FRENTE 2C:**

- [ ] API Client criado
- [ ] Página Index.tsx criada (estrutura)
- [ ] Tab Lançamentos implementada
- [ ] Tab Categorias implementada
- [ ] Tab Histórico implementada
- [ ] Rota adicionada
- [ ] Menu atualizado
- [ ] Testes UI realizados
- [ ] Commit: `git commit -m "feat(custos-fixos): interface completa"`

---

## 🎉 FIM DA FASE 2: CUSTOS FIXOS

**Entregáveis:**
- ✅ 1 Migration SQL (categories + costs)
- ✅ 2 Edge Functions (classify, update-status)
- ✅ 1 API Client
- ✅ 1 Página Frontend (3 tabs)

**Tempo Total:** 9-11 horas (1-2 semanas)

---

**Última Atualização:** 2026-03-17
**Status:** 📋 Guia Completo
**Autor:** Claude Code Agent
