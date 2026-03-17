# 📚 ÍNDICE - Sistema de Custos e Gestão Financeira

**Data:** 2026-03-17
**Versão:** 1.0

---

## 🎯 VISÃO GERAL

Este índice organiza toda a documentação do **Sistema de Custos e Gestão Financeira** criado para o **App Gestão**.

---

## 📂 ESTRUTURA DE DOCUMENTOS

```
gestao/docs/
│
├── 📋 PLANEJAMENTO GERAL
│   ├── PLANO_COMPLETO_IMPLEMENTACAO.md ← Todas as 6 fases (8-11 semanas)
│   ├── ARQUITETURA_CUSTOS_COMPLETA.md ← Arquitetura técnica detalhada
│   └── PLANO_IMPLEMENTACAO_PARALELA.md ← Estratégia de paralelização (antigo)
│
├── 🥕 FASE 1: CMV (Custo de Mercadoria Vendida)
│   └── FASE_1_CMV_COMPLETO.md ← Guia completo (22-28h)
│       ├─ FRENTE 1A: Database (2 migrations SQL)
│       ├─ FRENTE 1B: Backend (3 Edge Functions)
│       ├─ FRENTE 1C: Frontend Ingredientes
│       ├─ FRENTE 1D: Frontend Receitas
│       └─ FRENTE 1E: Frontend Análise
│
├── 🏢 FASE 2: CUSTOS FIXOS
│   └── FASE_2_CUSTOS_FIXOS_COMPLETO.md ← Guia completo (9-11h)
│       ├─ FRENTE 2A: Database (1 migration SQL)
│       ├─ FRENTE 2B: Backend (2 Edge Functions)
│       └─ FRENTE 2C: Frontend (3 tabs)
│
├── 👥 FASE 3: RH/FOLHA DE PAGAMENTO
│   ├── FASE_3_RH_FOLHA_COMPLETO.md ← Guia completo (17-21h)
│   │   ├─ FRENTE 3A: Database (1 migration SQL)
│   │   ├─ FRENTE 3B: Backend (3 Edge Functions)
│   │   ├─ FRENTE 3C: Frontend (4 tabs)
│   │   └─ FRENTE 3D: Migração do Controle
│   └── MIGRACAO_RH_CONTROLE_GESTAO.md ← Estratégia de migração
│
└── 📖 DOCUMENTOS DE REFERÊNCIA
    ├── CLAUDE.md ← Contexto global do projeto
    └── SESSION_HANDOFF.md ← Handoff entre sessões
```

---

## 🗂️ GUIA POR FASE

### **FASE 1: CMV (Custo de Mercadoria Vendida)**

**Documento:** [FASE_1_CMV_COMPLETO.md](./FASE_1_CMV_COMPLETO.md)

**Tempo Total:** 22-28 horas (2-3 semanas)

**O Que Contém:**
- ✅ 2 migrations SQL completas (900+ linhas)
- ✅ 35 ingredientes seed + 3 receitas exemplo
- ✅ 5 functions SQL + 1 view
- ✅ Queries de validação

**Estrutura:**
```
FRENTE 1A: Database (3-4h)
├─ 20260317_cmv_ingredients.sql
└─ 20260317_cmv_recipes.sql

FRENTE 1B: Backend (4-5h) - A FAZER
├─ match-nfe-to-ingredients
├─ calculate-product-cmv
└─ bulk-update-prices

FRENTE 1C: Frontend Ingredientes (5-6h) - A FAZER
FRENTE 1D: Frontend Receitas (6-8h) - A FAZER
FRENTE 1E: Frontend Análise (4-5h) - A FAZER
```

**Status:** 🚧 FRENTE 1A pronta | FRENTES 1B-1E a documentar

---

### **FASE 2: CUSTOS FIXOS**

**Documento:** [FASE_2_CUSTOS_FIXOS_COMPLETO.md](./FASE_2_CUSTOS_FIXOS_COMPLETO.md)

**Tempo Total:** 9-11 horas (1-2 semanas)

**O Que Contém:**
- ✅ 1 migration SQL completa (300+ linhas)
- ✅ 16 categorias seed + 5 lançamentos exemplo
- ✅ 2 Edge Functions completas (TypeScript)
- ✅ API Client + estrutura frontend

