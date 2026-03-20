import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Download, History, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface PayrollEntry {
  id: string;
  employee_id: string;
  reference_month: string;
  base_salary: number;
  overtime_65: number;
  overtime_100: number;
  night_shift: number;
  delays: number;
  faults: number;
  total_discounts: number;
  total_additions: number;
  net_salary: number;
  created_at: string;
  employee_name?: string;
  employee_position?: string;
}

interface EmployeeSummary {
  employee_id: string;
  employee_name: string;
  employee_position: string;
  base_salary: number;
  overtime_65: number;
  overtime_100: number;
  night_shift: number;
  delays: number;
  faults: number;
  total_discounts: number;
  total_additions: number;
  net_salary: number;
}

export default function FolhaPagamento() {
  const { toast } = useToast();
  const [referenceMonth, setReferenceMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [currentPayroll, setCurrentPayroll] = useState<EmployeeSummary[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollEntry[]>([]);
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<string>('');

  useEffect(() => {
    loadPayrollHistory();
  }, []);

  useEffect(() => {
    if (selectedHistoryMonth) {
      loadHistoricalPayroll(selectedHistoryMonth);
    }
  }, [selectedHistoryMonth]);

  const loadPayrollHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_entries')
        .select('reference_month')
        .order('reference_month', { ascending: false });

      if (error) throw error;

      // Get unique months
      const uniqueMonths = [...new Set(data?.map(item => item.reference_month) || [])];
      if (uniqueMonths.length > 0 && !selectedHistoryMonth) {
        setSelectedHistoryMonth(uniqueMonths[0]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const loadHistoricalPayroll = async (month: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_entries')
        .select(`
          *,
          employees:employee_id (
            name,
            position
          )
        `)
        .eq('reference_month', month)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = data?.map(entry => ({
        ...entry,
        employee_name: (entry.employees as any)?.name || 'N/A',
        employee_position: (entry.employees as any)?.position || 'N/A'
      })) || [];

      setPayrollHistory(formatted);
    } catch (error: any) {
      console.error('Erro ao carregar folha histórica:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePayroll = async () => {
    try {
      setCalculating(true);

      // Chamar Edge Function para calcular folha
      const { data, error } = await supabase.functions.invoke('calculate-payroll', {
        body: { reference_month: referenceMonth }
      });

      if (error) throw error;

      if (data && data.results) {
        setCurrentPayroll(data.results);
        toast({
          title: 'Folha calculada',
          description: `${data.results.length} funcionário(s) processado(s)`
        });
      }
    } catch (error: any) {
      console.error('Erro ao calcular folha:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao calcular',
        description: error.message || 'Verifique se a Edge Function está ativa'
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleExportCSV = () => {
    if (currentPayroll.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Sem dados',
        description: 'Calcule a folha primeiro antes de exportar'
      });
      return;
    }

    const headers = [
      'Funcionário',
      'Cargo',
      'Salário Base',
      'HE 65%',
      'HE 100%',
      'Ad. Noturno',
      'Atrasos',
      'Faltas',
      'Total Descontos',
      'Total Adicionais',
      'Líquido'
    ];

    const rows = currentPayroll.map(entry => [
      entry.employee_name,
      entry.employee_position,
      entry.base_salary.toFixed(2),
      entry.overtime_65.toFixed(2),
      entry.overtime_100.toFixed(2),
      entry.night_shift.toFixed(2),
      entry.delays.toFixed(2),
      entry.faults.toFixed(2),
      entry.total_discounts.toFixed(2),
      entry.total_additions.toFixed(2),
      entry.net_salary.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `folha_pagamento_${referenceMonth}.csv`;
    link.click();

    toast({
      title: 'CSV exportado',
      description: `Arquivo salvo: folha_pagamento_${referenceMonth}.csv`
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
  };

  const getTotals = (entries: EmployeeSummary[] | PayrollEntry[]) => {
    return entries.reduce(
      (acc, entry) => ({
        base_salary: acc.base_salary + (entry.base_salary || 0),
        total_additions: acc.total_additions + (entry.total_additions || 0),
        total_discounts: acc.total_discounts + (entry.total_discounts || 0),
        net_salary: acc.net_salary + (entry.net_salary || 0)
      }),
      { base_salary: 0, total_additions: 0, total_discounts: 0, net_salary: 0 }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-delay-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gold">Folha de Pagamento</h1>
          <p className="text-muted-foreground mt-1">Cálculo e gestão da folha mensal</p>
        </div>
      </div>

      <Tabs defaultValue="calculate" className="w-full">
        <TabsList className="bg-teal-light border border-gold/20">
          <TabsTrigger value="calculate" className="data-[state=active]:bg-gold data-[state=active]:text-teal">
            <Calculator className="w-4 h-4 mr-2" />
            Calcular Folha
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-gold data-[state=active]:text-teal">
            <History className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Calculate Tab */}
        <TabsContent value="calculate" className="mt-4 space-y-6">
          <Card className="border-gold/20 shadow-soft">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-gold">Configuração</CardTitle>
              <CardDescription>Selecione o mês de referência para cálculo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="month">Mês de Referência</Label>
                  <Input
                    id="month"
                    type="month"
                    value={referenceMonth}
                    onChange={(e) => setReferenceMonth(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <Button
                  className="bg-gold text-teal font-semibold hover:bg-gold-light"
                  onClick={handleCalculatePayroll}
                  disabled={calculating}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {calculating ? 'Calculando...' : 'Calcular Folha'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {currentPayroll.length > 0 && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-gold/20 shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Salário Base Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-serif">
                      {formatCurrency(getTotals(currentPayroll).base_salary)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-gold/20 shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                      Adicionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-serif text-green-600">
                      {formatCurrency(getTotals(currentPayroll).total_additions)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-gold/20 shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <TrendingDown className="w-4 h-4 mr-2 text-red-500" />
                      Descontos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-serif text-red-600">
                      {formatCurrency(getTotals(currentPayroll).total_discounts)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-gold/20 shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-gold" />
                      Total Líquido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-serif text-gold">
                      {formatCurrency(getTotals(currentPayroll).net_salary)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results Table */}
              <Card className="border-gold/20 shadow-elegant">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="font-serif text-xl text-gold">
                        Resultado do Cálculo
                      </CardTitle>
                      <CardDescription>
                        Folha de {formatMonth(referenceMonth)} - {currentPayroll.length} funcionário(s)
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      className="border-gold/30 text-gold hover:bg-gold/10"
                      onClick={handleExportCSV}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-gold/20 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-teal-light border-b border-gold/20">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gold">Funcionário</th>
                          <th className="px-4 py-3 text-left font-medium text-gold">Cargo</th>
                          <th className="px-4 py-3 text-right font-medium text-gold">Base</th>
                          <th className="px-4 py-3 text-right font-medium text-green-600">Adicionais</th>
                          <th className="px-4 py-3 text-right font-medium text-red-600">Descontos</th>
                          <th className="px-4 py-3 text-right font-medium text-gold">Líquido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gold/10">
                        {currentPayroll.map((entry, index) => (
                          <tr key={index} className="hover:bg-teal-light/50 transition-colors">
                            <td className="px-4 py-3 font-medium">{entry.employee_name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{entry.employee_position}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(entry.base_salary)}</td>
                            <td className="px-4 py-3 text-right text-green-600 font-semibold">
                              {formatCurrency(entry.total_additions)}
                            </td>
                            <td className="px-4 py-3 text-right text-red-600 font-semibold">
                              {formatCurrency(entry.total_discounts)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gold">
                              {formatCurrency(entry.net_salary)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-teal-light border-t-2 border-gold/30">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 font-bold text-gold">TOTAIS</td>
                          <td className="px-4 py-3 text-right font-bold">
                            {formatCurrency(getTotals(currentPayroll).base_salary)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-green-600">
                            {formatCurrency(getTotals(currentPayroll).total_additions)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">
                            {formatCurrency(getTotals(currentPayroll).total_discounts)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gold text-lg">
                            {formatCurrency(getTotals(currentPayroll).net_salary)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4 space-y-6">
          <Card className="border-gold/20 shadow-elegant">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-gold">Histórico de Folhas</CardTitle>
              <CardDescription>Consulte folhas de pagamento anteriores</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Carregando...</div>
              ) : payrollHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto mb-4 text-gold/30" />
                  <p className="text-muted-foreground">Nenhuma folha encontrada</p>
                </div>
              ) : (
                <div className="rounded-md border border-gold/20 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-teal-light border-b border-gold/20">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gold">Funcionário</th>
                        <th className="px-4 py-3 text-left font-medium text-gold">Mês</th>
                        <th className="px-4 py-3 text-right font-medium text-gold">Base</th>
                        <th className="px-4 py-3 text-right font-medium text-gold">Líquido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/10">
                      {payrollHistory.map((entry) => (
                        <tr key={entry.id} className="hover:bg-teal-light/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{entry.employee_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatMonth(entry.reference_month)}
                          </td>
                          <td className="px-4 py-3 text-right">{formatCurrency(entry.base_salary)}</td>
                          <td className="px-4 py-3 text-right font-bold text-gold">
                            {formatCurrency(entry.net_salary)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
