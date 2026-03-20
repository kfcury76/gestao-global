# ⚡ DEPLOY IMEDIATO - 3 COMANDOS

**Situação:** ✅ JANELA 1 completa (database pronto)
**Ação:** Deploy das 3 Edge Functions RH

---

## 🚀 EXECUTE ESTES 3 COMANDOS

Abra um terminal e execute:

```bash
cd c:/Users/khali/.antigravity/gestao/supabase_nfe

# Function 1
npx supabase functions deploy extract-secullum-pdf --project-ref energetictriggerfish

# Function 2
npx supabase functions deploy calculate-payroll --project-ref energetictriggerfish

# Function 3
npx supabase functions deploy generate-payslip-pdf --project-ref energetictriggerfish
```

**Tempo:** ~5 minutos total

---

## ❓ SE PEDIR LOGIN

Na primeira vez que executar, vai pedir:

```bash
npx supabase login
```

- Um navegador vai abrir
- Faça login com sua conta Supabase
- Autorize o CLI
- Volte para o terminal e execute os 3 comandos acima

---

## ✅ RESULTADO ESPERADO

Para cada function, vai aparecer:

```
Deploying Function (project-ref: energetictriggerfish)...
✓ Function [NOME] deployed successfully!
  URL: https://energetictriggerfish-supabase.cloudfy.live/functions/v1/[NOME]
```

---

## 📋 CHECKLIST

- [ ] Executei `npx supabase functions deploy extract-secullum-pdf --project-ref energetictriggerfish`
- [ ] Executei `npx supabase functions deploy calculate-payroll --project-ref energetictriggerfish`
- [ ] Executei `npx supabase functions deploy generate-payslip-pdf --project-ref energetictriggerfish`
- [ ] Vi 3 mensagens de sucesso

---

## 🆘 SE DER ERRO

### **Erro: "Forbidden resource"**
```bash
# Fazer login
npx supabase login
```

### **Erro: "Docker is not running"**
```
# Ignore este warning - não afeta o deploy
```

### **Timeout / Muito lento**
```bash
# Normal na primeira vez (pode levar 1-2 min por function)
# Apenas aguarde
```

---

## 🎉 APÓS COMPLETAR

**Me avise!** Vou então:
1. Testar `calculate-payroll`
2. Validar que está tudo funcionando
3. Criar relatório final

---

**Tempo:** 5 minutos
**Simples:** 3 comandos
**Pronto!** ⚡

🤖 Generated with [Claude Code](https://claude.com/claude-code)
