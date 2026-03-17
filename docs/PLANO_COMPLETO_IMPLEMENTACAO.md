# 🗓️ PLANO COMPLETO DE IMPLEMENTAÇÃO - Sistema de Custos e Gestão Financeira

**Data:** 2026-03-16
**Projeto:** App Gestão - Sistema Financeiro Completo
**Duração Total Estimada:** 8-11 semanas (40-55 dias úteis)
**Estratégia:** 3-4 frentes paralelas simultâneas

---

## 📊 RESUMO EXECUTIVO

### **O Que Será Construído:**

```
📂 SISTEMA COMPLETO DE GESTÃO FINANCEIRA
│
├── 🥕 FASE 1: CMV (Custo de Mercadoria Vendida) → 2-3 semanas
│   ├── Cadastro de Ingredientes
│   ├── Receitas de Produtos (BOM)
│   ├── Histórico de Preços
│   └── Integração NF-e → Ingredientes
│
├── 🏢 FASE 2: Custos Fixos → 1-2 semanas
│   ├── Categorias de Custos
│   ├── Lançamentos Mensais
│   ├── Classificação AI (APPLOAD)
│   └── Histórico e Comparativos
│
├── 👥 FASE 3: Folha de Pagamento (RH) → 2-3 semanas
│   ├── Cadastro de Funcionários
│   ├── Importação Secullum (PDF/Excel)
│   ├── Cálculo de Folha Mensal
│   ├── INSS + FGTS
│   └── Migração do Controle
│
├── 💰 FASE 4: Receitas (APPLOAD) → 1-2 semanas
│   ├── Upload de PDFs
│   ├── OCR + Parser
│   ├── Classificação AI
│   └── Validação e Aprendizado
│
├── 📈 FASE 5: DRE (Demonstração de Resultado) → 1 semana
│   ├── Consolidação de Receitas
│   ├── Consolidação de Custos
│   ├── Cálculo de Margens
│   └── Relatórios e Gráficos
│
└── 🎯 FASE 6: Análises e Precificação → 1-2 semanas
    ├── Margem por Produto
    ├── Margem por Canal
    ├── Simulador de Preços
    └── Alertas e Insights
```

**Total:** 6 Fases | 8-13 semanas | ~200-300 horas de desenvolvimento

---

## 🎯 ESTRATÉGIA DE EXECUÇÃO PARALELA

### **Por Que Paralelo?**
- ✅ Reduz tempo total de 13 semanas → 8-11 semanas
- ✅ Aproveita seu estilo de trabalho (múltiplas janelas)
- ✅ Frentes independentes = zero conflitos de código
- ✅ Commits frequentes e pequenos

### **Como Funciona:**

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  JANELA 1   │  │  JANELA 2   │  │  JANELA 3   │  │  JANELA 4   │
│             │  │             │  │             │  │             │
│  Database   │  │  Backend    │  │  Frontend   │  │  Docs/Test  │
│  (SQL)      │  │  (EdgeFunc) │  │  (React)    │  │  (Validar)  │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

Cada fase será dividida em **3-4 frentes paralelas**:
1. **Database** (migrations SQL)
2. **Backend** (Edge Functions TypeScript)
3. **Frontend** (React/TypeScript interfaces)
4. **Testes/Validação** (queries, curl, UI)

---

## 📅 CRONOGRAMA GERAL

| Semana | Fase Principal | Frentes Paralelas | Horas | Entregáveis |
|--------|----------------|-------------------|-------|-------------|
| **1-2** | FASE 1: CMV (DB + Backend) | DB CMV + Edge Functions + Início Frontend | 40-60h | Tabelas, Functions, Página Ingredientes |
| **2-3** | FASE 1: CMV (Frontend) | Frontend Receitas + Análise CMV | 30-40h | Páginas completas de CMV |
| **4** | FASE 2: Custos Fixos | DB + Backend + Frontend (paralelo) | 20-30h | Sistema completo de Custos Fixos |
| **5-6** | FASE 3: RH/Folha | DB RH + Migração Controle + Frontend | 40-50h | Sistema de Folha + Deprecação no Controle |
| **7** | FASE 4: Receitas (APPLOAD) | DB + AI Classification + Frontend | 20-30h | Sistema de Upload e Classificação |
| **8** | FASE 5: DRE | Consolidação + Relatórios + Gráficos | 15-20h | DRE Automático |
| **9-10** | FASE 6: Análises e Precificação | Margens + Simulador + Alertas | 20-30h | Análises completas |
| **11** | Integração e Refinamento | Testes E2E, bugs, ajustes | 15-25h | Sistema completo em produção |

**Total:** 8-11 semanas | 200-300 horas

---

## 🔥 FASE 1: CMV (Custo de Mercadoria Vendida)

**Duração:** 2-3 semanas (50-70 horas)
**Prioridade:** CRÍTICA (base de tudo)

---

### **📦 FRENTE 1A: Database CMV (Semana 1)**

**Pasta:** `gestao/supabase_nfe/migrations/`
**Tempo:** 3-4 horas
**Janela:** 1

#### **Tarefas:**

**1A.1 - Migration: Ingredientes** (90 min)
```bash
# Criar arquivo
touch gestao/supabase_nfe/migrations/20260316_cmv_ingredients.sql
```

**Conteúdo:** (usar código da ARQUITETURA_CUSTOS_COMPLETA.md)
- Tabela `ingredients` (id, name, category, unit, current_price, avg_price, supplier_name)
- Tabela `ingredient_price_history` (histórico de compras)
- Trigger `update_ingredient_current_price` (auto-atualizar preço)
- Function `calculate_avg_price` (média 3 meses)
- Seed: 23 ingredientes (proteínas, acompanhamentos, embalagens, temperos)
- RLS Policies

**1A.2 - Migration: Receitas de Produtos** (90 min)
```bash
touch gestao/supabase_nfe/migrations/20260316_cmv_recipes.sql
```

**Conteúdo:**
- Tabela `product_recipes` (id, product_name, product_code, category, size, yield_quantity)
- Tabela `recipe_items` (recipe_id, ingredient_id, quantity, unit, notes)
- View `product_cmv` (cálculo automático de CMV)
- Function `get_recipe_cmv` (detalhamento por ingrediente)
- Seed: 2 receitas exemplo (Marmita P Frango, Marmita M Carne)
- RLS Policies