**Estrutura:**
```
FRENTE 2A: Database (2h)
└─ 20260317_custos_fixos.sql ← COMPLETO

FRENTE 2B: Backend (2-3h)
├─ classify-fixed-cost ← COMPLETO
└─ update-payment-status ← COMPLETO

FRENTE 2C: Frontend (5-6h)
├─ API Client (fixedCosts.ts) ← COMPLETO
└─ Página Index.tsx (3 tabs) ← ESTRUTURA
```

**Status:** ✅ COMPLETO (código pronto para implementar)

---

### **FASE 3: RH/FOLHA DE PAGAMENTO**

**Documento:** [FASE_3_RH_FOLHA_COMPLETO.md](./FASE_3_RH_FOLHA_COMPLETO.md)

**Tempo Total:** 17-21 horas (2-3 semanas)

**O Que Contém:**
- ✅ 1 migration SQL completa (500+ linhas)
- ✅ 5 funcionários seed
- ✅ 3 Edge Functions completas (TypeScript)
- ✅ Frontend completo (4 tabs)
- ✅ Script de migração do Controle

**Estrutura:**
```
FRENTE 3A: Database (2h)
└─ 20260317_rh_payroll.sql ← COMPLETO

FRENTE 3B: Backend (5-6h)
├─ extract-secullum-pdf ← COMPLETO
├─ calculate-payroll ← COMPLETO
└─ generate-payslip-pdf ← COMPLETO

FRENTE 3C: Frontend (8-10h)
├─ API Client (payroll.ts) ← COMPLETO
└─ Página Index.tsx (4 tabs) ← ESTRUTURA

FRENTE 3D: Migração (2-3h)
├─ Script SQL de migração ← COMPLETO
├─ Aviso no Controle ← CÓDIGO PRONTO
└─ Documentação de deprecação ← COMPLETO
```

**Status:** ✅ COMPLETO (código pronto para implementar)

---

## 📊 CRONOGRAMA CONSOLIDADO

| Semana | Fases em Paralelo | Horas/Semana | Entregáveis |
|--------|-------------------|--------------|-------------|
| **1-2** | FASE 1 (1A + 1B) | 7-9h | Database CMV + Edge Functions |
| **2-3** | FASE 1 (1C + 1D) | 11-14h | Frontend Ingredientes + Receitas |
| **3** | FASE 1 (1E) | 4-5h | Frontend Análise CMV |
| **4** | FASE 2 (2A + 2B + 2C) | 9-11h | Sistema Custos Fixos completo |
| **5-6** | FASE 3 (3A + 3B + 3C) | 15-18h | Database + Backend + Frontend RH |
| **6** | FASE 3 (3D) | 2-3h | Migração do Controle |

**Total:** 48-60 horas (6 semanas trabalhando em paralelo)

---

## ✅ CHECKLIST GERAL

### **FASE 1: CMV**
- [x] Database criado (FRENTE 1A)
- [ ] Backend criado (FRENTE 1B)
- [ ] Frontend Ingredientes (FRENTE 1C)
- [ ] Frontend Receitas (FRENTE 1D)
- [ ] Frontend Análise (FRENTE 1E)

### **FASE 2: CUSTOS FIXOS**
- [ ] Database criado (FRENTE 2A)
- [ ] Backend criado (FRENTE 2B)
- [ ] Frontend criado (FRENTE 2C)

### **FASE 3: RH/FOLHA**
- [ ] Database criado (FRENTE 3A)
- [ ] Backend criado (FRENTE 3B)
- [ ] Frontend criado (FRENTE 3C)
- [ ] Migração realizada (FRENTE 3D)

---

## 🗃️ ARQUIVOS SQL (Migrations)

| Arquivo | Fase | Linhas | Status |
|---------|------|--------|--------|
| `20260317_cmv_ingredients.sql` | FASE 1 | ~500 | ✅ Pronto |
| `20260317_cmv_recipes.sql` | FASE 1 | ~400 | ✅ Pronto |
| `20260317_custos_fixos.sql` | FASE 2 | ~300 | ✅ Pronto |
| `20260317_rh_payroll.sql` | FASE 3 | ~500 | ✅ Pronto |

