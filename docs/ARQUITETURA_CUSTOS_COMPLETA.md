# 💰 Arquitetura Completa de Custos - App Gestão

**Data:** 2026-03-16
**Ordem de Implementação:** CMV → Custos Fixos → Folha de Pagamento → Margens/Precificação

---

## 🎯 Visão Geral

O sistema de custos do **App Gestão** é o alicerce para:
- ✅ Cálculo de **CMV real** por produto
- ✅ Controle de **Custos Fixos** mensais
- ✅ Gestão de **Folha de Pagamento** (migrado do Controle)
- ✅ **DRE automático** (Demonstração de Resultado)
- ✅ **Análise de Margem** e precificação inteligente

---

## 📦 Estrutura de Custos

```
📂 Gestão
│
├── 💰 RECEITAS
│   └── (APPLOAD - classificação AI)
│
├── 📊 CUSTOS
│   │
│   ├── 🥕 1. CMV (Custo de Mercadoria Vendida) ← PRIORIDADE 1
│   │   ├── Cadastro de Ingredientes
│   │   ├── Receitas de Produtos (BOM - Bill of Materials)
│   │   ├── Preços de Compra (histórico + média)
│   │   ├── Cálculo Automático de CMV
│   │   └── Integração com NF-e (atualização de preços)
│   │
│   ├── 🏢 2. Custos Fixos ← PRIORIDADE 2
│   │   ├── Aluguel
│   │   ├── Contas (luz, água, internet, gás)
│   │   ├── Manutenções
│   │   ├── Seguros
│   │   ├── Impostos fixos
│   │   └── Classificação AI (APPLOAD PDFs)
│   │
│   └── 👥 3. Folha de Pagamento ← PRIORIDADE 3
│       ├── Cadastro de Funcionários
│       ├── Importação Secullum (PDF/Excel)
│       ├── Cálculo de Folha Mensal
│       ├── INSS + FGTS
│       └── Histórico de Pagamentos
│
└── 📈 ANÁLISES (APÓS BASE DE CUSTOS)
    ├── DRE (Demonstração de Resultado)
    ├── CMV por Produto
    ├── Margem Bruta por Canal (iFood, Anotaí, apps)
    ├── Sugestão de Preços (baseado em CMV real)
    └── Alertas (margem negativa, custos elevados)
```

---

## 1️⃣ CMV (Custo de Mercadoria Vendida) - PRIORIDADE 1

### **Objetivo:**
Calcular o custo REAL de cada produto vendido, considerando:
- Ingredientes e quantidades
- Preço de compra mais recente
- Embalagens e insumos

### **🗂️ Estrutura de Dados:**

#### **Tabela: `ingredients`** (Cadastro de Ingredientes)
```sql
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE, -- 'Peito de Frango', 'Arroz'
  category VARCHAR(100), -- 'proteinas', 'acompanhamentos', 'embalagens'
  unit VARCHAR(20) NOT NULL, -- 'kg', 'un', 'litro'
  current_price DECIMAL(10,2), -- último preço de compra
  avg_price DECIMAL(10,2), -- média móvel (últimos 3 meses)
  supplier_name VARCHAR(255), -- fornecedor padrão
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ingredients_category ON ingredients(category);
```

#### **Tabela: `ingredient_price_history`** (Histórico de Preços)
```sql
CREATE TABLE ingredient_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id),
  price DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,3), -- quantidade comprada
  unit VARCHAR(20), -- kg, un, litro
  supplier_name VARCHAR(255),
  purchase_date DATE NOT NULL,
  nfe_key VARCHAR(44), -- chave da NF-e (se houver)
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'nfe', 'import'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_ingredient ON ingredient_price_history(ingredient_id);
CREATE INDEX idx_price_history_date ON ingredient_price_history(purchase_date DESC);
```

#### **Tabela: `product_recipes`** (Receitas = BOM)
```sql
CREATE TABLE product_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(255) NOT NULL, -- 'Marmita P - Frango'
  product_code VARCHAR(50), -- SKU ou código interno
  category VARCHAR(100), -- 'marmitas', 'encomendas', 'corporativo'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipes_product ON product_recipes(product_name);
```

