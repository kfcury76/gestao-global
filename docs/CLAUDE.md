# Marmitaria Araras — Contexto do Projeto

> Lido automaticamente pelo Claude Code em qualquer máquina.
> **ATENÇÃO:** Não commitar em repositório público — contém senhas e configurações sensíveis.

## Ecossistema: 3 Apps + Daemon de Impressão

| App | URL / Local | Stack | Status |
|---|---|---|---|
| **App de Vendas (Cosí)** | `cosiararas.com.br` | React + Vite + TS | ✅ Em produção |
| **App da Marmitaria** | `marmitaria-vendas/` | Next.js 16, React 19 | ✅ Pronto (falta hospedar) |
| **App Controle** | `controle.cosiararas.com.br` | React + Vite + TS + shadcn/ui | ✅ Em produção |
| **Daemon Impressão** | `marmitaria-print/` | Node.js + tsx | ✅ Criado (IPs placeholder) |

## GitHub Repos

- `kfcury76/cosiararas` — App de vendas público do Cosí
- `kfcury76/controle` — Painel admin/controle (OFICIAL) ✅
- `kfcury76/marmitaria-vendas` — App de vendas da Marmitaria (Next.js)

> ⚠️ **DESCONTINUADO:** `kfcury76/admcosi` foi substituído por `kfcury76/controle`

## Infraestrutura

- **Supabase (Cloudfy):** `https://energetictriggerfish-supabase.cloudfy.live`
- **N8N (Cloudfy):** `https://energetictriggerfish-n8n.cloudfy.live`
- **Mercado Pago:** token em `marmitaria-vendas/.env.local` (`MP_ACCESS_TOKEN`)

## Banco de Dados — Tabelas Principais

| Tabela | Uso | RLS |
|---|---|---|
| `marmita_orders` | Pedidos da marmitaria | ✅ ativo |
| `corporate_orders` | Pedidos corporativos | ✅ ativo (anon: INSERT only) |
| `encomendas_pedidos` | Encomendas (bolos, pães) | ✅ ativo (anon: INSERT only) |
| `print_queue` | Fila de impressão | ✅ ativo (anon: INSERT only) |
| `financial_entries` | Lançamentos financeiros | ✅ ativo (anon: INSERT only) |
| `menu_items` | Cardápio (preços reais) | ✅ ativo |
| `menu_groups` / `menu_additions` | Grupos e adicionais do cardápio | ✅ |
| `delivery_config` | Opções de entrega e taxas | ✅ (migration 03) |
| `corporate_routes` | Rotas corporativas (slug, preços) | ✅ |

### Campos legacy NOT NULL em `marmita_orders`
Ao inserir, preencher com defaults: `meal_size='P'`, `meal_size_name=nome_item`, `protein=''`, `carb=''`, `extras_price=0`, `delivery_fee=0`

## Roteamento de Impressão

- `print_queue.target = 'marmitaria'` → impressora USB (máquina da marmitaria)
- `print_queue.target = 'cosi'` → impressora TCP/IP (máquina do Cosí)
- Daemon: Supabase Realtime + polling fallback 10s
- `order_type`: `'marmita_normal'` | `'marmitaria_interna'` | `'corporativo'` | `'encomenda'`

## Senhas e Autenticação

- **Senha admin padrão:** `Kfcury76@` (todos os apps)
- `marmitaria-vendas` → `ADMIN_PASSWORD` em `.env.local`
- `controle` → auth já implementada (Supabase Auth)
- Admin URL: `<producao>/admin` — autenticação Bearer token

## Arquivos-chave

### marmitaria-vendas (Next.js)
- `src/app/api/checkout/route.ts` — checkout MP SDK + inserts Supabase
- `src/app/api/mp-preference/route.ts` — cria preferência MP para cosiararas (CORS)
- `src/app/api/admin/prices/route.ts` — GET/PATCH preços (Bearer ADMIN_PASSWORD)
- `src/app/admin/page.tsx` — painel de preços (tabs: Marmitas/Bebidas/Adicionais/Frete)
- `src/lib/supabase-admin.ts` — cliente service_role (server-side)
- `src/lib/menu-api.ts` — `getRealMenu()` conectada ao DB
- `supabase/migrations/` — migrations SQL (01→04)

### cosiararas (Lovable/Vite)
- `src/pages/MarmitaCardapio.tsx` — cardápio + checkout para marmitas normais
  - Chama `VITE_MARMITARIA_URL + '/api/mp-preference'` para criar preferência MP
  - **Requer env var `VITE_MARMITARIA_URL`** = URL do marmitaria-vendas no Vercel
- `src/pages/MarmitaCorporativa.tsx` — rota `/marmita/:slug` para corporativos
- `src/hooks/useMarmitaMenu.ts` — busca cardápio real do Supabase

### controle (React + Vite + shadcn/ui)
- `src/pages/Corporativo.tsx` — gestão de rotas corporativas
- `src/pages/Encomendas.tsx` — gestão de encomendas
- `src/pages/Financeiro.tsx` — lançamentos financeiros
- `src/pages/Marmitaria.tsx` — pedidos online + cardápio + POS
- `src/pages/RH.tsx` — gestão de recursos humanos
- `src/components/print/` — sistema de impressão

### marmitaria-print (Daemon)
- `src/index.ts` — daemon de impressão
- `.env` — `PRINT_TARGET`, IPs das impressoras, interface USB

## Mercado Pago

- SDK: `mercadopago@^2` (server-side, no marmitaria-vendas)
- IPN/webhook: `https://energetictriggerfish-n8n.cloudfy.live/webhook/marmitaria-pagamento-confirmado`
- Back URLs marmitaria-vendas: `/pedido/sucesso`, `/pedido/falha`, `/pedido/pendente`
- Back URLs cosiararas: `/pedido-confirmado?...`

## Fluxo de Checkout — cosiararas (/marmita)

1. Cliente monta pedido no cardápio
2. `supabase.insert('marmita_orders')` — client-side (anon key)
3. Fire-and-forget: `print_queue` (target: 'marmitaria') + `financial_entries`
4. `POST {VITE_MARMITARIA_URL}/api/mp-preference` → retorna `init_point`
5. Redirect para Mercado Pago

## Pendente

- [ ] Deploy `marmitaria-vendas` no Vercel
- [ ] Definir `VITE_MARMITARIA_URL` nas env vars do cosiararas
- [ ] IPs reais das impressoras no `.env` do daemon
- [ ] Rodar migrations 03 e 04 em produção (se ainda não feito)

## Rodar o Daemon

```bash
cd marmitaria-print && npm install
# Preencher .env com PRINT_TARGET, IPs das impressoras
npm run start:marmitaria   # na máquina da marmitaria (USB)
npm run start:cosi         # na máquina do Cosí (TCP)
```

## Rodar marmitaria-vendas (dev)

```bash
cd marmitaria-vendas && npm install
npm run dev   # localhost:3000
```
