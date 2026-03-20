# 🚀 PLANO: ADIANTAR TUDO NÃO-OPERACIONAL

**Data:** 20/03/2026
**Objetivo:** Completar 100% do que não depende do operacional do usuário

---

## 🎯 ESTRATÉGIA

Vamos **construir toda a infraestrutura** para que quando você precisar usar, basta:
1. Fazer upload de arquivo (XML/CSV/PDF)
2. Clicar em botões
3. Ver dashboards

**Nada de ter que esperar implementação depois!**

---

## 📊 SISTEMAS E STATUS ATUAL

### **1. Sistema Receitas: 83%**
**O que falta:**
- ❌ Testar end-to-end (precisa de você)
- ❌ Upload real de arquivos (precisa de você)

**O que posso adiantar:**
- ✅ Nada! Sistema completo aguardando testes

---

### **2. Sistema CMV: 83%**
**O que falta:**
- ❌ 3 páginas CRUD (Receitas, Ingredientes, Custos Fixos)
- ❌ Testar dashboard (precisa de você)

**O que posso adiantar:**
- ✅ **Criar as 3 páginas CRUD completas!**
- ✅ Todas as operações (criar, editar, deletar)
- ✅ Integração com Edge Functions existentes

---

### **3. Sistema RH: 67%**
**O que falta:**
- ❌ Frontend completo (0%)
- ⚠️ Edge Functions com boot error (dependências externas)

**O que posso adiantar:**
- ✅ **Criar frontend completo de RH!**
- ✅ Dashboard de folha de pagamento
- ✅ Página de funcionários (CRUD)
- ✅ Página de importar PDF Secullum (preparada)
- ✅ Página de gerar contracheques
- ✅ Resolver boot errors das Edge Functions (remover dependências)

---

## 🏗️ TRABALHO A FAZER HOJE

### **FRENTE 1: Sistema CMV - 3 Páginas CRUD** (45 min)

#### **Página 1: Receitas (CRUD completo)**
- Listar todas as receitas
- Criar nova receita
- Editar receita existente
- Deletar receita
- Ver custo total e margem
- **Arquivo:** `controle/src/pages/ReceitasCRUD.tsx`

#### **Página 2: Ingredientes (CRUD completo)**
- Listar todos os ingredientes
- Criar novo ingrediente
- Editar ingrediente (nome, unidade, custo)
- Deletar ingrediente
- **Arquivo:** `controle/src/pages/Ingredientes.tsx`

#### **Página 3: Custos Fixos (CRUD completo)**
- Listar custos fixos mensais
- Criar novo custo
- Editar custo (descrição, categoria, valor)
- Deletar custo
- Ver total por categoria
- **Arquivo:** `controle/src/pages/CustosFixos.tsx`

**Resultado:** Sistema CMV 83% → 100%

---

### **FRENTE 2: Sistema RH - Frontend Completo** (60 min)

#### **Página 1: Dashboard RH**
- Cards de resumo (total funcionários, folha mensal, média salarial)
- Tabela de funcionários ativos
- Gráfico de custos por departamento
- **Arquivo:** `controle/src/pages/RH.tsx`

#### **Página 2: Funcionários (CRUD)**
- Listar funcionários
- Criar novo funcionário
- Editar dados (nome, cargo, salário, departamento)
- Desativar funcionário
- **Arquivo:** `controle/src/pages/Funcionarios.tsx`

#### **Página 3: Folha de Pagamento**
- Calcular folha do mês
- Ver histórico de folhas
- Exportar para Excel
- **Arquivo:** `controle/src/pages/FolhaPagamento.tsx`

#### **Página 4: Importar PDF Secullum**
- Upload de PDF Secullum
- Preview de dados extraídos
- Confirmar importação
- **Arquivo:** `controle/src/pages/ImportarSecullum.tsx`

