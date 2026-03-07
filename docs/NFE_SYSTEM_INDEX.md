# 📄 Sistema de Automação de NF-e - Índice de Arquivos

**Data de Criação:** 04/03/2026
**Status:** ✅ Implementado e Organizado

---

## 📂 Estrutura de Arquivos - Sistema NF-e

Seguindo a convenção do arquivo `ORGANIZACAO.md`, todos os arquivos do sistema de NF-e estão organizados da seguinte forma:

---

## 📚 **1. DOCUMENTAÇÃO** (gestao_global/docs/)

### 📄 NFE_AUTOMATION_SYSTEM.md
**Localização:** `gestao_global/docs/NFE_AUTOMATION_SYSTEM.md`

**Conteúdo:**
- Documentação técnica completa
- Arquitetura do sistema
- Estrutura do banco de dados
- Guia de deploy (migrations + Edge Functions + frontend)
- FAQ e troubleshooting
- Próximos passos (fases 2-6)

**Quando usar:** Entender a arquitetura e fazer deploy inicial

---

### 📄 EMAIL_AUTOMATION_SETUP.md
**Localização:** `gestao_global/docs/EMAIL_AUTOMATION_SETUP.md`

**Conteúdo:**
- Guia de instalação do monitoramento de email
- Opção A: N8N Workflow (passo a passo)
- Opção B: Google Apps Script (passo a passo)
- Configuração de credenciais Gmail OAuth2
- Testes e validação
- FAQ específico de email

**Quando usar:** Configurar automação de recebimento de NF-e via email

---

## 🔧 **2. SCRIPTS** (gestao_global/scripts/)

### 📄 nfe_gmail_automation.gs
**Localização:** `gestao_global/scripts/nfe_gmail_automation.gs`

**Conteúdo:**
- Código completo do Google Apps Script
- Monitora Gmail (cosiararas@gmail.com)
- Processa XML de NF-e
- Encaminha para jhenyffer.fiscal@betenghelli.com.br
- Adiciona labels no Gmail

**Quando usar:** Implementar automação de email via Google Apps Script (grátis)

**Como usar:**
1. Acesse https://script.google.com
2. Cole o código
3. Configure variáveis (SUPABASE_URL, etc)
4. Crie trigger de 1 minuto

---

## 🤖 **3. AUTOMAÇÕES N8N** (marmitaria_ecossistema/automacoes_n8n/)

### 📄 nfe_email_automation.json
**Localização:** `marmitaria_ecossistema/automacoes_n8n/nfe_email_automation.json`

**Conteúdo:**
- Workflow N8N completo (12 nodes)
- Trigger: Gmail (polling 1 minuto)
- Extrai XML de anexos
- Chama Supabase Edge Function
- Encaminha email para fiscal
- Adiciona labels (Processada/Erro)

**Quando usar:** Implementar automação de email via N8N (recomendado para produção)

**Como usar:**
1. Abra N8N
2. Import from File
3. Selecione este arquivo
4. Configure credenciais Gmail OAuth2
5. Ative workflow

---

## 💾 **4. BANCO DE DADOS** (cosi_ecossistema/cosiararas/supabase/)

### 📄 20260304_fiscal_invoices_system.sql
**Localização:** `cosi_ecossistema/cosiararas/supabase/migrations/20260304_fiscal_invoices_system.sql`

**Conteúdo:**
- Migration SQL completa
- 5 Tabelas: fiscal_invoices, fiscal_invoice_items, payment_schedule, product_unit_conversions, cost_entries
- 3 Views: v_fiscal_invoices_summary, v_upcoming_payments, v_overdue_payments
- Triggers, índices e RLS policies
- Conversões de unidade padrão (kg→g, dz→un, etc)

**Quando usar:** Primeira vez configurando o banco de dados

**Como usar:**
```bash
cd cosi_ecossistema/cosiararas/supabase
supabase db push
# OU copiar/colar no SQL Editor do Supabase Dashboard
```

---

## ⚡ **5. EDGE FUNCTIONS** (cosi_ecossistema/cosiararas/supabase/)

### 📄 index.ts (process-nfe)
**Localização:** `cosi_ecossistema/cosiararas/supabase/functions/process-nfe/index.ts`

**Conteúdo:**
- Edge Function Deno/TypeScript
- Parser de XML NF-e (NFe 4.0)
- Extrai fornecedor, itens, valores, impostos
- Salva em 5 tabelas do banco
- Validação de chave única (evita duplicatas)

**Quando usar:** Processar XML de NF-e via API

**Como usar:**
```bash
cd cosi_ecossistema/cosiararas/supabase
supabase functions deploy process-nfe
```

**Endpoint:**
```
POST https://[projeto].supabase.co/functions/v1/process-nfe
Authorization: Bearer [SERVICE_ROLE_KEY]
Body: { "xmlContent": "<nfeProc>...</nfeProc>", "businessUnit": "cosi" }
```

---

## 🎨 **6. FRONTEND** (cosi_ecossistema/controle/src/)

### 📄 NFeUploadButton.tsx
**Localização:** `cosi_ecossistema/controle/src/components/fiscal/NFeUploadButton.tsx`

**Conteúdo:**
- Componente React de upload de XML
- Botão de upload + Drag & drop zone
- Validação de arquivo
- Chamada para Edge Function
- Toast notifications

**Como usar:**
```tsx
import { NFeUploadButton } from '@/components/fiscal/NFeUploadButton';

<NFeUploadButton
  onUploadSuccess={(id) => console.log('NF-e:', id)}
  businessUnit="cosi"
/>
```

---

### 📄 NotasFiscais.tsx
**Localização:** `cosi_ecossistema/controle/src/pages/NotasFiscais.tsx`

