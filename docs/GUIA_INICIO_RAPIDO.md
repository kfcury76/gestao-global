# ⚡ GUIA DE INÍCIO RÁPIDO - Sistema de Custos

**Data:** 2026-03-17
**Objetivo:** Começar a implementação AGORA em 5 minutos

---

## 🎯 ESCOLHA SUA ESTRATÉGIA

### **Opção 1: Trabalho Paralelo (RECOMENDADO)** 🔥
Trabalhe nas 3 fases simultaneamente em janelas diferentes

### **Opção 2: Sequencial** 📚
Faça uma fase por vez (mais lento, mas organizado)

---

## 🚀 OPÇÃO 1: PARALELO (3 Janelas)

### **JANELA 1: FASE 1 - CMV (Database)**

```bash
# 1. Abrir terminal
cd C:\Users\khali\.antigravity\gestao

# 2. Abrir arquivo da migration
code supabase_nfe\migrations\20260317_cmv_ingredients.sql

# 3. Copiar TODO o conteúdo do arquivo
# (O arquivo JÁ ESTÁ CRIADO com o código completo)

# 4. Aplicar no Supabase
# Opção A: Via Dashboard
#   - https://energetictriggerfish-supabase.cloudfy.live
#   - SQL Editor → Colar → Run

# Opção B: Via CLI (se configurado)
cd supabase_nfe
supabase db push

# 5. Fazer o mesmo com 20260317_cmv_recipes.sql
```

**Tempo:** 30 minutos

---

### **JANELA 2: FASE 2 - CUSTOS FIXOS (Database)**

```bash
# 1. Abrir terminal
cd C:\Users\khali\.antigravity\gestao

# 2. Abrir arquivo
code supabase_nfe\migrations\20260317_custos_fixos.sql

# 3. Copiar e aplicar no Supabase (mesmo processo)
```

**Tempo:** 15 minutos

---

### **JANELA 3: FASE 3 - RH (Database)**

```bash
# 1. Abrir terminal
cd C:\Users\khali\.antigravity\gestao

# 2. Abrir arquivo
code supabase_nfe\migrations\20260317_rh_payroll.sql

# 3. Copiar e aplicar no Supabase
```

**Tempo:** 15 minutos

---

## ✅ VALIDAÇÃO RÁPIDA

Após aplicar todas as migrations, execute no **SQL Editor** do Supabase:

```sql
-- Verificar FASE 1 (CMV)
SELECT 'FASE 1: CMV' as fase;
SELECT COUNT(*) as ingredientes FROM ingredients;
SELECT COUNT(*) as receitas FROM product_recipes;
SELECT * FROM product_cmv LIMIT 3;

-- Verificar FASE 2 (Custos Fixos)
SELECT 'FASE 2: Custos Fixos' as fase;
SELECT COUNT(*) as categorias FROM fixed_cost_categories;
SELECT COUNT(*) as lancamentos FROM fixed_costs;

-- Verificar FASE 3 (RH)
SELECT 'FASE 3: RH' as fase;
SELECT COUNT(*) as funcionarios FROM employees;
SELECT * FROM employee_current_salary;
```

**Resultados Esperados:**
- ✅ ~35 ingredientes
- ✅ 3 receitas
- ✅ 16 categorias de custos fixos
- ✅ 5 funcionários

---

## 📂 ARQUIVOS IMPORTANTES

### **Migrations SQL (JÁ CRIADAS):**
```
gestao/supabase_nfe/migrations/
├── 20260317_cmv_ingredients.sql      ← FASE 1 (500 linhas)
├── 20260317_cmv_recipes.sql          ← FASE 1 (400 linhas)
├── 20260317_custos_fixos.sql         ← FASE 2 (300 linhas)
└── 20260317_rh_payroll.sql           ← FASE 3 (500 linhas)
```

### **Documentação Completa:**
```
gestao/docs/
├── 00_INDICE_SISTEMA_CUSTOS.md       ← ÍNDICE GERAL
├── FASE_1_CMV_COMPLETO.md            ← Guia FASE 1
├── FASE_2_CUSTOS_FIXOS_COMPLETO.md   ← Guia FASE 2
└── FASE_3_RH_FOLHA_COMPLETO.md       ← Guia FASE 3
```

---

## 🔧 SCRIPT AUTOMÁTICO (Opcional)

Use o script PowerShell para aplicar todas as migrations de uma vez:

