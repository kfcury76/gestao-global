-- Criar tabela daily_menu para cardápio do dia
CREATE TABLE public.daily_menu (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lista_buffet text[] NOT NULL DEFAULT '{}',
  texto_quentes text NOT NULL DEFAULT '',
  texto_saladas text NOT NULL DEFAULT '',
  marmita_especial text,
  tem_buffet boolean NOT NULL DEFAULT true,
  data_cardapio date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_menu ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Cardápio do dia é público para leitura"
ON public.daily_menu
FOR SELECT
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_daily_menu_updated_at
BEFORE UPDATE ON public.daily_menu
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir cardápio inicial de exemplo
INSERT INTO public.daily_menu (lista_buffet, texto_quentes, texto_saladas, marmita_especial, tem_buffet)
VALUES (
  ARRAY['Frango Grelhado', 'Carne de Panela', 'Peixe ao Molho', 'Arroz Branco', 'Feijão Carioca', 'Farofa Especial'],
  'Frango grelhado com ervas, carne de panela com legumes, peixe ao molho de tomate',
  'Salada verde mista, tomate com cebola, beterraba ralada, cenoura temperada',
  'Marmita Executiva com Picanha',
  true
);