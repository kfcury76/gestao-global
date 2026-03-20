import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Upload, CheckCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface BankAccount {
  id: string
  bank_name: string
  account_number: string
  account_type: string
}

interface ImportResult {
  success: boolean
  transactions_imported: number
  transactions: any[]
  architecture: string
  database_location: string
}

export default function ImportarExtratoPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileType, setFileType] = useState('csv')
  const [bankAccountId, setBankAccountId] = useState('')
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  // Carregar contas bancárias
  useEffect(() => {
    loadBankAccounts()
  }, [])

  const loadBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)

      if (error) throw error
      setBankAccounts(data || [])
    } catch (err) {
      console.error('Erro ao carregar contas:', err)
    }
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File

    if (!file) {
      alert('Selecione um arquivo')
      setLoading(false)
      return
    }

    if (!bankAccountId) {
      alert('Selecione uma conta bancária')
      setLoading(false)
      return
    }

    try {
      // Ler arquivo e converter para base64
      const text = await file.text()
      const base64 = btoa(text)

      // Enviar para Edge Function
      const { data, error } = await supabase.functions.invoke('import-bank-statement', {
        body: {
          bank_account_id: bankAccountId,
          file_type: fileType,
          file_content: base64
        }
      })

      if (error) throw error
      setResult(data)
    } catch (err: any) {
      console.error('Erro ao importar extrato:', err)
      alert('Erro: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const totalCredit = result?.transactions?.reduce((sum, t) =>
    Number(t.amount) > 0 ? sum + Number(t.amount) : sum, 0
  ) || 0

  const totalDebit = result?.transactions?.reduce((sum, t) =>
    Number(t.amount) < 0 ? sum + Math.abs(Number(t.amount)) : sum, 0
  ) || 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Link to="/receitas">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
        <h1 className="text-4xl font-bold mt-2">Importar Extrato Bancário</h1>
        <p className="text-muted-foreground mt-2">
          Faça upload do extrato para conciliar pagamentos e recebimentos automaticamente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulário de Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Extrato</CardTitle>
            <CardDescription>
              Selecione o arquivo CSV ou OFX do seu banco
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Arquivo</label>
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                    <SelectItem value="ofx">OFX (Padrão Bancário)</SelectItem>
                    <SelectItem value="pdf" disabled>PDF (em breve com AI) 🤖</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Conta Bancária</label>
                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.bank_name} - {acc.account_number} ({acc.account_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  name="file"
                  accept={fileType === 'csv' ? '.csv' : fileType === 'ofx' ? '.ofx' : '.pdf'}
                  className="hidden"
                  id="file-upload"
                  required
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Clique para selecionar</span> ou arraste o arquivo {fileType.toUpperCase()}
                    </div>
                  </div>
                </label>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>Importando...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Extrato
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como funciona?</CardTitle>
            <CardDescription>
              Processo de importação e conciliação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Upload do Extrato</h4>
                <p className="text-sm text-muted-foreground">
                  Baixe o extrato do seu banco (CSV ou OFX) e faça o upload
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Importação Automática</h4>
                <p className="text-sm text-muted-foreground">
                  O sistema lê as transações (data, descrição, valor) e salva no banco
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Conciliação Inteligente</h4>
                <p className="text-sm text-muted-foreground">
                  O sistema sugere matches com vendas e pagamentos automaticamente (AI)
                </p>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Em breve:</strong> Parsing de PDF com AI para extrair dados de qualquer banco automaticamente
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Resultado */}
      {result && (
        <>
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <CardTitle className="text-green-800">
                  {result.transactions_imported} Transações Importadas com Sucesso!
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total de Transações</div>
                  <div className="text-2xl font-bold">{result.transactions_imported}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Entradas (Crédito)</div>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {totalCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Saídas (Débito)</div>
                  <div className="text-2xl font-bold text-red-600">
                    R$ {totalDebit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setResult(null)}>
                  Importar Outro Extrato
                </Button>
                <Link to="/receitas/conciliacao">
                  <Button variant="outline">
                    Ir para Conciliação
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Transações */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Importadas</CardTitle>
              <CardDescription>
                Detalhamento de todas as transações do extrato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">
                    Todas ({result.transactions.length})
                  </TabsTrigger>
                  <TabsTrigger value="credit" className="text-green-600">
                    Entradas ({result.transactions.filter(t => Number(t.amount) > 0).length})
                  </TabsTrigger>
                  <TabsTrigger value="debit" className="text-red-600">
                    Saídas ({result.transactions.filter(t => Number(t.amount) < 0).length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Data</th>
                          <th className="text-left p-2">Descrição</th>
                          <th className="text-right p-2">Valor</th>
                          <th className="text-right p-2">Saldo</th>
                          <th className="text-center p-2">Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.transactions.map((txn, i) => (
                          <tr key={i} className="border-b hover:bg-muted/50">
                            <td className="p-2">{new Date(txn.transaction_date).toLocaleDateString('pt-BR')}</td>
                            <td className="p-2">{txn.description}</td>
                            <td className={`p-2 text-right font-bold ${
                              Number(txn.amount) > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Number(txn.amount) > 0 ? (
                                <div className="flex items-center justify-end gap-1">
                                  <TrendingUp className="w-4 h-4" />
                                  R$ {Number(txn.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <TrendingDown className="w-4 h-4" />
                                  R$ {Math.abs(Number(txn.amount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              {txn.balance ? `R$ ${Number(txn.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                            <td className="p-2 text-center">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                txn.transaction_type === 'credit'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {txn.transaction_type === 'credit' ? 'Crédito' : 'Débito'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="credit" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Data</th>
                          <th className="text-left p-2">Descrição</th>
                          <th className="text-right p-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.transactions.filter(t => Number(t.amount) > 0).map((txn, i) => (
                          <tr key={i} className="border-b hover:bg-muted/50">
                            <td className="p-2">{new Date(txn.transaction_date).toLocaleDateString('pt-BR')}</td>
                            <td className="p-2">{txn.description}</td>
                            <td className="p-2 text-right font-bold text-green-600">
                              R$ {Number(txn.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="debit" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Data</th>
                          <th className="text-left p-2">Descrição</th>
                          <th className="text-right p-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.transactions.filter(t => Number(t.amount) < 0).map((txn, i) => (
                          <tr key={i} className="border-b hover:bg-muted/50">
                            <td className="p-2">{new Date(txn.transaction_date).toLocaleDateString('pt-BR')}</td>
                            <td className="p-2">{txn.description}</td>
                            <td className="p-2 text-right font-bold text-red-600">
                              R$ {Math.abs(Number(txn.amount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Exemplo de formato CSV */}
      <Card>
        <CardHeader>
          <CardTitle>📄 Formato CSV Esperado (para treinar robô AI)</CardTitle>
          <CardDescription>
            Estrutura simples: data, descrição, valor, saldo, documento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`data,descricao,valor,saldo,documento
2026-03-01,PIX Recebido - Cliente A,150.00,5000.00,
2026-03-02,Transferencia TED - Fornecedor B,-500.00,4500.00,DOC123
2026-03-03,Tarifa bancaria,-12.50,4487.50,
2026-03-04,PIX Recebido - Venda Marmitas,450.00,4937.50,
2026-03-05,Pagamento Boleto - Luz,-280.00,4657.50,BOL456`}
          </pre>
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>🤖 Treinamento de AI:</strong> Este formato será usado como base para treinar o robô a ler PDFs de qualquer banco automaticamente
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
