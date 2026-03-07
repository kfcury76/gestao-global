
-- Tabela de pedidos corporativos
CREATE TABLE public.corporate_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_route_id UUID NOT NULL REFERENCES public.corporate_routes(id),
  corporate_size_id UUID NOT NULL REFERENCES public.corporate_route_sizes(id),
  
  -- Cliente
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  matricula TEXT,
  setor TEXT,
  centro_custo TEXT,
  
  -- Marmita
  meal_size_name TEXT NOT NULL,
  protein TEXT NOT NULL,
  carb TEXT,
  side_dishes TEXT[] DEFAULT '{}',
  extras TEXT[] DEFAULT '{}',
  observations TEXT,
  
  -- Bebidas
  drinks JSONB DEFAULT '[]',
  
  -- Financeiro
  marmita_price NUMERIC NOT NULL DEFAULT 0,
  drinks_total NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  
  -- Status
  payment_status TEXT NOT NULL DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'boleto_corporativo',
  
  -- Mercado Pago
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.corporate_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode criar pedidos corporativos"
ON public.corporate_orders
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Pedidos corporativos são visíveis por telefone"
ON public.corporate_orders
FOR SELECT
USING (true);

-- Trigger updated_at
CREATE TRIGGER update_corporate_orders_updated_at
BEFORE UPDATE ON public.corporate_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX idx_corporate_orders_route ON public.corporate_orders(corporate_route_id);
CREATE INDEX idx_corporate_orders_phone ON public.corporate_orders(customer_phone);
