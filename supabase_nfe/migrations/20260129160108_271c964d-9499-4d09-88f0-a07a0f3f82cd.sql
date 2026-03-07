-- Tabela de pedidos de marmita
CREATE TABLE public.marmita_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  size_id UUID NOT NULL REFERENCES public.marmita_sizes(id),
  protein_id UUID NOT NULL REFERENCES public.proteins(id),
  sides JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_address TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.marmita_orders ENABLE ROW LEVEL SECURITY;

-- Política para inserção pública (qualquer um pode criar pedido)
CREATE POLICY "Qualquer um pode criar pedidos"
ON public.marmita_orders
FOR INSERT
WITH CHECK (true);

-- Política de leitura (apenas por phone - para buscar próprios pedidos)
CREATE POLICY "Clientes podem ver seus pedidos pelo telefone"
ON public.marmita_orders
FOR SELECT
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_marmita_orders_updated_at
BEFORE UPDATE ON public.marmita_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();