import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye, GripVertical, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface OpcaoPreco {
  nome: string;
  preco: number;
}

interface CampoPersonalizacao {
  nome: string;
  tipo: string;
  obrigatorio: boolean;
}

interface EncomendaProduct {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  icon: string | null;
  imagem_url: string | null;
  itens: string[] | null;
  tipo_preco: 'fixo' | 'variavel';
  preco_base: number | null;
  opcoes_preco: OpcaoPreco[] | null;
  permite_personalizacao: boolean;
  campos_personalizacao: { campos?: CampoPersonalizacao[] } | null;
  ativo: boolean;
  ordem: number;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function Encomendas() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EncomendaProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<EncomendaProduct | null>(null);
  const [previewProduct, setPreviewProduct] = useState<EncomendaProduct | null>(null);
  const [activeTab, setActiveTab] = useState('basico');

  // Form state
  const [formData, setFormData] = useState({
    slug: '', nome: '', descricao: '', icon: '',
    imagem_url: '', itensText: '',
    tipo_preco: 'fixo' as 'fixo' | 'variavel',
    preco_base: 0,
    opcoes_preco: [] as OpcaoPreco[],
    permite_personalizacao: false,
    campos_personalizacao: [] as CampoPersonalizacao[],
    ativo: true, ordem: 1,
  });
  const [novaOpcao, setNovaOpcao] = useState({ nome: '', preco: 0 });
  const [novoCampo, setNovoCampo] = useState({ nome: '', tipo: 'text', obrigatorio: true });
  const [slugManual, setSlugManual] = useState(false);