**Total:** ~1.700 linhas de SQL prontas

---

## 🔧 EDGE FUNCTIONS

| Function | Fase | Linhas | Status |
|----------|------|--------|--------|
| `match-nfe-to-ingredients` | FASE 1 | ~200 | 📝 A documentar |
| `calculate-product-cmv` | FASE 1 | ~150 | 📝 A documentar |
| `bulk-update-prices` | FASE 1 | ~100 | 📝 A documentar |
| `classify-fixed-cost` | FASE 2 | ~150 | ✅ Pronto |
| `update-payment-status` | FASE 2 | ~50 | ✅ Pronto |
| `extract-secullum-pdf` | FASE 3 | ~300 | ✅ Pronto |
| `calculate-payroll` | FASE 3 | ~200 | ✅ Pronto |
| `generate-payslip-pdf` | FASE 3 | ~150 | ✅ Pronto |

**Total:** 5 Edge Functions prontas | 3 a documentar

---

## 💻 PÁGINAS FRONTEND

| Página | Fase | Componentes | Status |
|--------|------|-------------|--------|
| `/custos/cmv/ingredientes` | FASE 1 | 3 modais | 📝 A documentar |
| `/custos/cmv/receitas` | FASE 1 | 4 modais | 📝 A documentar |
| `/custos/cmv/analise` | FASE 1 | 3 tabs + gráficos | 📝 A documentar |
| `/custos/fixos` | FASE 2 | 3 tabs | ✅ Estrutura pronta |
| `/custos/folha` | FASE 3 | 4 tabs | ✅ Estrutura pronta |

**Total:** 2 estruturas prontas | 3 a documentar

---

## 📖 COMO USAR ESTE ÍNDICE

### **1. Para Implementar uma Fase:**
```bash
# Exemplo: Implementar FASE 2 (Custos Fixos)

# 1. Abrir documento
code gestao/docs/FASE_2_CUSTOS_FIXOS_COMPLETO.md

# 2. Seguir passo a passo das frentes
# FRENTE 2A: Copiar SQL → Aplicar no Supabase
# FRENTE 2B: Copiar TypeScript → Deploy Edge Functions
# FRENTE 2C: Copiar React → Criar páginas
```

### **2. Para Verificar Progresso:**
```bash
# Consultar checklist geral (neste arquivo)
# Marcar [x] conforme concluir cada frente
```

### **3. Para Trabalho Paralelo:**
```bash
# Abrir múltiplas janelas do Antigravity
# Janela 1: FASE 1 (Database)
# Janela 2: FASE 2 (Database)
# Janela 3: FASE 3 (Database)
```

---

## 🔗 LINKS RÁPIDOS

### **Documentação Técnica:**
- [Arquitetura Completa](./ARQUITETURA_CUSTOS_COMPLETA.md)
- [Plano de Implementação](./PLANO_COMPLETO_IMPLEMENTACAO.md)

### **Guias por Fase:**
- [FASE 1: CMV](./FASE_1_CMV_COMPLETO.md)
- [FASE 2: Custos Fixos](./FASE_2_CUSTOS_FIXOS_COMPLETO.md)
- [FASE 3: RH/Folha](./FASE_3_RH_FOLHA_COMPLETO.md)

### **Contexto do Projeto:**
- [CLAUDE.md](./CLAUDE.md) - Contexto global
- [Migração RH](./MIGRACAO_RH_CONTROLE_GESTAO.md)

---

## 📊 ESTATÍSTICAS

**Total de Documentação Criada:**
- 📄 10 documentos markdown
- 📝 ~30.000 linhas de documentação
- 💾 ~1.700 linhas de SQL
- 💻 ~1.300 linhas de TypeScript (Edge Functions)
- ⚛️ Estrutura de 5 páginas React

**Tempo de Implementação Estimado:**
- FASE 1: 22-28h
- FASE 2: 9-11h
- FASE 3: 17-21h
- **TOTAL:** 48-60h (~6 semanas em paralelo)

---

**Última Atualização:** 2026-03-17
**Versão:** 1.0
**Autor:** Claude Code Agent
