import { useState, useEffect } from 'react'
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function CMV() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [recipes, setRecipes] = useState<any[]>([])
  const [fixedCosts, setFixedCosts] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Buscar receitas com custo calculado
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipe_cost_details')
        .select('*')
        .order('recipe_name')

      if (recipesError) throw recipesError
      setRecipes(recipesData || [])

      // Buscar custos fixos
      const { data: fixedCostsData, error: fixedError } = await supabase
        .from('fixed_costs')
        .select('*')
        .eq('is_active', true)
        .order('cost_name')

      if (fixedError) throw fixedError
      setFixedCosts(fixedCostsData || [])

    } catch (err) {
      console.error('Erro ao carregar dados CMV:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calcular totais
  const totalRecipes = recipes.length
  const avgCMV = recipes.length > 0
    ? recipes.reduce((sum, r) => sum + (parseFloat(r.total_cost) || 0), 0) / recipes.length
    : 0

  const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + (parseFloat(c.monthly_cost) || 0), 0)

  // Receitas com margem baixa (< 30%)
  const lowMarginRecipes = recipes.filter(r => {
    const price = parseFloat(r.selling_price) || 0
    const cost = parseFloat(r.total_cost) || 0
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0
    return margin < 30
  })

  // Dados para gráfico
  const chartData = recipes.slice(0, 10).map(r => ({
    name: r.recipe_name?.substring(0, 20) || 'Sem nome',
    CMV: parseFloat(r.total_cost) || 0,
    Preço: parseFloat(r.selling_price) || 0
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">CMV e Custos</h1>
            <p className="text-muted-foreground">Custo de Mercadoria Vendida e Custos Fixos</p>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecipes}</div>
            <p className="text-xs text-muted-foreground">cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CMV Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {avgCMV.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">por receita</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Fixos</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalFixedCosts.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">por mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Baixa</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{lowMarginRecipes.length}</div>
            <p className="text-xs text-muted-foreground">receitas &lt; 30%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="receitas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="custos">Custos Fixos</TabsTrigger>
          <TabsTrigger value="grafico">Gráfico CMV</TabsTrigger>
        </TabsList>

        {/* Tab: Receitas */}
        <TabsContent value="receitas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receitas Cadastradas</CardTitle>
              <CardDescription>CMV e margem de lucro por receita</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : recipes.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhuma receita encontrada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receita</TableHead>
                      <TableHead>CMV</TableHead>
                      <TableHead>Preço Venda</TableHead>
                      <TableHead>Margem</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipes.map((recipe) => {
                      const cost = parseFloat(recipe.total_cost) || 0
                      const price = parseFloat(recipe.selling_price) || 0
                      const margin = price > 0 ? ((price - cost) / price) * 100 : 0
                      const marginColor = margin >= 50 ? 'text-green-600' : margin >= 30 ? 'text-yellow-600' : 'text-red-600'

                      return (
                        <TableRow key={recipe.recipe_id}>
                          <TableCell className="font-medium">{recipe.recipe_name}</TableCell>
                          <TableCell>R$ {cost.toFixed(2)}</TableCell>
                          <TableCell>R$ {price.toFixed(2)}</TableCell>
                          <TableCell className={marginColor}>
                            {margin.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            {margin >= 30 ? (
                              <Badge variant="default">OK</Badge>
                            ) : (
                              <Badge variant="destructive">Baixa</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Custos Fixos */}
        <TabsContent value="custos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custos Fixos Mensais</CardTitle>
              <CardDescription>Aluguel, energia, salários, etc</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : fixedCosts.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhum custo fixo cadastrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Custo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Valor Mensal</TableHead>
                      <TableHead>Unidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fixedCosts.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium">{cost.cost_name}</TableCell>
                        <TableCell>{cost.cost_category}</TableCell>
                        <TableCell>R$ {parseFloat(cost.monthly_cost).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{cost.business_unit}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Gráfico */}
        <TabsContent value="grafico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CMV vs Preço de Venda</CardTitle>
              <CardDescription>Top 10 receitas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="CMV" fill="#ef4444" />
                  <Bar dataKey="Preço" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