#### **Tabela: `recipe_items`** (Ingredientes da Receita)
```sql
CREATE TABLE recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES product_recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  quantity DECIMAL(10,3) NOT NULL, -- 0.200 (200g)
  unit VARCHAR(20) NOT NULL, -- 'kg'
  notes TEXT, -- observações (ex: 'cozido', 'grelhado')
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_items_recipe ON recipe_items(recipe_id);
```

#### **View: `product_cmv`** (CMV Calculado)
```sql
CREATE OR REPLACE VIEW product_cmv AS
SELECT
  pr.id AS recipe_id,
  pr.product_name,
  pr.product_code,
  pr.category,
  SUM(ri.quantity * i.current_price) AS cmv_current,
  SUM(ri.quantity * i.avg_price) AS cmv_avg,
  COUNT(ri.id) AS ingredient_count,
  pr.is_active
FROM product_recipes pr
LEFT JOIN recipe_items ri ON pr.id = ri.recipe_id
LEFT JOIN ingredients i ON ri.ingredient_id = i.id
GROUP BY pr.id, pr.product_name, pr.product_code, pr.category, pr.is_active;
```

---

### **🖥️ Interface - Módulo CMV:**

#### **Página: `/custos/cmv`**

**Tab 1: Ingredientes**
- CRUD completo de ingredientes
- Tabela com: Nome | Categoria | Unidade | Preço Atual | Preço Médio | Fornecedor
- Ações: Editar, Ver Histórico de Preços, Inativar
- Filtros: Categoria, Ativo/Inativo

**Tab 2: Receitas de Produtos**
- Lista de produtos com CMV calculado
- Criação de nova receita:
  - Nome do produto
  - Seleção de ingredientes (autocomplete)
  - Quantidade de cada ingrediente
  - Preview de CMV total
- Duplicação de receitas (ex: Marmita P → M → G)
- Edição de receitas existentes

**Tab 3: Histórico de Preços**
- Consulta de preços históricos por ingrediente
- Gráfico de evolução de preço
- Importação manual de preços
- Integração com NF-e (atualização automática)

**Tab 4: Análise de CMV**
- Tabela: Produto | CMV | Preço Venda | Margem Bruta | %
- Filtros: Categoria, Margem < X%
- Alertas: Produtos com margem negativa ou abaixo do mínimo

---

### **🔄 Fluxo de Atualização de Preços:**

```
1. Compra com NF-e
   ↓
2. NF-e processada (já implementado em gestao/supabase_nfe/)
   ↓
3. Edge Function: match_nfe_to_ingredients
   - Parser de descrição do item NF-e
   - Match com tabela `ingredients` (AI/fuzzy)
   - Inserção em `ingredient_price_history`
   ↓
4. Trigger: update_ingredient_current_price
   - Atualiza `ingredients.current_price`
   - Recalcula `ingredients.avg_price` (últimos 3 meses)
   ↓
5. View `product_cmv` atualiza automaticamente
```

---

## 2️⃣ Custos Fixos - PRIORIDADE 2

### **Objetivo:**
Controlar despesas mensais recorrentes que NÃO variam com a produção.

### **🗂️ Estrutura de Dados:**

#### **Tabela: `fixed_costs`**
```sql
CREATE TABLE fixed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_month DATE NOT NULL, -- '2026-03-01'
  category VARCHAR(100) NOT NULL, -- 'aluguel', 'energia', 'agua', etc
  subcategory VARCHAR(100), -- detalhamento (ex: 'loja_araras', 'deposito')
  description TEXT,
  value DECIMAL(10,2) NOT NULL,
  due_date DATE,
  payment_date DATE,
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue
  payment_method VARCHAR(50), -- pix, boleto, cartao
  document_url TEXT, -- PDF da conta/boleto
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fixed_costs_month ON fixed_costs(reference_month);
CREATE INDEX idx_fixed_costs_category ON fixed_costs(category);
CREATE INDEX idx_fixed_costs_status ON fixed_costs(payment_status);
```

