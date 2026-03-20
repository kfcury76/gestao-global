import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Search, Plus, Trash2, Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface MarmitaOrder {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  observations: string | null;
  items: any;
  total_price: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  source: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'confirmed': case 'entregue': return 'bg-green-100 text-green-800';
    case 'pending': case 'pendente': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': case 'cancelado': return 'bg-red-100 text-red-800';
    default: return 'bg-blue-100 text-blue-800';
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function itemsSummary(items: any): string {
  if (!items) return '—';
  if (Array.isArray(items)) {
    return items.map((i: any) => {
      const name = i.menuItem?.name || i.name || '?';
      const qty = i.quantity || 1;
      return `${qty}x ${name}`;
    }).join(', ');
  }
  return JSON.stringify(items).slice(0, 80);
}

function sourceLabel(source: string | null) {
  if (source === 'cosiararas') return { label: 'Cosí Site', cls: 'bg-purple-100 text-purple-800' };
  if (source === 'marmitaria_araras') return { label: 'Marmitaria', cls: 'bg-orange-100 text-orange-800' };
  return { label: source ?? '?', cls: 'bg-gray-100 text-gray-700' };
}

// ── Aba Pedidos Online ────────────────────────────────────────────────────────

function PedidosOnline() {
  const [busca, setBusca] = useState('');
  const [filtroSource, setFiltroSource] = useState<'todos' | 'cosiararas' | 'marmitaria_araras'>('todos');
  const queryClient = useQueryClient();

  const { data: pedidos = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['marmitaria-online-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marmita_orders')
        .select('*')
        .in('source', ['marmitaria_araras', 'cosiararas'])
        .order('created_at', { ascending: false })
        .limit(150);
      if (error) throw error;
      return (data ?? []) as MarmitaOrder[];
    },
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('marmita_orders')
        .update({ order_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marmitaria-online-orders'] }),
  });

  const filtrados = pedidos.filter(p => {
    const matchSource = filtroSource === 'todos' || p.source === filtroSource;
    const matchBusca = (p.customer_name || '').toLowerCase().includes(busca.toLowerCase())
      || (p.customer_phone || '').includes(busca)
      || p.id.toLowerCase().includes(busca.toLowerCase());
    return matchSource && matchBusca;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente, telefone..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'cosiararas', 'marmitaria_araras'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFiltroSource(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filtroSource === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                }`}
            >
              {s === 'todos' ? 'Todos' : s === 'cosiararas' ? 'Cosí Site' : 'Marmitaria'}
            </button>
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
        <span className="text-sm text-muted-foreground">{filtrados.length} pedidos</span>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          {pedidos.length === 0 ? 'Nenhum pedido ainda.' : 'Nenhum resultado.'}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map(p => {
            const src = sourceLabel(p.source);
            return (
              <Card key={p.id} className="border rounded-xl shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-primary">#{p.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${src.cls}`}>{src.label}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(p.created_at)}</span>
                  </div>

                  <div>
                    <p className="font-semibold text-sm">{p.customer_name || '—'}</p>
                    {p.customer_phone && <p className="text-xs text-muted-foreground">{p.customer_phone}</p>}
                    {p.customer_address && <p className="text-xs text-muted-foreground">📍 {p.customer_address}</p>}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{itemsSummary(p.items)}</p>

                  {p.observations && (
                    <p className="text-xs bg-amber-50 text-amber-800 rounded px-2 py-1">Obs: {p.observations}</p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-sm">{formatCurrency(p.total_price || 0)}</span>
                    <span className="text-xs capitalize text-muted-foreground">{p.payment_method}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(p.order_status)}`}>
                      {p.order_status?.toUpperCase() || 'PENDENTE'}
                    </span>
                    {p.order_status === 'pending' && (
                      <Button size="sm" variant="outline" className="h-6 text-xs"
                        onClick={() => updateStatus.mutate({ id: p.id, status: 'confirmed' })}
                        disabled={updateStatus.isPending}>
                        Confirmar
                      </Button>
                    )}
                    {p.order_status === 'confirmed' && (
                      <Button size="sm" variant="outline" className="h-6 text-xs"
                        onClick={() => updateStatus.mutate({ id: p.id, status: 'entregue' })}
                        disabled={updateStatus.isPending}>
                        Entregue
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Linha editável: preço + toggle (Copiada de Configuracoes p/ Marmitaria) ──

function PriceRow({
  label, sublabel, value, table, id,
  isActive, canToggle,
  onSave, onToggle,
}: {
  label: string;
  sublabel?: string;
  value: number;
  table: 'menu_items' | 'menu_additions';
  id: string;
  isActive?: boolean;
  canToggle?: boolean;
  onSave: (table: string, id: string, price: number) => void;
  onToggle?: (table: string, id: string, active: boolean) => void;
}) {
  const [draft, setDraft] = useState(value.toFixed(2));
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  const isDirty = Number(draft.replace(',', '.')) !== value;

  async function save() {
    setStatus('err'); // Desabilitado
    toast({ title: "Edição Bloqueada", description: "Use o Google Sheets via N8N para alterar preços.", variant: "destructive" });
    setTimeout(() => setStatus('idle'), 2500);
  }

  async function handleToggle(checked: boolean) {
    if (!onToggle) return;
    toast({ title: "Edição Bloqueada", description: "Use o Google Sheets via N8N para ativar/desativar produtos.", variant: "destructive" });
  }

  return (
    <div className={`flex items-center justify-between py-3 border-b last:border-0 gap-4 transition-opacity ${isActive === false ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {canToggle && isActive !== undefined && (
          <div className={toggling ? 'opacity-50 pointer-events-none' : ''}>
            <Switch checked={isActive} onCheckedChange={handleToggle} />
          </div>
        )}
        <span className="text-xs text-muted-foreground font-mono">R$</span>
        <input
          type="number" step="0.5" min="0"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onFocus={e => e.target.select()}
          disabled={isActive === false}
          className="w-20 text-right text-sm font-mono border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:cursor-not-allowed"
          onKeyDown={e => { if (e.key === 'Enter') save(); }}
        />
        <Button
          size="sm"
          onClick={save}
          disabled={saving || !isDirty || isActive === false}
          variant={(status === 'ok' || (isDirty && isActive !== false)) ? 'default' : 'secondary'}
          className={`h-8 px-3 text-xs ${status === 'ok' ? 'bg-green-500 hover:bg-green-600 text-white' : status === 'err' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : status === 'ok' ? 'Salvo' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}

// ── Aba Cardápio — gestão de grupos, adicionais e bebidas ────────────────────

function CardapioManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addingTo, setAddingTo] = useState<string | null>(null);  // group_id
  const [newItem, setNewItem] = useState({ name: '', price: 0 });
  const [addingBev, setAddingBev] = useState(false);
  const [newBev, setNewBev] = useState({ name: '', price: 0 });
  const [editingBevPrice, setEditingBevPrice] = useState<string | null>(null);
  const [newBevPrice, setNewBevPrice] = useState(0);

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['cosi-cardapio-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          id, name, base_price, is_active, sort_order, category_id,
          category:category_id(name),
          groups:menu_groups(
            id, title, sort_order,
            options:menu_additions(id, name, price, is_active, sort_order)
          )
        `)
        .eq('business_unit', 'cosi')
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Separar marmitas (com grupos) de bebidas (sem grupos)
  const marmitaItems = (menuItems as any[]).filter(i => (i.groups ?? []).length > 0);
  const beverageItems = (menuItems as any[]).filter(i => (i.groups ?? []).length === 0);
  const bevCategoryId = beverageItems[0]?.category_id ?? null;

  // Toggle de adição (menu_additions.is_active)
  const toggleAdditionMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('menu_additions').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cosi-cardapio-admin'] }),
    onError: (err: any) => toast({ title: 'Erro ao alterar', description: err.message, variant: 'destructive' }),
  });

  // Toggle de bebida (menu_items.is_active)
  const toggleBevMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('menu_items').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cosi-cardapio-admin'] }),
    onError: (err: any) => toast({ title: 'Erro ao alterar bebida', description: err.message, variant: 'destructive' }),
  });

  // Adicionar adição a um grupo
  const addItemMutation = useMutation({
    mutationFn: async ({ groupId, name, price }: { groupId: string; name: string; price: number }) => {
      const { error } = await supabase
        .from('menu_additions')
        .insert({ group_id: groupId, name, price, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosi-cardapio-admin'] });
      setAddingTo(null);
      setNewItem({ name: '', price: 0 });
      toast({ title: 'Item adicionado!' });
    },
    onError: (err: any) => toast({ title: 'Erro ao adicionar', description: err.message, variant: 'destructive' }),
  });

  // Remover adição
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menu_additions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosi-cardapio-admin'] });
      toast({ title: 'Item removido.' });
    },
    onError: (err: any) => toast({ title: 'Erro ao remover', description: err.message, variant: 'destructive' }),
  });

  // Adicionar bebida (novo menu_item)
  const addBevMutation = useMutation({
    mutationFn: async ({ name, price }: { name: string; price: number }) => {
      const { error } = await supabase.from('menu_items').insert({
        name, base_price: price, is_active: true, business_unit: 'cosi',
        category_id: bevCategoryId, sort_order: 99,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosi-cardapio-admin'] });
      setAddingBev(false);
      setNewBev({ name: '', price: 0 });
      toast({ title: 'Bebida adicionada!' });
    },
    onError: (err: any) => toast({ title: 'Erro ao adicionar bebida', description: err.message, variant: 'destructive' }),
  });

  // Atualizar preço de bebida
  const updateBevPriceMutation = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const { error } = await supabase.from('menu_items').update({ base_price: price }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosi-cardapio-admin'] });
      setEditingBevPrice(null);
      toast({ title: 'Preço atualizado!' });
    },
    onError: (err: any) => toast({ title: 'Erro ao atualizar preço', description: err.message, variant: 'destructive' }),
  });

  // Remover bebida (menu_item)
  const deleteBevMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosi-cardapio-admin'] });
      toast({ title: 'Bebida removida.' });
    },
    onError: (err: any) => toast({ title: 'Erro ao remover bebida', description: err.message, variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (menuItems.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-16">
        Nenhum item com business_unit='cosi' encontrado.
      </p>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      {marmitaItems.map(item => (
        <div key={item.id}>
          <h2 className="font-semibold text-base text-foreground mb-4">{item.name}</h2>

          <div className="space-y-4">
            {/* Linha para o Preço Base do Item Pai (ex: "Marmita (Cosí)") */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-foreground mb-3">Preço Base do Item</h3>
                <PriceRow
                  label={item.name}
                  value={item.base_price}
                  table="menu_items"
                  id={item.id}
                  isActive={item.is_active}
                  canToggle
                  onSave={() => queryClient.invalidateQueries({ queryKey: ['cosi-cardapio-admin'] })}
                  onToggle={(table, id, active) => toggleBevMutation.mutate({ id, is_active: active })}
                />
              </CardContent>
            </Card>

            {(item.groups ?? [])
              .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((group: any) => (
                <Card key={group.id}>
                  <CardContent className="p-4">
                    {/* Group header */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm text-foreground">{group.title}</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-7 text-xs"
                        onClick={() => {
                          setAddingTo(group.id);
                          setNewItem({ name: '', price: 0 });
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Adicionar
                      </Button>
                    </div>

                    {/* Options list */}
                    <div className="space-y-0">
                      {(group.options ?? [])
                        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                        .map((opt: any) => (
                          <PriceRow
                            key={opt.id}
                            label={opt.name}
                            value={opt.price}
                            table="menu_additions"
                            id={opt.id}
                            isActive={opt.is_active}
                            canToggle
                            onSave={() => queryClient.invalidateQueries({ queryKey: ['cosi-cardapio-admin'] })}
                            onToggle={(table, id, active) => toggleAdditionMutation.mutate({ id, is_active: active })}
                          />
                        ))}

                      {(group.options ?? []).length === 0 && addingTo !== group.id && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Nenhum item. Clique em Adicionar.
                        </p>
                      )}
                    </div>

                    {/* Inline add form */}
                    {addingTo === group.id && (
                      <div className="mt-3 pt-3 border-t flex gap-2 items-center flex-wrap">
                        <Input
                          placeholder="Nome do item"
                          value={newItem.name}
                          onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                          className="flex-1 min-w-32 h-8 text-sm"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newItem.name.trim()) {
                              addItemMutation.mutate({ groupId: group.id, name: newItem.name.trim(), price: newItem.price });
                            }
                            if (e.key === 'Escape') setAddingTo(null);
                          }}
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            placeholder="0"
                            step="0.5"
                            min="0"
                            value={newItem.price}
                            onChange={e => setNewItem(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                            className="w-20 h-8 text-sm text-center"
                          />
                        </div>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1"
                          disabled={!newItem.name.trim() || addItemMutation.isPending}
                          onClick={() => addItemMutation.mutate({ groupId: group.id, name: newItem.name.trim(), price: newItem.price })}
                        >
                          {addItemMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Salvar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs"
                          onClick={() => setAddingTo(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      {/* ── Seção Bebidas ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base text-foreground">Bebidas</h2>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-7 text-xs"
            onClick={() => { setAddingBev(true); setNewBev({ name: '', price: 0 }); }}
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 space-y-2">
            {beverageItems.length === 0 && !addingBev && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Nenhuma bebida. Clique em Adicionar.
              </p>
            )}

            {beverageItems.map((bev: any) => (
              <div
                key={bev.id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 gap-2 ${!bev.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Switch
                    checked={!!bev.is_active}
                    onCheckedChange={(checked) => toggleBevMutation.mutate({ id: bev.id, is_active: checked })}
                    disabled={toggleBevMutation.isPending}
                  />
                  <span className="text-sm font-medium truncate">{bev.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {editingBevPrice === bev.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={newBevPrice}
                        onChange={e => setNewBevPrice(parseFloat(e.target.value) || 0)}
                        className="w-20 h-7 text-sm text-center"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') updateBevPriceMutation.mutate({ id: bev.id, price: newBevPrice });
                          if (e.key === 'Escape') setEditingBevPrice(null);
                        }}
                      />
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                        disabled={updateBevPriceMutation.isPending}
                        onClick={() => updateBevPriceMutation.mutate({ id: bev.id, price: newBevPrice })}>
                        {updateBevPriceMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'OK'}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                        onClick={() => setEditingBevPrice(null)}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground gap-1 px-2"
                      onClick={() => { setEditingBevPrice(bev.id); setNewBevPrice(Number(bev.base_price)); }}
                    >
                      R$ {Number(bev.base_price).toFixed(2).replace('.', ',')}
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => { if (confirm(`Remover "${bev.name}"?`)) deleteBevMutation.mutate(bev.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {addingBev && (
              <div className="pt-2 border-t flex gap-2 items-center flex-wrap">
                <Input
                  placeholder="Nome da bebida"
                  value={newBev.name}
                  onChange={e => setNewBev(p => ({ ...p, name: e.target.value }))}
                  className="flex-1 min-w-32 h-8 text-sm"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newBev.name.trim()) addBevMutation.mutate(newBev);
                    if (e.key === 'Escape') setAddingBev(false);
                  }}
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    placeholder="0"
                    step="0.5"
                    min="0"
                    value={newBev.price}
                    onChange={e => setNewBev(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                    className="w-20 h-8 text-sm text-center"
                  />
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1"
                  disabled={!newBev.name.trim() || addBevMutation.isPending}
                  onClick={() => addBevMutation.mutate(newBev)}
                >
                  {addBevMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Salvar'}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setAddingBev(false)}>
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Marmitaria() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">🍱 Marmitaria Cosí</h1>
        <p className="text-muted-foreground text-sm mt-1">Pedidos online e gestão do cardápio</p>
      </div>

      <Tabs defaultValue="online">
        <TabsList>
          <TabsTrigger value="online">Pedidos Online</TabsTrigger>
          <TabsTrigger value="cardapio">Cardápio</TabsTrigger>
        </TabsList>

        <TabsContent value="online" className="mt-4">
          <PedidosOnline />
        </TabsContent>

        <TabsContent value="cardapio" className="mt-4">
          <CardapioManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
