-- Tabela de tamanhos de marmita
CREATE TABLE public.marmita_sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_sides INTEGER NOT NULL DEFAULT 3,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de proteínas
CREATE TABLE public.proteins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  available BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de acompanhamentos
CREATE TABLE public.sides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.marmita_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proteins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sides ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (cardápio é público)
CREATE POLICY "Marmita sizes são públicos para leitura"
  ON public.marmita_sizes FOR SELECT
  USING (true);

CREATE POLICY "Proteínas são públicas para leitura"
  ON public.proteins FOR SELECT
  USING (true);

CREATE POLICY "Acompanhamentos são públicos para leitura"
  ON public.sides FOR SELECT
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_marmita_sizes_updated_at
  BEFORE UPDATE ON public.marmita_sizes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proteins_updated_at
  BEFORE UPDATE ON public.proteins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sides_updated_at
  BEFORE UPDATE ON public.sides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais de tamanhos
INSERT INTO public.marmita_sizes (name, description, base_price, max_sides) VALUES
  ('Pequena', 'Ideal para uma refeição leve', 18.00, 2),
  ('Média', 'Porção padrão', 25.00, 3),
  ('Grande', 'Para quem tem mais apetite', 32.00, 4),
  ('Família', 'Serve até 3 pessoas', 55.00, 5);

-- Inserir proteínas de exemplo
INSERT INTO public.proteins (name, description, price) VALUES
  ('Frango Grelhado', 'Peito de frango grelhado temperado', 0.00),
  ('Carne de Panela', 'Carne bovina cozida lentamente', 5.00),
  ('Linguiça Toscana', 'Linguiça grelhada na brasa', 3.00),
  ('Bife Acebolado', 'Bife bovino com cebolas caramelizadas', 6.00),
  ('Filé de Peixe', 'Filé de tilápia grelhado', 4.00),
  ('Ovo Frito', 'Dois ovos fritos', 0.00);

-- Inserir acompanhamentos de exemplo
INSERT INTO public.sides (name, category) VALUES
  ('Arroz Branco', 'base'),
  ('Arroz Integral', 'base'),
  ('Feijão Preto', 'base'),
  ('Feijão Carioca', 'base'),
  ('Salada Verde', 'salada'),
  ('Salada de Tomate', 'salada'),
  ('Legumes Grelhados', 'legumes'),
  ('Purê de Batata', 'legumes'),
  ('Farofa Artesanal', 'extras'),
  ('Vinagrete', 'extras');