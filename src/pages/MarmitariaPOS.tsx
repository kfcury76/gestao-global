import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const TAMANHOS = [
  { id: 'P', nome: 'Pequena', preco: 18 },
  { id: 'M', nome: 'Média', preco: 22 },
  { id: 'G', nome: 'Grande', preco: 28 }
];

const PROTEINAS = ['Frango Grelhado', 'Bisteca Suína', 'Carne Moída', 'Ovo Frito'];
const ACOMPANHAMENTOS = ['Arroz', 'Feijão', 'Farofa', 'Salada', 'Batata Frita', 'Macarrão'];

export default function MarmitariaPOS() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    tamanho: 'M',
    proteina: '',
    acomp: [] as string[],
    pagamento: 'dinheiro',
    obs: ''
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const t = TAMANHOS.find(x => x.id === form.tamanho)!;
      const oid = crypto.randomUUID();

      const { error: e1 } = await supabase
        .from('financial_entries')
        .insert({
          order_id: oid,
          order_table: 'marmita_orders',
          business_unit: 'marmitaria',
          customer_name: form.nome,
          total_amount: parseFloat(String(t.preco)),
          payment_method: form.pagamento,
          payment_status: 'aprovado',
          payment_date: new Date().toISOString(),
        });

      if (e1) throw e1;

      try {
        await supabase
          .from('marmita_orders')
          .insert({
            customer_name: form.nome,
            order_status: 'confirmed',
            payment_status: 'paid',
            payment_method: form.pagamento,
            total_price: parseFloat(String(t.preco)),
            source: 'pos',
            business_unit: 'marmitaria',
          });
      } catch (marmitaErr) {
        console.error('Erro ao inserir em marmita_orders:', marmitaErr);
      }

      const { error: e2 } = await supabase
        .from('print_queue')
        .insert({
          order_id: oid,
          order_type: 'marmitaria_interna',
          target: 'marmitaria',
          business_unit: 'marmitaria',
          customer_name: form.nome,
          customer_phone: form.telefone || null,
          order_summary: {
            customer: {
              nome: form.nome,
              telefone: form.telefone || undefined,
              observacoes: form.obs || undefined,
            },
            items: [{
              menuItem: { name: `Marmita ${t.nome} — ${form.proteina}` },
              quantity: 1,
              totalPrice: t.preco,
              selectedAdditions: form.acomp.length > 0 ? {
                acompanhamentos: form.acomp.map(a => ({ name: a, price: 0 }))
              } : {},
            }],
            total: t.preco,
          },
          print_status: 'pending',
        });

      if (e2) throw e2;
      return oid;
    },
    onSuccess: (id) => {
      toast({ title: '✅ Pedido criado!', description: `#${id.slice(0, 8)}` });
      setForm({ nome: '', telefone: '', tamanho: 'M', proteina: '', acomp: [], pagamento: 'dinheiro', obs: '' });
      queryClient.invalidateQueries({ queryKey: ['print-queue'] });
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    }
  });

  const ok = form.nome.trim() && form.proteina && form.acomp.length > 0;
  const preco = TAMANHOS.find(x => x.id === form.tamanho)!.preco;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">🍱 Marmitaria POS</h1>

      <Card className="p-6 space-y-6">
        <div>
          <label className="text-sm font-medium">Nome *</label>
          <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
        </div>

        <div>
          <label className="text-sm font-medium">Telefone</label>
          <Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
        </div>

        <div>
          <label className="text-sm font-medium">Tamanho *</label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {TAMANHOS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setForm({ ...form, tamanho: t.id })}
                className={`p-4 rounded border-2 ${form.tamanho === t.id ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-border'}`}
              >
                <p className="font-bold">{t.nome}</p>
                <p className="text-orange-600 dark:text-orange-400">R$ {t.preco.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Proteína *</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {PROTEINAS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setForm({ ...form, proteina: p })}
                className={`p-3 rounded border-2 ${form.proteina === p ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-border'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Acompanhamentos (até 3) - {form.acomp.length}/3</label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {ACOMPANHAMENTOS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  if (form.acomp.includes(a)) setForm({ ...form, acomp: form.acomp.filter(x => x !== a) });
                  else if (form.acomp.length < 3) setForm({ ...form, acomp: [...form.acomp, a] });
                }}
                disabled={!form.acomp.includes(a) && form.acomp.length >= 3}
                className={`p-3 rounded border-2 ${form.acomp.includes(a) ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-border'} disabled:opacity-50`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Pagamento *</label>
          <div className="grid grid-cols-4 gap-3 mt-2">
            {['dinheiro', 'pix', 'debito', 'credito'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setForm({ ...form, pagamento: m })}
                className={`p-3 rounded border-2 capitalize ${form.pagamento === m ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-border'}`}
              >
                {m === 'pix' ? 'PIX' : m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Observações</label>
          <Textarea value={form.obs} onChange={e => setForm({ ...form, obs: e.target.value })} rows={3} />
        </div>

        <div className="pt-4 border-t space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">TOTAL:</span>
            <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">R$ {preco.toFixed(2)}</span>
          </div>
          <Button onClick={() => mutation.mutate()} disabled={!ok || mutation.isPending} className="w-full h-16 text-xl">
            {mutation.isPending ? '⏳ Processando...' : '✅ Confirmar Pedido'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
