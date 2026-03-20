# 📊 Funcionalidades Reais - App Controle

**Repositório:** `kfcury76/controle`
**URL Produção:** `https://controle.cosiararas.com.br`
**Data da Análise:** 2026-03-16
**Status:** ✅ Totalmente Funcional

---

## 🎯 Visão Geral

O **App Controle** é o sistema administrativo central do Empório Cosi, oferecendo:
- ✅ **14 páginas implementadas** (100% funcionais)
- ✅ **10 rotas no menu** principal
- ✅ **6 CRUDs completos** (Produtos, Corporativo, Encomendas, etc)
- ✅ **16 tabelas Supabase** em uso ativo
- ⚠️ **1 página funcional** não linkada no menu (MarmitariaPOS)

---

## 📋 Páginas e Funcionalidades

### 1. Dashboard (`/dashboard`)
**Status:** ✅ Completo | **Menu:** Sim

**O que faz:**
- Métricas do dia: pedidos, faturamento, pendentes de impressão
- Lista de pedidos recentes (marmitas + encomendas)
- Atualização manual via botão

**Tabelas:** `marmita_orders`, `encomendas_pedidos`, `financial_entries`, `print_queue`

---

### 2. Pedidos (`/pedidos`)
**Status:** ✅ Completo | **Menu:** Sim

**O que faz:**
- Visualização unificada de marmitas + encomendas
- Busca por cliente ou número
- Sistema de impressão de pedidos
- Limitado aos últimos 50 de cada tipo

**Tabelas:** `marmita_orders`, `encomendas_pedidos`

---

### 3. Financeiro (`/financeiro`)
**Status:** ✅ Completo | **Menu:** Sim

**O que faz:**
- Resumo financeiro total (Encomendas, Marmitas, Marmitaria Araras)
- Tabs para filtrar por tipo de negócio
- Tabela detalhada: data, cliente, empresa, tipo, pagamento, status, valor
- **Auto-refresh a cada 10 segundos**

**Tabelas:** `financial_entries`

**⚠️ Nota:** Somente visualização (não permite edição/exclusão)

---

### 4. Pedidos (Impressão) (`/admin/pedidos`)
**Status:** ✅ Completo | **Menu:** Sim

**O que faz:**
- Fila de impressão separada por business unit (padaria/marmitaria)
- Modal de impressão com abertura de janela do browser
- Marcar pedidos como impressos
- **Auto-refresh a cada 5 segundos**

**Tabelas:** `print_queue`

---

### 5. Produtos de Encomenda (`/admin/encomendas`)
**Status:** ✅ CRUD Completo | **Menu:** Sim

**O que faz:**
- **CRUD completo** de produtos de encomenda (bolos, tortas, etc)
- Gerador automático de slug
- Sistema de tabs: Básico, Itens, Preço, Personalização
- Tipos de preço: fixo ou variável (P/M/G)
- Campos customizados por produto (text, number, select)
- Preview de produto
- Duplicação de produtos
- Upload de imagens (via URL)

**Tabelas:** `encomendas_products`

**Campos Gerenciados:**
- Nome, slug, descrição, ícone, imagem
- Itens inclusos (lista)
- Preço base ou opções de preço
- Campos de personalização

---

### 6. Corporativo (`/admin/corporativo`)
**Status:** ✅ CRUD Completo | **Menu:** Sim

**O que faz:**
- **CRUD completo** de rotas corporativas (clientes B2B)
- Gerador de slug único com sufixo randômico
- Sistema de tabs: Básico, Tamanhos, Opções, Bebidas, Campos
- Configuração de tamanhos de marmita com preços individuais
- Bebidas disponíveis (SKU, nome, preço)
- Campos obrigatórios: matrícula, setor, centro de custo
- **Cópia de URL** do cardápio corporativo
- Personalização visual: logo, cor primária

**Tabelas:** `corporate_routes`, `corporate_route_sizes`, `corporate_menu_items`

**Uso:** Cria links personalizados (`controle.cosiararas.com.br/marmita/{slug}`) para clientes B2B

---

### 7. Encomendas Especiais (`/admin/special-orders`)
**Status:** ✅ CRUD Completo | **Menu:** Sim

**O que faz:**
- **CRUD completo** de produtos especiais
- Categorias: torta, bolo, salgado, doce, kit, outro
- Campos: nome, descrição, categoria, preço, imagem, ordem
- Toggle disponível/indisponível

**Tabelas:** `special_orders`

---

### 8. Marmitaria Araras (`/marmitaria`)
**Status:** ✅ Completo (Híbrido) | **Menu:** Sim

**Tab 1: Pedidos Online**
- Visualização de pedidos dos sites `cosiararas` e `marmitaria_araras`
- Filtro por source
- Busca por cliente/telefone
- Atualização de status (pending → confirmed → entregue)
- **Auto-refresh a cada 30 segundos**

