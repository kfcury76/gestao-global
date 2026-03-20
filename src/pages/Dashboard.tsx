import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, DollarSign, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface DashboardMetrics {
  totalPedidosHoje: number;
  faturamentoHoje: number;
  pendentesImpressao: number;
}

interface PedidoRecente {
  id: string;
  numero: string;
  cliente: string;
  total: number;
  status: string;
  created_at: string;
  tipo: string;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalPedidosHoje: 0, faturamentoHoje: 0, pendentesImpressao: 0 });
  const [pedidosRecentes, setPedidosRecentes] = useState<PedidoRecente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    try {
      const [marmitaRes, encRes, finRes, printRes] = await Promise.all([
        supabase.from('marmita_orders').select('id, customer_name, total_price, order_status, created_at').gte('created_at', startOfDay).lte('created_at', endOfDay).order('created_at', { ascending: false }),
        supabase.from('encomendas_pedidos').select('id, cliente_nome, valor_total, status, created_at').gte('created_at', startOfDay).lte('created_at', endOfDay).order('created_at', { ascending: false }),
        supabase.from('financial_entries').select('total_amount').gte('created_at', startOfDay).lte('created_at', endOfDay),
        supabase.from('print_queue').select('id').eq('print_status', 'pending'),
      ]);

      const marmitas = marmitaRes.data || [];
      const encomendas = encRes.data || [];
      const financeiro = finRes.data || [];
      const printPending = printRes.data || [];

      const totalPedidos = marmitas.length + encomendas.length;
      const faturamento = financeiro.reduce((sum, e) => sum + (e.total_amount || 0), 0);

      setMetrics({
        totalPedidosHoje: totalPedidos,
        faturamentoHoje: faturamento,
        pendentesImpressao: printPending.length,
      });

      const recentes: PedidoRecente[] = [
        ...marmitas.map((p: any) => ({ id: p.id, numero: p.id.slice(0, 6).toUpperCase(), cliente: p.customer_name || 'Cliente', total: p.total_price || 0, status: p.order_status || 'pendente', created_at: p.created_at, tipo: 'Marmita' })),
        ...encomendas.map((p: any) => ({ id: p.id, numero: p.id.slice(0, 6).toUpperCase(), cliente: p.cliente_nome || 'Cliente', total: p.valor_total || 0, status: p.status || 'pendente', created_at: p.created_at, tipo: 'Encomenda' })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);

      setPedidosRecentes(recentes);
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmado': case 'completed': case 'entregue': return 'bg-green-100 text-green-800';
      case 'pendente': case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelado': case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral dos seus negócios</p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData}>
          🔄 Atualizar
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Hoje</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.totalPedidosHoje}</p>
            <p className="text-xs text-muted-foreground">Marmitas + Encomendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(metrics.faturamentoHoje)}</p>
            <p className="text-xs text-muted-foreground">Entradas registradas (financial_entries)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes de Impressão</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.pendentesImpressao}</p>
            <p className="text-xs text-muted-foreground">Na fila de impressão</p>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Pedidos Recentes (Hoje)
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/pedidos'}>
              Ver todos →
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pedidosRecentes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum pedido hoje ainda.</p>
          ) : (
            <div className="space-y-3">
              {pedidosRecentes.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">#{p.numero} — {p.tipo}</p>
                    <p className="text-sm text-muted-foreground">{p.cliente} • {new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(p.total)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(p.status)}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
