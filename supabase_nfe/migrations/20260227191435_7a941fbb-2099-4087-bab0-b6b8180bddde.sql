
CREATE TABLE public.print_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('marmita_normal', 'encomenda', 'corporativo')),
  target TEXT NOT NULL CHECK (target IN ('cosi', 'marmitaria')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode inserir na fila de impressão"
ON public.print_queue FOR INSERT WITH CHECK (true);

CREATE POLICY "Fila de impressão é pública para leitura"
ON public.print_queue FOR SELECT USING (true);

CREATE POLICY "Permitir update de status da fila"
ON public.print_queue FOR UPDATE USING (true) WITH CHECK (true);
