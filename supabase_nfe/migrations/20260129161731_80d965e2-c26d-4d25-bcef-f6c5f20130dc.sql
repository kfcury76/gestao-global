-- Criar tabela de zonas de entrega
CREATE TABLE public.delivery_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  bairros text[] NOT NULL DEFAULT '{}',
  taxa_entrega numeric NOT NULL DEFAULT 0,
  tempo_estimado text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela de configurações de preços
CREATE TABLE public.config_precos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave text NOT NULL UNIQUE,
  valor_numerico numeric,
  descricao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Adicionar campos na tabela marmita_orders
ALTER TABLE public.marmita_orders
ADD COLUMN delivery_zone_id uuid REFERENCES public.delivery_zones(id),
ADD COLUMN delivery_fee numeric NOT NULL DEFAULT 0,
ADD COLUMN discount numeric NOT NULL DEFAULT 0,
ADD COLUMN final_total numeric NOT NULL DEFAULT 0;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_precos ENABLE ROW LEVEL SECURITY;

-- Políticas para delivery_zones (leitura pública)
CREATE POLICY "Zonas de entrega são públicas para leitura"
ON public.delivery_zones
FOR SELECT
USING (true);

-- Políticas para config_precos (leitura pública)
CREATE POLICY "Configurações de preços são públicas para leitura"
ON public.config_precos
FOR SELECT
USING (true);

-- Atualizar max_sides para Grande (5) e Família (5)
UPDATE public.marmita_sizes SET max_sides = 5 WHERE name = 'Grande';
UPDATE public.marmita_sizes SET max_sides = 5 WHERE name = 'Família';

-- Inserir zona de retirada no local
INSERT INTO public.delivery_zones (nome, bairros, taxa_entrega, tempo_estimado, ativo)
VALUES ('Retirada no Local', ARRAY['Retirada'], 0, 'Imediato', true);

-- Inserir configuração de frete grátis
INSERT INTO public.config_precos (chave, valor_numerico, descricao)
VALUES ('frete_gratis_acima', 50.00, 'Valor mínimo do subtotal para frete grátis');