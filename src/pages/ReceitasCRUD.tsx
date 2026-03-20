import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Edit, Trash2, Search } from 'lucide-react'
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

interface Recipe {
  recipe_id: string
  recipe_name: string
  selling_price: number
  total_cost: number
  business_unit: string
}

export default function ReceitasCRUD() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    recipe_name: '',
    selling_price: '',
    business_unit: 'both'
  })

  useEffect(() => {
    loadRecipes()
  }, [])

  useEffect(() => {
    // Filter recipes by search term
    if (searchTerm.trim() === '') {
      setFilteredRecipes(recipes)
    } else {
      const filtered = recipes.filter(recipe =>
        recipe.recipe_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredRecipes(filtered)
    }
  }, [searchTerm, recipes])

  const loadRecipes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('recipe_cost_details')
        .select('*')
        .order('recipe_name')

      if (error) throw error
      setRecipes(data || [])
      setFilteredRecipes(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar receitas:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao carregar receitas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.recipe_name || !formData.selling_price) {
      toast({
        title: 'Validação',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('recipes')
        .insert({
          recipe_name: formData.recipe_name,
          selling_price: parseFloat(formData.selling_price),
          business_unit: formData.business_unit
        })

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Receita criada com sucesso'
      })

      setIsCreateOpen(false)
      resetForm()
      loadRecipes()
    } catch (err: any) {
      console.error('Erro ao criar receita:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao criar receita',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = async () => {
    if (!selectedRecipe || !formData.recipe_name || !formData.selling_price) {
      toast({
        title: 'Validação',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('recipes')
        .update({
          recipe_name: formData.recipe_name,
          selling_price: parseFloat(formData.selling_price),
          business_unit: formData.business_unit
        })
        .eq('recipe_id', selectedRecipe.recipe_id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Receita atualizada com sucesso'
      })

      setIsEditOpen(false)
      resetForm()
      loadRecipes()
    } catch (err: any) {
      console.error('Erro ao atualizar receita:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao atualizar receita',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedRecipe) return

    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('recipe_id', selectedRecipe.recipe_id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Receita deletada com sucesso'
      })

      setIsDeleteOpen(false)
      setSelectedRecipe(null)
      loadRecipes()
    } catch (err: any) {
      console.error('Erro ao deletar receita:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao deletar receita',
        variant: 'destructive'
      })
    }
  }

  const openEditModal = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setFormData({
      recipe_name: recipe.recipe_name,
      selling_price: recipe.selling_price.toString(),
      business_unit: recipe.business_unit
    })
    setIsEditOpen(true)
  }

  const openDeleteDialog = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setIsDeleteOpen(true)
  }

  const resetForm = () => {
    setFormData({
      recipe_name: '',
      selling_price: '',
      business_unit: 'both'
    })
    setSelectedRecipe(null)
  }

  const calculateMargin = (cost: number, price: number) => {
    if (price === 0) return 0
    return ((price - cost) / price) * 100
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
            <h1 className="text-3xl font-bold">Receitas</h1>
            <p className="text-muted-foreground">Gerenciamento de receitas e produtos</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Receita
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Receitas</CardTitle>
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
          <CardTitle>Receitas Cadastradas ({filteredRecipes.length})</CardTitle>
          <CardDescription>Lista completa de receitas com custos e margem</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredRecipes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma receita encontrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Custo Total (CMV)</TableHead>
                  <TableHead>Preço de Venda</TableHead>
                  <TableHead>Margem %</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecipes.map((recipe) => {
                  const margin = calculateMargin(recipe.total_cost, recipe.selling_price)
                  const marginColor = margin >= 50 ? 'text-green-600' : margin >= 30 ? 'text-yellow-600' : 'text-red-600'

                  return (
                    <TableRow key={recipe.recipe_id}>
                      <TableCell className="font-medium">{recipe.recipe_name}</TableCell>
                      <TableCell>R$ {recipe.total_cost.toFixed(2)}</TableCell>
                      <TableCell>R$ {recipe.selling_price.toFixed(2)}</TableCell>
                      <TableCell className={marginColor}>
                        {margin.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{recipe.business_unit}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(recipe)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(recipe)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Receita</DialogTitle>
            <DialogDescription>Adicione uma nova receita ao sistema</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Nome da Receita *</Label>
              <Input
                id="create-name"
                value={formData.recipe_name}
                onChange={(e) => setFormData({ ...formData, recipe_name: e.target.value })}
                placeholder="Ex: Marmita de Frango"
              />
            </div>
            <div>
              <Label htmlFor="create-price">Preço de Venda (R$) *</Label>
              <Input
                id="create-price"
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
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
            <Button onClick={handleCreate}>Criar Receita</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Receita</DialogTitle>
            <DialogDescription>Atualize os dados da receita</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome da Receita *</Label>
              <Input
                id="edit-name"
                value={formData.recipe_name}
                onChange={(e) => setFormData({ ...formData, recipe_name: e.target.value })}
                placeholder="Ex: Marmita de Frango"
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Preço de Venda (R$) *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
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
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a receita "{selectedRecipe?.recipe_name}"?
              Esta ação não pode ser desfeita.
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