#### **Página 5: Gerar Contracheques**
- Selecionar mês de referência
- Gerar PDF de todos os funcionários
- Download individual ou em lote
- **Arquivo:** `controle/src/pages/Contracheques.tsx`

**Resultado:** Sistema RH 67% → 100% (frontend)

---

### **FRENTE 3: Corrigir Edge Functions RH** (30 min)

**Problema:** Boot error por dependências externas (pdfjs, xlsx, pdf-lib)

**Solução:** Reescrever funções sem dependências externas

#### **Função 1: `calculate-payroll` (fixar)**
- ✅ Já corrigida anteriormente
- ✅ Deployada com sucesso

#### **Função 2: `generate-payslip-pdf` (refazer)**
**ANTES:** Usava `pdf-lib` para gerar PDF
**DEPOIS:** Retornar HTML formatado que frontend converte em PDF

#### **Função 3: `extract-secullum-pdf` (simplificar)**
**ANTES:** Usava `pdfjs-dist` para OCR
**DEPOIS:** Aceitar CSV convertido manualmente (mesma estratégia de extratos)

**Resultado:** Edge Functions RH funcionando 100%

---

## 📅 CRONOGRAMA DE HOJE

### **JANELA 1: CMV CRUD (60 min)**
- 20 min: Receitas CRUD
- 20 min: Ingredientes CRUD
- 20 min: Custos Fixos CRUD
- **Output:** 3 arquivos TSX + rotas no App.tsx

### **JANELA 2: RH Frontend (90 min)**
- 15 min: Dashboard RH
- 20 min: Funcionários CRUD
- 20 min: Folha de Pagamento
- 15 min: Importar Secullum
- 20 min: Gerar Contracheques
- **Output:** 5 arquivos TSX + rotas no App.tsx

### **JANELA 3: Edge Functions RH (30 min)**
- 10 min: Reescrever `generate-payslip-pdf` (HTML)
- 10 min: Simplificar `extract-secullum-pdf` (CSV)
- 10 min: Deploy via API
- **Output:** 2 funções corrigidas e deployadas

**TEMPO TOTAL: ~3 horas**

---

## ✅ RESULTADO FINAL ESPERADO

### **Sistema Receitas: 83% → 83%** (aguarda testes)
- ✅ Database
- ✅ Backend (4 Edge Functions)
- ✅ Frontend (5 páginas)

### **Sistema CMV: 83% → 100%** ⬆️
- ✅ Database
- ✅ Backend (5 Edge Functions)
- ✅ Frontend (1 Dashboard + **3 CRUD**)

### **Sistema RH: 67% → 100%** ⬆️⬆️
- ✅ Database
- ✅ Backend (3 Edge Functions **CORRIGIDAS**)
- ✅ Frontend (**5 páginas NOVAS**)

**PROGRESSO TOTAL: 78% → 94%** 🚀

---

## 🎯 O QUE VOCÊ VAI PODER FAZER DEPOIS

### **Sistema CMV:**
- ✅ Criar/editar/deletar receitas
- ✅ Gerenciar ingredientes
- ✅ Controlar custos fixos
- ✅ Ver dashboards e margens

### **Sistema RH:**
- ✅ Cadastrar funcionários
- ✅ Calcular folha de pagamento
- ✅ Gerar contracheques em PDF
- ✅ Importar dados do Secullum (via CSV)
- ✅ Ver dashboards de RH

### **Sistema Receitas:**
- ✅ Ver dashboard de vendas
- ✅ Importar NF-e (XML)
- ✅ Importar extratos (CSV)
- ✅ Conciliar pagamentos

---

## 🚀 COMEÇAR AGORA?

Vou executar as 3 janelas em sequência:
1. **JANELA 1:** CMV CRUD (3 páginas)
2. **JANELA 2:** RH Frontend (5 páginas)
3. **JANELA 3:** Edge Functions RH (corrigir 2)

**Total:** 8 páginas frontend + 2 Edge Functions = **10 entregas**

**Confirma para eu começar?** 🚀

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
