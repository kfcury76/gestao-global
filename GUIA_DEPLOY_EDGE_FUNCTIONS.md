# 🚀 GUIA DE DEPLOY - EDGE FUNCTIONS RH

**Data:** 2026-03-19
**Objetivo:** Deploy das 3 Edge Functions de RH no Supabase Cloudfy
**Método:** Manual via Dashboard (sem CLI)

---

## 📋 PRÉ-REQUISITOS

✅ Migration `20260317_rh_payroll.sql` aplicada
✅ Tabelas `employees` e `payroll_entries` criadas
✅ 5 funcionários seed inseridos
✅ 3 arquivos de Edge Functions criados localmente

---

## 🎯 EDGE FUNCTIONS A DEPLOYAR

| # | Nome | Arquivo | Linhas | Status |
|---|------|---------|--------|--------|
| 1 | extract-secullum-pdf | `supabase_nfe/functions/extract-secullum-pdf/index.ts` | 284 | ⏳ Pendente |
| 2 | calculate-payroll | `supabase_nfe/functions/calculate-payroll/index.ts` | 198 | ⏳ Pendente |
| 3 | generate-payslip-pdf | `supabase_nfe/functions/generate-payslip-pdf/index.ts` | 229 | ⏳ Pendente |

---

## 🔧 MÉTODO 1: DEPLOY VIA SUPABASE DASHBOARD (RECOMENDADO)

### **Passo a Passo:**

#### **1. Acessar o Dashboard**

```
URL: https://energetictriggerfish-supabase.cloudfy.live
Menu: Edge Functions
```

---

#### **2. Deploy da Function #1: extract-secullum-pdf**

1. **Clique em "Create Function"**

2. **Preencha os dados:**
   - **Name:** `extract-secullum-pdf`
   - **Verify JWT:** ✅ (deixar marcado)
   - **Import map:** (deixar em branco)

3. **Cole o código:**
   - Abra: `supabase_nfe/functions/extract-secullum-pdf/index.ts`
   - Copie TODO o conteúdo
   - Cole no editor de código

4. **Clique em "Create"**

5. **Aguarde deploy** (~30-60 segundos)

6. **Verifique a URL gerada:**
   ```
   https://energetictriggerfish-supabase.cloudfy.live/functions/v1/extract-secullum-pdf
   ```

**✅ Function 1 deployada!**

---

#### **3. Deploy da Function #2: calculate-payroll**

1. **Clique em "Create Function"**

2. **Preencha os dados:**
   - **Name:** `calculate-payroll`
   - **Verify JWT:** ✅ (deixar marcado)

3. **Cole o código:**
   - Abra: `supabase_nfe/functions/calculate-payroll/index.ts`
   - Copie TODO o conteúdo
   - Cole no editor

4. **Clique em "Create"**

5. **Aguarde deploy**

6. **Verifique a URL:**
   ```
   https://energetictriggerfish-supabase.cloudfy.live/functions/v1/calculate-payroll
   ```

**✅ Function 2 deployada!**

---

#### **4. Deploy da Function #3: generate-payslip-pdf**

1. **Clique em "Create Function"**

2. **Preencha os dados:**
   - **Name:** `generate-payslip-pdf`
   - **Verify JWT:** ✅ (deixar marcado)

3. **Cole o código:**
   - Abra: `supabase_nfe/functions/generate-payslip-pdf/index.ts`
   - Copie TODO o conteúdo
   - Cole no editor

4. **Clique em "Create"**

5. **Aguarde deploy**

6. **Verifique a URL:**
   ```
   https://energetictriggerfish-supabase.cloudfy.live/functions/v1/generate-payslip-pdf
   ```

**✅ Function 3 deployada!**

---

## 🔧 MÉTODO 2: DEPLOY VIA CLI (ALTERNATIVO)

Se você tem Supabase CLI instalado:

```bash
# Navegar até a pasta do projeto
cd c:/Users/khali/.antigravity/gestao/supabase_nfe

# Login (se necessário)
supabase login

# Link ao projeto
supabase link --project-ref energetictriggerfish

# Deploy das 3 functions
supabase functions deploy extract-secullum-pdf
supabase functions deploy calculate-payroll
supabase functions deploy generate-payslip-pdf
```

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

Após deployar as 3 functions, valide no Dashboard:

### **1. Verificar Lista de Functions**

```
Menu: Edge Functions
```

Deve mostrar:
- ✅ extract-secullum-pdf (Status: Active)
- ✅ calculate-payroll (Status: Active)
- ✅ generate-payslip-pdf (Status: Active)

---

### **2. Testar calculate-payroll (Teste Básico)**

**Via Dashboard:**

1. Clique em `calculate-payroll`
2. Vá para aba "Invoke"
3. Cole o JSON de teste:

```json
{
  "employee_id": "UUID_DE_UM_FUNCIONARIO",
  "reference_month": "2026-03-01",
  "absences": 1,
  "late_minutes": 30,
  "overtime_65_hours": 5,
  "overtime_100_hours": 2,
  "night_hours": 8
}
```

4. Clique em "Invoke"

