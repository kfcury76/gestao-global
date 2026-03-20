import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Users,
  DollarSign,
  FileText,
  Utensils,
  Package,
  TrendingUp,
  Calculator
} from 'lucide-react'

export default function Home() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
          Sistema de Gestão
        </h1>
        <p className="text-xl text-muted-foreground">
          Empório Cosi & Marmitaria Araras
        </p>
      </div>

      {/* Sistemas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sistema CMV */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Calculator className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <CardTitle>CMV & Custos</CardTitle>
                <CardDescription>Gestão de Custos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/cmv">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard CMV
              </Button>
            </Link>
            <Link to="/cmv/receitas">
              <Button variant="outline" className="w-full justify-start">
                <Utensils className="w-4 h-4 mr-2" />
                Receitas
              </Button>
            </Link>
            <Link to="/cmv/ingredientes">
              <Button variant="outline" className="w-full justify-start">
                <Package className="w-4 h-4 mr-2" />
                Ingredientes
              </Button>
            </Link>
            <Link to="/cmv/custos-fixos">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Custos Fixos
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Sistema RH */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Recursos Humanos</CardTitle>
                <CardDescription>Folha e Funcionários</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/rh/dashboard">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard RH
              </Button>
            </Link>
            <Link to="/rh/funcionarios">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Funcionários
              </Button>
            </Link>
            <Link to="/rh/folha">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" />
                Folha de Pagamento
              </Button>
            </Link>
            <Link to="/rh/importar">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Importar Secullum
              </Button>
            </Link>
            <Link to="/rh/contracheques">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Contracheques
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Sistema Receitas */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Receitas & Vendas</CardTitle>
                <CardDescription>Fiscal e Financeiro</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/receitas">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard Receitas
              </Button>
            </Link>
            <Link to="/receitas/importar-nfe">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Importar NF-e
              </Button>
            </Link>
            <Link to="/receitas/importar-extrato">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" />
                Importar Extrato
              </Button>
            </Link>
            <Link to="/receitas/conciliacao">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Conciliação
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ --</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CMV Médio</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">---%</div>
            <p className="text-xs text-muted-foreground">Margem de lucro</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">--</div>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Fixos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ --</div>
            <p className="text-xs text-muted-foreground">Mensal</p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-8">
        <p>Sistema de Gestão Integrado - Versão 1.0</p>
        <p>Empório Cosi & Marmitaria Araras © 2026</p>
      </div>
    </div>
  )
}
