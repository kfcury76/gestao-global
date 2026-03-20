# 🎯 ESTRATÉGIA FINAL: XML FIRST (PDF como fallback)

**Data:** 20/03/2026
**Decisão:** Priorizar XML/CSV, usar PDF apenas quando necessário

---

## 📋 FONTES DE DADOS MAPEADAS

### 1. **CRM Próprio** ✅ XML Disponível
- **Formato:** XML
- **Tipo de dados:** Vendas + outras informações
- **Frequência:** Semanal (máximo)
- **Status:** ✅ MELHOR CENÁRIO - não precisa OCR!

**Edge Function:** `import-crm-data` (nova)

---

### 2. **NF-e Fornecedores** ✅ XML Disponível (objetivo)
- **Formato:** XML (padrão NF-e brasileiro)
- **Tipo de dados:** Compras, fornecedores, produtos, valores
- **Frequência:** Conforme recebimento
- **Status:** 🔄 Você está tentando puxar XMLs dos fornecedores

**Edge Function:** `import-nfe` ✅ **JÁ EXISTE E ESTÁ DEPLOYADA!**

**Próximo passo:** Adaptar função para NF-e de **entrada** (compras), não só de **saída** (vendas)

---

### 3. **Extratos Bancários** 🔴 Somente PDF
- **Formato:** PDF (bancos não fornecem XML estruturado)
- **Tipo de dados:** Transações bancárias
- **Frequência:** Semanal/Mensal
- **Status:** ⏳ Única fonte que precisa OCR

**Edge Function:** `extract-bank-statement-pdf` (nova - única que precisa Google Cloud Document AI)

---

## 🏗️ ARQUITETURA REVISADA

```
ENTRADA DE DADOS
├── 📄 CRM Próprio (XML) → import-crm-data → sales, customers, etc
├── 📄 NF-e Fornecedores (XML) → import-nfe-compras → purchases, suppliers
├── 📄 NF-e Vendas (XML) → import-nfe ✅ JÁ EXISTE
├── 📄 Extratos Bancários (PDF) → extract-bank-statement-pdf → bank_transactions
└── 📄 Extratos Bancários (CSV manual) → import-bank-statement ✅ JÁ EXISTE
```

---

## 🚀 EDGE FUNCTIONS - ROADMAP ATUALIZADO

### **Função 1: `import-crm-data` (NOVA - Alta prioridade)**
**Entrada:** XML do CRM próprio
**Saída:** Dados inseridos em `sales`, `customers`, etc

**Estrutura esperada do XML:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<vendas>
  <venda>
    <data>2026-03-20</data>
    <cliente>João Silva</cliente>
    <produto>Marmita Executiva</produto>
    <quantidade>5</quantidade>
    <valor_unitario>25.00</valor_unitario>
    <valor_total>125.00</valor_total>
    <forma_pagamento>pix</forma_pagamento>
  </venda>
  <!-- mais vendas -->