#### **Tabela: `fixed_cost_categories`** (Categorias Padrão)
```sql
CREATE TABLE fixed_cost_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE, -- 'Aluguel', 'Energia', etc
  type VARCHAR(50) DEFAULT 'monthly', -- monthly, quarterly, annual
  expected_value DECIMAL(10,2), -- valor esperado (para alertas)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed de categorias padrão
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
('Limpeza e Higiene', 'monthly', 300.00);
```

---

### **🖥️ Interface - Custos Fixos:**

#### **Página: `/custos/fixos`**

**Tab 1: Lançamentos**
- Seleção de mês de referência
- Tabela: Categoria | Descrição | Valor | Vencimento | Status | Ações
- Ações: Pagar, Editar, Anexar Documento, Excluir
- Indicadores: Total do Mês | Pagas | Pendentes | Atrasadas
- **Classificação AI** (importação de PDFs do APPLOAD)

**Tab 2: Categorias**
- CRUD de categorias de custos fixos
- Valor esperado (para alertas)
- Tipo: Mensal, Trimestral, Anual

**Tab 3: Histórico e Comparativo**
- Gráfico de evolução mensal por categoria
- Comparativo: Mês Atual vs Mês Anterior vs Média
- Alertas: Custos acima do esperado

---

### **🔄 Integração com Classificação AI:**

```
1. Upload PDF APPLOAD (conta de luz, por exemplo)
   ↓
2. OCR + Parser (pdf.js)
   ↓
3. AI Classification (GPT-4o/Gemini)
   - Identifica: Categoria (Energia Elétrica)
   - Extrai: Valor, Vencimento, Referência
   ↓
4. User Validation (UI)
   - Usuário aprova ou corrige
   ↓
5. Learning (classification_rules)
   - Sistema aprende o padrão
   ↓
6. Insert em `fixed_costs`
```

---

## 3️⃣ Folha de Pagamento - PRIORIDADE 3

### **Objetivo:**
Migrar módulo RH do Controle para Gestão como **custo de pessoal**.

Já documentado em: [MIGRACAO_RH_CONTROLE_GESTAO.md](./MIGRACAO_RH_CONTROLE_GESTAO.md)

### **Resumo:**

**Tabelas:**
- `employees` (cadastro)
- `payroll_entries` (lançamentos mensais)

**Interface:** `/custos/folha`
- Tab 1: Importação Secullum
- Tab 2: Cadastro de Funcionários
- Tab 3: Fechamento Mensal
- Tab 4: Histórico

**Integração DRE:** Custo de Pessoal = Salários + INSS + FGTS

---

## 📊 DRE - Demonstração de Resultado do Exercício

### **Estrutura Completa:**

```
════════════════════════════════════════════════════════
DEMONSTRAÇÃO DE RESULTADO - Março 2026
════════════════════════════════════════════════════════

RECEITA BRUTA
├─ iFood                                    R$ 15.000,00
├─ Anotaí                                   R$  8.000,00
├─ Marmitaria (app)                         R$ 12.000,00
├─ Corporativo (rotas B2B)                  R$  3.000,00
└─ Encomendas                               R$  5.000,00
                                            ────────────
TOTAL RECEITA BRUTA                         R$ 43.000,00

════════════════════════════════════════════════════════
(-) CMV (CUSTO DE MERCADORIA VENDIDA)
════════════════════════════════════════════════════════
├─ Ingredientes                             R$ 12.000,00
├─ Embalagens                               R$  2.000,00
                                            ────────────
TOTAL CMV                                   R$ 14.000,00
                                            ────────────
LUCRO BRUTO                                 R$ 29.000,00
Margem Bruta: 67,4%

════════════════════════════════════════════════════════
(-) DESPESAS OPERACIONAIS
════════════════════════════════════════════════════════

CUSTOS FIXOS
├─ Aluguel                                  R$  3.000,00
├─ Energia Elétrica                         R$    800,00
├─ Água                                     R$    200,00
├─ Internet                                 R$    150,00
├─ Gás                                      R$    300,00
├─ Telefone                                 R$    100,00
├─ Contador                                 R$    500,00
├─ Limpeza                                  R$    300,00
                                            ────────────
Subtotal Custos Fixos                       R$  5.350,00

CUSTOS DE PESSOAL
├─ Salários                                 R$  8.000,00
├─ INSS Patronal (20%)                      R$  1.600,00
├─ FGTS (8%)                                R$    640,00
                                            ────────────
Subtotal Pessoal                            R$ 10.240,00

DESPESAS COMERCIAIS
├─ Comissões iFood (27%)                    R$  4.050,00
├─ Comissões Anotaí (12%)                   R$    960,00
├─ Marketing                                R$    500,00
├─ Embalagens Delivery                      R$    400,00
                                            ────────────
Subtotal Comercial                          R$  5.910,00
                                            ────────────
TOTAL DESPESAS OPERACIONAIS                 R$ 21.500,00

════════════════════════════════════════════════════════
RESULTADO OPERACIONAL                       R$  7.500,00
Margem Operacional: 17,4%
════════════════════════════════════════════════════════

(-) IMPOSTOS
├─ Simples Nacional (5% faturamento)        R$  2.150,00
                                            ────────────
LUCRO LÍQUIDO                               R$  5.350,00
Margem Líquida: 12,4%
════════════════════════════════════════════════════════
```