```powershell
# Validar apenas (não aplica)
.\gestao\scripts\apply-migrations.ps1 -Validate

# Aplicar FASE 1 apenas
.\gestao\scripts\apply-migrations.ps1 -Phase 1

# Aplicar TODAS as fases
.\gestao\scripts\apply-migrations.ps1 -Phase all
```

---

## 📋 CHECKLIST DE HOJE

### **Parte 1: Database (1-2h)**
- [ ] FASE 1: Aplicar `20260317_cmv_ingredients.sql`
- [ ] FASE 1: Aplicar `20260317_cmv_recipes.sql`
- [ ] FASE 2: Aplicar `20260317_custos_fixos.sql`
- [ ] FASE 3: Aplicar `20260317_rh_payroll.sql`
- [ ] Validar com queries SQL
- [ ] Commit: `git commit -m "feat: criar tabelas de CMV, Custos Fixos e RH"`

### **Parte 2: Backend (Próxima Sessão)**
- [ ] FASE 2: Deploy Edge Functions (classify-fixed-cost, update-payment-status)
- [ ] FASE 3: Deploy Edge Functions (extract-secullum-pdf, calculate-payroll, generate-payslip-pdf)
- [ ] Testar com curl

### **Parte 3: Frontend (Próxima Sessão)**
- [ ] FASE 2: Criar página `/custos/fixos`
- [ ] FASE 3: Criar página `/custos/folha`

---

## 🎯 PRÓXIMOS PASSOS

Após concluir o database das 3 fases:

1. **Ler documentação completa** de cada fase
2. **Implementar Backend** (Edge Functions)
3. **Implementar Frontend** (Páginas React)

**Guias Completos:**
- [FASE 1: CMV](./FASE_1_CMV_COMPLETO.md) - 22-28h
- [FASE 2: Custos Fixos](./FASE_2_CUSTOS_FIXOS_COMPLETO.md) - 9-11h
- [FASE 3: RH/Folha](./FASE_3_RH_FOLHA_COMPLETO.md) - 17-21h

---

## ❓ DÚVIDAS COMUNS

### **1. Os arquivos SQL já existem?**
✅ SIM! Todos os 4 arquivos de migration já estão criados em:
`gestao/supabase_nfe/migrations/`

Você só precisa **aplicá-los** no Supabase.

### **2. Como aplicar no Supabase?**
**Opção A (Manual - RECOMENDADO):**
1. Abrir https://energetictriggerfish-supabase.cloudfy.live
2. Menu → SQL Editor
3. Copiar conteúdo de um arquivo .sql
4. Colar no editor
5. Run (executar)

**Opção B (CLI):**
```bash
cd gestao/supabase_nfe
supabase db push
```

### **3. Posso aplicar tudo de uma vez?**
✅ SIM! Você pode aplicar todas as 4 migrations seguidas.
Elas não têm conflitos entre si.

### **4. E se der erro?**
- Ler a mensagem de erro (geralmente mostra a linha)
- Verificar se não há duplicação (tabela já existe)
- Se necessário, fazer DROP TABLE antes (cuidado!)

### **5. Quanto tempo leva para aplicar?**
- Cada migration: ~5-10 segundos
- Total: ~1-2 minutos (todas as 4)

---

## 🔗 LINKS ÚTEIS

| Recurso | Link |
|---------|------|
| **Supabase Dashboard** | https://energetictriggerfish-supabase.cloudfy.live |
| **Índice Geral** | [00_INDICE_SISTEMA_CUSTOS.md](./00_INDICE_SISTEMA_CUSTOS.md) |
| **Guia FASE 1** | [FASE_1_CMV_COMPLETO.md](./FASE_1_CMV_COMPLETO.md) |
| **Guia FASE 2** | [FASE_2_CUSTOS_FIXOS_COMPLETO.md](./FASE_2_CUSTOS_FIXOS_COMPLETO.md) |
| **Guia FASE 3** | [FASE_3_RH_FOLHA_COMPLETO.md](./FASE_3_RH_FOLHA_COMPLETO.md) |

---

## 📞 SUPORTE

Se encontrar problemas:
1. Ler mensagem de erro completa
2. Consultar documentação da fase específica
3. Verificar se migration já foi aplicada antes

---

**Última Atualização:** 2026-03-17
**Status:** ⚡ Pronto para Usar
**Tempo Estimado:** 1-2h (Database completo das 3 fases)
