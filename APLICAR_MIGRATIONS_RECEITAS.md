# 🚀 APLICAR MIGRATIONS - RECEITAS E PAGAMENTOS

**Data:** 2026-03-20
**Tempo estimado:** 5-10 minutos
**Status:** ⏳ Aguardando execução

---

## 📋 MIGRATIONS A APLICAR

| # | Arquivo | Linhas | O que faz |
|---|---------|--------|-----------|
| 1 | `20260320_receitas_vendas.sql` | 267 | Cria tabelas de receitas, vendas e notas fiscais |
| 2 | `20260320_extrato_bancario.sql` | 277 | Cria tabelas de contas, extratos e pagamentos |
| 3 | `20260320_seed_receitas.sql` | 140 | Insere 29 registros de teste |

**Total:** 684 linhas de SQL

---

## ✅ MÉTODO 1 - DASHBOARD SUPABASE (RECOMENDADO)

### **Passo 1: Acessar SQL Editor**

1. Abrir: https://energetictriggerfish-supabase.cloudfy.live
2. Login (se necessário)
3. Menu lateral → **SQL Editor**
4. Clicar em **"New Query"**

---

### **Passo 2: Executar Migration 1**

**Arquivo:** `supabase_nfe/migrations/20260320_receitas_vendas.sql`

1. Abrir o arquivo no VS Code
2. Copiar **TODO** o conteúdo (267 linhas)
3. Colar no SQL Editor
4. Clicar em **"Run"** (ou `Ctrl+Enter`)
5. Aguardar mensagem de sucesso:
   ```
   ✅ Migration receitas_vendas concluída com sucesso!
   📊 Tabelas criadas: revenue_categories, invoices, sales
   ```

---

### **Passo 3: Executar Migration 2**

**Arquivo:** `supabase_nfe/migrations/20260320_extrato_bancario.sql`

1. **New Query** (novamente)
2. Copiar o conteúdo (277 linhas)
3. Colar e **Run**
4. Aguardar:
   ```
   ✅ Migration extrato_bancario concluída com sucesso!
   📊 Tabelas criadas: bank_accounts, bank_statements, payments
   ```

---

### **Passo 4: Executar Migration 3 (Seed Data)**

**Arquivo:** `supabase_nfe/migrations/20260320_seed_receitas.sql`

1. **New Query**
2. Copiar seed data (140 linhas)
3. Colar e **Run**
4. Aguardar:
   ```
   ✅ Seed data concluído com sucesso!
   📊 Categorias de receita: 5
   🏦 Contas bancárias: 3
   💰 Vendas: 8
   📋 Extratos bancários: 8
   💸 Pagamentos: 5
   ```

---

## ✅ VALIDAÇÃO

Após executar as 3 migrations, validar no SQL Editor:

```sql
-- Contar registros
SELECT 'revenue_categories' as tabela, COUNT(*) as total FROM revenue_categories
UNION ALL
SELECT 'bank_accounts', COUNT(*) FROM bank_accounts
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'bank_statements', COUNT(*) FROM bank_statements
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;
```

**Resultado esperado:**

| tabela | total |
|--------|-------|
| revenue_categories | 5 |
| bank_accounts | 3 |
| sales | 8 |
| bank_statements | 8 |
| payments | 5 |

---

## ✅ TESTAR VIEWS

```sql
-- 1. Resumo diário de vendas
SELECT * FROM daily_sales_summary
ORDER BY sale_date DESC
LIMIT 3;

-- 2. Receita por categoria
SELECT * FROM revenue_by_category;

-- 3. Saldo bancário
SELECT * FROM bank_balance;

-- 4. Resumo de pagamentos
SELECT * FROM payments_summary
ORDER BY payment_date DESC
LIMIT 5;

-- 5. Status de conciliação
SELECT * FROM reconciliation_status;
```

---

## 🔧 MÉTODO 2 - CLI (ALTERNATIVO)

Se você tem o Supabase CLI configurado e logado:

```bash
cd c:/Users/khali/.antigravity/gestao/supabase_nfe
npx supabase db push --linked
```

⚠️ **ATENÇÃO:** Esse método pode dar timeout em conexões lentas.

---

## 🎯 APÓS APLICAR

Quando concluir:

1. ✅ Executar query de validação
2. ✅ Testar as 5 views
3. ✅ Confirmar 29 registros inseridos
4. 🚀 Prosseguir para **JANELA 2** (Edge Functions de Receitas)

---

## 📦 ARQUIVOS RELACIONADOS

```
gestao/
├── supabase_nfe/migrations/
│   ├── 20260320_receitas_vendas.sql ← EXECUTAR 1º
│   ├── 20260320_extrato_bancario.sql ← EXECUTAR 2º
│   └── 20260320_seed_receitas.sql ← EXECUTAR 3º
├── JANELA_1_RECEITAS_COMPLETA.md (documentação completa)
└── apply-migration-receitas.js (helper script)
```

---

## ⏱️ CHECKLIST

- [ ] Acessar Dashboard Supabase
- [ ] Executar `20260320_receitas_vendas.sql`
- [ ] Executar `20260320_extrato_bancario.sql`
- [ ] Executar `20260320_seed_receitas.sql`
- [ ] Validar 29 registros inseridos
- [ ] Testar as 5 views
- [ ] ✅ JANELA 1 completa!

---

**Status Atual:** ⏳ **AGUARDANDO EXECUÇÃO MANUAL VIA DASHBOARD**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