**Tab 2: Cardápio**
- ⚠️ **Edição de preços BLOQUEADA** (apenas via Google Sheets/N8N)
- Visualização de preços de proteínas, adicionais, sobremesas
- **CRUD de Bebidas** (criar, editar preço, deletar)
- Toggle ativo/inativo (bloqueado)

**Tabelas:** `marmita_orders`, `menu_items`, `menu_additions`, `menu_groups`, `menu_categories`

**⚠️ IMPORTANTE:** Preços sincronizados pelo N8N a partir do Google Sheets. Edição manual desabilitada intencionalmente.

---

### 9. Recursos Humanos (`/rh`)
**Status:** ✅ Completo | **Menu:** Sim

**O que faz:**
- **Importação de PDF/Excel** (Secullum Web Pro - sistema de ponto)
- Extração automática de dados:
  - Nome, Faltas, Atrasos, Horas Extras (65%, 100%), Hora Noturna
- Seleção de mês de referência
- **Envio de PDFs individuais** para Google Drive via webhook N8N
- **Gravação de lançamentos** no Supabase

**Tabelas:** `timesheet_summary`

**Tecnologias:**
- `pdfjs-dist` (extração de texto)
- `pdf-lib` (geração de PDFs individuais)
- `xlsx` (leitura de planilhas)

**Tabs:**
- ✅ Fechamento Consolidado (funcional)
- ⚠️ Quadro de Funcionários (stub)
- ⚠️ Inconsistências (stub)

---

### 10. Configurações (`/configuracoes`)
**Status:** ✅ Completo (Visualização + CRUD Bebidas) | **Menu:** Sim

**O que faz:**
- ⚠️ **Edição de preços BLOQUEADA** (apenas via Google Sheets/N8N)
- Visualização de preços: Tamanhos, Proteínas, Adicionais, Sobremesas, Frete
- **CRUD de Bebidas**: adicionar, editar preço, remover
- Alerta visual sobre bloqueio de edição

**Tabelas:** `menu_items`, `menu_additions`, `menu_categories`, `delivery_config`

**⚠️ IMPORTANTE:** Mesma lógica da Marmitaria - preços sincronizados via N8N.

---

## 🔒 Páginas Especiais (Não no Menu)

### 11. Marmitaria POS (`/marmitaria-pos`)
**Status:** ✅ Completo | **Menu:** ❌ **NÃO**

**O que faz:**
- Sistema de PDV para Marmitaria Araras
- Seleção de tamanho (P/M/G)
- Proteínas (Frango, Bisteca, Carne Moída, Ovo)
- Acompanhamentos (máximo 3)
- Formas de pagamento
- Inserção automática em `financial_entries`, `marmita_orders`, `print_queue`

**Tabelas:** `financial_entries`, `marmita_orders`, `print_queue`

**⚠️ ATENÇÃO:** Página funcional mas **não está linkada no menu lateral**. Possível esquecimento ou desabilitação intencional.

---

### 12. Corporate Order (`/marmita/:slug`)
**Status:** ✅ Completo | **Tipo:** Página Pública

**O que faz:**
- Cardápio público para clientes corporativos (via slug único)
- Personalização visual por empresa (logo, cor)
- Seleção de tamanho, proteína, acompanhamentos, extras
- Campos obrigatórios configuráveis (matrícula, setor, centro de custo)
- Cálculo automático de preços
- Tela de confirmação pós-envio
- Inserção em `corporate_orders` e `financial_entries`

**Tabelas:** `corporate_routes`, `corporate_route_sizes`, `corporate_menu_items`, `corporate_orders`, `financial_entries`

**Acesso:** Não precisa de autenticação. Clientes acessam via link personalizado.

---

### 13. Login (`/login`)
**Status:** ✅ Completo

**O que faz:**
- Autenticação via Supabase Auth
- Redirecionamento pós-login

---

### 14. Not Found (`/404`)
**Status:** ✅ Completo

**O que faz:**
- Página de erro 404
- Log de tentativas de acesso

---

## 📊 Estatísticas

| Categoria | Quantidade |
|-----------|------------|
| **Total de Páginas** | 14 |
| **Páginas no Menu** | 10 |
| **CRUDs Completos** | 6 |
| **Páginas de Visualização** | 8 |
| **Tabelas Supabase em Uso** | 16 |
| **Páginas Funcionais Não Linkadas** | 1 (MarmitariaPOS) |
| **Páginas com Auto-refresh** | 3 (Dashboard, Financeiro, Admin Pedidos) |
| **Páginas com Bloqueio de Edição** | 2 (Marmitaria, Configurações) |

