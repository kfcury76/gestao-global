
CREATE TABLE public.financial_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  order_table TEXT NOT NULL,
  business_unit TEXT NOT NULL,
  customer_name TEXT,
  customer_company TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pendente',
  payment_date TIMESTAMP WITH TIME ZONE,
  print_status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode inserir financial_entries"
ON public.financial_entries FOR INSERT WITH CHECK (true);

CREATE POLICY "Financial entries são públicas para leitura"
ON public.financial_entries FOR SELECT USING (true);

CREATE POLICY "Permitir update de financial_entries"
ON public.financial_entries FOR UPDATE USING (true) WITH CHECK (true);

CREATE TRIGGER update_financial_entries_updated_at
BEFORE UPDATE ON public.financial_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
