import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface SpecialOrder {
  id: string
  nome: string
  descricao: string | null
  categoria: string | null
  preco: number
  imagem_url: string | null
  disponivel: boolean
  display_order: number
  created_at: string
}

const CATEGORIAS = ['torta', 'bolo', 'salgado', 'doce', 'kit', 'outro']

const emptyForm = {
  nome: '',
  descricao: '',
  categoria: '',
  preco: 0,
  imagem_url: '',
  disponivel: true,
  display_order: 0,
}

export default function SpecialOrdersAdmin() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<SpecialOrder | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data: orders, isLoading } = useQuery({
    queryKey: ['special-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('special_orders')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) throw error
      return data as SpecialOrder[]
    },
  })

  const openCreate = () => {
    setEditingOrder(null)
    setForm({ ...emptyForm, display_order: (orders?.length || 0) + 1 })
    setDialogOpen(true)
  }

  const openEdit = (order: SpecialOrder) => {
    setEditingOrder(order)
    setForm({
      nome: order.nome,
      descricao: order.descricao || '',
      categoria: order.categoria || '',
      preco: order.preco,
      imagem_url: order.imagem_url || '',
      disponivel: order.disponivel,
      display_order: order.display_order,
    })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        descricao: form.descricao || null,
        categoria: form.categoria || null,
        preco: Number(form.preco),
        imagem_url: form.imagem_url || null,
        disponivel: form.disponivel,
        display_order: Number(form.display_order),
      }

      if (editingOrder) {
        const { error } = await supabase
          .from('special_orders')
          .update(payload)
          .eq('id', editingOrder.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('special_orders')
          .insert([payload])
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast({ title: editingOrder ? 'Encomenda atualizada!' : 'Encomenda criada!' })
      queryClient.invalidateQueries({ queryKey: ['special-orders'] })
      setDialogOpen(false)
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('special_orders').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Encomenda removida!' })
      queryClient.invalidateQueries({ queryKey: ['special-orders'] })
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, disponivel }: { id: string; disponivel: boolean }) => {
      const { error } = await supabase
        .from('special_orders')
        .update({ disponivel })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-orders'] })
    },
  })

  const handleDelete = (order: SpecialOrder) => {
    if (confirm(`Remover "${order.nome}"? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate(order.id)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">🎁 Encomendas Especiais</CardTitle>
              <CardDescription>Gerencie os produtos disponíveis para encomenda</CardDescription>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Encomenda
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : !orders?.length ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma encomenda cadastrada. Clique em "Adicionar Encomenda".
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Disponível</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-muted-foreground">{order.display_order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {order.imagem_url && (
                          <img
                            src={order.imagem_url}
                            alt={order.nome}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{order.nome}</div>
                          {order.descricao && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {order.descricao}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.categoria && (
                        <Badge variant="outline" className="capitalize">
                          {order.categoria}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{formatCurrency(order.preco)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={order.disponivel}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: order.id, disponivel: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(order)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(order)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Editar' : 'Nova'} Encomenda Especial</DialogTitle>
            <DialogDescription>Preencha os dados do produto de encomenda</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Torta de Frango"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descrição do produto..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(value) => setForm({ ...form, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preco">Preço (R$) *</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.preco}
                  onChange={(e) => setForm({ ...form, preco: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="imagem_url">URL da Imagem</Label>
              <Input
                id="imagem_url"
                value={form.imagem_url}
                onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                placeholder="https://..."
              />
              {form.imagem_url && (
                <img
                  src={form.imagem_url}
                  alt="Preview"
                  className="mt-2 h-24 w-24 rounded object-cover border"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="display_order">Ordem de exibição</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="disponivel"
                checked={form.disponivel}
                onCheckedChange={(checked) => setForm({ ...form, disponivel: checked })}
              />
              <Label htmlFor="disponivel">Disponível</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!form.nome || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
