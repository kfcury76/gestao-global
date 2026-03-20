import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { Copy, Pencil, Eye, Trash2, Plus } from 'lucide-react'
import CorporateMenuItems from '@/components/corporativo/CorporateMenuItems'

const BASE_URL = 'https://cosiararas.com.br/marmita'

export default function Corporativo() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<any>(null)

  // Buscar rotas corporativas
  const { data: routes, isLoading } = useQuery({
    queryKey: ['corporate-routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corporate_routes')
        .select(`
          *,
          tamanhos:corporate_route_sizes(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  // Copiar URL
  const handleCopyUrl = (slug: string) => {
    const url = `${BASE_URL}/${slug}`
    navigator.clipboard.writeText(url)
    toast({ title: 'URL copiada para área de transferência!' })
  }

  // Desativar cliente
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('corporate_routes')
        .update({ ativo: false })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Cliente desativado com sucesso' })
      queryClient.invalidateQueries({ queryKey: ['corporate-routes'] })
    },
    onError: () => {
      toast({ title: 'Erro ao desativar cliente', variant: 'destructive' })
    }
  })

  const handleDelete = async (route: any) => {
    if (confirm(`Desativar cliente ${route.empresa_nome}? Pedidos e tamanhos serão mantidos para histórico.`)) {
      deleteMutation.mutate(route.id)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">🏢 Rotas Corporativas</CardTitle>
              <CardDescription>Gerencie clientes corporativos e suas configurações de marmitas</CardDescription>
            </div>

            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) setEditingRoute(null)
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingRoute(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <CorporateRouteForm
                  route={editingRoute}
                  onClose={() => {
                    setDialogOpen(false)
                    setEditingRoute(null)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routes?.map(route => (
            <Card key={route.id} className="overflow-hidden">
              <div className="h-1.5 w-full" style={{ backgroundColor: route.cor_primaria || '#10b981' }} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {route.logo_url && (
                      <img src={route.logo_url} alt="" className="h-10 w-10 rounded object-contain" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{route.empresa_nome}</CardTitle>
                      <Badge variant="outline" className="mt-1 font-mono text-xs">
                        {route.slug}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={route.ativo ? 'default' : 'secondary'}>
                    {route.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Tamanhos: {route.tamanhos?.length || 0} configurados</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopyUrl(route.slug)}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copiar URL
                  </Button>
                </div>

                <div className="flex items-center gap-1 border-t pt-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingRoute(route)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.location.href = `/pedidos?corporate_route_id=${route.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(route)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== FORM COMPONENT =====

function CorporateRouteForm({ route, onClose }: { route: any; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('basico')

  const [form, setForm] = useState({
    empresaNome: route?.empresa_nome || '',
    slug: route?.slug || '',
    logoUrl: route?.logo_url || '',
    corPrimaria: route?.cor_primaria || '#10b981',
    observacoes: route?.observacoes || '',
    ativo: route?.ativo ?? true,
    requireMatricula: route?.require_matricula || false,
    requireSetor: route?.require_setor || false,
    requireCentroCusto: route?.require_centro_custo || false,
    tamanhos: route?.tamanhos || [],
    bebidas: (route?.bebidas_disponiveis as any[]) || []
  })

  const [novaBebida, setNovaBebida] = useState({ sku: '', name: '', price: 0 })


  const generateSlug = (empresaNome: string): string => {
    const slugBase = empresaNome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const randomStr = Math.random().toString(36).substring(2, 8)
    return `${slugBase}-${randomStr}`
  }

  const handleNomeChange = (valor: string) => {
    if (!route) {
      setForm(prev => ({ ...prev, empresaNome: valor, slug: generateSlug(valor) }))
    } else {
      setForm(prev => ({ ...prev, empresaNome: valor }))
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = route ? route.slug : form.slug

      const { data: savedRoute, error: routeError } = await supabase
        .from('corporate_routes')
        .upsert({
          id: route?.id,
          slug,
          empresa_nome: form.empresaNome,
          logo_url: form.logoUrl || null,
          cor_primaria: form.corPrimaria,
          require_matricula: form.requireMatricula,
          require_setor: form.requireSetor,
          require_centro_custo: form.requireCentroCusto,
          ativo: form.ativo,
          observacoes: form.observacoes || null,
          bebidas_disponiveis: form.bebidas
        })
        .select()
        .single()

      if (routeError) throw routeError

      // Deletar tamanhos removidos
      const tamanhosIds = form.tamanhos.map((t: any) => t.id).filter(Boolean)
      if (tamanhosIds.length > 0) {
        await supabase
          .from('corporate_route_sizes')
          .delete()
          .eq('corporate_route_id', savedRoute.id)
          .not('id', 'in', `(${tamanhosIds.join(',')})`)
      }

      // Upsert tamanhos
      for (const size of form.tamanhos) {
        await supabase
          .from('corporate_route_sizes')
          .upsert({
            id: size.id || undefined,
            corporate_route_id: savedRoute.id,
            nome: size.nome,
            label: size.label,
            descricao: size.descricao || null,
            peso_ml: size.peso || null,
            preco: size.preco,
            ordem: size.ordem,
            ativo: size.ativo ?? true
          })
      }

      return savedRoute
    },
    onSuccess: () => {
      toast({ title: 'Cliente corporativo salvo com sucesso!' })
      queryClient.invalidateQueries({ queryKey: ['corporate-routes'] })
      onClose()
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    }
  })

  const adicionarTamanho = () => {
    setForm({
      ...form,
      tamanhos: [
        ...form.tamanhos,
        {
          nome: '',
          label: '',
          descricao: '',
          peso: '',
          preco: 0,
          ordem: form.tamanhos.length + 1,
          ativo: true
        }
      ]
    })
  }

  const removerTamanho = (index: number) => {
    setForm({
      ...form,
      tamanhos: form.tamanhos.filter((_: any, i: number) => i !== index)
    })
  }


  return (
    <>
      <DialogHeader>
        <DialogTitle>{route ? 'Editar' : 'Adicionar'} Cliente Corporativo</DialogTitle>
        <DialogDescription>
          Configure o cliente corporativo, tamanhos, preços e opções disponíveis
        </DialogDescription>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basico">Básico</TabsTrigger>
          <TabsTrigger value="tamanhos">Tamanhos</TabsTrigger>
          <TabsTrigger value="opcoes">Opções</TabsTrigger>
          <TabsTrigger value="bebidas">Bebidas</TabsTrigger>
          <TabsTrigger value="campos">Campos</TabsTrigger>
        </TabsList>

        {/* Tab 1: Dados Básicos */}
        <TabsContent value="basico" className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label htmlFor="empresaNome">Nome da Empresa *</Label>
            <Input
              id="empresaNome"
              value={form.empresaNome}
              onChange={(e) => handleNomeChange(e.target.value)}
              placeholder="Ex: Avicena"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (URL) *</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="avicena-xyz123"
              disabled={!!route}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              URL: {BASE_URL}/{form.slug}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">URL do Logo</Label>
            <Input
              id="logoUrl"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Cor Primária</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.corPrimaria}
                onChange={(e) => setForm({ ...form, corPrimaria: e.target.value })}
                className="h-10 w-14 rounded border cursor-pointer"
              />
              <Input
                value={form.corPrimaria}
                onChange={(e) => setForm({ ...form, corPrimaria: e.target.value })}
                placeholder="#10b981"
                className="w-32 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações (uso interno)</Label>
            <Textarea
              id="observacoes"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Notas internas sobre o cliente..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={form.ativo}
              onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
            />
            <Label htmlFor="ativo">Ativo</Label>
          </div>
        </TabsContent>

        {/* Tab 2: Tamanhos e Preços */}
        <TabsContent value="tamanhos" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-foreground">Tamanhos Configurados</h3>
            <Button onClick={adicionarTamanho} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Adicionar Tamanho
            </Button>
          </div>

          {form.tamanhos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum tamanho configurado. Clique em "Adicionar Tamanho".
            </div>
          ) : (
            <div className="space-y-3">
              {form.tamanhos.map((size: any, index: number) => (
                <Card key={index}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Nome *</Label>
                        <Input
                          value={size.nome}
                          onChange={(e) => {
                            const newTamanhos = [...form.tamanhos]
                            newTamanhos[index] = { ...newTamanhos[index], nome: e.target.value }
                            setForm({ ...form, tamanhos: newTamanhos })
                          }}
                          placeholder="P, M, G, XG..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Label *</Label>
                        <Input
                          value={size.label}
                          onChange={(e) => {
                            const newTamanhos = [...form.tamanhos]
                            newTamanhos[index] = { ...newTamanhos[index], label: e.target.value }
                            setForm({ ...form, tamanhos: newTamanhos })
                          }}
                          placeholder="Pequeno (300g)"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Descrição</Label>
                      <Input
                        value={size.descricao}
                        onChange={(e) => {
                          const newTamanhos = [...form.tamanhos]
                          newTamanhos[index] = { ...newTamanhos[index], descricao: e.target.value }
                          setForm({ ...form, tamanhos: newTamanhos })
                        }}
                        placeholder="Ideal para 1 pessoa"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label>Peso</Label>
                        <Input
                          value={size.peso}
                          onChange={(e) => {
                            const newTamanhos = [...form.tamanhos]
                            newTamanhos[index] = { ...newTamanhos[index], peso: e.target.value }
                            setForm({ ...form, tamanhos: newTamanhos })
                          }}
                          placeholder="300g"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Preço (R$) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={size.preco}
                          onChange={(e) => {
                            const newTamanhos = [...form.tamanhos]
                            newTamanhos[index] = { ...newTamanhos[index], preco: parseFloat(e.target.value) || 0 }
                            setForm({ ...form, tamanhos: newTamanhos })
                          }}
                          placeholder="25.00"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Ordem</Label>
                        <Input
                          type="number"
                          value={size.ordem}
                          onChange={(e) => {
                            const newTamanhos = [...form.tamanhos]
                            newTamanhos[index] = { ...newTamanhos[index], ordem: parseInt(e.target.value) || 0 }
                            setForm({ ...form, tamanhos: newTamanhos })
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={size.ativo ?? true}
                          onCheckedChange={(checked) => {
                            const newTamanhos = [...form.tamanhos]
                            newTamanhos[index] = { ...newTamanhos[index], ativo: checked }
                            setForm({ ...form, tamanhos: newTamanhos })
                          }}
                        />
                        <Label>Ativo</Label>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removerTamanho(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Opções Disponíveis */}
        <TabsContent value="opcoes" className="mt-4">
          <CorporateMenuItems empresaId={route?.id} />
        </TabsContent>

        {/* Tab 4: Bebidas */}
        <TabsContent value="bebidas" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-foreground">Bebidas Disponíveis</h3>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>SKU</Label>
                  <Input
                    value={novaBebida.sku}
                    onChange={(e) => setNovaBebida({ ...novaBebida, sku: e.target.value })}
                    placeholder="coca-cola-350"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input
                    value={novaBebida.name}
                    onChange={(e) => setNovaBebida({ ...novaBebida, name: e.target.value })}
                    placeholder="Coca-Cola 350ml"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={novaBebida.price}
                    onChange={(e) => setNovaBebida({ ...novaBebida, price: parseFloat(e.target.value) || 0 })}
                    placeholder="5.00"
                  />
                </div>
              </div>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  if (!novaBebida.sku || !novaBebida.name) {
                    toast({ title: 'Preencha SKU e Nome', variant: 'destructive' })
                    return
                  }
                  setForm({ ...form, bebidas: [...form.bebidas, { ...novaBebida }] })
                  setNovaBebida({ sku: '', name: '', price: 0 })
                }}
              >
                <Plus className="h-4 w-4" />
                Adicionar Bebida
              </Button>
            </CardContent>
          </Card>

          {form.bebidas.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Nenhuma bebida configurada.
            </div>
          ) : (
            <div className="space-y-2">
              {form.bebidas.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs">{b.sku}</Badge>
                    <span className="text-sm font-medium text-foreground">{b.name}</span>
                    <span className="text-sm text-muted-foreground">R$ {Number(b.price).toFixed(2)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setForm({ ...form, bebidas: form.bebidas.filter((_: any, idx: number) => idx !== i) })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 5: Campos Extras */}
        <TabsContent value="campos" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Configure quais campos são obrigatórios no formulário de pedido.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-foreground">Matrícula obrigatória</p>
                <p className="text-sm text-muted-foreground">Funcionário deve informar matrícula</p>
              </div>
              <Switch
                checked={form.requireMatricula}
                onCheckedChange={(checked) => setForm({ ...form, requireMatricula: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-foreground">Setor obrigatório</p>
                <p className="text-sm text-muted-foreground">Funcionário deve informar setor</p>
              </div>
              <Switch
                checked={form.requireSetor}
                onCheckedChange={(checked) => setForm({ ...form, requireSetor: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-foreground">Centro de Custo obrigatório</p>
                <p className="text-sm text-muted-foreground">Funcionário deve informar centro de custo</p>
              </div>
              <Switch
                checked={form.requireCentroCusto}
                onCheckedChange={(checked) => setForm({ ...form, requireCentroCusto: checked })}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!form.empresaNome || !form.slug || saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </>
  )
}