**1A.3 - Aplicar Migrations** (30 min)
```sql
-- Via Supabase Dashboard
-- SQL Editor → Executar 20260316_cmv_ingredients.sql
-- SQL Editor → Executar 20260316_cmv_recipes.sql
```

**1A.4 - Validar** (30 min)
```sql
-- Contar ingredientes
SELECT category, COUNT(*) FROM ingredients GROUP BY category;

-- Ver receitas com CMV
SELECT product_name, cmv_current, ingredient_count FROM product_cmv;

-- Testar function
SELECT * FROM get_recipe_cmv(
  (SELECT id FROM product_recipes WHERE product_name LIKE '%Frango%')
);
```

**✅ Checklist Frente 1A:**
- [ ] Arquivo `20260316_cmv_ingredients.sql` criado
- [ ] Arquivo `20260316_cmv_recipes.sql` criado
- [ ] Migrations aplicadas no Supabase
- [ ] 23 ingredientes inseridos (validado)
- [ ] 2 receitas inseridas (validado)
- [ ] View `product_cmv` funcionando
- [ ] Function `get_recipe_cmv` testada
- [ ] Commit: `feat(cmv): criar tabelas de ingredientes e receitas`

---

### **📦 FRENTE 1B: Backend CMV (Semana 1-2)**

**Pasta:** `gestao/supabase_nfe/functions/`
**Tempo:** 4-5 horas
**Janela:** 2

#### **Tarefas:**

**1B.1 - Edge Function: match-nfe-to-ingredients** (2-3h)
```bash
mkdir -p gestao/supabase_nfe/functions/match-nfe-to-ingredients
touch gestao/supabase_nfe/functions/match-nfe-to-ingredients/index.ts
```

**Funcionalidades:**
- Recebe: `nfe_key` + array de `items` (description, quantity, unit, price)
- Busca ingredientes ativos no banco
- Match: Exato → Fuzzy → Manual
- Insere em `ingredient_price_history` (se confidence >= 80%)
- Retorna: lista de matches com confidence score

**Tecnologias:**
- Deno + TypeScript
- Supabase Client
- Normalização de strings (remove acentos, minúsculas)
- Normalização de unidades (KG → kg, UN → un)

**Código completo:** Ver PLANO_IMPLEMENTACAO_PARALELA.md (já criado)

**1B.2 - Edge Function: calculate-product-cmv** (1-2h)
```bash
mkdir -p gestao/supabase_nfe/functions/calculate-product-cmv
touch gestao/supabase_nfe/functions/calculate-product-cmv/index.ts
```

**Funcionalidades:**
- Recebe: `recipe_id` + `price_type` ('current' ou 'avg')
- Busca receita e ingredientes
- Calcula CMV total e por unidade (yield)
- Retorna detalhamento por ingrediente

**1B.3 - Edge Function: bulk-update-prices** (1h)
```bash
mkdir -p gestao/supabase_nfe/functions/bulk-update-prices
touch gestao/supabase_nfe/functions/bulk-update-prices/index.ts
```

**Funcionalidades:**
- Recebe: array de `{ingredient_id, price, purchase_date, source}`
- Insere em lote em `ingredient_price_history`
- Trigger atualiza `current_price` automaticamente

**1B.4 - Deploy** (30 min)
```bash
cd gestao/supabase_nfe
supabase functions deploy match-nfe-to-ingredients
supabase functions deploy calculate-product-cmv
supabase functions deploy bulk-update-prices
```

**1B.5 - Testar** (1h)
```bash
# Teste: match NF-e
curl -X POST 'https://energetictriggerfish-supabase.cloudfy.live/functions/v1/match-nfe-to-ingredients' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "nfe_key": "test123",
    "items": [
      {"description": "PEITO FRANGO", "quantity": 10, "unit": "KG", "unit_price": 17.50}
    ]
  }'

# Teste: calcular CMV
curl -X POST 'https://energetictriggerfish-supabase.cloudfy.live/functions/v1/calculate-product-cmv' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"recipe_id": "UUID_MARMITA_FRANGO", "price_type": "current"}'
```

**✅ Checklist Frente 1B:**
- [ ] Function `match-nfe-to-ingredients` criada
- [ ] Function `calculate-product-cmv` criada
- [ ] Function `bulk-update-prices` criada
- [ ] Deploy realizado
- [ ] Teste match NF-e (sucesso)
- [ ] Teste calcular CMV (sucesso)
- [ ] Validar inserção em `ingredient_price_history`
- [ ] Commit: `feat(cmv): edge functions para match e cálculo`

---

### **📦 FRENTE 1C: Frontend CMV - Ingredientes (Semana 2)**

**Pasta:** `gestao/src/`
**Tempo:** 5-6 horas
**Janela:** 3

#### **Tarefas:**

**1C.1 - API Client** (1h)
```bash
mkdir -p gestao/src/lib/api
touch gestao/src/lib/api/cmv.ts
```

**Exports:**
- `getIngredients(filters?)` → Ingredient[]
- `getIngredient(id)` → Ingredient
- `createIngredient(data)` → Ingredient
- `updateIngredient(id, data)` → Ingredient
- `deleteIngredient(id)` → void
- `getIngredientPriceHistory(id)` → PriceHistory[]
- `getProductRecipes(filters?)` → ProductRecipe[]
- `getRecipeItems(recipeId)` → RecipeItem[]
- `calculateProductCMV(recipeId, priceType)` → CMVDetail

**Código completo:** Ver PLANO_IMPLEMENTACAO_PARALELA.md

**1C.2 - Página: Ingredientes (CRUD)** (3-4h)
```bash
mkdir -p gestao/src/pages/custos/cmv
touch gestao/src/pages/custos/cmv/Ingredientes.tsx
```

**Features:**
- Tabela de ingredientes (nome, categoria, unidade, preço atual, preço médio, fornecedor, status)
- Filtros: categoria, busca por nome
- Ações: Criar, Editar, Excluir, Ver Histórico
- Modal de Criação/Edição (formulário completo)
- Modal de Histórico de Preços (tabela + gráfico)

