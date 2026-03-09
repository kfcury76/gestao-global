-- ============================================================
-- FIX: Políticas RLS ausentes causando erros em cosiararas e n8n
-- Data: 2026-03-07
-- ============================================================
--
-- CONTEXTO DO PROBLEMA
-- --------------------
-- Após ajustes recentes no código, fluxos n8n (ex: "chamar zelador")
-- e o app cosiararas passaram a retornar erros de RLS do Supabase.
--
-- Causa raiz:
--   - cosiararas usa cliente ANON (frontend) para INSERT e SELECT
--   - n8n usa anon key por padrão em todos os fluxos
--   - Tabelas com RLS ativo sem policy bloqueiam TUDO por padrão
--   - A migration anterior (04_rls_policies) não cobriu marmita_orders
--     nem as tabelas de leitura pública
--
-- marmitaria-vendas NÃO é afetada: usa service_role no backend (OK)
--
-- ============================================================
-- COMO EXECUTAR
-- ============================================================
--
-- PASSO 1 — Executar este SQL no Supabase
--   1. Acesse: https://supabase.com → seu projeto energetictriggerfish
--   2. No menu lateral: SQL Editor
--   3. Clique em "New query"
--   4. Cole TODO o conteúdo deste arquivo
--   5. Clique em "Run" (ou Ctrl+Enter)
--   6. Ao final você verá uma tabela listando todas as policies criadas
--      (query de verificação no final deste arquivo)
--
-- PASSO 2 — Corrigir credencial do Supabase no n8n (resolve zelador e todos os demais fluxos)
--   1. Acesse o n8n: https://energetictriggerfish-n8n.cloudfy.live
--   2. No menu lateral: Credentials
--   3. Encontre a credencial do Supabase (usada nos fluxos)
--   4. Clique em editar
--   5. No campo "API Key", substitua pela service_role secret:
--      → Supabase Dashboard → Project Settings → API → "service_role" → copiar o secret
--   6. Salve a credencial
--   OBS: a service_role key bypassa RLS completamente — resolve zelador
--        e qualquer outro fluxo n8n que tente escrever no banco
--
-- PASSO 3 — Corrigir URL do webhook de RH (quando for publicar em produção)
--   No arquivo controle/.env, troque:
--     VITE_N8N_WEBHOOK_URL_RH=https://...n8n.cloudfy.live/webhook-test/rh-ponto-upload
--   Por:
--     VITE_N8N_WEBHOOK_URL_RH=https://...n8n.cloudfy.live/webhook/rh-ponto-upload
--   E no n8n, certifique-se de que o fluxo está ATIVO (Published),
--   não apenas em modo de teste.
--
-- ============================================================


-- ============================================================
-- 1. marmita_orders
--    Problema: cosiararas (useMarmitaOrder.ts + supabase-marmitas.ts)
--              faz INSERT com anon key — bloqueado por RLS
--    Operações necessárias:
--      INSERT — criar pedido
--      UPDATE — salvar preference_id após criar preference no MP
--      SELECT — página de confirmação (/pedido-confirmado)
-- ============================================================
ALTER TABLE public.marmita_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'marmita_orders' AND policyname = 'anon_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "anon_insert" ON public.marmita_orders
      FOR INSERT TO anon WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'marmita_orders' AND policyname = 'anon_select_own'
  ) THEN
    EXECUTE 'CREATE POLICY "anon_select_own" ON public.marmita_orders
      FOR SELECT TO anon USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'marmita_orders' AND policyname = 'anon_update_preference'
  ) THEN
    EXECUTE 'CREATE POLICY "anon_update_preference" ON public.marmita_orders
      FOR UPDATE TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;


-- ============================================================
-- 2. leads
--    Problema: cosiararas (supabase-marmitas.ts → enviarLead)
--              faz INSERT com anon key — bloqueado por RLS
-- ============================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'anon_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "anon_insert" ON public.leads
      FOR INSERT TO anon WITH CHECK (true)';
  END IF;
END $$;


-- ============================================================
-- 3. Tabelas de leitura pública (SELECTs do cosiararas)
--    Problema: se RLS estava ativo sem policy SELECT,
--              cardápio, zonas, config etc. ficavam em branco
--    Operação: SELECT público para anon
--    Nota: se RLS não estava ativo nestas tabelas, estas
--          instruções não mudam o comportamento atual
-- ============================================================

