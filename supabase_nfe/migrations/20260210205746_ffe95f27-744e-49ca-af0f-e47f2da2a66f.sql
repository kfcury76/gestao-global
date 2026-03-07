
-- Tabela de rotas corporativas
CREATE TABLE public.corporate_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  empresa_nome TEXT NOT NULL,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#3B82F6',
  proteinas_disponiveis UUID[],
  carboidratos_disponiveis UUID[],
  acompanhamentos_disponiveis UUID[],
  extras_disponiveis UUID[],
  require_matricula BOOLEAN NOT NULL DEFAULT false,
  require_setor BOOLEAN NOT NULL DEFAULT false,
  require_centro_custo BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de tamanhos por rota corporativa
CREATE TABLE public.corporate_route_sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corporate_route_id UUID NOT NULL REFERENCES public.corporate_routes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  label TEXT,
  descricao TEXT,
  peso_ml TEXT,
  preco NUMERIC NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.corporate_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_route_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rotas corporativas são públicas para leitura"
ON public.corporate_routes FOR SELECT USING (true);

CREATE POLICY "Tamanhos corporativos são públicos para leitura"
ON public.corporate_route_sizes FOR SELECT USING (true);

-- Triggers de updated_at
CREATE TRIGGER update_corporate_routes_updated_at
BEFORE UPDATE ON public.corporate_routes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_corporate_route_sizes_updated_at
BEFORE UPDATE ON public.corporate_route_sizes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX idx_corporate_routes_slug ON public.corporate_routes(slug);
CREATE INDEX idx_corporate_route_sizes_route_id ON public.corporate_route_sizes(corporate_route_id);