**Resultado Esperado:**

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
    "net_total": 2409.40,
    "status": "pending"
  }
}
```

**✅ Se retornar JSON com cálculos → Sucesso!**

---

### **3. Obter IDs dos Funcionários Seed**

Se não tem os UUIDs, execute no SQL Editor:

```sql
SELECT id, name, position, base_salary
FROM employees
WHERE is_active = true
ORDER BY name;
```

Copie um `id` para usar no teste acima.

---

## 🧪 TESTES COMPLETOS (OPCIONAL)

### **Teste 1: calculate-payroll via curl**

```bash
# Obter ANON_KEY no Dashboard → Settings → API
ANON_KEY="sua_anon_key"

curl -X POST \
  "https://energetictriggerfish-supabase.cloudfy.live/functions/v1/calculate-payroll" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "UUID_AQUI",
    "reference_month": "2026-03-01",
    "absences": 1,
    "late_minutes": 30,
    "overtime_65_hours": 5,
    "overtime_100_hours": 2,
    "night_hours": 8
  }'
```

---

### **Teste 2: Validar Inserção no Banco**

Após testar `calculate-payroll`, verificar no SQL Editor:

```sql
SELECT
  pe.id,
  e.name,
  pe.reference_month,
  pe.base_salary,
  pe.gross_total,
  pe.net_total,
  pe.total_cost,
  pe.status
FROM payroll_entries pe
JOIN employees e ON e.id = pe.employee_id
ORDER BY pe.created_at DESC
LIMIT 1;
```

Deve mostrar o lançamento recém-criado.

---

### **Teste 3: extract-secullum-pdf**

**Requer PDF/Excel real do Secullum.**

Exemplo de payload:

```json
{
  "file_content": "BASE64_DO_PDF",
  "file_type": "pdf",
  "reference_month": "2026-03-01"
}
```

*(Pular este teste por enquanto - testar depois com arquivo real)*

---

### **Teste 4: generate-payslip-pdf**

Após criar um `payroll_entry` via `calculate-payroll`:

```bash
curl -X POST \
  "https://energetictriggerfish-supabase.cloudfy.live/functions/v1/generate-payslip-pdf" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "payroll_entry_id": "UUID_DO_PAYROLL_ENTRY"
  }'
```

**Resultado esperado:**

```json
{
  "success": true,
  "pdf_url": "https://energetictriggerfish-supabase.cloudfy.live/storage/v1/object/public/documents/payslips/2026/contracheque_Joao_Silva_2026-03-01.pdf",
  "file_name": "contracheque_Joao_Silva_2026-03-01.pdf"
}
```

⚠️ **Nota:** Pode dar erro se o bucket `documents` não existir. Criar via Dashboard → Storage.

---

## 📊 CHECKLIST FINAL

Após completar o deploy:

### **Backend RH:**
- [ ] Function `extract-secullum-pdf` deployada
- [ ] Function `calculate-payroll` deployada
- [ ] Function `generate-payslip-pdf` deployada
- [ ] Teste básico de `calculate-payroll` executado
- [ ] Validação de inserção no banco OK

### **Database RH:**
- [ ] Migration aplicada
- [ ] Tabelas criadas (employees, payroll_entries)
- [ ] Views criadas (payroll_summary, employee_current_salary)
- [ ] Functions SQL criadas (calculate_inss, calculate_fgts)
- [ ] 5 funcionários seed inseridos

---

## 🎉 RESULTADO FINAL

Ao completar todos os passos:

✅ **Backend RH 100% completo**
✅ **8/8 Edge Functions deployadas** (5 CMV + 3 RH)
✅ **Database RH pronto para uso**
✅ **Pronto para JANELA 3** (Frontend RH)

---

## 🆘 TROUBLESHOOTING

### **Erro: "Table employees does not exist"**

**Causa:** Migration não foi aplicada.
**Solução:** Aplicar `20260317_rh_payroll.sql` via SQL Editor.

---

### **Erro: "Function already exists"**

**Causa:** Function já foi deployada antes.
**Solução:**
1. Dashboard → Edge Functions
2. Clicar na function existente
3. Editar código
4. Salvar (re-deploy automático)

---

### **Erro 500 na function**

**Solução:**
1. Dashboard → Edge Functions
2. Clicar na function com erro
3. Aba "Logs"
4. Ver mensagem de erro detalhada
5. Corrigir código e re-deploy

---

### **Deploy muito lento**

**Normal.** Deploy via Dashboard pode levar 1-2 minutos por function.
Aguarde a mensagem "Function deployed successfully".

---

## 📞 REFERÊNCIAS

- **Dashboard:** https://energetictriggerfish-supabase.cloudfy.live
- **Código das Functions:** `supabase_nfe/functions/`
- **Migration:** `supabase_nfe/migrations/20260317_rh_payroll.sql`
- **Relatório JANELA 2:** `JANELA_2_BACKEND_CONCLUIDA.md`

---

**Última Atualização:** 2026-03-19
**Status:** 📋 Guia Completo
**Autor:** Claude Code Agent

🤖 Generated with [Claude Code](https://claude.com/claude-code)
