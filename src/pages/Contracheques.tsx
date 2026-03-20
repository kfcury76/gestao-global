import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Loader2, CheckCircle, History } from 'lucide-react';
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
  employee?: {
    name: string;
    position: string;
  };
}

interface GenerationStatus {
  [key: string]: 'idle' | 'generating' | 'success' | 'error';
}

export default function Contracheques() {
  const { toast } = useToast();
  const [referenceMonth, setReferenceMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({});

  useEffect(() => {
    loadPayrollEntries();
  }, [referenceMonth]);

  const loadPayrollEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_entries')
        .select(`
          *,
          employee:employees!employee_id (
            name,
            position
          )
        `)
        .eq('reference_month', referenceMonth)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const transformed = data?.map(entry => ({
        ...entry,
        employee: Array.isArray(entry.employee) ? entry.employee[0] : entry.employee
      })) || [];

      setPayrollEntries(transformed);

      // Reset generation status
      const newStatus: GenerationStatus = {};
      transformed.forEach(entry => {
        newStatus[entry.id] = 'idle';
      });
      setGenerationStatus(newStatus);
    } catch (error: any) {
      console.error('Erro ao carregar folhas:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePayslip = async (entryId: string) => {
    try {
      setGenerationStatus(prev => ({ ...prev, [entryId]: 'generating' }));

      // Chamar Edge Function para gerar PDF
      const { data, error } = await supabase.functions.invoke('generate-payslip-pdf', {
        body: { payroll_entry_id: entryId }
      });

      if (error) throw error;

      if (data && data.pdfUrl) {
        // Download PDF
        const link = document.createElement('a');
        link.href = data.pdfUrl;
        link.download = `contracheque_${entryId}.pdf`;
        link.click();

        setGenerationStatus(prev => ({ ...prev, [entryId]: 'success' }));

        toast({
          title: 'PDF gerado',
          description: 'Contracheque baixado com sucesso'
        });

        // Reset status after 3 seconds
        setTimeout(() => {
          setGenerationStatus(prev => ({ ...prev, [entryId]: 'idle' }));
        }, 3000);
      }
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      setGenerationStatus(prev => ({ ...prev, [entryId]: 'error' }));

      toast({
        variant: 'destructive',
        title: 'Erro ao gerar PDF',
        description: error.message || 'Verifique se a Edge Function está ativa'
      });

      // Reset status after 3 seconds
      setTimeout(() => {
        setGenerationStatus(prev => ({ ...prev, [entryId]: 'idle' }));
      }, 3000);
    }
  };

  const generateAllPayslips = async () => {
    if (payrollEntries.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Sem dados',
        description: 'Não há folhas de pagamento para este mês'
      });
      return;
    }

    setGeneratingAll(true);

    let successCount = 0;
    let errorCount = 0;

    for (const entry of payrollEntries) {
      try {
        setGenerationStatus(prev => ({ ...prev, [entry.id]: 'generating' }));

        const { data, error } = await supabase.functions.invoke('generate-payslip-pdf', {
          body: { payroll_entry_id: entry.id }
        });

        if (error) throw error;

        if (data && data.pdfUrl) {
          // Download PDF
          const link = document.createElement('a');
          link.href = data.pdfUrl;
          link.download = `contracheque_${entry.employee?.name.replace(/\s+/g, '_')}_${referenceMonth}.pdf`;
          link.click();

          setGenerationStatus(prev => ({ ...prev, [entry.id]: 'success' }));
          successCount++;

          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        console.error(`Erro ao gerar PDF para ${entry.employee?.name}:`, error);
        setGenerationStatus(prev => ({ ...prev, [entry.id]: 'error' }));
        errorCount++;
      }
    }

    setGeneratingAll(false);

    toast({
      title: 'Geração concluída',
      description: `${successCount} PDF(s) gerado(s) com sucesso${errorCount > 0 ? `, ${errorCount} erro(s)` : ''}`
    });

    // Reset all status after 3 seconds
    setTimeout(() => {
      const resetStatus: GenerationStatus = {};
      payrollEntries.forEach(entry => {
        resetStatus[entry.id] = 'idle';
      });
      setGenerationStatus(resetStatus);
    }, 3000);
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

  const getStatusButton = (entryId: string) => {
    const status = generationStatus[entryId] || 'idle';

    switch (status) {
      case 'generating':
        return (
          <Button size="sm" disabled>
            <Loader2 className="w-4 h-4 animate-spin" />
          </Button>
        );
      case 'success':
        return (
          <Button size="sm" variant="outline" className="border-green-500 text-green-600">
            <CheckCircle className="w-4 h-4" />
          </Button>
        );
      case 'error':
        return (
          <Button
            size="sm"
            variant="outline"
            className="border-red-500 text-red-600"
            onClick={() => generatePayslip(entryId)}
          >
            Tentar novamente
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10"
            onClick={() => generatePayslip(entryId)}
          >
            <Download className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-delay-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gold">Contracheques</h1>
          <p className="text-muted-foreground mt-1">Geração de PDFs de contracheques</p>
        </div>
      </div>

      {/* Controls */}
      <Card className="border-gold/20 shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-gold">Configuração</CardTitle>
          <CardDescription>Selecione o mês de referência para gerar contracheques</CardDescription>
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
              onClick={generateAllPayslips}
              disabled={generatingAll || payrollEntries.length === 0}
            >
              {generatingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Gerar Todos os PDFs
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Entries */}
      <Card className="border-gold/20 shadow-elegant">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-gold">
            Folha de {formatMonth(referenceMonth)}
          </CardTitle>
          <CardDescription>
            {payrollEntries.length > 0
              ? `${payrollEntries.length} funcionário(s) encontrado(s)`
              : 'Nenhuma folha de pagamento encontrada para este mês'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
              <p>Carregando...</p>
            </div>
          ) : payrollEntries.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gold/30" />
              <p className="text-muted-foreground mb-2">Nenhuma folha encontrada para este mês</p>
              <p className="text-sm text-muted-foreground">
                Vá para Folha de Pagamento e calcule a folha primeiro
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-gold/20 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-teal-light border-b border-gold/20">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gold">Funcionário</th>
                    <th className="px-4 py-3 text-left font-medium text-gold">Cargo</th>
                    <th className="px-4 py-3 text-right font-medium text-gold">Salário Base</th>
                    <th className="px-4 py-3 text-right font-medium text-gold">Total Líquido</th>
                    <th className="px-4 py-3 text-center font-medium text-gold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {payrollEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-teal-light/50 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {entry.employee?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {entry.employee?.position || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(entry.base_salary)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gold">
                        {formatCurrency(entry.net_salary)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusButton(entry.id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-gold/20 shadow-soft bg-teal-light/20">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-gold flex items-center">
            <History className="w-5 h-5 mr-2" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Selecione o mês de referência</p>
          <p>2. A tabela exibirá todas as folhas de pagamento calculadas para aquele mês</p>
          <p>3. Clique em "Gerar PDF" para baixar o contracheque individual</p>
          <p>4. Ou clique em "Gerar Todos os PDFs" para baixar todos de uma vez</p>
          <p className="text-xs mt-4 text-gold">
            Nota: A Edge Function 'generate-payslip-pdf' deve estar ativa no Supabase
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
