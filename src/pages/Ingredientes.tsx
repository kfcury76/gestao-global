import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Edit, Trash2, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'

interface Ingredient {
  ingredient_id: string
  name: string
  unit: string
  unit_cost: number
}

export default function Ingredientes() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    unit_cost: ''
  })

  useEffect(() => {
    loadIngredients()
  }, [])

  useEffect(() => {
    // Filter ingredients by search term
    if (searchTerm.trim() === '') {
      setFilteredIngredients(ingredients)
    } else {
      const filtered = ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredIngredients(filtered)
    }
  }, [searchTerm, ingredients])

  const loadIngredients = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name')

      if (error) throw error
      setIngredients(data || [])
      setFilteredIngredients(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar ingredientes:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao carregar ingredientes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.unit || !formData.unit_cost) {
      toast({
        title: 'Validação',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('ingredients')
        .insert({
          name: formData.name,
          unit: formData.unit,
          unit_cost: parseFloat(formData.unit_cost)
        })

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Ingrediente criado com sucesso'
      })

      setIsCreateOpen(false)
      resetForm()
      loadIngredients()
    } catch (err: any) {
      console.error('Erro ao criar ingrediente:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao criar ingrediente',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = async () => {
    if (!selectedIngredient || !formData.name || !formData.unit || !formData.unit_cost) {
      toast({
        title: 'Validação',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('ingredients')
        .update({
          name: formData.name,
          unit: formData.unit,
          unit_cost: parseFloat(formData.unit_cost)
        })
        .eq('ingredient_id', selectedIngredient.ingredient_id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Ingrediente atualizado com sucesso'
      })

      setIsEditOpen(false)
      resetForm()
      loadIngredients()
    } catch (err: any) {
      console.error('Erro ao atualizar ingrediente:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao atualizar ingrediente',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedIngredient) return

    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('ingredient_id', selectedIngredient.ingredient_id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Ingrediente deletado com sucesso'
      })

      setIsDeleteOpen(false)
      setSelectedIngredient(null)
      loadIngredients()
    } catch (err: any) {
      console.error('Erro ao deletar ingrediente:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao deletar ingrediente',
        variant: 'destructive'
      })
    }
  }

  const openEditModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      unit_cost: ingredient.unit_cost.toString()
    })
    setIsEditOpen(true)
  }

  const openDeleteDialog = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setIsDeleteOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      unit: 'kg',
      unit_cost: ''
    })
    setSelectedIngredient(null)
  }

  const getUnitLabel = (unit: string) => {
    const units: Record<string, string> = {
      'kg': 'Quilograma',
      'g': 'Grama',
      'l': 'Litro',
      'ml': 'Mililitro',
      'un': 'Unidade'
    }
    return units[unit] || unit
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cmv')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Ingredientes</h1>
            <p className="text-muted-foreground">Gerenciamento de ingredientes e insumos</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ingrediente
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Ingredientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredientes Cadastrados ({filteredIngredients.length})</CardTitle>
          <CardDescription>Lista completa de ingredientes com custos unitários</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredIngredients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum ingrediente encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade de Medida</TableHead>
                  <TableHead>Custo Unitário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngredients.map((ingredient) => (
                  <TableRow key={ingredient.ingredient_id}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>
                      {ingredient.unit} ({getUnitLabel(ingredient.unit)})
                    </TableCell>
                    <TableCell>R$ {ingredient.unit_cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(ingredient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(ingredient)}
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
            <DialogTitle>Criar Novo Ingrediente</DialogTitle>
            <DialogDescription>Adicione um novo ingrediente ao sistema</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Nome do Ingrediente *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Arroz Branco"
              />
            </div>
            <div>
              <Label htmlFor="create-unit">Unidade de Medida *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg - Quilograma</SelectItem>
                  <SelectItem value="g">g - Grama</SelectItem>
                  <SelectItem value="l">l - Litro</SelectItem>
                  <SelectItem value="ml">ml - Mililitro</SelectItem>
                  <SelectItem value="un">un - Unidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="create-cost">Custo Unitário (R$) *</Label>
              <Input
                id="create-cost"
                type="number"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar Ingrediente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ingrediente</DialogTitle>
            <DialogDescription>Atualize os dados do ingrediente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome do Ingrediente *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Arroz Branco"
              />
            </div>
            <div>
              <Label htmlFor="edit-unit">Unidade de Medida *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg - Quilograma</SelectItem>
                  <SelectItem value="g">g - Grama</SelectItem>
                  <SelectItem value="l">l - Litro</SelectItem>
                  <SelectItem value="ml">ml - Mililitro</SelectItem>
                  <SelectItem value="un">un - Unidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-cost">Custo Unitário (R$) *</Label>
              <Input
                id="edit-cost"
                type="number"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                placeholder="0.00"
              />
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
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o ingrediente "{selectedIngredient?.name}"?
              Esta ação não pode ser desfeita e pode afetar receitas que utilizam este ingrediente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