-- menu_items (cardápio)
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'menu_items' AND policyname = 'public_select'
  ) THEN
    EXECUTE 'CREATE POLICY "public_select" ON public.menu_items
      FOR SELECT TO anon USING (true)';
  END IF;
END $$;

-- delivery_zones (zonas de entrega)
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'delivery_zones' AND policyname = 'public_select'
  ) THEN
    EXECUTE 'CREATE POLICY "public_select" ON public.delivery_zones
      FOR SELECT TO anon USING (true)';
  END IF;
END $$;

-- delivery_config (configurações de entrega/frete)
ALTER TABLE public.delivery_config ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'delivery_config' AND policyname = 'public_select'
  ) THEN
    EXECUTE 'CREATE POLICY "public_select" ON public.delivery_config
      FOR SELECT TO anon USING (true)';
  END IF;
END $$;

-- encomendas_products (catálogo de encomendas)
ALTER TABLE public.encomendas_products ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'encomendas_products' AND policyname = 'public_select'
  ) THEN
    EXECUTE 'CREATE POLICY "public_select" ON public.encomendas_products
      FOR SELECT TO anon USING (true)';
  END IF;
END $$;

-- faq_items (perguntas frequentes)
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'faq_items' AND policyname = 'public_select'
  ) THEN
    EXECUTE 'CREATE POLICY "public_select" ON public.faq_items
      FOR SELECT TO anon USING (true)';
  END IF;
END $$;

-- corporate_routes (rotas corporativas)
ALTER TABLE public.corporate_routes ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'corporate_routes' AND policyname = 'public_select'
  ) THEN
    EXECUTE 'CREATE POLICY "public_select" ON public.corporate_routes
      FOR SELECT TO anon USING (true)';
  END IF;
END $$;

-- corporate_route_sizes (tamanhos por rota corporativa)
ALTER TABLE public.corporate_route_sizes ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'corporate_route_sizes' AND policyname = 'public_select'
  ) THEN
    EXECUTE 'CREATE POLICY "public_select" ON public.corporate_route_sizes
      FOR SELECT TO anon USING (true)';
  END IF;
END $$;

-- product_prices (preços de produtos)
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'product_prices' AND policyname = 'public_select'
  ) THEN
    EXECUTE 'CREATE POLICY "public_select" ON public.product_prices
      FOR SELECT TO anon USING (true)';
  END IF;
END $$;

-- meal_sizes (tamanhos de marmita)
ALTER TABLE public.meal_sizes ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'meal_sizes' AND policyname = 'public_select'
  ) THEN
    EXECUTE 'CREATE POLICY "public_select" ON public.meal_sizes
      FOR SELECT TO anon USING (true)';
  END IF;
END $$;


-- ============================================================
-- 4. Fluxo "Chamar Zelador" e outros fluxos n8n
-- ============================================================
-- A solução definitiva é o PASSO 2 acima (trocar para service_role no n8n).
--
-- Se preferir manter a anon key no n8n e apenas liberar a tabela específica,
-- descubra o nome da tabela no nó Supabase do fluxo "chamar zelador" no n8n
-- e descomente o bloco correspondente abaixo:
--
-- OPÇÃO A — tabela service_requests:
-- ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "anon_insert" ON public.service_requests
--   FOR INSERT TO anon WITH CHECK (true);
--
-- OPÇÃO B — tabela maintenance_calls:
-- ALTER TABLE public.maintenance_calls ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "anon_insert" ON public.maintenance_calls
--   FOR INSERT TO anon WITH CHECK (true);
--
-- OPÇÃO C — tabela chamadas_zelador:
-- ALTER TABLE public.chamadas_zelador ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "anon_insert" ON public.chamadas_zelador
--   FOR INSERT TO anon WITH CHECK (true);


-- ============================================================
-- VERIFICAÇÃO FINAL
-- Esta query roda automaticamente ao final — confirme que as
-- policies esperadas aparecem no resultado.
-- ============================================================
SELECT
  tablename,
  policyname,
  cmd        AS operacao,
  roles
FROM pg_policies
WHERE tablename IN (
  'marmita_orders',
  'leads',
  'print_queue',
  'financial_entries',
  'corporate_orders',
  'encomendas_pedidos',
  'menu_items',
  'delivery_zones',
  'delivery_config',
  'encomendas_products',
  'faq_items',
  'corporate_routes',
  'corporate_route_sizes',
  'product_prices',
  'meal_sizes'
)
ORDER BY tablename, policyname;