</vendas>
```

**Tarefas:**
- [ ] Você me envia 1 exemplo real de XML do CRM
- [ ] Eu crio o parser específico
- [ ] Testamos com 10 XMLs
- [ ] Deploy

---

### **Função 2: `import-nfe-compras` (NOVA - Adaptação)**
**Entrada:** XML de NF-e de entrada (compras)
**Saída:** Dados em `purchases`, `suppliers`, `inventory` (opcional)

**Diferença da função existente:**
- Função `import-nfe` existente: NF-e de **saída** (você vendeu)
- Função nova: NF-e de **entrada** (você comprou)

**Tarefas:**
- [ ] Adaptar parser XML da função existente
- [ ] Criar tabelas `purchases` e `suppliers` (se não existirem)
- [ ] Testar com NF-e de fornecedores
- [ ] Deploy

---

### **Função 3: `extract-bank-statement-pdf` (NOVA - OCR)**
**Entrada:** PDF de extrato bancário (base64)
**Saída:** Transações em `bank_transactions`

**Fluxo:**
1. Recebe PDF base64
2. Envia para Google Cloud Document AI
3. Parseia JSON retornado (OCR)
4. Extrai: data, descrição, valor, saldo
5. Valida: saldo inicial + entradas - saídas = saldo final
6. Insere em `bank_transactions`

**Tarefas:**
- [ ] Configurar Google Cloud Document AI
- [ ] Criar processador de extratos
- [ ] Desenvolver função
- [ ] Testar com 10 PDFs
- [ ] Deploy

---

## ✅ FUNÇÕES JÁ DEPLOYADAS (Reusar!)

### **1. `import-nfe`** ✅ Deployada
- Para NF-e de **vendas** (XML)
- Pode ser base para `import-nfe-compras`

### **2. `import-bank-statement`** ✅ Deployada
- Para extratos CSV/OFX (texto estruturado)
- Pode processar CSV convertido manualmente de PDF

### **3. `calculate-revenue`** ✅ Deployada
- Calcula receitas agregadas

### **4. `reconcile-bank-statement`** ✅ Deployada
- Conciliação bancária com AI scoring

---

## 📊 NOVA ESTRUTURA DE BANCO DE DADOS

### **Tabelas a Criar (se não existem):**

```sql
-- Compras (NF-e de entrada)
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id),
  purchase_date DATE NOT NULL,
  invoice_number VARCHAR(20),
  invoice_key VARCHAR(44), -- Chave NF-e
  gross_amount DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  payment_method VARCHAR(20),
  business_unit VARCHAR(20) CHECK (business_unit IN ('cosi', 'marmitaria', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fornecedores
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  cnpj VARCHAR(14) UNIQUE,
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens da compra (detalhe)
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_code VARCHAR(50),
  product_name VARCHAR(200),
  quantity DECIMAL(10,3),
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 PLANO DE AÇÃO - PRÓXIMAS 3 SEMANAS

### **SEMANA 1 (Esta semana): CRM XML** 🔴 Urgente
- [ ] Você exporta 1 XML de exemplo do CRM
- [ ] Eu analiso a estrutura
- [ ] Eu crio a migration para tabelas necessárias
- [ ] Eu crio a função `import-crm-data`
- [ ] Testamos com 10 XMLs reais
- [ ] Deploy
- [ ] 🎉 **CRM automatizado!**

### **SEMANA 2: NF-e Compras (XML)** 🟡 Importante
- [ ] Você coleta XMLs de NF-e de fornecedores
- [ ] Eu crio migrations (`purchases`, `suppliers`, `purchase_items`)
- [ ] Eu crio função `import-nfe-compras`
- [ ] Testamos com 10 XMLs
- [ ] Deploy
- [ ] 🎉 **Compras automatizadas!**

### **SEMANA 3: Extratos PDF (OCR)** 🟢 Opcional
- [ ] Configurar Google Cloud Document AI
- [ ] Desenvolver `extract-bank-statement-pdf`
- [ ] Testar com 10 PDFs
- [ ] Deploy
- [ ] 🎉 **Tudo automatizado!**

---

## 💰 CUSTOS REVISADOS

| Componente | Custo Mensal |
|------------|--------------|
| Google Cloud Document AI (só extratos PDF) | ~$0.15 |
| Supabase Edge Functions | $0.00 |
| Supabase Database (Cloudfy) | Já pago |
| **TOTAL** | **~$0.15/mês** |

**Economia:** Como você vai usar XML para CRM e NF-e, o custo do OCR é **mínimo**! ✅

---

## 📁 ESTRUTURA DE ARQUIVOS PARA VOCÊ PREPARAR

```
C:/documentos_integracao/
├── crm_xml/
│   ├── vendas_2026-03-01.xml
│   ├── vendas_2026-03-08.xml
│   └── vendas_2026-03-15.xml
├── nfe_compras_xml/
│   ├── 35260312345678901234567890123456789012.xml
│   └── 35260312345678901234567890123456789013.xml
├── nfe_vendas_xml/
│   └── (já processamos via função existente)
└── extratos_pdf/
    ├── bb_202603.pdf
    ├── itau_202603.pdf
    └── mercadopago_202603.pdf
```

---

## 🚦 PRÓXIMO PASSO IMEDIATO

### **AÇÃO PARA VOCÊ (hoje/amanhã):**

1. **Exportar 1 XML de exemplo do CRM** com vendas da semana
   - Me enviar o arquivo ou colar o conteúdo aqui

2. **Coletar 2-3 XMLs de NF-e de fornecedores**
   - Podem ser do último mês

3. **Baixar 2-3 PDFs de extratos bancários**
   - Qualquer período recente

---

## 💡 VANTAGENS DESSA ABORDAGEM

✅ **99% dos dados via XML** (estruturado, grátis, 100% acurácia)
✅ **1% via PDF** (só extratos bancários)
✅ **Custo quase zero** (~$0.15/mês)
✅ **Processamento rápido** (XML é instantâneo)
✅ **Menos complexidade** (menos código de OCR)
✅ **Mais confiável** (não depende de OCR)

---

## 📝 RESUMO EXECUTIVO

**ANTES (planejamento inicial):**
- CRM em PDF → OCR caro e impreciso ❌
- NF-e em PDF → OCR caro e impreciso ❌
- Extratos em PDF → OCR necessário ⚠️

**DEPOIS (sua abordagem):**
- CRM em XML → Parser simples, grátis ✅
- NF-e em XML → Parser simples, grátis ✅
- Extratos em PDF → OCR mínimo necessário ✅

**Você escolheu o caminho certo! 🎯**

---

## 🎯 CALL TO ACTION

**Me envie agora:**
1. 1 XML do CRM (vendas da semana)
2. 1-2 XMLs de NF-e de compras (fornecedores)

**Eu entrego em 2 horas:**
- ✅ Migrations das tabelas
- ✅ 2 Edge Functions (`import-crm-data` + `import-nfe-compras`)
- ✅ Testes funcionando
- ✅ Deploy completo

**Resultado:** Sistema 95% automatizado ainda hoje! 🚀

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
