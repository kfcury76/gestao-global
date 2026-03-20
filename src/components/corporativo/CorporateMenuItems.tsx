import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'

interface CorporateMenuItemsProps {
  empresaId: string | undefined
}

interface MenuItem {
  id: string
  corporate_route_id: string
  categoria: string
  nome: string
  preco_adicional: number
  ativo: boolean
  created_at: string
}

interface ItemForm {
  nome: string
  preco_adicional: number
  ativo: boolean
}

const CATEGORIAS = [
  { value: 'proteina', label: 'Proteínas' },
  { value: 'acompanhamento', label: 'Acompanhamentos' },
  { value: 'extra', label: 'Extras' },
] as const

const defaultForm: ItemForm = { nome: '', preco_adicional: 0, ativo: true }

export default function CorporateMenuItems({ empresaId }: CorporateMenuItemsProps) {
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState('proteina')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemForm, setItemForm] = useState<ItemForm>(defaultForm)

  const { data: items, isLoading } = useQuery({
    queryKey: ['corporate-menu-items', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corporate_menu_items')
        .select('*')
        .eq('corporate_route_id', empresaId!)
        .order('nome')
      if (error) throw error
      return data as MenuItem[]
    },
    enabled: !!empresaId,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!itemForm.nome.trim()) throw new Error('Nome é obrigatório')

      const payload = {
        corporate_route_id: empresaId!,
        categoria: activeCategory,
        nome: itemForm.nome.trim(),
        preco_adicional: itemForm.preco_adicional,
        ativo: itemForm.ativo,
      }

      if (editingItem) {
        const { error } = await supabase
          .from('corporate_menu_items')
          .update(payload)
          .eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('corporate_menu_items')
          .insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast({ title: editingItem ? 'Item atualizado!' : 'Item adicionado!' })
      queryClient.invalidateQueries({ queryKey: ['corporate-menu-items', empresaId] })
      closeModal()
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar item', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('corporate_menu_items')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Item removido!' })
      queryClient.invalidateQueries({ queryKey: ['corporate-menu-items', empresaId] })
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover item', description: error.message, variant: 'destructive' })
    },
  })

  const closeModal = () => {
    setModalOpen(false)
    setEditingItem(null)
    setItemForm(defaultForm)
  }

  const openAdd = () => {
    setEditingItem(null)
    setItemForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditingItem(item)
    setItemForm({ nome: item.nome, preco_adicional: item.preco_adicional, ativo: item.ativo })
    setModalOpen(true)
  }

  const handleDelete = (item: MenuItem) => {
    if (confirm(`Remover "${item.nome}"?`)) {
      deleteMutation.mutate(item.id)
    }
  }

  if (!empresaId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Salve o cliente primeiro para gerenciar os itens do cardápio.
      </div>
    )
  }

  const categoryLabel = CATEGORIAS.find(c => c.value === activeCategory)?.label || ''
  const filteredItems = items?.filter(i => i.categoria === activeCategory) || []

  return (
    <>
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-3">
          {CATEGORIAS.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIAS.map(cat => {
          const catItems = items?.filter(i => i.categoria === cat.value) || []
          return (
            <TabsContent key={cat.value} value={cat.value} className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{cat.label}</h3>
                <Button size="sm" className="gap-1.5" onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Carregando...</div>
              ) : catItems.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum item cadastrado. Clique em "Adicionar".
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Preço Adicional</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell>
                          {item.preco_adicional > 0
                            ? formatCurrency(item.preco_adicional)
                            : <span className="text-muted-foreground">Grátis</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.ativo ? 'default' : 'secondary'}>
                            {item.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(item)}
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
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Modal Adicionar/Editar */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar' : 'Adicionar'} Item - {categoryLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="item-nome">Nome do item *</Label>
              <Input
                id="item-nome"
                value={itemForm.nome}
                onChange={(e) => setItemForm({ ...itemForm, nome: e.target.value })}
                placeholder="Ex: Frango Grelhado"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-preco">Preço adicional (R$)</Label>
              <Input
                id="item-preco"
                type="number"
                step="0.01"
                min="0"
                value={itemForm.preco_adicional}
                onChange={(e) => setItemForm({ ...itemForm, preco_adicional: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="item-ativo"
                checked={itemForm.ativo}
                onCheckedChange={(checked) => setItemForm({ ...itemForm, ativo: checked })}
              />
              <Label htmlFor="item-ativo">Ativo</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeModal}>Cancelar</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