---

## 🗂️ Tabelas Supabase Utilizadas

| Tabela | Páginas | Operações |
|--------|---------|-----------|
| `marmita_orders` | Dashboard, Pedidos, Marmitaria, MarmitariaPOS | SELECT, INSERT, UPDATE |
| `encomendas_pedidos` | Dashboard, Pedidos | SELECT |
| `encomendas_products` | Encomendas | CRUD Completo |
| `financial_entries` | Dashboard, Financeiro, MarmitariaPOS, CorporateOrder | SELECT, INSERT |
| `print_queue` | Dashboard, AdminPedidos, MarmitariaPOS | SELECT, INSERT, UPDATE |
| `corporate_routes` | Corporativo, CorporateOrder | CRUD Completo |
| `corporate_route_sizes` | Corporativo, CorporateOrder | CRUD Completo |
| `corporate_menu_items` | Corporativo, CorporateOrder | CRUD Completo |
| `corporate_orders` | CorporateOrder | INSERT |
| `special_orders` | SpecialOrdersAdmin | CRUD Completo |
| `menu_items` | Marmitaria, Configuracoes | SELECT, INSERT (bebidas), DELETE (bebidas) |
| `menu_additions` | Marmitaria, Configuracoes | SELECT |
| `menu_groups` | Marmitaria, Configuracoes | SELECT |
| `menu_categories` | Configuracoes | SELECT |
| `delivery_config` | Configuracoes | SELECT |
| `timesheet_summary` | RH | INSERT |

---

## ⚠️ Pontos de Atenção

### 1. Edição de Preços Bloqueada
**Páginas afetadas:** Marmitaria (tab Cardápio), Configurações

**Motivo:** Preços são sincronizados automaticamente via:
- **Google Sheets** → **N8N** → **Supabase** (`menu_items`, `menu_additions`)

**Exceção:** CRUD de bebidas permitido

**Alerta Visual:**
```
⚠️ Importante: Os preços são atualizados automaticamente via Google Sheets.
Para alterar valores, edite a planilha e aguarde a sincronização via N8N.
```

---

### 2. MarmitariaPOS Não Linkada
**Página:** `/marmitaria-pos`
**Status:** Funcional mas não está no menu

**Possíveis Razões:**
- Esquecimento durante desenvolvimento
- Desabilitação intencional
- Substituída pela tab POS da página Marmitaria

**Recomendação:** Decidir se deve ser adicionada ao menu ou removida do código.

---

### 3. Tabs Stub no RH
**Página:** `/rh`

**Tabs Implementadas:**
- ✅ Fechamento Consolidado (funcional)
- ⚠️ Quadro de Funcionários (stub)
- ⚠️ Inconsistências (stub)

**Recomendação:** Implementar ou remover tabs não funcionais.

---

## 🔗 Integrações Externas

### N8N (Automações)
- ✅ Sincronização de preços (Google Sheets → Supabase)
- ✅ Envio de PDFs de ponto para Google Drive (RH)
- ✅ Webhooks para Instagram/WhatsApp (outros workflows)

### Google Sheets
- ✅ Cardápio (fonte de verdade para preços)
- ✅ Sincronização via N8N (workflow "Consultar Cardapio")

### Supabase
- ✅ Auth (autenticação de usuários)
- ✅ Database (16 tabelas em uso)
- ✅ Realtime (auto-refresh em algumas páginas)

---

## 🚀 Recomendações

### Curto Prazo
1. ✅ **Documentar bloqueio de edição** de preços (feito neste arquivo)
2. ⚠️ **Decidir sobre MarmitariaPOS:** adicionar ao menu ou remover
3. ⚠️ **Completar tabs stub** no RH ou removê-las

### Médio Prazo
1. Separar CorporateOrder em app/domínio próprio (ex: `pedidos.cosiararas.com.br`)
2. Adicionar testes automatizados para páginas críticas (Financeiro, RH, Corporativo)
3. Implementar auditoria de alterações (log de CRUD)

### Longo Prazo
1. Sistema de permissões por usuário (admin, gerente, operador)
2. Relatórios financeiros (exportação Excel/PDF)
3. Dashboard analítico (gráficos de vendas)

---

## 📚 Documentação Relacionada

- [CLAUDE.md](../CLAUDE.md) - Contexto global do projeto
- [DEPRECATION_ADMCOSI.md](../DEPRECATION_ADMCOSI.md) - Descontinuação do nome admcosi
- [SESSION_HANDOFF.md](docs/SESSION_HANDOFF.md) - Handoff de sessão anterior

---

**Última Atualização:** 2026-03-16
**Analisado por:** Claude Code Agent
**Repositório:** `kfcury76/controle`
**Produção:** `https://controle.cosiararas.com.br`
