import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  base_salary: number;
  hire_date: string;
  is_active: boolean;
  created_at?: string;
}

interface EmployeeFormData {
  name: string;
  position: string;
  department: string;
  base_salary: string;
  hire_date: string;
  is_active: boolean;
}

const DEPARTMENTS = [
  { value: 'cozinha', label: 'Cozinha' },
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'entrega', label: 'Entrega' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'gerencia', label: 'Gerência' }
];

const INITIAL_FORM_DATA: EmployeeFormData = {
  name: '',
  position: '',
  department: '',
  base_salary: '',
  hire_date: new Date().toISOString().split('T')[0],
  is_active: true
};

export default function Funcionarios() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, statusFilter, departmentFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar funcionários:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp =>
        statusFilter === 'active' ? emp.is_active : !emp.is_active
      );
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    setFilteredEmployees(filtered);
  };

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        position: employee.position,
        department: employee.department,
        base_salary: employee.base_salary.toString(),
        hire_date: employee.hire_date,
        is_active: employee.is_active
      });
    } else {
      setEditingEmployee(null);
      setFormData(INITIAL_FORM_DATA);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleSave = async () => {
    try {
      // Validação
      if (!formData.name || !formData.position || !formData.department || !formData.base_salary) {
        toast({
          variant: 'destructive',
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos antes de salvar'
        });
        return;
      }

      setSaving(true);

      const employeeData = {
        name: formData.name,
        position: formData.position,
        department: formData.department,
        base_salary: parseFloat(formData.base_salary),
        hire_date: formData.hire_date,
        is_active: formData.is_active
      };

      if (editingEmployee) {
        // Update
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', editingEmployee.id);

        if (error) throw error;

        toast({
          title: 'Funcionário atualizado',
          description: `${formData.name} foi atualizado com sucesso`
        });
      } else {
        // Insert
        const { error } = await supabase
          .from('employees')
          .insert([employeeData]);

        if (error) throw error;

        toast({
          title: 'Funcionário cadastrado',
          description: `${formData.name} foi adicionado com sucesso`
        });
      }

      handleCloseDialog();
      loadEmployees();
    } catch (error: any) {
      console.error('Erro ao salvar funcionário:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: !employee.is_active })
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: employee.is_active ? 'Funcionário desativado' : 'Funcionário ativado',
        description: `${employee.name} está agora ${!employee.is_active ? 'ativo' : 'inativo'}`
      });

      loadEmployees();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message
      });
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
          <h1 className="text-3xl font-bold font-serif text-gold">Funcionários</h1>
          <p className="text-muted-foreground mt-1">Gestão completa do quadro de colaboradores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gold text-teal font-semibold hover:bg-gold-light"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gold font-serif">
                {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ex: Cozinheiro, Atendente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_salary">Salário Base (R$)</Label>
                <Input
                  id="base_salary"
                  type="number"
                  step="0.01"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hire_date">Data de Admissão</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                className="bg-gold text-teal hover:bg-gold-light"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-gold/20 shadow-soft">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search" className="mb-2 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status" className="mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dept" className="mb-2 block">Departamento</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger id="dept">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="border-gold/20 shadow-elegant">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-gold">
            Lista de Funcionários ({filteredEmployees.length})
          </CardTitle>
          <CardDescription>
            Gerencie seu quadro de colaboradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-gold/30" />
              <p className="text-muted-foreground">Nenhum funcionário encontrado</p>
            </div>
          ) : (
            <div className="rounded-md border border-gold/20 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-teal-light border-b border-gold/20">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gold">Nome</th>
                    <th className="px-4 py-3 text-left font-medium text-gold">Cargo</th>
                    <th className="px-4 py-3 text-left font-medium text-gold">Departamento</th>
                    <th className="px-4 py-3 text-left font-medium text-gold">Salário Base</th>
                    <th className="px-4 py-3 text-left font-medium text-gold">Admissão</th>
                    <th className="px-4 py-3 text-left font-medium text-gold">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-teal-light/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{employee.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{employee.position}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {DEPARTMENTS.find(d => d.value === employee.department)?.label || employee.department}
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(employee.base_salary)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(employee.hire_date)}</td>
                      <td className="px-4 py-3">
                        {employee.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(employee)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(employee)}
                          >
                            {employee.is_active ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
