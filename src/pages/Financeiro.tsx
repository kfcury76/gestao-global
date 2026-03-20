import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Financeiro() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['financial-entries'],
    queryFn: async () => {
      const { data } = await supabase
        .from('financial_entries')
        .select('*')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    refetchInterval: 10000
  });

  const totalGeral = entries.reduce((sum: number, e: any) => sum + (e.total_amount || 0), 0);

  const encomendas = entries.filter((e: any) => e.order_table === 'encomendas_pedidos');
  const marmitasRegulares = entries.filter((e: any) => e.order_table === 'marmita_orders');
  const marmitaria = entries.filter((e: any) => e.business_unit === 'marmitaria');

  const totalEncomendas = encomendas.reduce((sum: number, e: any) => sum + (e.total_amount || 0), 0);
  const totalMarmitasRegulares = marmitasRegulares.reduce((sum: number, e: any) => sum + (e.total_amount || 0), 0);
  const totalMarmitaria = marmitaria.reduce((sum: number, e: any) => sum + (e.total_amount || 0), 0);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return d;
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      aprovado: 'default',
      pendente: 'secondary',
      cancelado: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const renderTable = (data: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Pagamento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              Nenhum registro encontrado
            </TableCell>
          </TableRow>
        ) : (
          data.map((e: any) => (
            <TableRow key={e.id}>
              <TableCell className="text-sm">{formatDate(e.created_at)}</TableCell>
              <TableCell className="font-medium">{e.customer_name || '—'}</TableCell>
              <TableCell>{e.customer_company || '—'}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">{e.order_table || '—'}</Badge>
              </TableCell>
              <TableCell className="capitalize">{e.payment_method || '—'}</TableCell>
              <TableCell><StatusBadge status={e.payment_status} /></TableCell>
              <TableCell className="font-semibold">{formatCurrency(e.total_amount || 0)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">💰 Financeiro</h1>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalGeral)}</p>
            <p className="text-xs text-muted-foreground">{entries.length} transações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">🥖 Encomendas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalEncomendas)}</p>
            <p className="text-xs text-muted-foreground">{encomendas.length} pedidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">🍱 Marmitas Regulares</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalMarmitasRegulares)}</p>
            <p className="text-xs text-muted-foreground">{marmitasRegulares.length} pedidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">🍱 Marmitaria Araras</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalMarmitaria)}</p>
            <p className="text-xs text-muted-foreground">{marmitaria.length} pedidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Tabelas */}
      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">Todos ({entries.length})</TabsTrigger>
          <TabsTrigger value="encomendas">🥖 Encomendas ({encomendas.length})</TabsTrigger>
          <TabsTrigger value="marmitas">🍱 Marmitas Regulares ({marmitasRegulares.length})</TabsTrigger>
          <TabsTrigger value="marmitaria">🍱 Marmitaria Araras ({marmitaria.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <Card>
            <CardContent className="p-0">
              {renderTable(entries)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encomendas">
          <Card>
            <CardContent className="p-0">
              {renderTable(encomendas)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marmitas">
          <Card>
            <CardContent className="p-0">
              {renderTable(marmitasRegulares)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marmitaria">
          <Card>
            <CardContent className="p-0">
              {renderTable(marmitaria)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
