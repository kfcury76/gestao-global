
-- Adicionar colunas ao marmita_orders para suportar o novo payload
-- items: detalhes dos itens do pedido (JSONB)
ALTER TABLE public.marmita_orders ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;

-- preference_id: ID da preferência do Mercado Pago
ALTER TABLE public.marmita_orders ADD COLUMN IF NOT EXISTS preference_id text;

-- payment_id: ID do pagamento do Mercado Pago (atualizado pelo n8n)
ALTER TABLE public.marmita_orders ADD COLUMN IF NOT EXISTS payment_id text;

-- total_amount: valor total do pedido (separado de total_price para compatibilidade)
-- Nota: total_price já existe, vamos usar ele. Não precisa de total_amount.

-- Tornar protein_id e size_id opcionais (nullable) para pedidos que não usam esses campos
ALTER TABLE public.marmita_orders ALTER COLUMN protein_id DROP NOT NULL;
ALTER TABLE public.marmita_orders ALTER COLUMN size_id DROP NOT NULL;

-- Tornar delivery_address opcional para pedidos de retirada
ALTER TABLE public.marmita_orders ALTER COLUMN delivery_address DROP NOT NULL;

-- Adicionar política de UPDATE para permitir atualização de status de pagamento
CREATE POLICY "Permitir update de status de pagamento"
ON public.marmita_orders
FOR UPDATE
USING (true)
WITH CHECK (true);
