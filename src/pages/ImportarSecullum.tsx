import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface CSVRow {
  nome: string;
  faltas?: string;
  atrasos_minutos?: string;
  he_65?: string;
  he_100?: string;
  horas_noturnas?: string;
}

interface MatchedEmployee {
  csvName: string;
  employeeId: string | null;
  employeeName: string | null;
  matched: boolean;
  data: CSVRow;
}

export default function ImportarSecullum() {
  const { toast } = useToast();
  const [referenceMonth, setReferenceMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [matchedEmployees, setMatchedEmployees] = useState<MatchedEmployee[]>([]);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Get headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Parse rows
    const data: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      if (row.nome) {
        data.push(row);
      }
    }

    return data;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        variant: 'destructive',
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo CSV'
      });
      return;
    }

    setUploading(true);

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        throw new Error('Arquivo CSV vazio ou formato inválido');
      }

      setCsvData(parsed);

      // Match with existing employees
      await matchEmployees(parsed);

      toast({
        title: 'Arquivo processado',
        description: `${parsed.length} registro(s) encontrado(s)`
      });
    } catch (error: any) {
      console.error('Erro ao processar CSV:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao processar',
        description: error.message
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const matchEmployees = async (data: CSVRow[]) => {
    try {
      // Buscar todos os funcionários ativos
      const { data: employees, error } = await supabase
        .from('employees')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;

      const matched: MatchedEmployee[] = data.map(row => {
        // Tentar match por nome (case-insensitive, partial match)
        const csvNameLower = row.nome.toLowerCase().trim();
        const found = employees?.find(emp =>
          emp.name.toLowerCase().includes(csvNameLower) ||
          csvNameLower.includes(emp.name.toLowerCase())
        );

        return {
          csvName: row.nome,
          employeeId: found?.id || null,
          employeeName: found?.name || null,
          matched: !!found,
          data: row
        };
      });

      setMatchedEmployees(matched);
    } catch (error: any) {
      console.error('Erro ao fazer matching:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no matching',
        description: error.message
      });
    }
  };

  const handleConfirmImport = async () => {
    if (matchedEmployees.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Sem dados',
        description: 'Faça upload de um arquivo CSV primeiro'
      });
      return;
    }

    const unmatchedCount = matchedEmployees.filter(m => !m.matched).length;
    if (unmatchedCount > 0) {
      toast({
        variant: 'destructive',
        title: 'Funcionários não encontrados',
        description: `${unmatchedCount} funcionário(s) do CSV não foram encontrados no sistema`
      });
      return;
    }

    setImporting(true);

    try {
      // Chamar Edge Function para processar importação
      const payload = {
        reference_month: referenceMonth,
        data: matchedEmployees.map(m => ({
          employee_id: m.employeeId,
          faltas: parseFloat(m.data.faltas || '0'),
          atrasos_minutos: parseFloat(m.data.atrasos_minutos || '0'),
          he_65: parseFloat(m.data.he_65 || '0'),
          he_100: parseFloat(m.data.he_100 || '0'),
          horas_noturnas: parseFloat(m.data.horas_noturnas || '0')
        }))
      };

      const { data, error } = await supabase.functions.invoke('extract-secullum-pdf', {
        body: payload
      });

      if (error) throw error;

      toast({
        title: 'Importação concluída',
        description: `${matchedEmployees.length} registro(s) importado(s) com sucesso`
      });

      // Limpar dados
      setCsvData([]);
      setMatchedEmployees([]);
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na importação',
        description: error.message || 'Verifique se a Edge Function está ativa'
      });
    } finally {
      setImporting(false);
    }
  };

  const getMatchStats = () => {
    const total = matchedEmployees.length;
    const matched = matchedEmployees.filter(m => m.matched).length;
    const unmatched = total - matched;
    return { total, matched, unmatched };
  };

  const stats = getMatchStats();

  return (
    <div className="space-y-6 animate-fade-in-delay-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gold">Importar Secullum</h1>
          <p className="text-muted-foreground mt-1">Upload de arquivo CSV convertido do PDF Secullum</p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="border-gold/20 shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-gold">Upload de Arquivo</CardTitle>
          <CardDescription>
            Converta manualmente o PDF Secullum para CSV e faça o upload aqui
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month">Mês de Referência</Label>
            <Input
              id="month"
              type="month"
              value={referenceMonth}
              onChange={(e) => setReferenceMonth(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Arquivo CSV</Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                accept=".csv"
                className="cursor-pointer"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Template esperado: nome, faltas, atrasos_minutos, he_65, he_100, horas_noturnas
            </p>
          </div>

          {/* CSV Template Example */}
          <div className="mt-4 p-4 bg-teal-light/30 rounded-md border border-gold/20">
            <p className="text-sm font-medium text-gold mb-2">Exemplo de CSV:</p>
            <pre className="text-xs font-mono bg-background p-2 rounded">
{`nome,faltas,atrasos_minutos,he_65,he_100,horas_noturnas
João Silva,1,30,5,2,8
Maria Santos,0,0,10,0,6`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {matchedEmployees.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-gold/20 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gold" />
                  Total de Registros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-serif">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="border-gold/20 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Encontrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-serif text-green-600">{stats.matched}</div>
              </CardContent>
            </Card>

            <Card className="border-gold/20 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <XCircle className="w-4 h-4 mr-2 text-red-500" />
                  Não Encontrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-serif text-red-600">{stats.unmatched}</div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Table */}
          <Card className="border-gold/20 shadow-elegant">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="font-serif text-xl text-gold">Preview dos Dados</CardTitle>
                  <CardDescription>
                    Verifique o matching antes de confirmar a importação
                  </CardDescription>
                </div>
                <Button
                  className="bg-gold text-teal font-semibold hover:bg-gold-light"
                  onClick={handleConfirmImport}
                  disabled={importing || stats.unmatched > 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {importing ? 'Importando...' : 'Confirmar Importação'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stats.unmatched > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Funcionários não encontrados no sistema
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Cadastre os funcionários ausentes antes de importar ou corrija os nomes no CSV
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-md border border-gold/20 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-teal-light border-b border-gold/20">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gold">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gold">Nome CSV</th>
                      <th className="px-4 py-3 text-left font-medium text-gold">Nome Sistema</th>
                      <th className="px-4 py-3 text-right font-medium text-gold">Faltas</th>
                      <th className="px-4 py-3 text-right font-medium text-gold">Atrasos (min)</th>
                      <th className="px-4 py-3 text-right font-medium text-gold">HE 65%</th>
                      <th className="px-4 py-3 text-right font-medium text-gold">HE 100%</th>
                      <th className="px-4 py-3 text-right font-medium text-gold">H. Noturnas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/10">
                    {matchedEmployees.map((match, index) => (
                      <tr
                        key={index}
                        className={`transition-colors ${
                          match.matched ? 'hover:bg-teal-light/50' : 'bg-red-50 hover:bg-red-100'
                        }`}
                      >
                        <td className="px-4 py-3">
                          {match.matched ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{match.csvName}</td>
                        <td className="px-4 py-3">
                          {match.matched ? (
                            <span className="text-green-600">{match.employeeName}</span>
                          ) : (
                            <span className="text-red-600">Não encontrado</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">{match.data.faltas || '0'}</td>
                        <td className="px-4 py-3 text-right">{match.data.atrasos_minutos || '0'}</td>
                        <td className="px-4 py-3 text-right">{match.data.he_65 || '0'}</td>
                        <td className="px-4 py-3 text-right">{match.data.he_100 || '0'}</td>
                        <td className="px-4 py-3 text-right">{match.data.horas_noturnas || '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
