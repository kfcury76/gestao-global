# ⚡ DEPLOY VIA CLI - COMANDO RÁPIDO

**Tempo:** 5-10 minutos
**Método:** Linha de comando (mais rápido que Dashboard)

---

## 🚀 EXECUTE ESTES COMANDOS

Abra um terminal (PowerShell ou Git Bash) e execute:

### **1. Login no Supabase** (apenas 1 vez)

```bash
cd c:/Users/khali/.antigravity/gestao/supabase_nfe
npx supabase login
```

**O que vai acontecer:**
- Um navegador vai abrir
- Faça login com sua conta Supabase
- Autorize o CLI
- Volte para o terminal

✅ Login completo!

---

### **2. Link ao Projeto** (apenas 1 vez)

```bash
npx supabase link --project-ref energetictriggerfish
```

**Vai pedir:**
- Database password (senha do banco)

Se não souber a senha, pode pular este step e usar `--project-ref` em cada deploy.

---

### **3. Deploy das 3 Edge Functions**

```bash
# Function 1: extract-secullum-pdf
npx supabase functions deploy extract-secullum-pdf --project-ref energetictriggerfish

# Function 2: calculate-payroll
npx supabase functions deploy calculate-payroll --project-ref energetictriggerfish

# Function 3: generate-payslip-pdf
npx supabase functions deploy generate-payslip-pdf --project-ref energetictriggerfish
```

**Cada deploy leva ~30-60 segundos**

---

### **4. Listar Functions Deployadas**

```bash
npx supabase functions list --project-ref energetictriggerfish
```

Deve mostrar as 3 functions com status "ACTIVE".

---

## ✅ RESULTADO ESPERADO

```
Deploying Function (project-ref: energetictriggerfish)...
✓ Function extract-secullum-pdf deployed successfully!
  URL: https://energetictriggerfish-supabase.cloudfy.live/functions/v1/extract-secullum-pdf

Deploying Function (project-ref: energetictriggerfish)...
✓ Function calculate-payroll deployed successfully!
  URL: https://energetictriggerfish-supabase.cloudfy.live/functions/v1/calculate-payroll

Deploying Function (project-ref: energetictriggerfish)...
✓ Function generate-payslip-pdf deployed successfully!
  URL: https://energetictriggerfish-supabase.cloudfy.live/functions/v1/generate-payslip-pdf
```

---

## 🧪 TESTE RÁPIDO

Depois de deployar, teste a function `calculate-payroll`:

```bash
# Obter ID de funcionário
npx supabase db execute "SELECT id FROM employees LIMIT 1;" --project-ref energetictriggerfish

# Copie o UUID retornado e use no curl abaixo
```

**Teste via curl:**

```bash
# Substitua YOUR_ANON_KEY e EMPLOYEE_UUID
curl -X POST "https://energetictriggerfish-supabase.cloudfy.live/functions/v1/calculate-payroll" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMPLOYEE_UUID",
    "reference_month": "2026-03-01",
    "absences": 1,
    "late_minutes": 30,
    "overtime_65_hours": 5,
    "overtime_100_hours": 2,
    "night_hours": 8
  }'
```

**Para obter o ANON_KEY:**
- Acessar: https://energetictriggerfish-supabase.cloudfy.live
- Settings → API
- Copiar "anon public"

---

## ⚠️ TROUBLESHOOTING

### **Erro: "command not found: npx"**
```bash
# Instalar Node.js/npm primeiro
# https://nodejs.org/
```

### **Erro: "Forbidden resource"**
```bash
# Fazer login novamente
npx supabase login
```

### **Erro: "Docker is not running"**
```bash
# Ignore este warning - não afeta o deploy
# Docker só é necessário para desenvolvimento local
```

### **Erro: "Function already exists"**
```bash
# A function já foi deployada antes
# Use --project-ref para sobrescrever:
npx supabase functions deploy FUNCTION_NAME --project-ref energetictriggerfish
```

---

## 📋 CHECKLIST

- [ ] Executei `npx supabase login`
- [ ] Navegador abriu e fiz login
- [ ] Deployei `extract-secullum-pdf`
- [ ] Deployei `calculate-payroll`
- [ ] Deployei `generate-payslip-pdf`
- [ ] Verifiquei: `npx supabase functions list`
- [ ] Vi 3 functions com status ACTIVE

---

## 🎉 APÓS CONCLUIR

**Me avise!** Vou então:
- Validar que tudo está OK
- Criar relatório final
- Preparar próximos passos (JANELA 3 - Frontend)

---

**Tempo Total:** 5-10 minutos
**Mais rápido que Dashboard!** ⚡

🤖 Generated with [Claude Code](https://claude.com/claude-code)
