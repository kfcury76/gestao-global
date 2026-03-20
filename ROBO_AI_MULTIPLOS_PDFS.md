# 🤖 ROBÔ AI - PROCESSAMENTO DE MÚLTIPLOS TIPOS DE PDFs

**Data:** 20/03/2026
**Objetivo:** Criar robô AI que lê e processa diferentes tipos de documentos PDF automaticamente

---

## 📄 TIPOS DE PDFs A PROCESSAR

### 1. **Extratos Bancários** ✅ Base Pronta
**Bancos:** Banco do Brasil, Itaú, Caixa, Mercado Pago

**Informações a extrair:**
- Data da transação
- Descrição
- Valor (débito/crédito)
- Saldo
- Tipo de transação (PIX, TED, DOC, etc)

**Destino:** Tabela `bank_transactions`

**Status:** ✅ Função `import-bank-statement` já criada (aceita CSV/OFX)

---

### 2. **Relatórios do CRM** 🔴 A MAPEAR

**CRM usado:** [INFORMAR]

**Tipos de relatórios:**
- [ ] Relatório de vendas
- [ ] Relatório de clientes
- [ ] Relatório de produtos
- [ ] Relatório de estoque
- [ ] Outros: [ESPECIFICAR]

**Informações a extrair:**
- [A DEFINIR COM USUÁRIO]

**Destino:** [A DEFINIR]

**Status:** ⏳ Aguardando informações

---

### 3. **Outros Documentos Fiscais** (Possível Expansão)

- [ ] NF-e (Notas Fiscais Eletrônicas) - Já temos parser XML
- [ ] Boletos bancários
- [ ] Recibos de pagamento
- [ ] Contratos
- [ ] Outros

---

## 🏗️ ARQUITETURA DO ROBÔ AI

### **Opção 1: Google Cloud Document AI** (Recomendada)
✅ OCR preciso (>95% acurácia)
✅ Reconhece estruturas de documentos
✅ API paga por página (~$1.50/1000 páginas)
✅ Suporta templates customizados
❌ Requer treinamento inicial

### **Opção 2: AWS Textract**
✅ OCR + detecção de tabelas
✅ Boa integração com AWS
✅ Preço similar ao Google
❌ Curva de aprendizado

### **Opção 3: Azure Form Recognizer**
✅ Templates pré-treinados para documentos financeiros
✅ Bom para formulários estruturados
❌ Menos flexível para documentos variados

**DECISÃO:** Google Cloud Document AI (melhor custo-benefício + flexibilidade)

---

## 🔄 FLUXO DE PROCESSAMENTO

```
1. UPLOAD PDF
   ↓
2. IDENTIFICAR TIPO DE DOCUMENTO (AI ou regras)
   ↓
3. ENVIAR PARA GOOGLE CLOUD DOCUMENT AI
   ↓
4. PARSEAR RESULTADO (JSON)
   ↓
5. EXTRAIR DADOS RELEVANTES
   ↓
6. VALIDAR DADOS
   ↓
7. INSERIR NO BANCO DE DADOS
   ↓
8. RETORNAR RESULTADO AO USUÁRIO
```

---

## 📊 EDGE FUNCTIONS NECESSÁRIAS

### **1. `process-pdf` (Nova - Core do Robô)**
**Responsabilidade:** Orquestrador principal
- Recebe PDF base64
- Identifica tipo de documento
- Roteia para função especializada
- Retorna resultado unificado

### **2. `extract-bank-statement-pdf` (Nova)**
**Responsabilidade:** Processar extratos bancários PDF
- Envia PDF para Google Cloud Document AI
- Parseia resultado OCR
- Converte para formato de transações
- Insere em `bank_transactions`

### **3. `extract-crm-report-pdf` (Nova)**
**Responsabilidade:** Processar relatórios CRM
- OCR via Document AI
- Extração de dados do CRM
- Inserção nas tabelas corretas

### **4. `import-bank-statement` (Existente)**
**Status:** ✅ Já deployada
**Função:** Aceita CSV/OFX manualmente convertidos

### **5. `import-nfe` (Existente)**
**Status:** ✅ Já deployada
**Função:** Parseia NF-e XML

---