---

## 🖥️ Interface - DRE

### **Página: `/analises/dre`**

**Controles:**
- Seleção de período: Mês | Trimestre | Ano
- Comparativo: Mês Anterior | Mesmo Mês Ano Anterior

**Blocos:**
1. **Receita Bruta** (dados de `revenue_entries` - APPLOAD)
2. **CMV** (calculado de `product_cmv` x vendas)
3. **Custos Fixos** (soma de `fixed_costs`)
4. **Folha de Pagamento** (soma de `payroll_entries`)
5. **Despesas Comerciais** (comissões, marketing)
6. **Impostos** (Simples Nacional)

**Visualizações:**
- 📊 Gráfico de pizza (distribuição de custos)
- 📈 Gráfico de evolução mensal (receita vs custos vs lucro)
- 🎯 Indicadores: Margem Bruta, Margem Operacional, Margem Líquida

**Exportação:**
- PDF formatado
- Excel (dados brutos)

---

## 4️⃣ Margens e Precificação - APÓS BASE DE CUSTOS

### **Objetivo:**
Análise de rentabilidade e sugestão de preços baseada em custos REAIS.

### **Página: `/analises/margens`**

**Tab 1: Margem por Produto**
| Produto | CMV | Preço Venda | Margem R$ | Margem % | Status |
|---------|-----|-------------|-----------|----------|--------|
| Marmita P - Frango | R$ 6,50 | R$ 18,00 | R$ 11,50 | 63,9% | ✅ Saudável |
| Marmita M - Carne | R$ 9,20 | R$ 22,00 | R$ 12,80 | 58,2% | ✅ Saudável |
| Torta Limão G | R$ 25,00 | R$ 60,00 | R$ 35,00 | 58,3% | ✅ Saudável |
| Marmita G - Picanha | R$ 18,00 | R$ 30,00 | R$ 12,00 | 40,0% | ⚠️ Atenção |

**Filtros:**
- Margem < 50% (alerta)
- Margem < 0% (prejuízo)
- Categoria de produto

**Tab 2: Margem por Canal**
| Canal | Receita Bruta | CMV | Comissão | Margem Líquida | % |
|-------|---------------|-----|----------|----------------|---|
| iFood | R$ 15.000 | R$ 5.400 | R$ 4.050 (27%) | R$ 5.550 | 37,0% |
| Anotaí | R$ 8.000 | R$ 2.880 | R$ 960 (12%) | R$ 4.160 | 52,0% |
| App Próprio | R$ 12.000 | R$ 4.320 | R$ 0 | R$ 7.680 | 64,0% |
| Corporativo | R$ 3.000 | R$ 1.080 | R$ 0 | R$ 1.920 | 64,0% |

**Insights:**
- ✅ App Próprio tem melhor margem (sem comissão)
- ⚠️ iFood tem margem mais baixa (comissão alta)
- 💡 Sugestão: Incentivar vendas diretas

