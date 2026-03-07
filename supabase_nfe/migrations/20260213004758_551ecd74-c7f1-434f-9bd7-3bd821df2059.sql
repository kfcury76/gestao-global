-- Adicionar coluna bebidas_disponiveis na tabela corporate_routes
ALTER TABLE public.corporate_routes 
ADD COLUMN IF NOT EXISTS bebidas_disponiveis jsonb DEFAULT '[]'::jsonb;