**Componentes:**
- `IngredientTable` (lista)
- `IngredientForm` (modal create/edit)
- `PriceHistoryModal` (histórico + chart)

**1C.3 - Adicionar Rota** (10 min)
```typescript
// gestao/src/App.tsx
import Ingredientes from './pages/custos/cmv/Ingredientes'

<Route path="/custos/cmv/ingredientes" element={<Ingredientes />} />
```

**1C.4 - Atualizar Menu** (10 min)
```typescript
// gestao/src/components/layout/Sidebar.tsx
{
  label: 'Custos',
  icon: DollarSign,
  children: [
    { label: 'CMV - Ingredientes', path: '/custos/cmv/ingredientes' },
    // ... outros
  ]
}
```

**1C.5 - Testar UI** (30 min)
- [ ] Listar ingredientes (tabela populada)
- [ ] Filtrar por categoria
- [ ] Buscar por nome
- [ ] Criar novo ingrediente (modal)
- [ ] Editar ingrediente existente
- [ ] Ver histórico de preços (modal + gráfico)
- [ ] Excluir ingrediente

**✅ Checklist Frente 1C:**
- [ ] API Client `cmv.ts` criado
- [ ] Página `Ingredientes.tsx` criada
- [ ] Modal de Create/Edit implementado
- [ ] Modal de Histórico implementado
- [ ] Rota adicionada no App.tsx
- [ ] Menu atualizado (Sidebar)
- [ ] Testes UI realizados
- [ ] Commit: `feat(cmv): interface de ingredientes`

---

### **📦 FRENTE 1D: Frontend CMV - Receitas (Semana 2-3)**

**Pasta:** `gestao/src/pages/custos/cmv/`
**Tempo:** 6-8 horas
**Janela:** 3

#### **Tarefas:**

**1D.1 - Página: Receitas (CRUD)** (4-5h)
```bash
touch gestao/src/pages/custos/cmv/Receitas.tsx
```

