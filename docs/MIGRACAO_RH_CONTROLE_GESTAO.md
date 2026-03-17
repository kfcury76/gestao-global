# 🔄 Migração: RH do Controle → Gestão (Custos)

**Data:** 2026-03-16
**Decisão:** RH deve estar no app **Gestão** como CUSTO, não em Controle (operacional)

---

## 🎯 Justificativa

### **Controle = Operacional**
- Pedidos, impressão, cardápio
- Gestão de rotas corporativas
- Encomendas especiais
- **NÃO** deveria ter análise de custos

### **Gestão = Financeiro**
- CMV (custo de ingredientes)
- Custos Fixos (aluguel, luz, etc)
- **Folha de Pagamento** (RH) → CUSTO DE PESSOAL
- DRE (Demonstração de Resultado)
- Análise de margem e precificação

---

## 📦 O que Migrar do Controle

### **Página `/rh` Atual:**

| Funcionalidade | Status | Tabela | Tecnologia |
|----------------|--------|--------|------------|
| **Importação PDF/Excel** (Secullum) | ✅ Funcional | `timesheet_summary` | pdfjs-dist, xlsx |
| **Extração de dados** (Faltas, HE, etc) | ✅ Funcional | `timesheet_summary` | Regex parsing |
| **Envio PDFs** para Google Drive | ✅ Funcional | N8N webhook | pdf-lib |
| **Gravação de lançamentos** | ✅ Funcional | `timesheet_summary` | Supabase insert |
| **Tab: Quadro de Funcionários** | ⚠️ Stub | - | Não implementado |
| **Tab: Inconsistências** | ⚠️ Stub | - | Não implementado |

---

## 🏗️ Nova Arquitetura no App Gestão

### **Módulo: Custos → Folha de Pagamento**

```
📂 Gestão
├── 💰 Receitas
│   └── (APPLOAD - classificação AI)
│
├── 📊 Custos
│   ├── 🥕 CMV (Custo Mercadoria)
│   ├── 🏢 Custos Fixos (aluguel, luz, etc)
│   └── 👥 Folha de Pagamento ← NOVO (migrado do Controle)
│       ├── Importação Secullum (PDF/Excel)
│       ├── Cadastro de Funcionários
│       ├── Cálculo de Folha Mensal
│       ├── Histórico de Pagamentos
│       └── Integração com DRE
│
└── 📈 Análises
    ├── DRE (Demonstração de Resultado)
    ├── CMV por Produto
    └── Margens e Precificação
```

---

## 🗂️ Estrutura de Dados

### **Tabelas Novas no Gestão:**

#### 1. `employees` (Cadastro de Funcionários)
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  admission_date DATE NOT NULL,
  position VARCHAR(100),
  department VARCHAR(100), -- cozinha, atendimento, entrega, etc
  salary_type VARCHAR(20), -- 'monthly', 'hourly'
  base_salary DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `payroll_entries` (Lançamentos de Folha)
```sql
CREATE TABLE payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  reference_month DATE NOT NULL, -- '2026-03-01'

  -- Dados do Secullum (migrados de timesheet_summary)
  absences INTEGER DEFAULT 0,
  late_minutes INTEGER DEFAULT 0,
  overtime_65_hours DECIMAL(5,2) DEFAULT 0,
  overtime_100_hours DECIMAL(5,2) DEFAULT 0,
  night_hours DECIMAL(5,2) DEFAULT 0,

  -- Cálculos
  base_salary DECIMAL(10,2) NOT NULL,
  overtime_65_value DECIMAL(10,2) DEFAULT 0,
  overtime_100_value DECIMAL(10,2) DEFAULT 0,
  night_shift_value DECIMAL(10,2) DEFAULT 0,
  discounts DECIMAL(10,2) DEFAULT 0, -- faltas, atrasos
  gross_total DECIMAL(10,2) NOT NULL,
  inss DECIMAL(10,2) DEFAULT 0,
  fgts DECIMAL(10,2) DEFAULT 0,
  net_total DECIMAL(10,2) NOT NULL,

  -- Documentação
  pdf_url TEXT, -- Google Drive URL
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payroll_month ON payroll_entries(reference_month);
CREATE INDEX idx_payroll_employee ON payroll_entries(employee_id);
```

#### 3. Manter `timesheet_summary` (backup/auditoria)
- Continua existindo no Supabase
- Recebe dados brutos do Secullum
- `payroll_entries` consome e enriquece esses dados

---

## 🔄 Fluxo de Migração

### **Fase 1: Preparação (Gestão)**
1. ✅ Criar tabelas `employees` e `payroll_entries`
2. ✅ Migrar dados existentes de `timesheet_summary` (se houver)
3. ✅ Implementar página `/custos/folha` no Gestão
4. ✅ Copiar lógica de importação do Controle

### **Fase 2: Novo Módulo (Gestão)**
**Página:** `/custos/folha`

**Tabs:**
1. **Importação Secullum** (migrado do Controle)
   - Upload PDF/Excel
   - Extração automática de dados
   - Preview antes de gravar
   - Envio para Google Drive (N8N)

2. **Cadastro de Funcionários** (novo)
   - CRUD completo
   - Campos: nome, CPF, admissão, cargo, salário
   - Histórico de alterações salariais

3. **Fechamento Mensal** (novo)
   - Seleção de mês
   - Lista de funcionários com totais
   - Cálculo automático: HE, descontos, INSS, FGTS
   - Aprovação de folha
   - Exportação para PDF/Excel

4. **Histórico** (novo)
   - Consulta de meses anteriores
   - Comparativo mensal
   - Gráficos de custo de pessoal

