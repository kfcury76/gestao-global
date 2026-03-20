import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (com fallback hardcoded)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://energetictriggerfish-supabase.cloudfy.live';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcxMjQ3MjE5LCJleHAiOjE4MDI3ODMyMTl9.ptnClNNSMAfgXzL5YkmAjY_Y1NYAOhya1u1Uzoxrolw';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('Usando variáveis de ambiente padrão do Supabase (hardcoded)');
}

// Cliente padrão — usa anon key para segurança
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = supabase;

// Tipos
export interface Project {
  id: string;
  name: string;
  slug: string;
  supabase_url: string;
  supabase_anon_key: string;
  tipo: 'vendas' | 'estoque';
  cnpj: string | null;
  logo_url: string | null;
  ativo: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'manager' | 'operator';
  avatar_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Helper para criar cliente dinâmico de cada projeto
export const createProjectClient = (project: Project) => {
  return createClient(project.supabase_url, project.supabase_anon_key);
};
