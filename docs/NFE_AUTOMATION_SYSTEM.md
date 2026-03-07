# 📄 Sistema de Automação de Notas Fiscais Eletrônicas (NF-e)

**Data de Criação:** 04/03/2026
**Versão:** 1.0
**Status:** ✅ Implementado (Aguardando Deploy e Testes)

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Componentes Implementados](#componentes-implementados)
4. [Banco de Dados](#banco-de-dados)
5. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
6. [Guia de Deploy](#guia-de-deploy)
7. [Como Usar](#como-usar)
8. [Próximos Passos](#próximos-passos)
9. [FAQ e Troubleshooting](#faq-e-troubleshooting)

---

## 🎯 Visão Geral

### Objetivo

Automatizar completamente o processo de gestão de notas fiscais recebidas, desde a extração do email até:
- Contabilização de custos
- Atualização de estoque (com conversão de unidades)
- Agenda de pagamentos com notificações

### Problema Resolvido

Antes, o processo manual envolvia:
1. ❌ Baixar XML do email
2. ❌ Abrir e ler a NF-e manualmente
3. ❌ Lançar custos no sistema financeiro
4. ❌ Atualizar estoque manualmente
5. ❌ Anotar vencimentos em planilhas/papel
6. ❌ Esquecer pagamentos e gerar multas

Agora, tudo isso é **automático**!

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│  ENTRADA: cosiararas@gmail.com                          │
│  ├── NF-e em XML anexada                                │
│  └── Monitoramento (futuro: N8N/Webhook)                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  PROCESSAMENTO: Edge Function /process-nfe              │
│  ├── Parse XML (extração de dados)                      │
│  ├── Validação (chave única, estrutura)                 │
│  └── Inserção no banco de dados                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  BANCO DE DADOS: Supabase PostgreSQL                    │
│  ├── fiscal_invoices (NF-e)                             │
│  ├── fiscal_invoice_items (Itens)                       │
│  ├── payment_schedule (Agenda)                          │
│  ├── cost_entries (Custos)                              │
│  └── product_unit_conversions (Conversões)              │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┴──────────────┐
    │                           │
    ▼                           ▼
┌─────────────────┐    ┌─────────────────┐
│  PAINEL ADMIN   │    │  ESTOQUE        │
│  (Controle)     │    │  (Orçamentos)   │
│                 │    │                 │
│  ├── NF-e       │    │  ├── Produtos   │
│  ├── Pagamentos │    │  ├── Preços     │
│  └── Custos     │    │  └── Entradas   │
└─────────────────┘    └─────────────────┘
```

---

## 📦 Componentes Implementados

### 1. **Banco de Dados (Migration SQL)**

**Arquivo:** `cosiararas/supabase/migrations/20260304_fiscal_invoices_system.sql`

**Tabelas Criadas:**

#### `fiscal_invoices` - Cabeçalho das Notas Fiscais
```sql
- nfe_key (chave única de 44 dígitos)
- nfe_number, nfe_series, nfe_model
- supplier_name, supplier_cnpj, supplier_address
- issue_date, due_date, entry_date
- total_products, total_tax, total_value
- status, payment_status
- cost_category, business_unit
- xml_data (XML completo)
```

#### `fiscal_invoice_items` - Itens das NF-e
```sql
- invoice_id (FK)
- product_code, product_name, product_ncm
- quantity, unit, unit_price, total_price
- mapped_product_id (FK para inv_products)
- converted_quantity, converted_unit
- stock_updated (flag)
```

#### `payment_schedule` - Agenda de Pagamentos
```sql
- invoice_id (FK)
- installment_number, due_date, amount
- status (pending, paid, overdue)
- payment_method, payment_reference
- notification_sent_at, notification_count
```

#### `product_unit_conversions` - Conversões de Unidade
```sql
- from_unit, to_unit, conversion_factor
- product_id (opcional, para conversões específicas)
- Exemplos: kg→g (1000), dz→un (12), cx12→un (12)
```

#### `cost_entries` - Lançamentos de Custo
```sql
- invoice_id (FK)
- category, amount, entry_date
- business_unit, cost_center
- supplier_name, supplier_cnpj
```

**Views Criadas:**

- `v_fiscal_invoices_summary` - NF-e com contadores
- `v_upcoming_payments` - Pagamentos próximos (7 dias)
- `v_overdue_payments` - Pagamentos vencidos

---

### 2. **Backend - Edge Function**

**Arquivo:** `cosiararas/supabase/functions/process-nfe/index.ts`

**Funcionalidades:**

- ✅ Parse completo de XML NF-e (NFe 4.0)
- ✅ Extração de dados do fornecedor
- ✅ Extração de itens com impostos
- ✅ Validação de chave única (evita duplicatas)
- ✅ Criação automática de:
  - Nota fiscal
  - Itens
  - Agenda de pagamento
  - Lançamento de custo

**Endpoint:**
```
POST https://[seu-projeto].supabase.co/functions/v1/process-nfe

Body:
{
  "xmlContent": "<nfeProc>...</nfeProc>",
  "businessUnit": "cosi",  // ou "marmitaria"
  "costCategory": "materia_prima"  // opcional
}
```

---

### 3. **Frontend - Componentes React**

#### `NFeUploadButton.tsx` e `NFeDropZone.tsx`

**Arquivo:** `controle/src/components/fiscal/NFeUploadButton.tsx`

**Funcionalidades:**
- Botão de upload de XML
- Área de drag & drop
- Validação de arquivo
- Chamada para Edge Function
- Feedback visual (loading, sucesso, erro)
- Toast notifications

**Uso:**
```tsx
<NFeUploadButton
  onUploadSuccess={(invoiceId) => console.log('NF-e importada:', invoiceId)}
  businessUnit="cosi"
  costCategory="materia_prima"
/>
```

---

#### `NotasFiscais.tsx` - Página de Gestão

**Arquivo:** `controle/src/pages/NotasFiscais.tsx`

**Funcionalidades:**
- 📊 Cards de resumo (total, mês atual, pendentes, pagas)
- 📋 Tabela de NF-e com filtros e busca
- 🔍 Busca por número, fornecedor, CNPJ, chave
- 📑 Tabs: Todas, Pendentes, Pagas, Upload
- 👁️ Visualização de detalhes (futuro)
- 📥 Download de XML/PDF (futuro)

**Rota:** `/notas-fiscais`

---

#### `AgendaPagamentos.tsx` - Agenda de Pagamentos

**Arquivo:** `controle/src/pages/AgendaPagamentos.tsx`

**Funcionalidades:**
- ⚠️ Alertas de vencimentos (vencidos, próximos 7 dias)
- 📊 Cards de resumo por status
- 📅 Tabelas organizadas por criticidade
- ✅ Marcar como pago (com dialog)
- 📝 Registro de forma de pagamento
- 🔔 Contadores de notificações (futuro)

**Rota:** `/agenda-pagamentos` (precisa adicionar ao router)

---

## 💾 Banco de Dados

### Conexão

As tabelas são criadas no mesmo banco Supabase usado pelo sistema atual.

**Variáveis de Ambiente:**
```env
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (apenas backend)
```

### Row Level Security (RLS)

Por enquanto, todas as políticas permitem acesso total para usuários autenticados.

**Futuro:** Implementar políticas por `business_unit` e roles.

---

## 🔄 Fluxo de Funcionamento

### Cenário 1: Upload Manual (Implementado)

```
1. Usuário acessa /notas-fiscais
2. Clica em "Importar XML NF-e" ou arrasta arquivo
3. Frontend valida arquivo (.xml)
4. Envia para Edge Function /process-nfe
5. Function faz parse do XML
6. Insere dados nas 5 tabelas
7. Retorna sucesso com dados da NF-e
8. Frontend exibe toast de sucesso
9. Tabela é atualizada automaticamente
```

### Cenário 2: Monitoramento de Email (Futuro)

```
1. Email chega em cosiararas@gmail.com com XML
2. N8N Workflow detecta novo email com anexo .xml
3. N8N extrai XML do anexo
4. N8N chama Edge Function /process-nfe
5. (resto igual ao cenário 1)
6. N8N envia notificação de sucesso
```

### Cenário 3: Pagamento de NF-e

```
1. Usuário acessa /agenda-pagamentos
2. Vê alerta de "Vencidos" ou "Próximos 7 dias"
3. Clica em "Marcar como Pago"
4. Preenche forma de pagamento e referência
5. Confirma
6. Status muda para "paid"
7. Pagamento some da lista de pendentes
```

### Cenário 4: Atualização de Estoque (Futuro)

```
1. NF-e é importada com sucesso
2. Sistema busca mapeamento de produtos:
   - Por código (product_code)
   - Por nome similar (fuzzy match)
   - Sugere mapeamento manual
3. Aplica conversão de unidades
4. Atualiza inv_products.current_stock
5. Atualiza inv_products.last_price
6. Marca item como stock_updated=true
```

---

## 🚀 Guia de Deploy

### Pré-requisitos

- [ ] Acesso ao Supabase (conta admin)
- [ ] Supabase CLI instalado (`npm install -g supabase`)
- [ ] Projeto React buildável

### Passo 1: Deploy da Migration

```bash
cd cosiararas/supabase

# Login no Supabase
supabase login

# Link do projeto
supabase link --project-ref [seu-projeto-ref]

# Rodar migration
supabase db push
```

**Ou via Dashboard:**

1. Acesse Supabase Dashboard > SQL Editor
2. Abra o arquivo `20260304_fiscal_invoices_system.sql`
3. Copie todo o conteúdo
4. Cole no editor e execute

### Passo 2: Deploy da Edge Function

```bash
cd cosiararas/supabase

# Deploy da function
supabase functions deploy process-nfe

# Verificar logs
supabase functions logs process-nfe
```

### Passo 3: Build e Deploy do Frontend

```bash
cd controle

# Instalar dependências (se necessário)
npm install

# Build
npm run build

# Deploy (Vercel/Netlify/outro)
vercel --prod
```

### Passo 4: Testar

1. Acesse o painel admin
2. Vá em `/notas-fiscais`
3. Faça upload de um XML de teste
4. Verifique se aparece na tabela
5. Confira no Supabase Dashboard se os dados foram inseridos

---

## 📖 Como Usar

### Importar uma NF-e

1. Acesse o painel admin (`controle.cosiararas.com.br`)
2. Clique em "Notas Fiscais" no menu lateral
3. Vá na tab "Importar XML"
4. Arraste o arquivo XML ou clique para selecionar
5. Aguarde o processamento (1-3 segundos)
6. Pronto! A NF-e está no sistema

### Consultar Pagamentos

1. Acesse "Agenda de Pagamentos" no menu (futuro)
2. Veja os cards de resumo:
   - Vencidos (vermelho)
   - Próximos 7 dias (amarelo)
   - A vencer (cinza)
3. Clique em "Marcar como Pago" quando efetuar o pagamento
4. Preencha os dados e confirme

### Configurar Conversões de Unidade

1. Acesse o banco de dados (Supabase Dashboard)
2. Tabela `product_unit_conversions`
3. Insira novas conversões manualmente:
```sql
INSERT INTO product_unit_conversions
  (from_unit, to_unit, conversion_factor, description)
VALUES
  ('sc50', 'kg', 50, '1 saco de 50kg = 50kg');
```

### Mapear Produtos Manualmente

**(Futuro - Interface a ser implementada)**

1. Acesse "Notas Fiscais"
2. Clique em uma NF-e
3. Veja a lista de itens
4. Clique em "Mapear" ao lado de item não mapeado
5. Busque o produto no estoque
6. Confirme o mapeamento
7. Defina a conversão de unidade (se necessário)

---

## 🔜 Próximos Passos

### Fase 2: Integração com Email (N8N)

- [ ] Criar workflow N8N para monitorar Gmail
- [ ] Filtrar emails com anexos .xml
- [ ] Extrair XML e chamar Edge Function
- [ ] Enviar notificações de sucesso/erro

### Fase 3: Mapeamento Automático de Produtos

- [ ] Criar algoritmo de matching (código + nome)
- [ ] Interface de mapeamento manual
- [ ] Sugestões baseadas em histórico
- [ ] Machine Learning para melhorar matching

### Fase 4: Atualização Automática de Estoque

- [ ] Edge Function para processar mapeamento
- [ ] Aplicar conversões de unidade
- [ ] Atualizar `inv_products` no banco do orçamentos
- [ ] Registrar histórico de movimentações
- [ ] Alertas de divergências

### Fase 5: Notificações de Vencimento

- [ ] Cron job diário (Supabase Edge Function)
- [ ] Verificar pagamentos vencendo em 3/7 dias
- [ ] Enviar email de lembrete
- [ ] Enviar WhatsApp (Twilio/Evolution API)
- [ ] Push notifications no painel

### Fase 6: Dashboard Financeiro Avançado

- [ ] Gráficos de custos por categoria
- [ ] Análise de fornecedores
- [ ] Previsão de gastos
- [ ] Exportação para Excel
- [ ] Integração com contabilidade

---

## ❓ FAQ e Troubleshooting

### Erro: "Invoice already exists"

**Causa:** A NF-e com essa chave já foi importada.

**Solução:** Verifique na tabela se realmente é duplicata. Se quiser reimportar, delete a NF-e antiga primeiro.

```sql
DELETE FROM fiscal_invoices WHERE nfe_key = '44...';
```

### Erro: "File does not appear to be a valid NFe"

**Causa:** O XML não contém tags `<nfeProc>` ou `<NFe>`.

**Solução:** Verifique se o arquivo é realmente uma NF-e. Algumas NFSe (Nota Fiscal de Serviço) têm estrutura diferente.

### Edge Function retorna 500

**Causa:** Erro no parse do XML ou problema no banco.

**Solução:**
1. Veja os logs: `supabase functions logs process-nfe`
2. Teste o XML localmente
3. Verifique se as tabelas existem no banco

### NF-e importada mas não aparece na lista

**Causa:** Frontend não está consultando a view correta.

**Solução:**
1. Recarregue a página (F5)
2. Verifique o console do navegador
3. Confira se a view `v_fiscal_invoices_summary` existe
4. Query manual no Supabase:
```sql
SELECT * FROM v_fiscal_invoices_summary;
```

### Produtos não estão mapeando

**Causa:** Sistema ainda não tem mapeamento automático implementado.

**Solução:**
1. Aguardar implementação da Fase 3
2. Por enquanto, mapear manualmente via SQL:
```sql
UPDATE fiscal_invoice_items
SET mapped_product_id = '[uuid-do-produto]',
    mapping_method = 'manual'
WHERE id = '[uuid-do-item]';
```

### Notificações não estão chegando

**Causa:** Sistema de notificações ainda não implementado (Fase 5).

**Solução:** Por enquanto, consulte a página de Agenda de Pagamentos diariamente.

---

## 📊 Estrutura de Arquivos Criados

```
cosi_ecossistema/
├── cosiararas/
│   └── supabase/
│       ├── migrations/
│       │   └── 20260304_fiscal_invoices_system.sql  ✅ CRIADO
│       └── functions/
│           └── process-nfe/
│               └── index.ts  ✅ CRIADO
│
└── controle/
    └── src/
        ├── components/
        │   └── fiscal/
        │       └── NFeUploadButton.tsx  ✅ CRIADO
        ├── pages/
        │   ├── NotasFiscais.tsx  ✅ CRIADO
        │   └── AgendaPagamentos.tsx  ✅ CRIADO
        └── App.tsx  ✅ MODIFICADO (adicionada rota)
```

---

## 🎉 Conclusão

O **Sistema de Automação de Notas Fiscais** está **100% implementado** na parte de:
- ✅ Banco de dados (migrations)
- ✅ Backend (Edge Function)
- ✅ Frontend (páginas e componentes)
- ✅ Upload manual de XML
- ✅ Gestão de NF-e
- ✅ Agenda de pagamentos

**Pendente:**
- ⏳ Deploy (aguardando execução)
- ⏳ Integração com email (N8N)
- ⏳ Mapeamento automático de produtos
- ⏳ Atualização de estoque
- ⏳ Notificações de vencimento

**Tempo estimado para deploy e testes:** 2-3 horas

**Desenvolvido por:** Claude Code
**Data:** 04/03/2026
**Versão:** 1.0

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte este documento
2. Verifique logs no Supabase Dashboard
3. Inspecione console do navegador (F12)
4. Consulte documentação do Supabase

---

**🚀 Bom uso do sistema!**