**Features:**
- Tabela de produtos (nome, código, categoria, tamanho, CMV atual, CMV médio, # ingredientes, status)
- Filtros: categoria, busca
- Ações: Criar, Editar, Duplicar, Ver Detalhes, Inativar
- Modal de Criação/Edição:
  - Tab 1: Dados Básicos (nome, código, categoria, tamanho, yield)
  - Tab 2: Ingredientes (adicionar/remover, quantidade, unidade, notes)
  - Preview de CMV (tabela + total)

**Componentes:**
- `RecipeTable` (lista de produtos)
- `RecipeForm` (modal multi-tab)
- `IngredientSelector` (autocomplete)
- `CMVPreview` (tabela de ingredientes + total)

**1D.2 - Modal: Detalhes de CMV** (2h)
```bash
touch gestao/src/components/cmv/RecipeCMVModal.tsx
```

**Features:**
- Detalhamento completo (tabela de ingredientes com preço, quantidade, subtotal)
- Toggle: Preço Atual vs Preço Médio
- Total de CMV
- CMV por unidade (yield)
- Gráfico de pizza (distribuição de custos por categoria)
- Botão: Exportar PDF

**1D.3 - Componente: Duplicar Receita** (1h)
```bash
touch gestao/src/components/cmv/DuplicateRecipeModal.tsx
```

**Features:**
- Selecionar receita base
- Novo nome (ex: Marmita P → Marmita M)
- Ajustar quantidades (multiplicador: 1.5x para M, 2x para G)
- Preview do novo CMV
- Criar

**1D.4 - Adicionar Rota** (10 min)
```typescript
<Route path="/custos/cmv/receitas" element={<Receitas />} />
```

**1D.5 - Testar UI** (1h)
- [ ] Listar receitas (tabela)
- [ ] Filtrar por categoria
- [ ] Criar nova receita (multi-step)
- [ ] Adicionar ingredientes (autocomplete)
- [ ] Preview de CMV (calculado em tempo real)
- [ ] Editar receita existente
- [ ] Ver detalhes de CMV (modal)
- [ ] Duplicar receita (P → M → G)
- [ ] Inativar receita

**✅ Checklist Frente 1D:**
- [ ] Página `Receitas.tsx` criada
- [ ] Modal de Create/Edit (multi-tab)
- [ ] Component `IngredientSelector` (autocomplete)
- [ ] Component `CMVPreview` (calculado)
- [ ] Modal `RecipeCMVModal` (detalhes)
- [ ] Modal `DuplicateRecipeModal` (duplicação)
- [ ] Rota adicionada
- [ ] Testes UI realizados
- [ ] Commit: `feat(cmv): interface de receitas e BOM`

---

### **📦 FRENTE 1E: Frontend CMV - Análise (Semana 3)**

**Pasta:** `gestao/src/pages/custos/cmv/`
**Tempo:** 4-5 horas
**Janela:** 3

#### **Tarefas:**

**1E.1 - Página: Análise de CMV** (3-4h)
```bash
touch gestao/src/pages/custos/cmv/Analise.tsx
```

**Features:**

**Tab 1: Visão Geral**
- KPIs: Total de Ingredientes, Total de Receitas, CMV Médio, Produto Mais Caro
- Tabela: Top 10 produtos com maior CMV
- Gráfico de barras: CMV por categoria de produto

**Tab 2: Ingredientes Críticos**
- Tabela: Ingredientes com maior impacto no CMV total
- Gráfico de pizza: Distribuição de custos por categoria de ingrediente
- Alertas: Ingredientes sem preço, ingredientes inativos usados em receitas

**Tab 3: Comparativo de Preços**
- Tabela: Ingredientes com maior variação (current_price vs avg_price)
- Gráfico de linha: Evolução de preços (últimos 6 meses)
- Filtro: Categoria, ingrediente específico

**1E.2 - Componente: CMV Chart** (1h)
```bash
mkdir -p gestao/src/components/charts
touch gestao/src/components/charts/CMVChart.tsx
```

**Tipos:**
- Bar Chart (CMV por categoria)
- Pie Chart (distribuição)
- Line Chart (evolução temporal)

**Tecnologia:** Recharts ou Chart.js

**1E.3 - Adicionar Rota** (10 min)
```typescript
<Route path="/custos/cmv/analise" element={<Analise />} />
```

**1E.4 - Testar UI** (30 min)
- [ ] Ver KPIs (atualizados)
- [ ] Tabela Top 10 produtos
- [ ] Gráficos renderizados
- [ ] Ingredientes críticos listados
- [ ] Comparativo de preços (variação)
- [ ] Evolução temporal (gráfico de linha)

**✅ Checklist Frente 1E:**
- [ ] Página `Analise.tsx` criada (3 tabs)
- [ ] Component `CMVChart.tsx` (Recharts)
- [ ] KPIs calculados
- [ ] Gráficos funcionando
- [ ] Rota adicionada
- [ ] Testes UI realizados
- [ ] Commit: `feat(cmv): página de análise e dashboards`

---

### **🎉 FIM DA FASE 1: CMV**

**Entregáveis:**
- ✅ 2 Migrations SQL (ingredients, recipes)
- ✅ 3 Edge Functions (match, calculate, bulk-update)
- ✅ 1 API Client completo
- ✅ 3 Páginas Frontend (Ingredientes, Receitas, Análise)
- ✅ 6 Modais/Components (forms, CMV preview, histórico, duplicação, charts)
- ✅ Seed de dados (23 ingredientes, 2 receitas)

**Tempo Total:** 22-28 horas (2-3 semanas em paralelo)

---

## 🏢 FASE 2: CUSTOS FIXOS

**Duração:** 1-2 semanas (20-30 horas)
**Prioridade:** ALTA

---

### **📦 FRENTE 2A: Database Custos Fixos (Semana 4)**

**Pasta:** `gestao/supabase_nfe/migrations/`
**Tempo:** 2 horas
**Janela:** 1

#### **Tarefas:**

**2A.1 - Migration: Fixed Costs** (90 min)
```bash
touch gestao/supabase_nfe/migrations/20260320_fixed_costs.sql
```

**Tabelas:**
- `fixed_cost_categories` (id, name, type, expected_value, is_active)
- `fixed_costs` (id, reference_month, category, subcategory, description, value, due_date, payment_date, payment_status, payment_method, document_url, notes)

**Seed:**
- 12 categorias padrão (Aluguel, Energia, Água, Internet, Gás, Telefone, Contador, Seguros, IPTU, Alvará, Manutenção, Limpeza)

**Views:**
- `fixed_costs_summary` (total por mês, por categoria)

**Código Completo:**
```sql
-- ============================================================================
-- MIGRATION: Custos Fixos
-- ============================================================================

CREATE TABLE IF NOT EXISTS fixed_cost_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50) DEFAULT 'monthly', -- monthly, quarterly, annual
  expected_value DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed
INSERT INTO fixed_cost_categories (name, type, expected_value) VALUES
('Aluguel', 'monthly', 3000.00),
('Energia Elétrica', 'monthly', 800.00),
('Água', 'monthly', 200.00),
('Internet', 'monthly', 150.00),
('Gás', 'monthly', 300.00),
('Telefone', 'monthly', 100.00),
('Contador', 'monthly', 500.00),
('Seguros', 'annual', 2400.00),
('IPTU', 'annual', 1200.00),
('Alvará', 'annual', 500.00),
('Manutenção Equipamentos', 'monthly', 200.00),
('Limpeza e Higiene', 'monthly', 300.00)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS fixed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_month DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  description TEXT,
  value DECIMAL(10,2) NOT NULL,
  due_date DATE,
  payment_date DATE,
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue
  payment_method VARCHAR(50), -- pix, boleto, cartao, dinheiro
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fixed_costs_month ON fixed_costs(reference_month);
CREATE INDEX idx_fixed_costs_category ON fixed_costs(category);
CREATE INDEX idx_fixed_costs_status ON fixed_costs(payment_status);

CREATE TRIGGER update_fixed_costs_updated_at
BEFORE UPDATE ON fixed_costs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- View: Resumo Mensal
CREATE OR REPLACE VIEW fixed_costs_summary AS
SELECT
  reference_month,
  COUNT(*) AS total_entries,
  SUM(value) AS total_value,
  SUM(CASE WHEN payment_status = 'paid' THEN value ELSE 0 END) AS paid_value,
  SUM(CASE WHEN payment_status = 'pending' THEN value ELSE 0 END) AS pending_value,
  SUM(CASE WHEN payment_status = 'overdue' THEN value ELSE 0 END) AS overdue_value
FROM fixed_costs
GROUP BY reference_month
ORDER BY reference_month DESC;

-- RLS
ALTER TABLE fixed_cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read categories" ON fixed_cost_categories FOR SELECT USING (true);
CREATE POLICY "Allow read fixed costs" ON fixed_costs FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated on categories" ON fixed_cost_categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated on costs" ON fixed_costs
  FOR ALL USING (auth.role() = 'authenticated');
```

**2A.2 - Aplicar Migration** (15 min)

**2A.3 - Validar** (15 min)
```sql
SELECT * FROM fixed_cost_categories;
SELECT * FROM fixed_costs_summary;
```

**✅ Checklist Frente 2A:**
- [ ] Migration criada
- [ ] Aplicada no Supabase
- [ ] 12 categorias inseridas (validado)
- [ ] View `fixed_costs_summary` funcionando
- [ ] Commit: `feat(custos-fixos): criar tabelas de custos fixos`

---

### **📦 FRENTE 2B: Backend Custos Fixos (Semana 4)**

**Pasta:** `gestao/supabase_nfe/functions/`
**Tempo:** 2-3 horas
**Janela:** 2

#### **Tarefas:**

**2B.1 - Edge Function: classify-fixed-cost** (2h)
```bash
mkdir -p gestao/supabase_nfe/functions/classify-fixed-cost
touch gestao/supabase_nfe/functions/classify-fixed-cost/index.ts
```

**Funcionalidades:**
- Recebe: PDF/texto extraído (description, value, due_date)
- AI Classification (GPT-4o ou Gemini):
  - Identifica categoria (Energia, Água, Aluguel, etc)
  - Extrai valor, vencimento, referência
  - Retorna: `{category, value, due_date, confidence}`
- Consulta `classification_rules` (aprendizado)
- Retorna sugestão + confidence

**Tecnologias:**
- OpenAI API ou Gemini API
- Supabase Client
- Pattern matching (regex para valores, datas)

**2B.2 - Edge Function: update-payment-status** (1h)
```bash
mkdir -p gestao/supabase_nfe/functions/update-payment-status
touch gestao/supabase_nfe/functions/update-payment-status/index.ts
```

**Funcionalidades:**
- Scheduled job (cron diário)
- Atualiza status: `pending` → `overdue` (se due_date < hoje)
- Envia alertas (opcional: email, webhook)

**2B.3 - Deploy e Testar** (30 min)

**✅ Checklist Frente 2B:**
- [ ] Function `classify-fixed-cost` criada
- [ ] Function `update-payment-status` criada
- [ ] Deploy realizado
- [ ] Teste de classificação (curl)
- [ ] Commit: `feat(custos-fixos): edge functions para classificação`

---

### **📦 FRENTE 2C: Frontend Custos Fixos (Semana 4)**

**Pasta:** `gestao/src/pages/custos/`
**Tempo:** 5-6 horas
**Janela:** 3

#### **Tarefas:**

**2C.1 - API Client** (1h)
```bash
touch gestao/src/lib/api/fixedCosts.ts
```

**Exports:**
- `getFixedCostCategories()` → Category[]
- `getFixedCosts(month)` → FixedCost[]
- `createFixedCost(data)` → FixedCost
- `updateFixedCost(id, data)` → FixedCost
- `deleteFixedCost(id)` → void
- `markAsPaid(id, paymentData)` → FixedCost
- `classifyFixedCost(text, value, date)` → Classification

**2C.2 - Página: Custos Fixos** (4-5h)
```bash
mkdir -p gestao/src/pages/custos/fixos
touch gestao/src/pages/custos/fixos/Index.tsx
```

**Features:**

**Tab 1: Lançamentos**
- Seletor de mês
- Indicadores: Total do Mês, Pagas, Pendentes, Atrasadas
- Tabela: Categoria | Descrição | Valor | Vencimento | Status | Ações
- Ações: Marcar como Paga, Editar, Excluir, Ver Documento
- Botão: Novo Lançamento (modal)
- Botão: Importar PDF (upload + AI classification)

**Tab 2: Categorias**
- CRUD de categorias
- Tabela: Nome | Tipo (mensal/anual) | Valor Esperado | Status
- Indicador: Valor esperado vs Real do mês

**Tab 3: Histórico e Comparativo**
- Gráfico de linha: Evolução mensal (últimos 12 meses)
- Gráfico de barras: Comparativo por categoria
- Tabela: Mês Atual vs Anterior vs Média (últimos 6 meses)
- Alertas: Custos acima do esperado (>20%)

**2C.3 - Modal: Novo Lançamento** (incluso)
- Form: Categoria (select), Descrição, Valor, Vencimento, Método Pagamento
- Upload de documento (boleto, nota)
- Preview de classificação AI (se upload)

**2C.4 - Adicionar Rota** (10 min)
```typescript
<Route path="/custos/fixos" element={<CustosFixos />} />
```

**2C.5 - Testar UI** (1h)

**✅ Checklist Frente 2C:**
- [ ] API Client criado
- [ ] Página criada (3 tabs)
- [ ] Modal de novo lançamento
- [ ] Integração com AI classification
- [ ] Gráficos funcionando
- [ ] Rota adicionada
- [ ] Testes UI realizados
- [ ] Commit: `feat(custos-fixos): interface completa`

---

### **🎉 FIM DA FASE 2: CUSTOS FIXOS**

**Entregáveis:**
- ✅ 1 Migration SQL (categories + costs)
- ✅ 2 Edge Functions (classify, update-status)
- ✅ 1 API Client
- ✅ 1 Página Frontend (3 tabs)
- ✅ Integração com AI

**Tempo Total:** 9-11 horas (1-2 semanas)

---

## 👥 FASE 3: FOLHA DE PAGAMENTO (RH)

**Duração:** 2-3 semanas (40-50 horas)
**Prioridade:** ALTA (migração do Controle)

---

### **📦 FRENTE 3A: Database RH (Semana 5)**

**Pasta:** `gestao/supabase_nfe/migrations/`
**Tempo:** 2 horas
**Janela:** 1

#### **Tarefas:**

**3A.1 - Migration: Employees & Payroll** (90 min)
```bash
touch gestao/supabase_nfe/migrations/20260325_rh_payroll.sql
```

**Tabelas:**
- `employees` (id, name, cpf, admission_date, position, department, salary_type, base_salary, is_active)
- `payroll_entries` (id, employee_id, reference_month, absences, late_minutes, overtime_65_hours, overtime_100_hours, night_hours, base_salary, gross_total, inss, fgts, net_total, pdf_url, status)

**Seed:**
- 3 funcionários exemplo

**Views:**
- `payroll_summary` (resumo mensal para DRE)

**Código:** Ver PLANO_IMPLEMENTACAO_PARALELA.md (Frente 4)

**3A.2 - Aplicar Migration** (15 min)

**3A.3 - Validar** (15 min)

**✅ Checklist Frente 3A:**
- [ ] Migration criada
- [ ] Aplicada
- [ ] Seed validado (3 funcionários)
- [ ] Commit: `feat(rh): criar tabelas de funcionários e folha`

---

### **📦 FRENTE 3B: Backend RH (Semana 5-6)**

**Pasta:** `gestao/supabase_nfe/functions/`
**Tempo:** 5-6 horas
**Janela:** 2

#### **Tarefas:**

**3B.1 - Edge Function: extract-secullum-pdf** (3-4h)
```bash
mkdir -p gestao/supabase_nfe/functions/extract-secullum-pdf
touch gestao/supabase_nfe/functions/extract-secullum-pdf/index.ts
```

**Funcionalidades:**
- Recebe: PDF base64 (Secullum Web Pro)
- Parser: Nome, Faltas, Atrasos, HE 65%, HE 100%, Hora Noturna
- Retorna: array de `{name, absences, late_minutes, overtime_65, overtime_100, night_hours}`

**Tecnologias:**
- pdfjs-dist (parsing)
- Regex patterns (Secullum format)

**3B.2 - Edge Function: calculate-payroll** (2h)
```bash
mkdir -p gestao/supabase_nfe/functions/calculate-payroll
touch gestao/supabase_nfe/functions/calculate-payroll/index.ts
```

**Funcionalidades:**
- Recebe: `employee_id` + dados Secullum
- Busca salário base
- Calcula:
  - HE 65%: base_salary / 220h × 1.65 × overtime_65_hours
  - HE 100%: base_salary / 220h × 2.0 × overtime_100_hours
  - Hora Noturna: base_salary / 220h × 1.2 × night_hours
  - Descontos: faltas + atrasos
  - Gross Total
  - INSS (tabela progressiva)
  - FGTS (8%)
  - Net Total
- Retorna: `PayrollEntry` completo

**3B.3 - Edge Function: generate-payslip-pdf** (1h)
```bash
mkdir -p gestao/supabase_nfe/functions/generate-payslip-pdf
touch gestao/supabase_nfe/functions/generate-payslip-pdf/index.ts
```

**Funcionalidades:**
- Recebe: `payroll_entry_id`
- Gera PDF do contracheque (pdf-lib)
- Upload para Supabase Storage
- Retorna: URL do PDF

**3B.4 - Deploy e Testar** (30 min)

**✅ Checklist Frente 3B:**
- [ ] Function `extract-secullum-pdf` criada
- [ ] Function `calculate-payroll` criada
- [ ] Function `generate-payslip-pdf` criada
- [ ] Deploy realizado
- [ ] Testes realizados
- [ ] Commit: `feat(rh): edge functions para folha`

---

### **📦 FRENTE 3C: Frontend RH (Semana 6)**

**Pasta:** `gestao/src/pages/custos/folha/`
**Tempo:** 8-10 horas
**Janela:** 3

#### **Tarefas:**

**3C.1 - API Client** (1h)
```bash
touch gestao/src/lib/api/payroll.ts
```

**3C.2 - Página: Folha de Pagamento** (7-9h)
```bash
mkdir -p gestao/src/pages/custos/folha
touch gestao/src/pages/custos/folha/Index.tsx
```

**Features:**

**Tab 1: Importação Secullum**
- Upload PDF/Excel
- Preview de dados extraídos (tabela)
- Validação (funcionários não cadastrados)
- Botão: Processar (calcular folha)
- Envio PDFs individuais para Google Drive

**Tab 2: Cadastro de Funcionários**
- CRUD completo
- Tabela: Nome, CPF, Admissão, Cargo, Salário, Status
- Modal Create/Edit

**Tab 3: Fechamento Mensal**
- Seleção de mês
- Tabela: Funcionário | Salário Base | HE | Descontos | Gross | INSS | FGTS | Net | Ações
- Indicadores: Total Bruto, Total Líquido, Total INSS+FGTS (custo para DRE)
- Ações: Ver Contracheque (PDF), Editar, Aprovar
- Botão: Fechar Mês (aprovar todos)

**Tab 4: Histórico**
- Consulta de meses anteriores
- Comparativo mensal (gráfico)
- Exportação Excel

**3C.3 - Copiar Lógica do Controle** (incluso)
- Ler `controle/src/pages/rh/ClosingConsolidated.tsx`
- Adaptar para Gestão
- Usar Edge Functions criadas

**3C.4 - Adicionar Rota** (10 min)
```typescript
<Route path="/custos/folha" element={<Folha />} />
```

**3C.5 - Testar UI** (1h)

**✅ Checklist Frente 3C:**
- [ ] API Client criado
- [ ] Página criada (4 tabs)
- [ ] Importação Secullum funcionando
- [ ] CRUD Funcionários
- [ ] Cálculo de folha
- [ ] Geração de contracheques
- [ ] Rota adicionada
- [ ] Testes UI realizados
- [ ] Commit: `feat(rh): interface completa de folha`

---

### **📦 FRENTE 3D: Migração e Deprecação (Semana 6)**

**Pasta:** `controle/src/pages/rh/`
**Tempo:** 2-3 horas
**Janela:** 4

#### **Tarefas:**

**3D.1 - Adicionar Aviso no Controle** (1h)
```tsx
// controle/src/pages/rh/ClosingConsolidated.tsx
// Adicionar banner no topo:
<Alert variant="warning">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Módulo Migrado</AlertTitle>
  <AlertDescription>
    Este módulo foi migrado para o <strong>App Gestão</strong>.
    Para novas importações, acesse: <a href="https://gestao.cosiararas.com.br/custos/folha">gestao.cosiararas.com.br/custos/folha</a>
  </AlertDescription>
</Alert>
```

**3D.2 - Bloquear Novas Importações** (30 min)
```tsx
// Adicionar verificação:
if (new Date() > new Date('2026-06-01')) {
  return <Redirect to="https://gestao.cosiararas.com.br/custos/folha" />
}
```

**3D.3 - Migrar Dados Históricos** (1-2h)
```sql
-- Script de migração
-- Copiar de controle.timesheet_summary → gestao.payroll_entries
INSERT INTO gestao.payroll_entries (employee_id, reference_month, ...)
SELECT ... FROM controle.timesheet_summary
WHERE ...;
```

**3D.4 - Documentar** (30 min)
```bash
touch controle/docs/DEPRECATION_RH_MODULE.md
```

**✅ Checklist Frente 3D:**
- [ ] Aviso adicionado no Controle
- [ ] Bloqueio de importações (após data)
- [ ] Dados históricos migrados
- [ ] Documentação criada
- [ ] Commit (Controle): `feat(rh): deprecar módulo e migrar para Gestão`

---

### **🎉 FIM DA FASE 3: RH/FOLHA**

**Entregáveis:**
- ✅ 1 Migration SQL
- ✅ 3 Edge Functions (extract, calculate, generate-pdf)
- ✅ 1 API Client
- ✅ 1 Página Frontend (4 tabs)
- ✅ Migração de dados históricos
- ✅ Deprecação no Controle

**Tempo Total:** 17-21 horas (2-3 semanas)

---

## 💰 FASE 4: RECEITAS (APPLOAD)

**Duração:** 1-2 semanas (20-30 horas)
**Prioridade:** MÉDIA

---

### **📦 FRENTE 4A: Database Receitas (Semana 7)**

**Tempo:** 2 horas
**Janela:** 1

#### **Tarefas:**

**4A.1 - Migration: Revenue & Classification** (90 min)
```bash
touch gestao/supabase_nfe/migrations/20260330_revenue_classification.sql
```

**Tabelas:**
- `revenue_entries` (id, reference_month, source, channel, subcategory, description, value, transaction_date, document_url, classification_confidence, status)
- `classification_rules` (id, pattern, pattern_type, transaction_type, category, subcategory, confidence_score, times_used, times_correct, created_by)
- `transaction_classifications` (id, transaction_id, rule_id, suggested_category, user_category, is_correct)

**Código:** Ver CLASSIFICACAO_AUTOMATICA.md

**4A.2 - Aplicar e Validar** (30 min)

**✅ Checklist Frente 4A:**
- [ ] Migration criada e aplicada
- [ ] Seed de rules básicas
- [ ] Commit: `feat(receitas): criar tabelas de receitas e classificação`

---

### **📦 FRENTE 4B: Backend Receitas (Semana 7)**

**Tempo:** 5-6 horas
**Janela:** 2

#### **Tarefas:**

**4B.1 - Edge Function: extract-appload-pdf** (2-3h)
- Parser de PDFs do APPLOAD
- OCR + Regex (valores, datas, descrições)

**4B.2 - Edge Function: classify-transaction-ai** (2-3h)
- AI Classification (GPT-4o/Gemini)
- Consulta `classification_rules`
- Learning system (atualiza confidence)

**4B.3 - Deploy e Testar** (1h)

**✅ Checklist Frente 4B:**
- [ ] Functions criadas e testadas
- [ ] Commit: `feat(receitas): edge functions para classificação AI`

---

### **📦 FRENTE 4C: Frontend Receitas (Semana 7)**

**Tempo:** 6-8 horas
**Janela:** 3

#### **Tarefas:**

**4C.1 - API Client** (1h)

**4C.2 - Página: Receitas** (5-7h)

**Tab 1: Lançamentos**
- Upload de PDFs (APPLOAD)
- Validação de classificação AI (approve/reject)
- Tabela de lançamentos

**Tab 2: Categorias e Regras**
- CRUD de classification_rules
- Treinamento do sistema

**Tab 3: Histórico**
- Consulta mensal
- Gráficos por canal

**4C.3 - Adicionar Rota e Testar** (1h)

**✅ Checklist Frente 4C:**
- [ ] Página criada e testada
- [ ] Commit: `feat(receitas): interface de classificação AI`

---

### **🎉 FIM DA FASE 4: RECEITAS**

**Tempo Total:** 13-16 horas (1-2 semanas)

---

## 📈 FASE 5: DRE (Demonstração de Resultado)

**Duração:** 1 semana (15-20 horas)
**Prioridade:** ALTA

---

### **📦 FRENTE 5A: Backend DRE (Semana 8)**

**Tempo:** 4-5 horas
**Janela:** 2

#### **Tarefas:**

**5A.1 - Edge Function: calculate-dre** (4-5h)
- Consolidar receitas (revenue_entries)
- Consolidar CMV (product_cmv × vendas)
- Consolidar custos fixos (fixed_costs)
- Consolidar folha (payroll_summary)
- Calcular margens (bruta, operacional, líquida)
- Retornar DRE estruturado

**✅ Checklist Frente 5A:**
- [ ] Function criada e testada
- [ ] Commit: `feat(dre): edge function para cálculo automático`

---

### **📦 FRENTE 5B: Frontend DRE (Semana 8)**

**Tempo:** 10-15 horas
**Janela:** 3

#### **Tarefas:**

**5B.1 - Página: DRE** (8-12h)

**Features:**
- Seleção de período (mês, trimestre, ano)
- DRE formatado (estrutura contábil)
- Indicadores (margem bruta %, margem operacional %, margem líquida %)
- Gráficos:
  - Pizza: Distribuição de custos
  - Linha: Evolução mensal (receita, custos, lucro)
  - Barras: Comparativo mês atual vs anterior
- Exportação: PDF, Excel

**5B.2 - Componente: DREChart** (2-3h)

**5B.3 - Adicionar Rota e Testar** (1h)

**✅ Checklist Frente 5B:**
- [ ] Página criada
- [ ] Gráficos funcionando
- [ ] Exportação PDF/Excel
- [ ] Commit: `feat(dre): interface completa com gráficos`

---

### **🎉 FIM DA FASE 5: DRE**

**Tempo Total:** 14-20 horas (1 semana)

---

## 🎯 FASE 6: ANÁLISES E PRECIFICAÇÃO

**Duração:** 1-2 semanas (20-30 horas)
**Prioridade:** MÉDIA

---

### **📦 FRENTE 6A: Backend Análises (Semana 9)**

**Tempo:** 3-4 horas
**Janela:** 2

#### **Tarefas:**

**6A.1 - Edge Function: calculate-margins** (2h)
- Margem por produto (preço - CMV)
- Margem por canal (receita - CMV - comissão)

**6A.2 - Edge Function: suggest-price** (1-2h)
- CMV × (1 + margem_desejada) + comissão
- Retornar sugestão

**✅ Checklist Frente 6A:**
- [ ] Functions criadas e testadas
- [ ] Commit: `feat(analises): edge functions para margens`

---

### **📦 FRENTE 6B: Frontend Análises (Semana 9-10)**

**Tempo:** 8-10 horas
**Janela:** 3

#### **Tarefas:**

**6B.1 - Página: Margens e Precificação** (6-8h)

**Tab 1: Margem por Produto**
- Tabela: Produto | CMV | Preço | Margem R$ | Margem % | Status
- Filtros: Margem < X%, Categoria
- Alertas: Margem negativa

**Tab 2: Margem por Canal**
- Tabela: Canal | Receita | CMV | Comissão | Margem Líquida | %
- Gráfico de barras comparativo

**Tab 3: Simulador de Preços**
- Seleção de produto
- Input: Margem desejada
- Output: Preço sugerido, impacto em vendas

**Tab 4: Alertas**
- Produtos com margem < 50%
- Ingredientes com alta volatilidade
- Custos fixos acima do esperado

**6B.2 - Adicionar Rota e Testar** (2h)

**✅ Checklist Frente 6B:**
- [ ] Página criada (4 tabs)
- [ ] Simulador funcionando
- [ ] Alertas configurados
- [ ] Commit: `feat(analises): interface completa de margens`

---

### **🎉 FIM DA FASE 6: ANÁLISES**

**Tempo Total:** 11-14 horas (1-2 semanas)

---

## ✅ FASE 7: INTEGRAÇÃO E REFINAMENTO

**Duração:** 1 semana (15-25 horas)
**Prioridade:** CRÍTICA

---

### **Tarefas:**

**7.1 - Testes End-to-End** (8-10h)
- Fluxo completo: Upload NF-e → Match ingredientes → Atualizar CMV → Verificar DRE
- Fluxo: Importar Secullum → Calcular folha → Verificar DRE
- Fluxo: Upload APPLOAD → Classificar → Verificar DRE

**7.2 - Correção de Bugs** (5-10h)
- Priorizar bugs críticos
- Ajustes de UX

**7.3 - Documentação Final** (2-3h)
- README atualizado
- Guia de uso
- Vídeos tutoriais (opcional)

**7.4 - Deploy em Produção** (1-2h)
- Verificar variáveis de ambiente
- Deploy via Vercel/Cloudflare
- Testes em produção

**✅ Checklist Fase 7:**
- [ ] Testes E2E realizados
- [ ] Bugs corrigidos
- [ ] Documentação atualizada
- [ ] Deploy em produção
- [ ] Commit: `chore: release v1.0.0 - sistema financeiro completo`

---

## 📊 RESUMO FINAL

### **Total de Entregas:**

| Fase | Migrations | Edge Functions | Páginas | Componentes | Horas |
|------|-----------|----------------|---------|-------------|-------|
| **1. CMV** | 2 | 3 | 3 | 6 | 22-28h |
| **2. Custos Fixos** | 1 | 2 | 1 | 3 | 9-11h |
| **3. RH/Folha** | 1 | 3 | 1 | 4 | 17-21h |
| **4. Receitas** | 1 | 2 | 1 | 2 | 13-16h |
| **5. DRE** | 0 | 1 | 1 | 3 | 14-20h |
| **6. Análises** | 0 | 2 | 1 | 4 | 11-14h |
| **7. Integração** | 0 | 0 | 0 | 0 | 15-25h |
| **TOTAL** | **5** | **13** | **8** | **22** | **101-135h** |

**Duração:** 8-11 semanas (em paralelo)
**Equivalente:** 13-17 semanas (sequencial)
**Economia:** ~40% de tempo

---

## 🚀 COMO USAR ESTE PLANO

### **1. Configuração Inicial:**
```bash
# Clonar/atualizar repositórios
cd C:\Users\khali\.antigravity\gestao
git pull

# Instalar dependências
npm install
```

### **2. Trabalho Paralelo (Recomendado):**

**Abrir 4 janelas do Antigravity:**

```bash
# JANELA 1: Database
cd gestao/supabase_nfe/migrations
# Seguir Frentes XA (X = número da fase)

# JANELA 2: Backend
cd gestao/supabase_nfe/functions
# Seguir Frentes XB

# JANELA 3: Frontend
cd gestao/src
# Seguir Frentes XC

# JANELA 4: Testes/Validação
cd gestao
# Executar queries, curl tests, UI tests
```

### **3. Estratégia de Commits:**

```bash
# Commits pequenos e frequentes por frente
git add gestao/supabase_nfe/migrations/20260316_cmv_*.sql
git commit -m "feat(cmv): criar tabelas de ingredientes e receitas"

git add gestao/supabase_nfe/functions/match-nfe-to-ingredients/
git commit -m "feat(cmv): edge function para match NF-e"

git add gestao/src/pages/custos/cmv/Ingredientes.tsx
git commit -m "feat(cmv): interface de ingredientes"
```

### **4. Tracking de Progresso:**

Use os **checklists** de cada frente para marcar o que foi concluído.

---

## 📚 DOCUMENTOS DE REFERÊNCIA

| Documento | Conteúdo |
|-----------|----------|
| [ARQUITETURA_CUSTOS_COMPLETA.md](./ARQUITETURA_CUSTOS_COMPLETA.md) | Arquitetura técnica detalhada |
| [MIGRACAO_RH_CONTROLE_GESTAO.md](./MIGRACAO_RH_CONTROLE_GESTAO.md) | Migração do módulo RH |
| [CLASSIFICACAO_AUTOMATICA.md](./CLASSIFICACAO_AUTOMATICA.md) | Sistema de AI para receitas/custos |
| [SISTEMA_FINANCEIRO_COMPLETO.md](./SISTEMA_FINANCEIRO_COMPLETO.md) | Visão de negócio |
| [PLANO_IMPLEMENTACAO_PARALELA.md](./PLANO_IMPLEMENTACAO_PARALELA.md) | Detalhamento da Fase 1 (CMV) |

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Revisar este plano** (você está aqui)
2. ⏳ **Decidir quando iniciar** (apps da semana primeiro?)
3. ⏳ **Escolher fase inicial** (recomendo Fase 1: CMV)
4. ⏳ **Abrir múltiplas janelas** do Antigravity
5. ⏳ **Iniciar frentes em paralelo**
6. ⏳ **Usar checklists** para tracking
7. ⏳ **Commits frequentes**
8. ⏳ **Testar continuamente**

---

**Última Atualização:** 2026-03-16
**Status:** 📋 Plano Completo e Detalhado
**Pronto para:** Execução Imediata
**Autor:** Claude Code Agent