### **Fase 3: Integração com DRE**
- Custo de Pessoal = SUM(payroll_entries.gross_total + fgts + inss) do mês
- Aparecer no DRE como "Custos de Pessoal"
- Comparativo mensal

### **Fase 4: Deprecação no Controle**
1. ⚠️ Adicionar aviso na página `/rh` do Controle:
   ```
   ⚠️ ATENÇÃO: Este módulo foi migrado para o App Gestão.
   Acesse: https://gestao.cosiararas.com.br/custos/folha
   ```
2. ⚠️ Bloquear novas importações (redirect para Gestão)
3. ✅ Remover código após 3 meses de validação

---

## 📊 Integração com DRE

### **Estrutura DRE (Demonstração de Resultado):**

```
RECEITA BRUTA
├─ iFood                      R$ 15.000,00
├─ Anotaí                     R$ 8.000,00
├─ Marmitaria (app)           R$ 12.000,00
└─ Encomendas                 R$ 5.000,00
                              ────────────
TOTAL RECEITA                 R$ 40.000,00

(-) CMV (Custo Mercadoria)
├─ Ingredientes               R$ 12.000,00
├─ Embalagens                 R$ 2.000,00
                              ────────────
TOTAL CMV                     R$ 14.000,00
                              ────────────
LUCRO BRUTO                   R$ 26.000,00

(-) DESPESAS OPERACIONAIS
├─ Custos Fixos
│   ├─ Aluguel                R$ 3.000,00
│   ├─ Luz                    R$ 800,00
│   ├─ Água                   R$ 200,00
│   └─ Internet               R$ 150,00
│
└─ Custos de Pessoal ← FOLHA DE PAGAMENTO
    ├─ Salários               R$ 8.000,00
    ├─ INSS Patronal          R$ 1.600,00
    ├─ FGTS                   R$ 640,00
                              ────────────
TOTAL DESPESAS                R$ 14.390,00
                              ────────────
LUCRO OPERACIONAL             R$ 11.610,00
```

---

## 🎯 Benefícios da Migração

### **Para o Negócio:**
✅ Visão completa de custos em um único lugar
✅ DRE automático com custo de pessoal real
✅ Comparativo mensal de folha
✅ Base para cálculo de margem real por produto

### **Para o Sistema:**
✅ Separação clara: Controle = Operação / Gestão = Financeiro
✅ Redução de complexidade no Controle
✅ Melhor rastreabilidade de custos
✅ Integração natural com CMV e Custos Fixos

### **Para o Usuário:**
✅ Interface única para análise financeira
✅ Relatórios consolidados
✅ Histórico de evolução de custos

---

## ⚙️ Tecnologias a Manter

| Tecnologia | Uso | Origem |
|------------|-----|--------|
| **pdfjs-dist** | Extração de texto do PDF Secullum | Controle |
| **pdf-lib** | Geração de PDFs individuais | Controle |
| **xlsx** | Leitura de planilhas Excel | Controle |
| **N8N Webhook** | Envio para Google Drive | Controle |
| **Supabase Storage** | Armazenamento local de PDFs | Novo |

---

## 📋 Checklist de Implementação

### **Banco de Dados:**
- [ ] Criar tabela `employees`
- [ ] Criar tabela `payroll_entries`
- [ ] Criar índices de performance
- [ ] Criar RLS policies (Row Level Security)
- [ ] Migrar dados de `timesheet_summary` (se houver)

### **Backend (Edge Functions):**
- [ ] `extract-secullum-pdf` - Parser de PDF
- [ ] `calculate-payroll` - Cálculo de folha
- [ ] `generate-payslip-pdf` - Geração de contracheque

### **Frontend (Gestão App):**
- [ ] Página `/custos/folha`
- [ ] Tab: Importação Secullum
- [ ] Tab: Cadastro de Funcionários
- [ ] Tab: Fechamento Mensal
- [ ] Tab: Histórico
- [ ] Integração com DRE

### **Integrações:**
- [ ] N8N webhook (envio Google Drive)
- [ ] Supabase Storage (armazenamento PDFs)
- [ ] DRE (consumir payroll_entries)

### **Controle (Deprecação):**
- [ ] Adicionar aviso de migração
- [ ] Bloquear novas importações
- [ ] Redirecionar para Gestão
- [ ] Remover código após validação

---

## 📅 Cronograma Sugerido

| Fase | Duração | Status |
|------|---------|--------|
| **Fase 1:** Preparação (tabelas + migração dados) | 1 semana | ⏳ Pendente |
| **Fase 2:** Implementação Gestão (UI + lógica) | 2 semanas | ⏳ Pendente |
| **Fase 3:** Integração DRE | 1 semana | ⏳ Pendente |
| **Fase 4:** Deprecação Controle | 1 semana (+ 3 meses validação) | ⏳ Pendente |

**Total:** ~5 semanas de desenvolvimento + 3 meses de validação paralela

---

## 🔗 Documentação Relacionada

- [SISTEMA_FINANCEIRO_COMPLETO.md](./SISTEMA_FINANCEIRO_COMPLETO.md) - Visão geral do sistema financeiro
- [CLASSIFICACAO_AUTOMATICA.md](./CLASSIFICACAO_AUTOMATICA.md) - Classificação AI de receitas/custos
- [FUNCIONALIDADES_REAIS.md](../controle/FUNCIONALIDADES_REAIS.md) - Estado atual do módulo RH no Controle
- [ANALISE_CONTROLE_VS_GESTAO.md](./ANALISE_CONTROLE_VS_GESTAO.md) - Separação de responsabilidades

---

**Última Atualização:** 2026-03-16
**Status:** 📋 Planejamento
**Prioridade:** Alta (após CMV e Custos Fixos)
