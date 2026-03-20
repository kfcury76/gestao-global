import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, TrendingUp, Building2, UserPlus, FileText, Upload, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DashboardStats {
  totalEmployees: number;
  totalPayroll: number;
  averageSalary: number;
  totalDepartments: number;
}

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  base_salary: number;
  hire_date: string;
  is_active: boolean;
}

interface DepartmentCost {
  name: string;
  value: number;
}

const COLORS = ['#D4AF37', '#2C7A7B', '#38B2AC', '#81E6D9', '#E6FFFA'];

const DEPARTMENT_LABELS: { [key: string]: string } = {
  cozinha: 'Cozinha',
  atendimento: 'Atendimento',
  entrega: 'Entrega',
  administrativo: 'Administrativo',
  gerencia: 'Gerência'
};

export default function RHDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalPayroll: 0,
    averageSalary: 0,
    totalDepartments: 0
  });
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([]);
  const [departmentCosts, setDepartmentCosts] = useState<DepartmentCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar funcionários ativos
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('hire_date', { ascending: false });

      if (employeesError) throw employeesError;

      if (employees && employees.length > 0) {
        // Calcular estatísticas
        const totalPayroll = employees.reduce((sum, emp) => sum + (emp.base_salary || 0), 0);
        const averageSalary = totalPayroll / employees.length;

        // Contar departamentos únicos
        const uniqueDepartments = new Set(employees.map(emp => emp.department));

        setStats({
          totalEmployees: employees.length,
          totalPayroll,
          averageSalary,
          totalDepartments: uniqueDepartments.size
        });

        // Pegar últimos 10 funcionários
        setRecentEmployees(employees.slice(0, 10));

        // Calcular custos por departamento
        const deptCosts: { [key: string]: number } = {};
        employees.forEach(emp => {
          if (!deptCosts[emp.department]) {
            deptCosts[emp.department] = 0;
          }
          deptCosts[emp.department] += emp.base_salary || 0;
        });

        const chartData = Object.entries(deptCosts).map(([dept, value]) => ({
          name: DEPARTMENT_LABELS[dept] || dept,
          value
        }));

        setDepartmentCosts(chartData);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 animate-fade-in-delay-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gold">Sistema de RH</h1>
          <p className="text-muted-foreground mt-1">Gestão completa de Recursos Humanos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10"
            onClick={() => navigate('/rh/funcionarios')}
          >
            <Users className="w-4 h-4 mr-2" />
            Funcionários
          </Button>
          <Button
            className="bg-gold text-teal font-semibold hover:bg-gold-light"
            onClick={() => navigate('/rh/folha')}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Folha de Pagamento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-gold/20 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
            <Users className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif">{loading ? '...' : stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Total de colaboradores</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Folha Mensal</CardTitle>
            <DollarSign className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif">{loading ? '...' : formatCurrency(stats.totalPayroll)}</div>
            <p className="text-xs text-muted-foreground">Custo total mensal</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Média Salarial</CardTitle>
            <TrendingUp className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif">{loading ? '...' : formatCurrency(stats.averageSalary)}</div>
            <p className="text-xs text-muted-foreground">Salário médio da empresa</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
            <Building2 className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif">{loading ? '...' : stats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">Áreas ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-20 flex-col border-gold/30 hover:bg-gold/10"
          onClick={() => navigate('/rh/funcionarios')}
        >
          <UserPlus className="w-6 h-6 text-gold mb-2" />
          <span>Novo Funcionário</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex-col border-gold/30 hover:bg-gold/10"
          onClick={() => navigate('/rh/folha')}
        >
          <DollarSign className="w-6 h-6 text-gold mb-2" />
          <span>Calcular Folha</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex-col border-gold/30 hover:bg-gold/10"
          onClick={() => navigate('/rh/importar')}
        >
          <Upload className="w-6 h-6 text-gold mb-2" />
          <span>Importar CSV</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex-col border-gold/30 hover:bg-gold/10"
          onClick={() => navigate('/rh/contracheques')}
        >
          <FileText className="w-6 h-6 text-gold mb-2" />
          <span>Contracheques</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Employees Table */}
        <Card className="border-gold/20 shadow-elegant">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-gold">Últimos Funcionários</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : recentEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum funcionário cadastrado</p>
              </div>
            ) : (
              <div className="rounded-md border border-gold/20 overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-teal-light border-b border-gold/20">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gold">Nome</th>
                      <th className="px-4 py-2 text-left font-medium text-gold">Cargo</th>
                      <th className="px-4 py-2 text-left font-medium text-gold">Admissão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/10">
                    {recentEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-teal-light/50 transition-colors">
                        <td className="px-4 py-2 font-medium">{emp.name}</td>
                        <td className="px-4 py-2 text-muted-foreground">{emp.position}</td>
                        <td className="px-4 py-2 text-muted-foreground">{formatDate(emp.hire_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Costs Chart */}
        <Card className="border-gold/20 shadow-elegant">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-gold">Custos por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : departmentCosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sem dados para exibir</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentCosts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentCosts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
