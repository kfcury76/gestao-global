# 💰 Sistema de Custos e Gestão Financeira

**App Gestão - Empório Cosi**

Sistema completo de controle de custos, CMV, folha de pagamento e análise financeira.

---

## 📋 ÍNDICE

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Fases do Sistema](#fases-do-sistema)
- [Scripts Úteis](#scripts-úteis)
- [Documentação](#documentação)
- [FAQ](#faq)

---

## 🎯 VISÃO GERAL

O **Sistema de Custos e Gestão Financeira** é composto por 6 fases principais:

```
📊 SISTEMA COMPLETO
│
├── ✅ FASE 1: CMV (Custo de Mercadoria Vendida)
├── ✅ FASE 2: Custos Fixos
├── ✅ FASE 3: RH/Folha de Pagamento
├── 🚧 FASE 4: Receitas (APPLOAD - Classificação AI)
├── 🚧 FASE 5: DRE (Demonstração de Resultado)
└── 🚧 FASE 6: Análises e Precificação
```

**Status Atual:** Fases 1, 2 e 3 com código completo e prontas para implementação.

---

## 🛠️ TECNOLOGIAS

### **Frontend:**
- React 18/19
- TypeScript 5
- Vite 5/7
- Tailwind CSS 4
- shadcn/ui
- Zustand (state management)
- Recharts (gráficos)

### **Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Edge Functions (Deno/TypeScript)
- OpenAI GPT-4o (classificação AI)
- Google Gemini (alternativa)

### **Automação:**
- n8n (workflows)
- Google Drive (armazenamento)

---

## 📁 ESTRUTURA DO PROJETO

```
gestao/
│
├── docs/                           # 📚 Documentação completa
│   ├── 00_INDICE_SISTEMA_CUSTOS.md  # Índice geral
│   ├── GUIA_INICIO_RAPIDO.md        # Como começar
│   ├── FASE_1_CMV_COMPLETO.md       # Guia FASE 1
│   ├── FASE_2_CUSTOS_FIXOS_COMPLETO.md
│   ├── FASE_3_RH_FOLHA_COMPLETO.md
│   └── ...
│
├── supabase_nfe/
│   ├── migrations/                 # 💾 Migrations SQL
│   │   ├── 20260317_cmv_ingredients.sql
│   │   ├── 20260317_cmv_recipes.sql
│   │   ├── 20260317_custos_fixos.sql
│   │   └── 20260317_rh_payroll.sql
│   │
│   └── functions/                  # ⚡ Edge Functions
│       ├── classify-fixed-cost/
│       ├── update-payment-status/
│       ├── extract-secullum-pdf/
│       ├── calculate-payroll/
│       └── generate-payslip-pdf/
│
├── scripts/                        # 🔧 Scripts de automação
│   ├── apply-migrations.ps1
│   ├── test-edge-functions.ps1
│   └── validacao-completa.sql
│
├── src/
│   ├── pages/
│   │   └── custos/
│   │       ├── cmv/                # FASE 1
│   │       ├── fixos/              # FASE 2
│   │       └── folha/              # FASE 3
│   │
│   └── lib/
│       └── api/
│           ├── cmv.ts
│           ├── fixedCosts.ts
│           └── payroll.ts
│
├── .env.example                    # Variáveis de ambiente
└── README_SISTEMA_CUSTOS.md        # Este arquivo
```

---

## 🚀 INSTALAÇÃO

### **1. Clonar repositório:**
```bash
cd C:\Users\khali\.antigravity\gestao
```

### **2. Instalar dependências:**
```bash
npm install
```

### **3. Configurar variáveis de ambiente:**
```bash
cp .env.example .env
# Editar .env com valores reais
```

### **4. Aplicar migrations no Supabase:**

**Opção A: Via Dashboard (Recomendado)**
```
1. Acessar: https://energetictriggerfish-supabase.cloudfy.live
2. Menu → SQL Editor
3. Copiar conteúdo de cada migration
4. Executar
```

**Opção B: Via Script PowerShell**
```powershell
.\scripts\apply-migrations.ps1 -Phase all
```

**Opção C: Via Supabase CLI**
```bash
cd supabase_nfe
supabase db push
```

### **5. Validar instalação:**
```bash
# Via SQL
psql -h ... -f scripts/validacao-completa.sql

# Ou copiar queries para SQL Editor
```

---

## ⚙️ CONFIGURAÇÃO

### **Variáveis de Ambiente Essenciais:**

```env
# Supabase
VITE_SUPABASE_URL=https://energetictriggerfish-supabase.cloudfy.live
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI (para classificação AI)
OPENAI_API_KEY=sk-your_openai_api_key_here

# n8n (para RH/Google Drive)
N8N_WEBHOOK_PAYSLIP_URL=https://your-n8n-url/webhook/payslip-upload
```

**Ver arquivo completo:** [.env.example](./.env.example)

---

## 📊 FASES DO SISTEMA

### **FASE 1: CMV (Custo de Mercadoria Vendida)**

**Status:** ✅ Database pronto | 🚧 Backend e Frontend a implementar

**O que faz:**
- Cadastro de ingredientes
- Receitas de produtos (BOM - Bill of Materials)
- Histórico de preços de compra
- Cálculo automático de CMV por produto
- Integração com NF-e (atualização de preços)

**Tabelas:**
- `ingredients` (35 ingredientes seed)
- `ingredient_price_history`
- `product_recipes` (3 receitas seed)
- `recipe_items`

**Documentação:** [FASE_1_CMV_COMPLETO.md](./docs/FASE_1_CMV_COMPLETO.md)

---

### **FASE 2: Custos Fixos**

**Status:** ✅ Código completo pronto

**O que faz:**
- Controle de despesas mensais recorrentes
- Categorias de custos (aluguel, energia, etc)
- Status de pagamento (pago, pendente, atrasado)
- Classificação AI de PDFs/boletos
- Alertas de vencimento
- Comparativos mensais

**Tabelas:**
- `fixed_cost_categories` (16 categorias seed)
- `fixed_costs`

**Edge Functions:**
- `classify-fixed-cost` (AI com OpenAI GPT-4o)
- `update-payment-status` (cron diário)

**Documentação:** [FASE_2_CUSTOS_FIXOS_COMPLETO.md](./docs/FASE_2_CUSTOS_FIXOS_COMPLETO.md)

---

### **FASE 3: RH/Folha de Pagamento**

**Status:** ✅ Código completo pronto

**O que faz:**
- Cadastro de funcionários
- Importação de PDF/Excel do Secullum (ponto eletrônico)
- Cálculo automático de folha (HE, INSS, FGTS)
- Geração de contracheques (PDF)
- Envio para Google Drive
- Histórico de pagamentos
- Integração com DRE (custo de pessoal)

**Tabelas:**
- `employees` (5 funcionários seed)
- `payroll_entries`

**Edge Functions:**
- `extract-secullum-pdf` (parser de PDF)
- `calculate-payroll` (cálculo completo)
- `generate-payslip-pdf` (geração de PDF)

**Migração:**
- Migra módulo RH do app Controle → Gestão

**Documentação:** [FASE_3_RH_FOLHA_COMPLETO.md](./docs/FASE_3_RH_FOLHA_COMPLETO.md)

---

## 🔧 SCRIPTS ÚTEIS

### **Aplicar Migrations:**
```powershell
# Validar sem aplicar
.\scripts\apply-migrations.ps1 -Validate

# Aplicar FASE 1 apenas
.\scripts\apply-migrations.ps1 -Phase 1

# Aplicar todas
.\scripts\apply-migrations.ps1 -Phase all
```

### **Validar Database:**
```bash
# Executar no SQL Editor do Supabase
# Copiar conteúdo de:
scripts/validacao-completa.sql
```

### **Testar Edge Functions:**
```powershell
.\scripts\test-edge-functions.ps1 `
  -AnonKey "your_key" `
  -ServiceRoleKey "your_key"
```

### **Desenvolvimento:**
```bash
# Iniciar app
npm run dev

# Build
npm run build

# Preview
npm run preview
```

---

## 📚 DOCUMENTAÇÃO

| Documento | Descrição |
|-----------|-----------|
| [00_INDICE_SISTEMA_CUSTOS.md](./docs/00_INDICE_SISTEMA_CUSTOS.md) | Índice completo |
| [GUIA_INICIO_RAPIDO.md](./docs/GUIA_INICIO_RAPIDO.md) | Como começar AGORA |
| [FASE_1_CMV_COMPLETO.md](./docs/FASE_1_CMV_COMPLETO.md) | Guia completo FASE 1 |
| [FASE_2_CUSTOS_FIXOS_COMPLETO.md](./docs/FASE_2_CUSTOS_FIXOS_COMPLETO.md) | Guia completo FASE 2 |
| [FASE_3_RH_FOLHA_COMPLETO.md](./docs/FASE_3_RH_FOLHA_COMPLETO.md) | Guia completo FASE 3 |
| [ARQUITETURA_CUSTOS_COMPLETA.md](./docs/ARQUITETURA_CUSTOS_COMPLETA.md) | Arquitetura técnica |
| [PLANO_COMPLETO_IMPLEMENTACAO.md](./docs/PLANO_COMPLETO_IMPLEMENTACAO.md) | Plano de 6 fases |

---

## ❓ FAQ

### **1. Como começar a implementação?**

Leia: [GUIA_INICIO_RAPIDO.md](./docs/GUIA_INICIO_RAPIDO.md)

Resumo:
1. Aplicar migrations (1-2h)
2. Validar com queries
3. Deploy Edge Functions (próxima sessão)
4. Implementar frontend (próxima sessão)

---

### **2. As migrations já estão criadas?**

✅ **SIM!** Todos os 4 arquivos SQL estão prontos em:
- `supabase_nfe/migrations/20260317_cmv_ingredients.sql`
- `supabase_nfe/migrations/20260317_cmv_recipes.sql`
- `supabase_nfe/migrations/20260317_custos_fixos.sql`
- `supabase_nfe/migrations/20260317_rh_payroll.sql`

Você só precisa **aplicá-las** no Supabase.

---

### **3. Posso trabalhar nas 3 fases em paralelo?**

✅ **SIM!** As fases são independentes.

Estratégia recomendada:
- **JANELA 1:** FASE 1 (Database)
- **JANELA 2:** FASE 2 (Database)
- **JANELA 3:** FASE 3 (Database)

---

### **4. Quanto tempo leva para implementar?**

| Fase | Database | Backend | Frontend | Total |
|------|----------|---------|----------|-------|
| **FASE 1** | 3-4h | 4-5h | 15-18h | 22-28h |
| **FASE 2** | 2h | 2-3h | 5-6h | 9-11h |
| **FASE 3** | 2h | 5-6h | 8-10h | 17-21h |

**Total:** 48-60 horas (~6 semanas trabalhando em paralelo)

---

### **5. Preciso de OpenAI API Key?**

Apenas para **classificação AI** (FASE 2 e 4):
- `classify-fixed-cost` (classificar boletos/PDFs)
- `classify-transaction-ai` (classificar receitas - FASE 4)

**Alternativa:** Usar Google Gemini (configurar GEMINI_API_KEY)

---

### **6. Como testar sem implementar frontend?**

Use scripts de teste:
```powershell
.\scripts\test-edge-functions.ps1
```

Ou curl manualmente:
```bash
curl -X POST "https://supabase.../functions/v1/calculate-payroll" \
  -H "Authorization: Bearer KEY" \
  -d '{"employee_id": "..."}'
```

---

### **7. Onde ficam os PDFs de contracheque?**

2 opções:
1. **Supabase Storage** (`documents/payslips/`)
2. **Google Drive** (via n8n webhook)

Configurar em: `.env` → `N8N_WEBHOOK_PAYSLIP_URL`

---

### **8. Como atualizar preços de ingredientes?**

3 formas:
1. **Manual:** Via interface frontend (CRUD)
2. **NF-e:** Automático via `match-nfe-to-ingredients`
3. **Importação:** Upload Excel/CSV

---

### **9. E se der erro na migration?**

Leia a mensagem de erro (mostra linha e problema).

Erros comuns:
- Tabela já existe → DROP TABLE antes (cuidado!)
- Função não existe → Aplicar migration anterior primeiro
- Permissão negada → Usar service_role key

---

### **10. Como contribuir?**

1. Criar branch: `git checkout -b feature/nova-funcionalidade`
2. Commit: `git commit -m "feat: descrição"`
3. Push: `git push origin feature/nova-funcionalidade`
4. Abrir PR

---

## 📞 SUPORTE

**Documentação:** [docs/](./docs/)
**Issues:** Verificar logs de erro e consultar documentação da fase específica

---

## 📄 LICENÇA

Uso interno - Empório Cosi

---

## 👥 CRÉDITOS

**Desenvolvido por:** Khalil Cury
**Assistente AI:** Claude Code Agent (Anthropic)
**Data:** 2026-03-17

---

**Última Atualização:** 2026-03-17
**Versão:** 1.0.0