**Tab 3: Simulador de Preços**
- Seleção de produto
- CMV atual
- Margem desejada (%)
- **Sugestão de preço** = CMV / (1 - margem_desejada)
- Comparação com preço atual
- Análise de impacto (vendas vs margem)

**Tab 4: Alertas**
- Produtos com margem negativa
- Produtos com preço de venda < CMV + 50%
- Ingredientes com alta volatilidade de preço
- Custos fixos acima do esperado

---

## 🔄 Ordem de Implementação (CONFIRMADA)

### **FASE 1: CMV (Prioridade Máxima)**
**Objetivo:** Base de cálculo de custo por produto

**Entregáveis:**
- ✅ Tabelas: `ingredients`, `ingredient_price_history`, `product_recipes`, `recipe_items`
- ✅ View: `product_cmv`
- ✅ Interface: `/custos/cmv` (4 tabs)
- ✅ Edge Function: `match_nfe_to_ingredients` (integração NF-e)

**Tempo estimado:** 2-3 semanas

---

### **FASE 2: Custos Fixos**
**Objetivo:** Controle de despesas mensais recorrentes

**Entregáveis:**
- ✅ Tabelas: `fixed_costs`, `fixed_cost_categories`
- ✅ Interface: `/custos/fixos` (3 tabs)
- ✅ Integração com Classificação AI (APPLOAD)

**Tempo estimado:** 1-2 semanas

---

### **FASE 3: Folha de Pagamento**
**Objetivo:** Migração do módulo RH do Controle

**Entregáveis:**
- ✅ Tabelas: `employees`, `payroll_entries`
- ✅ Interface: `/custos/folha` (4 tabs)
- ✅ Migração de lógica do Controle (Secullum)
- ✅ Deprecação do módulo RH no Controle

**Tempo estimado:** 2-3 semanas

---

### **FASE 4: DRE Automático**
**Objetivo:** Consolidação de todos os dados em relatório gerencial

**Entregáveis:**
- ✅ Interface: `/analises/dre`
- ✅ Lógica de cálculo (Receita - CMV - Custos)
- ✅ Gráficos e indicadores
- ✅ Exportação PDF/Excel

**Tempo estimado:** 1 semana

---

### **FASE 5: Margens e Precificação**
**Objetivo:** Análise de rentabilidade e sugestão de preços

**Entregáveis:**
- ✅ Interface: `/analises/margens` (4 tabs)
- ✅ Simulador de preços
- ✅ Sistema de alertas
- ✅ Análise por canal

**Tempo estimado:** 1-2 semanas

---

**TOTAL:** ~8-11 semanas de desenvolvimento

---

## 📋 Dependências Técnicas

### **Banco de Dados:**
- PostgreSQL (Supabase)
- Triggers para recálculo automático
- Views materializadas para performance
- Índices otimizados

### **Backend:**
- Edge Functions (Deno/TypeScript)
- OCR/Parser (pdf.js, pdf-lib)
- AI Classification (GPT-4o/Gemini)

### **Frontend:**
- React 18+
- Vite 5+
- TypeScript 5
- shadcn/ui (componentes)
- Recharts (gráficos)
- Zustand (state management)

### **Integrações:**
- N8N (webhooks, Google Drive)
- Supabase (auth, database, storage)
- Google Sheets (cardápio, sync)
- APPLOAD (PDFs de receitas/custos)

---

## 🔗 Documentação Relacionada

- [SISTEMA_FINANCEIRO_COMPLETO.md](./SISTEMA_FINANCEIRO_COMPLETO.md)
- [CLASSIFICACAO_AUTOMATICA.md](./CLASSIFICACAO_AUTOMATICA.md)
- [MIGRACAO_RH_CONTROLE_GESTAO.md](./MIGRACAO_RH_CONTROLE_GESTAO.md)
- [MIGRACAO_GESTAO_PARA_ESTOQUE.md](./MIGRACAO_GESTAO_PARA_ESTOQUE.md)

---

**Última Atualização:** 2026-03-16
**Status:** 📋 Arquitetura Completa
**Próximo Passo:** Implementação da Fase 1 (CMV)