  // ===== QUERIES =====
  const { data: products, isLoading } = useQuery({
    queryKey: ['encomendas-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas_products')
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw error;
      return data as EncomendaProduct[];
    },
  });

  // ===== MUTATIONS =====
  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsedItens = formData.itensText.split('\n').map(i => i.trim()).filter(Boolean);
      const payload = {
        slug: formData.slug,
        nome: formData.nome,
        descricao: formData.descricao,
        icon: formData.icon || null,
        imagem_url: formData.imagem_url || null,
        itens: parsedItens.length > 0 ? parsedItens : null,
        tipo_preco: formData.tipo_preco,
        preco_base: formData.tipo_preco === 'fixo' ? (formData.preco_base || null) : null,
        opcoes_preco: formData.tipo_preco === 'variavel' && formData.opcoes_preco.length > 0
          ? formData.opcoes_preco : null,
        permite_personalizacao: formData.permite_personalizacao,
        campos_personalizacao: formData.permite_personalizacao && formData.campos_personalizacao.length > 0
          ? { campos: formData.campos_personalizacao } : null,
        ativo: formData.ativo,
        ordem: formData.ordem,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('encomendas_products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('encomendas_products').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingProduct ? 'Produto atualizado!' : 'Produto criado!' });
      queryClient.invalidateQueries({ queryKey: ['encomendas-products'] });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('encomendas_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Produto removido!' });
      queryClient.invalidateQueries({ queryKey: ['encomendas-products'] });
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('encomendas_products').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encomendas-products'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (product: EncomendaProduct) => {
      const { id, ...rest } = product;
      const { error } = await supabase.from('encomendas_products').insert([{
        ...rest,
        nome: `${rest.nome} (cópia)`,
        slug: `${rest.slug}-copia-${Math.random().toString(36).substring(2, 6)}`,
        ordem: (products?.length || 0) + 1,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Produto duplicado!' });
      queryClient.invalidateQueries({ queryKey: ['encomendas-products'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao duplicar', description: error.message, variant: 'destructive' });
    },
  });

  // ===== HANDLERS =====
  const openAdd = () => {
    setEditingProduct(null);
    setActiveTab('basico');
    setSlugManual(false);
    setNovaOpcao({ nome: '', preco: 0 });
    setNovoCampo({ nome: '', tipo: 'text', obrigatorio: true });
    setFormData({
      slug: '', nome: '', descricao: '', icon: '', imagem_url: '', itensText: '',
      tipo_preco: 'fixo', preco_base: 0, opcoes_preco: [],
      permite_personalizacao: false, campos_personalizacao: [],
      ativo: true, ordem: (products?.length || 0) + 1,
    });
    setDialogOpen(true);
  };

  const openEdit = (p: EncomendaProduct) => {
    setEditingProduct(p);
    setActiveTab('basico');
    setSlugManual(true);
    setNovaOpcao({ nome: '', preco: 0 });
    setNovoCampo({ nome: '', tipo: 'text', obrigatorio: true });
    setFormData({
      slug: p.slug, nome: p.nome, descricao: p.descricao,
      icon: p.icon || '', imagem_url: p.imagem_url || '',
      itensText: p.itens?.join('\n') || '',
      tipo_preco: p.tipo_preco, preco_base: p.preco_base || 0,
      opcoes_preco: (p.opcoes_preco as OpcaoPreco[]) || [],
      permite_personalizacao: p.permite_personalizacao,
      campos_personalizacao: (p.campos_personalizacao as any)?.campos || [],
      ativo: p.ativo, ordem: p.ordem,
    });
    setDialogOpen(true);
  };

  const handleNameChange = (nome: string) => {
    setFormData(prev => ({
      ...prev, nome,
      slug: slugManual ? prev.slug : generateSlug(nome),
    }));
  };

  const handleSave = () => {
    if (!formData.nome.trim() || !formData.slug.trim()) {
      toast({ title: 'Nome e slug são obrigatórios', variant: 'destructive' });
      return;
    }
    saveMutation.mutate();
  };

  const addOpcaoPreco = () => {
    if (!novaOpcao.nome.trim()) return;
    setFormData(prev => ({
      ...prev,
      opcoes_preco: [...prev.opcoes_preco, { ...novaOpcao }],
    }));
    setNovaOpcao({ nome: '', preco: 0 });
  };

  const removeOpcaoPreco = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      opcoes_preco: prev.opcoes_preco.filter((_, i) => i !== idx),
    }));
  };

  const addCampoPersonalizacao = () => {
    if (!novoCampo.nome.trim()) return;
    setFormData(prev => ({
      ...prev,
      campos_personalizacao: [...prev.campos_personalizacao, { ...novoCampo }],
    }));
    setNovoCampo({ nome: '', tipo: 'text', obrigatorio: true });
  };

  const removeCampoPersonalizacao = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      campos_personalizacao: prev.campos_personalizacao.filter((_, i) => i !== idx),
    }));
  };

  const getPrecoLabel = (p: EncomendaProduct) => {
    if (p.tipo_preco === 'fixo' && p.preco_base) return formatCurrency(p.preco_base);
    if (p.tipo_preco === 'variavel' && p.opcoes_preco?.length) {
      const min = Math.min(...p.opcoes_preco.map(o => o.preco));
      return `A partir de ${formatCurrency(min)}`;
    }
    if (p.preco_base) return formatCurrency(p.preco_base);
    return '—';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos de Encomendas</h1>
          <p className="text-muted-foreground">Gerencie cestas, tábuas, lanches e outros produtos</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Produto
        </Button>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-4 w-48 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !products?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">Nenhum produto cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">Clique em "Adicionar Produto" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card
              key={product.id}
              className={`group relative overflow-hidden ${!product.ativo ? 'opacity-60' : ''}`}
            >
              {product.imagem_url && (
                <div className="h-40 overflow-hidden">
                  <img src={product.imagem_url} alt={product.nome} className="h-full w-full object-cover" />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate">{product.nome}</h3>
                    <Badge variant="outline" className="mt-1 text-xs font-mono">{product.slug}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground">#{product.ordem}</span>
                    <Switch
                      checked={product.ativo}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: product.id, ativo: checked })}
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">{product.descricao}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={product.tipo_preco === 'fixo' ? 'default' : 'secondary'} className="text-xs">
                    {product.tipo_preco === 'fixo' ? 'Preço Fixo' : 'Preço Variável'}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">{getPrecoLabel(product)}</span>
                </div>

                <div className="flex items-center gap-1 pt-1 border-t">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(product)} className="gap-1.5 flex-1">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setPreviewProduct(product); setPreviewDialogOpen(true); }} className="gap-1.5 flex-1">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateMutation.mutate(product)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => { setDeletingProduct(product); setDeleteDialogOpen(true); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ===== ADD/EDIT DIALOG ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Adicionar Produto'}</DialogTitle>
            <DialogDescription>Configure o produto de encomenda</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="itens">Itens</TabsTrigger>
              <TabsTrigger value="preco">Preço</TabsTrigger>
              <TabsTrigger value="personalizacao">Personalização</TabsTrigger>
            </TabsList>

            {/* TAB BÁSICO */}
            <TabsContent value="basico" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" value={formData.nome} onChange={e => handleNameChange(e.target.value)}
                  placeholder="Ex: Cesta de Café da Manhã" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug *</Label>
                <Input id="slug" value={formData.slug} className="font-mono text-sm"
                  onChange={e => { setSlugManual(true); setFormData(prev => ({ ...prev, slug: e.target.value })); }}
                  placeholder="cesta-cafe-manha" disabled={!!editingProduct} />
                <p className="text-xs text-muted-foreground">URL amigável gerada automaticamente</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" value={formData.descricao} rows={3}
                  onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva o produto..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="icon">Ícone (Lucide)</Label>
                  <Input id="icon" value={formData.icon}
                    onChange={e => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="Ex: ShoppingBasket" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="imagem_url">URL da Imagem</Label>
                  <Input id="imagem_url" value={formData.imagem_url}
                    onChange={e => setFormData(prev => ({ ...prev, imagem_url: e.target.value }))}
                    placeholder="https://..." />
                  {formData.imagem_url && (
                    <img src={formData.imagem_url} alt="Preview" className="mt-1 h-20 w-full object-cover rounded-md border" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input id="ordem" type="number" min="1" value={formData.ordem}
                    onChange={e => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch id="ativo" checked={formData.ativo}
                    onCheckedChange={v => setFormData(prev => ({ ...prev, ativo: v }))} />
                  <Label htmlFor="ativo" className="cursor-pointer">Ativo</Label>
                </div>
              </div>
            </TabsContent>

            {/* TAB ITENS */}
            <TabsContent value="itens" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="itens">Itens inclusos (um por linha)</Label>
                <Textarea id="itens" value={formData.itensText} rows={8}
                  onChange={e => setFormData(prev => ({ ...prev, itensText: e.target.value }))}
                  placeholder={'Pães artesanais\nGeleias caseiras\nQueijos finos'} />
                <p className="text-xs text-muted-foreground">
                  {formData.itensText.split('\n').filter(i => i.trim()).length} iten(s)
                </p>
              </div>
            </TabsContent>

            {/* TAB PREÇO */}
            <TabsContent value="preco" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Tipo de Preço</Label>
                <Select value={formData.tipo_preco}
                  onValueChange={(v: 'fixo' | 'variavel') => setFormData(prev => ({ ...prev, tipo_preco: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixo">Fixo</SelectItem>
                    <SelectItem value="variavel">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo_preco === 'fixo' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="preco_base">Preço Base (R$)</Label>
                  <Input id="preco_base" type="number" step="0.01" min="0"
                    value={formData.preco_base}
                    onChange={e => setFormData(prev => ({ ...prev, preco_base: parseFloat(e.target.value) || 0 }))} />
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Opções de Preço</h4>
                  
                  {/* Lista de opções */}
                  {formData.opcoes_preco.length > 0 && (
                    <div className="space-y-2">
                      {formData.opcoes_preco.map((op, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          <span className="font-medium flex-1">{op.nome}</span>
                          <span className="font-mono text-sm">{formatCurrency(op.preco)}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            onClick={() => removeOpcaoPreco(idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adicionar opção */}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1.5">
                      <Label>Nome</Label>
                      <Input value={novaOpcao.nome} placeholder="Ex: P, M, G"
                        onChange={e => setNovaOpcao(prev => ({ ...prev, nome: e.target.value }))} />
                    </div>
                    <div className="w-32 space-y-1.5">
                      <Label>Preço (R$)</Label>
                      <Input type="number" step="0.01" min="0" value={novaOpcao.preco}
                        onChange={e => setNovaOpcao(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))} />
                    </div>
                    <Button onClick={addOpcaoPreco} size="sm" className="gap-1.5">
                      <Plus className="h-4 w-4" /> Adicionar
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB PERSONALIZAÇÃO */}
            <TabsContent value="personalizacao" className="space-y-4 mt-4">
              <div className="flex items-center space-x-2">
                <Switch id="permite_personalizacao" checked={formData.permite_personalizacao}
                  onCheckedChange={v => setFormData(prev => ({ ...prev, permite_personalizacao: v }))} />
                <Label htmlFor="permite_personalizacao" className="cursor-pointer">Permite personalização?</Label>
              </div>

              {formData.permite_personalizacao && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium text-foreground">Campos de Personalização</h4>

                  {formData.campos_personalizacao.length > 0 && (
                    <div className="space-y-2">
                      {formData.campos_personalizacao.map((campo, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          <span className="font-medium flex-1">{campo.nome}</span>
                          <Badge variant="outline" className="text-xs">{campo.tipo}</Badge>
                          <Badge variant={campo.obrigatorio ? 'default' : 'secondary'} className="text-xs">
                            {campo.obrigatorio ? 'Obrigatório' : 'Opcional'}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            onClick={() => removeCampoPersonalizacao(idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1.5">
                      <Label>Nome do campo</Label>
                      <Input value={novoCampo.nome} placeholder="Ex: Sabor"
                        onChange={e => setNovoCampo(prev => ({ ...prev, nome: e.target.value }))} />
                    </div>
                    <div className="w-28 space-y-1.5">
                      <Label>Tipo</Label>
                      <Select value={novoCampo.tipo}
                        onValueChange={v => setNovoCampo(prev => ({ ...prev, tipo: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="number">Número</SelectItem>
                          <SelectItem value="textarea">Texto longo</SelectItem>
                          <SelectItem value="select">Seleção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1.5 pb-0.5">
                      <Switch id="campo_obrigatorio" checked={novoCampo.obrigatorio}
                        onCheckedChange={v => setNovoCampo(prev => ({ ...prev, obrigatorio: v }))} />
                      <Label htmlFor="campo_obrigatorio" className="text-xs cursor-pointer">Obrig.</Label>
                    </div>
                    <Button onClick={addCampoPersonalizacao} size="sm" className="gap-1.5">
                      <Plus className="h-4 w-4" /> Adicionar
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto <strong>"{deletingProduct?.nome}"</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Removendo...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PREVIEW DIALOG */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview: {previewProduct?.nome}</DialogTitle>
            <DialogDescription>Visualização do produto</DialogDescription>
          </DialogHeader>
          {previewProduct && (
            <div className="space-y-4">
              {previewProduct.imagem_url && (
                <img src={previewProduct.imagem_url} alt={previewProduct.nome}
                  className="w-full h-48 object-cover rounded-lg" />
              )}
              <div>
                <h3 className="text-xl font-bold text-foreground">{previewProduct.nome}</h3>
                <p className="text-muted-foreground mt-1">{previewProduct.descricao}</p>
              </div>
              {previewProduct.itens && previewProduct.itens.length > 0 && (
                <div>
                  <p className="font-medium text-sm text-foreground mb-2">Itens inclusos:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {previewProduct.itens.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2 border-t">
                <Badge variant={previewProduct.tipo_preco === 'fixo' ? 'default' : 'secondary'}>
                  {previewProduct.tipo_preco === 'fixo' ? 'Preço Fixo' : 'Preço Variável'}
                </Badge>
                <span className="text-lg font-bold text-foreground">{getPrecoLabel(previewProduct)}</span>
              </div>
              {previewProduct.tipo_preco === 'variavel' && previewProduct.opcoes_preco?.length && (
                <div className="space-y-1">
                  {previewProduct.opcoes_preco.map((op, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{op.nome}</span>
                      <span className="font-mono">{formatCurrency(op.preco)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