## 📅 ROADMAP DE IMPLEMENTAÇÃO

### **FASE 1: PREPARAÇÃO (Esta Semana)**
- [ ] Mapear todos os tipos de PDFs com usuário
- [ ] Coletar 50+ amostras de cada tipo
- [ ] Criar 10 exemplos CSV manuais de cada tipo (dataset de treinamento)
- [ ] Organizar PDFs em pastas por tipo

### **FASE 2: SETUP GOOGLE CLOUD (Semana 2)**
- [ ] Criar projeto no Google Cloud
- [ ] Ativar Document AI API
- [ ] Criar processador para cada tipo de documento
- [ ] Criar service account + chave JSON
- [ ] Configurar billing (estimar custos)
- [ ] Adicionar `GOOGLE_CLOUD_KEY` nos secrets do Supabase

### **FASE 3: DESENVOLVIMENTO (Semana 3)**
- [ ] Criar função `process-pdf` (orquestrador)
- [ ] Criar função `extract-bank-statement-pdf`
- [ ] Criar função `extract-crm-report-pdf`
- [ ] Testar com 5 PDFs de cada tipo
- [ ] Ajustar parsing conforme acurácia

### **FASE 4: VALIDAÇÃO (Semana 4)**
- [ ] Processar 50 PDFs de cada tipo
- [ ] Calcular acurácia (meta: >95%)
- [ ] Ajustar algoritmos de parsing
- [ ] Criar regras de validação
- [ ] Criar dashboard de monitoramento

### **FASE 5: PRODUÇÃO (Semana 5)**
- [ ] Deploy final das funções
- [ ] Criar interface de upload no frontend
- [ ] Adicionar histórico de processamento
- [ ] Configurar alertas de erro
- [ ] Documentar processo

---

## 💰 ESTIMATIVA DE CUSTOS

### **Google Cloud Document AI**
- Preço: ~$1.50 por 1000 páginas
- Estimativa mensal:
  - 100 extratos bancários (100 páginas) = $0.15/mês
  - 50 relatórios CRM (100 páginas) = $0.15/mês
  - **Total estimado: $0.30/mês** (desprezível)

### **Supabase Edge Functions**
- Grátis até 500k execuções/mês
- Estimativa: ~500 execuções/mês
- **Custo: $0.00**

### **Supabase Database (Cloudfy)**
- Já pago (plano existente)

**CUSTO TOTAL ESTIMADO: ~$0.30/mês** ✅

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### **URGENTE: Responder estas perguntas**

1. **Qual CRM você usa?**
   - [ ] CRM próprio
   - [ ] Pipedrive
   - [ ] HubSpot
   - [ ] RD Station
   - [ ] Outro: ___________

2. **Que relatórios do CRM você precisa processar?**
   - Exemplo: "Relatório de vendas diário com cliente, produto, valor, data"

3. **Esses relatórios vêm em PDF ou você pode exportar em CSV/Excel?**
   - Se CSV/Excel disponível, podemos pular o OCR

4. **Com que frequência você processa esses documentos?**
   - Diária? Semanal? Mensal?

5. **Quantos documentos você processa por mês?**
   - Para estimar custos e volume

6. **Além de CRM e extratos, há outros PDFs importantes?**
   - Boletos? Recibos? Contratos? NF-e de compras?

---

## 📁 ESTRUTURA DE PASTAS SUGERIDA

```
C:/documentos_robo_ai/
├── extratos_bancarios/
│   ├── banco_do_brasil/
│   ├── itau/
│   ├── caixa/
│   └── mercado_pago/
├── relatorios_crm/
│   ├── vendas/
│   ├── clientes/
│   └── produtos/
├── nfe_compras/
├── boletos/
└── outros/
```

---

## 🧪 DATASET DE TREINAMENTO

Para cada tipo de documento, precisamos:
1. **50+ PDFs originais** (variados, diferentes períodos)
2. **10 conversões CSV manuais** (ground truth para validação)
3. **Regras de validação** (ex: saldo inicial + entradas - saídas = saldo final)

---

**Status:** 🔴 Aguardando informações do usuário sobre tipos de PDFs do CRM

📞 **Me responda as 6 perguntas acima para eu criar o robô completo!**

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
