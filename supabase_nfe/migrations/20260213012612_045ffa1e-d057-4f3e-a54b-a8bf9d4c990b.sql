
-- Criar tabela drinks para bebidas disponíveis
CREATE TABLE public.drinks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  volume_ml integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  emoji text DEFAULT '🥤',
  is_available boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS público para leitura
ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bebidas são públicas para leitura"
ON public.drinks FOR SELECT
USING (true);

-- Inserir bebidas iniciais
INSERT INTO public.drinks (sku, name, volume_ml, price, emoji, display_order) VALUES
  ('agua-500', 'Água Mineral', 500, 3.00, '💧', 1),
  ('coca-350', 'Coca-Cola', 350, 5.00, '🥤', 2),
  ('guarana-350', 'Guaraná', 350, 5.00, '🥤', 3),
  ('suco-laranja-300', 'Suco de Laranja', 300, 7.00, '🧃', 4);
