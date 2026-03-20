import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Edit, Trash2, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'

interface FixedCost {
  id: string
  cost_name: string
  cost_category: string
  monthly_cost: number
  business_unit: string
  is_active: boolean
  reference_month?: string
}

export default function CustosFixos() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [costs, setCosts] = useState<FixedCost[]>([])
  const [filteredCosts, setFilteredCosts] = useState<FixedCost[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCost, setSelectedCost] = useState<FixedCost | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    cost_name: '',
    cost_category: 'outros',
    monthly_cost: '',
    business_unit: 'both',
    reference_month: new Date().toISOString().substring(0, 7) // YYYY-MM
  })

  useEffect(() => {
    loadCosts()
  }, [])

  useEffect(() => {
    // Filter costs by category
    if (selectedCategory === 'all') {
      setFilteredCosts(costs)
    } else {
      const filtered = costs.filter(cost => cost.cost_category === selectedCategory)
      setFilteredCosts(filtered)
    }
  }, [selectedCategory, costs])

  const loadCosts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('fixed_costs')
        .select('*')
        .eq('is_active', true)
        .order('cost_category')
        .order('cost_name')

      if (error) throw error
      setCosts(data || [])
      setFilteredCosts(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar custos fixos:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao carregar custos fixos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.cost_name || !formData.cost_category || !formData.monthly_cost) {
      toast({
        title: 'Validação',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('fixed_costs')
        .insert({
          cost_name: formData.cost_name,
          cost_category: formData.cost_category,
          monthly_cost: parseFloat(formData.monthly_cost),
          business_unit: formData.business_unit,
          is_active: true
        })

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Custo fixo criado com sucesso'
      })

      setIsCreateOpen(false)
      resetForm()
      loadCosts()
    } catch (err: any) {
      console.error('Erro ao criar custo fixo:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao criar custo fixo',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = async () => {
    if (!selectedCost || !formData.cost_name || !formData.cost_category || !formData.monthly_cost) {
      toast({
        title: 'Validação',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('fixed_costs')
        .update({
          cost_name: formData.cost_name,
          cost_category: formData.cost_category,
          monthly_cost: parseFloat(formData.monthly_cost),
          business_unit: formData.business_unit
        })
        .eq('id', selectedCost.id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Custo fixo atualizado com sucesso'
      })

      setIsEditOpen(false)
      resetForm()
      loadCosts()
    } catch (err: any) {
      console.error('Erro ao atualizar custo fixo:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao atualizar custo fixo',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedCost) return

    try {
      // Soft delete - marca como inativo
      const { error } = await supabase
        .from('fixed_costs')
        .update({ is_active: false })
        .eq('id', selectedCost.id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Custo fixo removido com sucesso'
      })

      setIsDeleteOpen(false)
      setSelectedCost(null)
      loadCosts()
    } catch (err: any) {
      console.error('Erro ao deletar custo fixo:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao deletar custo fixo',
        variant: 'destructive'
      })
    }
  }

  const openEditModal = (cost: FixedCost) => {
    setSelectedCost(cost)
    setFormData({
      cost_name: cost.cost_name,
      cost_category: cost.cost_category,
      monthly_cost: cost.monthly_cost.toString(),
      business_unit: cost.business_unit,
      reference_month: cost.reference_month || new Date().toISOString().substring(0, 7)
    })
    setIsEditOpen(true)
  }

  const openDeleteDialog = (cost: FixedCost) => {
    setSelectedCost(cost)
    setIsDeleteOpen(true)
  }

  const resetForm = () => {
    setFormData({
      cost_name: '',
      cost_category: 'outros',
      monthly_cost: '',
      business_unit: 'both',
      reference_month: new Date().toISOString().substring(0, 7)
    })
    setSelectedCost(null)
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'aluguel': 'Aluguel',
      'salarios': 'Salários',
      'energia': 'Energia',
      'agua': 'Água',
      'internet': 'Internet',
      'telefone': 'Telefone',
      'manutencao': 'Manutenção',
      'impostos': 'Impostos',
      'outros': 'Outros'
    }
    return categories[category] || category
  }

  // Calcular resumo por categoria
  const summaryByCategory = costs.reduce((acc, cost) => {
    if (!acc[cost.cost_category]) {
      acc[cost.cost_category] = 0
    }
    acc[cost.cost_category] += parseFloat(cost.monthly_cost.toString())
    return acc
  }, {} as Record<string, number>)

  const totalCosts = costs.reduce((sum, cost) => sum + parseFloat(cost.monthly_cost.toString()), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cmv')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Custos Fixos</h1>
            <p className="text-muted-foreground">Gerenciamento de custos fixos mensais</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Custo
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalCosts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{costs.length} custos ativos</p>
          </CardContent>
        </Card>

        {Object.entries(summaryByCategory).slice(0, 3).map(([category, amount]) => (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{getCategoryLabel(category)}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {amount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {((amount / totalCosts) * 100).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="aluguel">Aluguel</SelectItem>
              <SelectItem value="salarios">Salários</SelectItem>
              <SelectItem value="energia">Energia</SelectItem>
              <SelectItem value="agua">Água</SelectItem>
              <SelectItem value="internet">Internet</SelectItem>
              <SelectItem value="telefone">Telefone</SelectItem>
              <SelectItem value="manutencao">Manutenção</SelectItem>
              <SelectItem value="impostos">Impostos</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Custos Cadastrados ({filteredCosts.length})</CardTitle>
          <CardDescription>Lista de custos fixos mensais</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredCosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum custo encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">{cost.cost_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(cost.cost_category)}</Badge>
                    </TableCell>
                    <TableCell>R$ {parseFloat(cost.monthly_cost.toString()).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{cost.business_unit}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(cost)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(cost)}
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

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Custo Fixo</DialogTitle>
            <DialogDescription>Adicione um novo custo fixo mensal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Descrição *</Label>
              <Input
                id="create-name"
                value={formData.cost_name}
                onChange={(e) => setFormData({ ...formData, cost_name: e.target.value })}
                placeholder="Ex: Aluguel loja centro"
              />
            </div>
            <div>
              <Label htmlFor="create-category">Categoria *</Label>
              <Select
                value={formData.cost_category}
                onValueChange={(value) => setFormData({ ...formData, cost_category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                  <SelectItem value="salarios">Salários</SelectItem>
                  <SelectItem value="energia">Energia</SelectItem>
                  <SelectItem value="agua">Água</SelectItem>
                  <SelectItem value="internet">Internet</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="impostos">Impostos</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="create-amount">Valor Mensal (R$) *</Label>
              <Input
                id="create-amount"
                type="number"
                step="0.01"
                value={formData.monthly_cost}
                onChange={(e) => setFormData({ ...formData, monthly_cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="create-unit">Unidade de Negócio</Label>
              <Select
                value={formData.business_unit}
                onValueChange={(value) => setFormData({ ...formData, business_unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cosi">Cosi</SelectItem>
                  <SelectItem value="marmitaria">Marmitaria</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar Custo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Custo Fixo</DialogTitle>
            <DialogDescription>Atualize os dados do custo fixo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Descrição *</Label>
              <Input
                id="edit-name"
                value={formData.cost_name}
                onChange={(e) => setFormData({ ...formData, cost_name: e.target.value })}
                placeholder="Ex: Aluguel loja centro"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Categoria *</Label>
              <Select
                value={formData.cost_category}
                onValueChange={(value) => setFormData({ ...formData, cost_category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                  <SelectItem value="salarios">Salários</SelectItem>
                  <SelectItem value="energia">Energia</SelectItem>
                  <SelectItem value="agua">Água</SelectItem>
                  <SelectItem value="internet">Internet</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="impostos">Impostos</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-amount">Valor Mensal (R$) *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.monthly_cost}
                onChange={(e) => setFormData({ ...formData, monthly_cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="edit-unit">Unidade de Negócio</Label>
              <Select
                value={formData.business_unit}
                onValueChange={(value) => setFormData({ ...formData, business_unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cosi">Cosi</SelectItem>
                  <SelectItem value="marmitaria">Marmitaria</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o custo fixo "{selectedCost?.cost_name}"?
              O custo será marcado como inativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
