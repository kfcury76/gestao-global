-- Criar tabela product_prices para precificação dinâmica por empresa
CREATE TABLE public.product_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL,
  price_table TEXT NOT NULL DEFAULT 'default',
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sku, price_table)
);

-- Enable RLS
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Preços são públicos para leitura"
ON public.product_prices
FOR SELECT
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_product_prices_updated_at
BEFORE UPDATE ON public.product_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir preços padrão
INSERT INTO public.product_prices (sku, price_table, price, description) VALUES
('marmita-p', 'default', 12.00, 'Marmita Pequena'),
('marmita-m', 'default', 15.00, 'Marmita Média'),
('marmita-g', 'default', 18.00, 'Marmita Grande'),
('taxa-entrega', 'default', 5.00, 'Taxa de Entrega');