import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Addition = { id: string; name: string; price: number; is_active: boolean };
type Group = { id: string; title: string; options: Addition[] };
type MenuItem = { id: string; name: string; base_price: number; is_active: boolean; category: { name: string } | null; groups: Group[] };
type Delivery = { id: string; label: string; fee: number };

// ── Toggle ativo/inativo ───────────────────────────────────────────────────────

function Toggle({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${active ? 'bg-green-500' : 'bg-muted'
        }`}
      title={active ? 'Desativar' : 'Ativar'}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0'
          }`}
      />
    </button>
  );
}

// ── Linha editável: preço + toggle ────────────────────────────────────────────

function PriceRow({
  label, sublabel, value, table, id,
  isActive, canToggle,
  onSave, onToggle,
}: {
  label: string;
  sublabel?: string;
  value: number;
  table: 'menu_items' | 'menu_additions' | 'delivery_config';
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
    setStatus('err');
    toast.error('Use o Google Sheets via N8N para alterar preços.');
    setTimeout(() => setStatus('idle'), 2500);
  }

  async function handleToggle(active: boolean) {
    if (!onToggle) return;
    toast.error('Use o Google Sheets via N8N para ativar/desativar produtos.');
  }

  return (
    <div className={`flex items-center justify-between py-3 border-b last:border-0 gap-4 transition-opacity ${isActive === false ? 'opacity-50' : ''
      }`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {canToggle && isActive !== undefined && (
          <div className={toggling ? 'opacity-50 pointer-events-none' : ''}>
            <Toggle active={isActive} onChange={handleToggle} />
          </div>
        )}
        <span className="text-xs text-muted-foreground font-mono">R$</span>
        <input
          type="number" step="0.01" min="0"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onFocus={e => e.target.select()}
          disabled={isActive === false}
          className="w-24 text-right text-sm font-mono border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:cursor-not-allowed"
        />
        <button
          onClick={save}
          disabled={saving || !isDirty || isActive === false}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-w-[56px] ${status === 'ok' ? 'bg-green-500 text-white' :
              status === 'err' ? 'bg-red-500 text-white' :
                isDirty && isActive !== false ? 'bg-primary text-primary-foreground hover:opacity-90' :
                  'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
        >
          {saving ? '...' : status === 'ok' ? 'Salvo!' : status === 'err' ? 'Erro' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

// ── Bloco de seção ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border rounded-xl p-5 bg-card">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ── Seção de Bebidas com CRUD ─────────────────────────────────────────────────

function BebidasSection({
  bebidas,
  onSave,
  onToggle,
  onRefresh,
}: {
  bebidas: MenuItem[];
  onSave: (table: string, id: string, price: number) => void;
  onToggle: (table: string, id: string, active: boolean) => void;
  onRefresh: () => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!newName.trim() || !newPrice) return;
    const price = Number(newPrice.replace(',', '.'));
    if (isNaN(price) || price < 0) {
      toast.error('Preço inválido');
      return;
    }

    setCreating(true);
    try {
      // Buscar categoria de Bebidas
      const { data: categoryData } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('name', 'Bebidas')
        .single();

      if (!categoryData) {
        toast.error('Categoria Bebidas não encontrada');
        return;
      }

      const { error } = await supabase.from('menu_items').insert({
        name: newName.trim(),
        base_price: price,
        category_id: categoryData.id,
        business_unit: 'marmitaria',
        is_active: true,
        sort_order: 999,
      });

      if (error) throw error;

      toast.success(`${newName} adicionado com sucesso`);
      setNewName('');
      setNewPrice('');
      setShowAddForm(false);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao criar bebida');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja remover "${name}"?`)) return;

    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      toast.success(`${name} removido com sucesso`);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao deletar bebida');
    }
  }

  return (
    <div className="space-y-3">
      {/* Botão Adicionar */}
      <button
        type="button"
        onClick={() => setShowAddForm(!showAddForm)}
        className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${showAddForm
            ? 'bg-muted text-foreground hover:bg-muted/80'
            : 'bg-primary text-primary-foreground hover:opacity-90'
          }`}
      >
        <span className="text-lg">{showAddForm ? '−' : '+'}</span>
        <span>{showAddForm ? 'Cancelar' : 'Adicionar Nova Bebida'}</span>
      </button>

      {/* Formulário */}
      {showAddForm && (
        <div className="border rounded-xl p-4 bg-card space-y-3">
          <h4 className="font-semibold text-sm">Nova Bebida</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nome da bebida"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground font-mono">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !newName.trim() || !newPrice}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors text-sm"
          >
            {creating ? 'Criando...' : 'Criar Bebida'}
          </button>
        </div>
      )}

      {/* Lista */}
      <Section title="Bebidas">
        {bebidas.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">Nenhuma bebida cadastrada.</p>
        ) : (
          bebidas.map(bev => (
            <div key={bev.id} className="flex items-center gap-2">
              <div className="flex-1">
                <PriceRow
                  label={bev.name}
                  sublabel={!bev.is_active ? 'Inativo — não aparece no app' : undefined}
                  value={bev.base_price}
                  table="menu_items"
                  id={bev.id}
                  isActive={bev.is_active}
                  canToggle
                  onSave={onSave}
                  onToggle={onToggle}
                />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(bev.id, bev.name)}
                className="px-2 py-1 rounded-lg text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors shrink-0 h-8"
                title="Remover bebida"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </Section>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function Configuracoes() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['cosi_admin_prices'],
    queryFn: async () => {
      const [itemsRes, deliveryRes] = await Promise.all([
        supabase
          .from('menu_items')
          .select(`
            id, name, base_price, is_active,
            category:category_id(name),
            groups:menu_groups(
              id, title, sort_order,
              options:menu_additions(id, name, price, is_active, sort_order)
            )
          `)
          // sem filtro is_active=true: admin vê tudo, inclusive inativos
          .eq('business_unit', 'marmitaria')
          .order('sort_order', { ascending: true }),

        supabase
          .from('delivery_config')
          .select('id, label, fee')
          .eq('business_unit', 'marmitaria'),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      return { items: (itemsRes.data ?? []) as MenuItem[], delivery: (deliveryRes.data ?? []) as Delivery[] };
    },
  });

  function handleSave(table: string, id: string, price: number) {
    qc.setQueryData(['cosi_admin_prices'], (old: any) => {
      if (!old) return old;
      if (table === 'menu_items') {
        return { ...old, items: old.items.map((i: MenuItem) => i.id === id ? { ...i, base_price: price } : i) };
      }
      if (table === 'delivery_config') {
        return { ...old, delivery: old.delivery.map((d: Delivery) => d.id === id ? { ...d, fee: price } : d) };
      }
      if (table === 'menu_additions') {
        return {
          ...old,
          items: old.items.map((i: MenuItem) => ({
            ...i,
            groups: i.groups.map((g: Group) => ({
              ...g,
              options: g.options.map((o: Addition) => o.id === id ? { ...o, price } : o),
            })),
          })),
        };
      }
      return old;
    });
  }

  function handleToggle(table: string, id: string, active: boolean) {
    qc.setQueryData(['cosi_admin_prices'], (old: any) => {
      if (!old) return old;
      if (table === 'menu_items') {
        return { ...old, items: old.items.map((i: MenuItem) => i.id === id ? { ...i, is_active: active } : i) };
      }
      if (table === 'menu_additions') {
        return {
          ...old,
          items: old.items.map((i: MenuItem) => ({
            ...i,
            groups: i.groups.map((g: Group) => ({
              ...g,
              options: g.options.map((o: Addition) => o.id === id ? { ...o, is_active: active } : o),
            })),
          })),
        };
      }
      return old;
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-destructive text-sm py-8">Erro ao carregar dados do cardápio.</p>;
  }

  const marmitaItem = data.items.find(i => i.category?.name === 'Marmitas');
  const bebidas = data.items.filter(i => i.category?.name === 'Bebidas');
  const proteinGrp = marmitaItem?.groups.find(g => /prote/i.test(g.title));
  const adicionais = marmitaItem?.groups.find(g => /adiciona/i.test(g.title));
  const sobremesas = marmitaItem?.groups.find(g => /sobreme/i.test(g.title));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Preços — Cosí Araras</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Alterações salvas aqui refletem imediatamente em <strong>cosiararas.com.br</strong>
        </p>
      </div>

      {/* Tamanhos */}
      {marmitaItem && (
        <Section title="Tamanhos">
          <PriceRow
            label="Marmita Pequena (base)"
            sublabel="Preço base sem proteína — individual"
            value={marmitaItem.base_price}
            table="menu_items"
            id={marmitaItem.id}
            onSave={handleSave}
          />
          <div className="flex items-center justify-between py-3 border-b last:border-0 gap-4 opacity-50">
            <div className="flex-1">
              <p className="text-sm font-medium">Marmita Família (base)</p>
              <p className="text-xs text-muted-foreground">~4 porções — constante no código (R$ 80,00)</p>
            </div>
            <span className="text-sm font-mono text-muted-foreground">R$ 80,00 *</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * O preço Família e seus surcharges por proteína são constantes no código. Para alterá-los solicite um deploy.
          </p>
        </Section>
      )}

      {/* Proteínas */}
      {proteinGrp && (
        <Section title="Proteínas — surcharge sobre Pequena">
          {proteinGrp.options
            .slice()
            .sort((a, b) => a.price - b.price)
            .map(opt => (
              <PriceRow
                key={opt.id}
                label={opt.name}
                sublabel={opt.is_active ? `Total Pequena: R$ ${(marmitaItem!.base_price + opt.price).toFixed(2)}` : 'Inativo — não aparece no app'}
                value={opt.price}
                table="menu_additions"
                id={opt.id}
                isActive={opt.is_active}
                canToggle
                onSave={handleSave}
                onToggle={handleToggle}
              />
            ))}
        </Section>
      )}

      {/* Adicionais */}
      {adicionais && (
        <Section title="Adicionais">
          {adicionais.options.map(opt => (
            <PriceRow
              key={opt.id}
              label={opt.name}
              sublabel={!opt.is_active ? 'Inativo — não aparece no app' : undefined}
              value={opt.price}
              table="menu_additions"
              id={opt.id}
              isActive={opt.is_active}
              canToggle
              onSave={handleSave}
              onToggle={handleToggle}
            />
          ))}
        </Section>
      )}

      {/* Sobremesas */}
      {sobremesas && (
        <Section title="Sobremesas">
          {sobremesas.options.map(opt => (
            <PriceRow
              key={opt.id}
              label={opt.name}
              sublabel={!opt.is_active ? 'Inativo — não aparece no app' : undefined}
              value={opt.price}
              table="menu_additions"
              id={opt.id}
              isActive={opt.is_active}
              canToggle
              onSave={handleSave}
              onToggle={handleToggle}
            />
          ))}
        </Section>
      )}

      {/* Bebidas */}
      <BebidasSection
        bebidas={bebidas}
        onSave={handleSave}
        onToggle={handleToggle}
        onRefresh={() => qc.invalidateQueries({ queryKey: ['cosi_admin_prices'] })}
      />

      {/* Frete */}
      {data.delivery.length > 0 && (
        <Section title="Frete">
          {data.delivery.map(d => (
            <PriceRow
              key={d.id}
              label={d.label}
              sublabel={d.fee === 0 ? 'Retirada no local' : undefined}
              value={d.fee}
              table="delivery_config"
              id={d.id}
              onSave={handleSave}
            />
          ))}
        </Section>
      )}
    </div>
  );
}