**Conteúdo:**
- Página principal de gestão de NF-e
- Cards de resumo (totais, mês, pendentes, pagas)
- Tabela com filtros e busca
- Tabs: Todas, Pendentes, Pagas, Upload
- Visualização de detalhes

**Rota:** `/notas-fiscais`

---

### 📄 AgendaPagamentos.tsx
**Localização:** `cosi_ecossistema/controle/src/pages/AgendaPagamentos.tsx`

**Conteúdo:**
- Página de agenda de pagamentos
- Alertas de vencimentos (vencidos, próximos 7 dias)
- Cards por criticidade
- Dialog para marcar como pago
- Registro de forma de pagamento

**Rota:** `/agenda-pagamentos`

---

### 📄 App.tsx (modificado)
**Localização:** `cosi_ecossistema/controle/src/App.tsx`

**Modificações:**
- Adicionado import: `NotasFiscais`
- Adicionada rota: `/notas-fiscais`

---

## 🗺️ Mapa Visual da Estrutura

```
C:/Users/khali/.gemini/antigravity/scratch/
│
├── 📁 gestao_global/
│   ├── 📁 docs/
│   │   ├── 📄 NFE_AUTOMATION_SYSTEM.md          ← Documentação técnica
│   │   ├── 📄 EMAIL_AUTOMATION_SETUP.md         ← Guia de email
│   │   └── 📄 NFE_SYSTEM_INDEX.md               ← Este arquivo
│   │
│   └── 📁 scripts/
│       └── 📄 nfe_gmail_automation.gs           ← Apps Script
│
├── 📁 marmitaria_ecossistema/
│   └── 📁 automacoes_n8n/
│       └── 📄 nfe_email_automation.json         ← Workflow N8N
│
└── 📁 cosi_ecossistema/
    ├── 📁 cosiararas/supabase/
    │   ├── 📁 migrations/
    │   │   └── 📄 20260304_fiscal_invoices_system.sql
    │   └── 📁 functions/process-nfe/
    │       └── 📄 index.ts
    │
    └── 📁 controle/src/
        ├── 📁 components/fiscal/
        │   └── 📄 NFeUploadButton.tsx
        ├── 📁 pages/
        │   ├── 📄 NotasFiscais.tsx
        │   └── 📄 AgendaPagamentos.tsx
        └── 📄 App.tsx (modificado)
```

---

## 🎯 Guia Rápido de Uso

### Deploy Inicial (Primeira Vez):

1. **Banco de Dados:**
   ```bash
   cd cosi_ecossistema/cosiararas/supabase
   supabase db push
   ```

2. **Edge Function:**
   ```bash
   supabase functions deploy process-nfe
   ```

3. **Frontend:**
   ```bash
   cd cosi_ecossistema/controle
   npm run build
   vercel --prod
   ```

4. **Automação de Email (escolha uma):**
   - **N8N:** Importe `marmitaria_ecossistema/automacoes_n8n/nfe_email_automation.json`
   - **Apps Script:** Use código de `gestao_global/scripts/nfe_gmail_automation.gs`

---

### Uso Diário:

1. **Upload Manual:**
   - Acesse `/notas-fiscais`
   - Arraste XML ou clique "Importar XML NF-e"

2. **Email Automático:**
   - Envie NF-e para `cosiararas@gmail.com`
   - Sistema processa automaticamente em ~1 minuto
   - Email encaminhado para `jhenyffer.fiscal@betenghelli.com.br`

3. **Gestão de Pagamentos:**
   - Acesse `/agenda-pagamentos`
   - Veja alertas de vencimento
   - Marque como pago quando efetuar pagamento

---

## 📊 Status de Implementação

| Componente | Status | Localização |
|------------|--------|-------------|
| **Migration SQL** | ✅ Criado | `cosi_ecossistema/cosiararas/supabase/migrations/` |
| **Edge Function** | ✅ Criado | `cosi_ecossistema/cosiararas/supabase/functions/` |
| **Componente Upload** | ✅ Criado | `cosi_ecossistema/controle/src/components/fiscal/` |
| **Página NF-e** | ✅ Criado | `cosi_ecossistema/controle/src/pages/` |
| **Página Pagamentos** | ✅ Criado | `cosi_ecossistema/controle/src/pages/` |
| **Workflow N8N** | ✅ Criado | `marmitaria_ecossistema/automacoes_n8n/` |
| **Apps Script** | ✅ Criado | `gestao_global/scripts/` |
| **Documentação** | ✅ Completa | `gestao_global/docs/` |
| **Deploy** | ⏳ Pendente | - |

---

## 🔜 Próximas Fases

### Fase 2: Integração com Email
- ⏳ Deploy do workflow N8N ou Apps Script
- ⏳ Configurar credenciais Gmail
- ⏳ Testar com email real

### Fase 3: Mapeamento de Produtos
- ⏳ Interface de mapeamento manual
- ⏳ Algoritmo de matching automático
- ⏳ Sugestões baseadas em histórico

### Fase 4: Atualização de Estoque
- ⏳ Aplicar conversões de unidade
- ⏳ Atualizar `inv_products` automaticamente
- ⏳ Registrar histórico de movimentações

### Fase 5: Notificações
- ⏳ Cron job diário de vencimentos
- ⏳ Email de lembrete (3/7 dias)
- ⏳ WhatsApp (opcional)

---

## 📞 Links Úteis

- **Supabase Dashboard:** https://supabase.com/dashboard
- **N8N:** [Seu domínio N8N]
- **Google Apps Script:** https://script.google.com
- **Vercel Dashboard:** https://vercel.com/dashboard

---

**Última atualização:** 04/03/2026
**Versão:** 1.0
**Desenvolvido por:** Claude Code
