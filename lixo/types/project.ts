export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cpf_cnpj: string;
  created_at: string;
  updated_at: string;
}

export interface Pedido {
  id: string;
  cliente_id: string;
  cliente?: Cliente;
  status: 'pendente' | 'em_producao' | 'concluido' | 'entregue' | 'cancelado';
  valor_total: number;
  data_entrega: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface ItemPedido {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  quantidade_estoque: number;
  categoria: string;
  unidade: string;
  created_at: string;
  updated_at: string;
}

export interface Transacao {
  id: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  pedido_id?: string;
  created_at: string;
}

export interface DashboardStats {
  totalPedidos: number;
  pedidosPendentes: number;
  faturamentoMensal: number;
  clientesAtivos: number;
}

export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'usuario';
}
