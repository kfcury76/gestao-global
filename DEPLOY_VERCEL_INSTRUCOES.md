# 🚀 INSTRUÇÕES DE DEPLOY NO VERCEL

**Data:** 20/03/2026
**Status:** Build concluído, pronto para deploy

---

## ✅ BUILD COMPLETO

```bash
✓ 2570 modules transformed
✓ Built in 45.29s

dist/index.html                    1.19 kB  │ gzip:   0.49 kB
dist/assets/index-B5rXYbDu.css    73.38 kB  │ gzip:  12.58 kB
dist/assets/index-CAhbgEx8.js  1,068.33 kB  │ gzip: 294.10 kB
```

**Localização:** `C:/Users/khali/.antigravity/gestao/frontend/dist/`

---

## 🔧 OPÇÕES DE DEPLOY

### **OPÇÃO 1: Deploy via Vercel Dashboard (RECOMENDADO)**

#### Passo 1: Criar projeto no Vercel
1. Acesse: https://vercel.com/new
2. Selecione: **Import Git Repository**
3. Repositório: `kfcury76/gestao-global`
4. Clique em **Import**

#### Passo 2: Configurar projeto
```
Project Name: gestao-frontend
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install --legacy-peer-deps
```

#### Passo 3: Variáveis de ambiente
Adicionar na aba **Environment Variables**:
```
VITE_SUPABASE_URL=https://energetictriggerfish-supabase.cloudfy.live
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcxMjQ3MjE5LCJleHAiOjE4MDI3ODMyMTl9.ptnClNNSMAfgXzL5YkmAjY_Y1NYAOhya1u1Uzoxrolw
```

#### Passo 4: Deploy
- Clique em **Deploy**
- Aguardar build (~2 minutos)
- URL temporária: `https://gestao-frontend-xxx.vercel.app`

---

### **OPÇÃO 2: Deploy Manual (Upload pasta dist/)**

#### Passo 1: Fazer upload manual
1. Acesse: https://vercel.com/new
2. Clique em **Upload Files**
3. Selecione pasta: `C:/Users/khali/.antigravity/gestao/frontend/dist/`
4. Upload completo

#### Passo 2: Configurar projeto
```
Project Name: gestao-frontend
Framework Preset: Other
```

---

## 🌐 CONFIGURAR DOMÍNIO

### Passo 1: Adicionar domínio customizado
1. No projeto Vercel, vá em **Settings → Domains**
2. Adicionar domínio: `gestao.cosiararas.com.br`
3. Vercel vai fornecer DNS records

### Passo 2: Configurar DNS
No painel do seu provedor de DNS (ex: Cloudflare, GoDaddy):

**Opção A: CNAME (Recomendado)**
```
Tipo: CNAME
Nome: gestao
Valor: cname.vercel-dns.com
TTL: Auto ou 3600
```

**Opção B: A Record**
```
Tipo: A
Nome: gestao
Valor: 76.76.21.21
TTL: Auto ou 3600
```

### Passo 3: Verificar
- Aguardar propagação DNS (5-30 minutos)
- Acessar: https://gestao.cosiararas.com.br
- Vercel emite SSL automaticamente

---

## 📦 ARQUIVOS IMPORTANTES

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### package.json
```json
{
  "name": "gestao-cosiararas",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 🧪 TESTAR BUILD LOCALMENTE

```bash
cd C:/Users/khali/.antigravity/gestao/frontend
npm run build
npm run preview
# Abrir: http://localhost:4173
```

---

## 🔄 FLUXO DE ATUALIZAÇÃO

Quando fizer mudanças no código:

```bash
cd C:/Users/khali/.antigravity/gestao
git add frontend/
git commit -m "feat: atualização frontend"
git push origin main
```

Vercel vai detectar o push e fazer redeploy automaticamente.

---

## ✅ CHECKLIST FINAL

Antes de ir para produção:

- [ ] Build passou sem erros
- [ ] Pasta `dist/` contém arquivos HTML, CSS, JS
- [ ] `vercel.json` configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio `gestao.cosiararas.com.br` adicionado
- [ ] DNS apontando para Vercel
- [ ] SSL ativo (HTTPS)
- [ ] Testar todas as 14 páginas
- [ ] Verificar integração com Supabase

---

## 🎯 URLs FINAIS

### Produção
```
https://gestao.cosiararas.com.br
```

### Páginas principais
```
https://gestao.cosiararas.com.br/            → Home
https://gestao.cosiararas.com.br/cmv         → Dashboard CMV
https://gestao.cosiararas.com.br/rh/dashboard → Dashboard RH
https://gestao.cosiararas.com.br/receitas    → Dashboard Receitas
```

---

## 📊 RESUMO DO ARQUIVO XLSX

O agente processou `Extratos receita até 20.xlsx`:

**Resultado:**
- ❌ Arquivo XLSX corrompido (XML stylesheet inválido)
- ❌ Estrutura não-tabular (células mescladas)
- ❌ Dados insuficientes (apenas 2 de 527 linhas úteis)
- ✅ Valor extraído: R$ 23.484,17

**Arquivos gerados:**
```
C:/Users/khali/.antigravity/gestao/faturamento_raw_20260320_171715.json
C:/Users/khali/.antigravity/gestao/faturamento_raw_20260320_171715.csv
C:/Users/khali/.antigravity/gestao/RELATORIO_EXTRACAO_FATURAMENTO.md
```

**Recomendação:**
- Solicitar novo arquivo XLSX em formato tabular simples
- Ou re-exportar do Excel sem formatação complexa
- Colunas necessárias: Data, Cliente, Valor, Forma Pagamento, Descrição

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
