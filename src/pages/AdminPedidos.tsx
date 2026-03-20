import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Printer, Package, UtensilsCrossed, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PrintQueueItem {
  id: string;
  order_id: string;
  order_number: string;
  business_unit: 'padaria' | 'marmitaria';
  customer_name: string;
  customer_phone: string;
  product_summary: string;
  order_summary: Record<string, any> | string | null;
  details: Record<string, any> | null;
  delivery_date: string | null;
  delivery_time: string | null;
  delivery_address: string | null;
  total: number;
  priority: number;
  print_status: 'pending' | 'printed' | 'erro';
  created_at: string;
}

export default function AdminPedidos() {
  const [printData, setPrintData] = useState<PrintQueueItem | null>(null);
  const queryClient = useQueryClient();

  const { data: printQueue = [], isLoading } = useQuery({
    queryKey: ['print-queue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('print_queue')
        .select('*')
        .eq('print_status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });
      return (data ?? []) as PrintQueueItem[];
    },
    refetchInterval: 5000,
  });

  const markPrintedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('print_queue')
        .update({ print_status: 'printed' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-queue'] });
      toast.success('Pedido marcado como impresso');
    },
  });

  const padaria = printQueue.filter(q => q.business_unit === 'padaria');
  const marmitaria = printQueue.filter(q => q.business_unit === 'marmitaria');

  const handlePrint = () => {
    const el = document.getElementById('print-order-content');
    if (!el) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Impressão</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px}
      .title{font-size:18px;font-weight:bold;text-align:center;margin-bottom:16px;border-bottom:2px solid #000;padding-bottom:8px}
      .row{margin-bottom:6px;font-size:14px}.label{font-weight:bold}.total{font-size:18px;font-weight:bold;margin-top:12px;border-top:2px solid #000;padding-top:8px;text-align:right}
      .detail-item{margin-left:12px;font-size:13px;color:#333}
      @media print{body{padding:0}}</style></head><body>${el.innerHTML}
      <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script></body></html>`);
    w.document.close();
    if (printData) {
      markPrintedMutation.mutate(printData.id);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return d; }
  };

  const renderOrderCard = (item: PrintQueueItem) => {
    const summary = typeof item.order_summary === 'string'
      ? (() => { try { return JSON.parse(item.order_summary) } catch { return {} } })()
      : item.order_summary;
    const items = summary?.items || [];
    const produto = items.map((i: any) => i.name).join(', ') || item.product_summary || '—';
    const valor = summary?.total || item.total || 0;
    const numero = item.order_number || item.order_id?.slice(0, 8) || item.id;

    return (
      <Card key={item.id} className="mb-3">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary">🖨️ {numero}</span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => markPrintedMutation.mutate(item.id)} className="gap-1.5">
                <CheckCircle className="h-4 w-4" /> Marcar Impresso
              </Button>
              <Button size="sm" onClick={() => setPrintData(item)} className="gap-1.5">
                <Printer className="h-4 w-4" /> Imprimir
              </Button>
            </div>
          </div>
          <p className="text-sm"><span className="font-medium">Cliente:</span> {item.customer_name}</p>
          <p className="text-sm"><span className="font-medium">Telefone:</span> {item.customer_phone}</p>
          <p className="text-sm"><span className="font-medium">Produto:</span> {produto}</p>
          <div className="flex items-center justify-between text-sm">
            <span><span className="font-medium">Valor:</span> {formatCurrency(valor)}</span>
            {item.delivery_date && <span className="text-muted-foreground">{formatDate(item.delivery_date)}</span>}
          </div>
          {item.priority > 0 && (
            <span className="text-xs bg-destructive/15 text-destructive rounded-full px-2 py-0.5">Prioridade {item.priority}</span>
          )}
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ label }: { label: string }) => (
    <div className="text-center py-12 text-muted-foreground">
      Nenhum pedido de {label} pendente para impressão.
    </div>
  );

  const Loading = () => (
    <div className="text-center py-12 text-muted-foreground">Carregando...</div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pedidos para Impressão</h1>

      <Tabs defaultValue="padaria">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="padaria" className="gap-1.5">
            <Package className="h-4 w-4" /> Padaria
            {padaria.length > 0 && <span className="ml-1 text-xs bg-primary/15 text-primary rounded-full px-1.5">{padaria.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="marmitaria" className="gap-1.5">
            <UtensilsCrossed className="h-4 w-4" /> Marmitaria
            {marmitaria.length > 0 && <span className="ml-1 text-xs bg-primary/15 text-primary rounded-full px-1.5">{marmitaria.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="padaria">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Fila de Impressão — Padaria</h3>
          {isLoading ? <Loading /> : padaria.length === 0 ? <EmptyState label="padaria" /> :
            padaria.map(renderOrderCard)}
        </TabsContent>

        <TabsContent value="marmitaria">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Fila de Impressão — Marmitaria</h3>
          {isLoading ? <Loading /> : marmitaria.length === 0 ? <EmptyState label="marmitaria" /> :
            marmitaria.map(renderOrderCard)}
        </TabsContent>
      </Tabs>

      {/* Print Modal */}
      <Dialog open={!!printData} onOpenChange={() => setPrintData(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Imprimir Pedido</DialogTitle>
          </DialogHeader>

          {printData && (() => {
            const summary = typeof printData.order_summary === 'string'
              ? (() => { try { return JSON.parse(printData.order_summary) } catch { return {} } })()
              : printData.order_summary;
            const items = summary?.items || [];
            const produto = items.map((i: any) => i.name).join(', ') || printData.product_summary || '—';
            const valor = summary?.total || printData.total || 0;
            const numero = printData.order_number || printData.order_id?.slice(0, 8) || printData.id;

            return (
              <div id="print-order-content" className="space-y-2 text-sm">
                <div className="text-center font-bold text-lg border-b-2 border-foreground pb-2">
                  PEDIDO #{numero}
                </div>
                <p><span className="font-bold">Cliente:</span> {printData.customer_name}</p>
                <p><span className="font-bold">Telefone:</span> {printData.customer_phone}</p>
                <p><span className="font-bold">Produto:</span> {produto}</p>

                {items.length > 0 && (
                  <div>
                    <span className="font-bold">Detalhes:</span>
                    {items.map((item: any, i: number) => (
                      <div key={i} className="ml-3 text-muted-foreground">
                        <p>- {item.name}: {item.quantity}x</p>
                        {item.details?.proteina && <p className="ml-3">Proteína: {item.details.proteina}</p>}
                        {item.details?.acompanhamentos?.length > 0 && (
                          <p className="ml-3">Acomp: {item.details.acompanhamentos.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {printData.delivery_date && (
                  <p><span className="font-bold">Entrega:</span> {formatDate(printData.delivery_date)}{printData.delivery_time ? ` às ${printData.delivery_time}` : ''}</p>
                )}
                {printData.delivery_address && (
                  <p><span className="font-bold">Endereço:</span> {printData.delivery_address}</p>
                )}

                {summary?.notes && (
                  <p><span className="font-bold">Obs:</span> {summary.notes}</p>
                )}

                <div className="text-right font-bold text-lg border-t-2 border-foreground pt-2 mt-3">
                  TOTAL: {formatCurrency(valor)}
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPrintData(null)}>Fechar</Button>
            <Button onClick={handlePrint} className="gap-1.5">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
