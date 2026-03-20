import { useState } from 'react';
import { Printer, Search, Loader2 } from 'lucide-react';
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';

interface PedidoUnificado {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  total: number;
  status: string;
  created_at: string;
  tipo: 'marmita' | 'encomenda' | 'corporativo';
  dados_originais: any;
}

const fetchPedidosUnificados = async (): Promise<PedidoUnificado[]> => {
  const [marmitaRes, encRes] = await Promise.all([
    supabase.from('marmita_orders').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('encomendas_pedidos').select('*').order('created_at', { ascending: false }).limit(50),
  ]);

  return [
    ...(marmitaRes.data || []).map((p: any) => ({
      id: p.id,
      numero_pedido: p.id.slice(0, 6).toUpperCase(),
      cliente_nome: p.customer_name || 'Cliente',
      cliente_telefone: p.customer_phone || '',
      total: p.total_price || 0,
      status: p.order_status || 'pendente',
      created_at: p.created_at,
      tipo: 'marmita' as const,
      dados_originais: p,
    })),
    ...(encRes.data || []).map((p: any) => ({
      id: p.id,
      numero_pedido: (p.numero_pedido || p.id.slice(0, 6)).toUpperCase(),
      cliente_nome: p.cliente_nome || 'Cliente',
      cliente_telefone: p.cliente_telefone || '',
      total: p.valor_total || 0,
      status: p.status || 'pendente',
      created_at: p.created_at,
      tipo: 'encomenda' as const,
      dados_originais: p,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export default function Pedidos() {
  const [busca, setBusca] = useState('');
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [tipoPedido, setTipoPedido] = useState<'marmita' | 'encomenda'>('marmita');

  const { data: pedidos = [], isLoading: loading } = useQuery({
    queryKey: ['pedidos-unificados'],
    queryFn: fetchPedidosUnificados,
  });

  const handlePrint = (pedido: PedidoUnificado) => {
    setSelectedPedido(pedido.dados_originais);
    setTipoPedido(pedido.tipo === 'encomenda' ? 'encomenda' : 'marmita');
    setPrintModalOpen(true);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmado': case 'completed': case 'entregue': return 'bg-green-100 text-green-800';
      case 'pendente': case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelado': case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const tipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'marmita': return '🍱 Marmita';
      case 'encomenda': return '🎂 Encomenda';
      default: return tipo;
    }
  };

  const pedidosFiltrados = pedidos.filter(p =>
    p.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.numero_pedido.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
        <p className="text-muted-foreground">Todos os pedidos (marmitas e encomendas)</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por cliente ou número..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Nenhum pedido encontrado.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pedidosFiltrados.map((pedido) => (
            <div key={pedido.id} className="bg-card border rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-bold text-primary">#{pedido.numero_pedido}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(pedido.status)}`}>
                      {pedido.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">{tipoLabel(pedido.tipo)}</span>
                  </div>

                  <p className="font-medium text-foreground">{pedido.cliente_nome}</p>
                  {pedido.cliente_telefone && (
                    <p className="text-sm text-muted-foreground">{pedido.cliente_telefone}</p>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="font-bold text-foreground">{formatCurrency(pedido.total)}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(pedido.created_at).toLocaleDateString('pt-BR')} {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePrint(pedido)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                >
                  <Printer size={16} />
                  Imprimir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        tipo={tipoPedido}
        pedido={selectedPedido}
        projectName="Empório Cosí"
      />
    </div>
  );
}
