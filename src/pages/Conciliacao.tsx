import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, CheckCircle, XCircle, ArrowLeft, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Suggestion {
  bank_statement_id: string
  statement: any
  match_type: string
  match_id?: string
  match?: any
  confidence: number
  reason: string
}

interface ReconciliationResult {
  success: boolean
  total_statements: number
  suggestions: number
  auto_reconciled: number
  suggestions: Suggestion[]
}

export default function ConciliacaoPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReconciliationResult | null>(null)

  const runReconciliation = async (autoApply: boolean) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('reconcile-bank-statement', {
        body: {
          suggested_only: autoApply ? false : true
        }
      })

      if (error) throw error
      setResult(data)
    } catch (err: any) {
      console.error('Erro ao reconciliar:', err)
      alert('Erro: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runReconciliation(false)
  }, [])

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge className="bg-green-500">Alta ({(confidence * 100).toFixed(0)}%)</Badge>
    if (confidence >= 0.7) return <Badge className="bg-yellow-500">Média ({(confidence * 100).toFixed(0)}%)</Badge>
    return <Badge className="bg-red-500">Baixa ({(confidence * 100).toFixed(0)}%)</Badge>
  }

  const getMatchTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      sale: { label: 'Venda', color: 'bg-green-600' },
      payment: { label: 'Pagamento', color: 'bg-red-600' },
      fee: { label: 'Taxa', color: 'bg-orange-600' },
      manual: { label: 'Manual', color: 'bg-gray-600' }
    }
    const config = types[type] || { label: type, color: 'bg-gray-600' }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  // Agrupar sugestões por confiança
  const highConfidence = result?.suggestions?.filter(s => s.confidence >= 0.9) || []
  const mediumConfidence = result?.suggestions?.filter(s => s.confidence >= 0.7 && s.confidence < 0.9) || []
  const lowConfidence = result?.suggestions?.filter(s => s.confidence < 0.7) || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/receitas">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold mt-2">Conciliação Bancária Inteligente 🤖</h1>
          <p className="text-muted-foreground mt-2">
            Sugestões automáticas de conciliação entre extrato e vendas/pagamentos usando AI
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => runReconciliation(false)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Sugestões
          </Button>
          <Button
            onClick={() => runReconciliation(true)}
            disabled={loading || highConfidence.length === 0}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Aplicar Automáticas ({highConfidence.length})
          </Button>
        </div>
      </div>

      {/* Resumo */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Transações Não Conciliadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{result.total_statements}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sugestões Geradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{result.suggestions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Alta Confiança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{highConfidence.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Auto-Conciliadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{result.auto_reconciled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {result?.auto_reconciled && result.auto_reconciled > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>{result.auto_reconciled}</strong> transações foram conciliadas automaticamente com alta confiança (≥90%).
          </AlertDescription>
        </Alert>
      )}

      {/* Explicação da AI */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">🤖 Como funciona a Conciliação Inteligente?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>1. Matching por Valor e Data:</strong> O sistema compara o valor e a data da transação bancária com vendas/pagamentos registrados (tolerância de R$ 0,01 e até 7 dias).
          </p>
          <p>
            <strong>2. Detecção de Padrões:</strong> Identifica palavras-chave na descrição (PIX, TED, taxa, tarifa) para classificar automaticamente.
          </p>
          <p>
            <strong>3. Nível de Confiança:</strong>
            <span className="ml-2">
              <Badge className="bg-green-500 mr-2">≥90% Alta</Badge>
              <Badge className="bg-yellow-500 mr-2">70-89% Média</Badge>
              <Badge className="bg-red-500">&lt;70% Baixa</Badge>
            </span>
          </p>
          <p>
            <strong>4. Base para Treinamento:</strong> Esses matches servem como dados de treinamento para o robô aprender a ler PDFs de qualquer banco.
          </p>
        </CardContent>
      </Card>

      {/* Tabs de Sugestões */}
      <Tabs defaultValue="high" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="high" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Alta Confiança ({highConfidence.length})
          </TabsTrigger>
          <TabsTrigger value="medium" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Média Confiança ({mediumConfidence.length})
          </TabsTrigger>
          <TabsTrigger value="low" className="gap-2">
            <XCircle className="w-4 h-4" />
            Baixa Confiança ({lowConfidence.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="high" className="space-y-4 mt-4">
          {highConfidence.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma sugestão de alta confiança encontrada
              </CardContent>
            </Card>
          ) : (
            highConfidence.map((sug, i) => (
              <Card key={i} className="border-green-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {sug.statement.description}
                      </CardTitle>
                      <CardDescription>
                        {new Date(sug.statement.transaction_date).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getConfidenceBadge(sug.confidence)}
                      {getMatchTypeBadge(sug.match_type)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        {Number(sug.statement.amount) > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        Extrato Bancário
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valor: </span>
                          <span className={`font-bold ${Number(sug.statement.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {Math.abs(Number(sug.statement.amount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {sug.statement.document_number && (
                          <div>
                            <span className="text-muted-foreground">Documento: </span>
                            {sug.statement.document_number}
                          </div>
                        )}
                      </div>
                    </div>

                    {sug.match && (
                      <div>
                        <h4 className="font-semibold mb-2">Match Encontrado ✅</h4>
                        <div className="space-y-1 text-sm">
                          {sug.match_type === 'sale' && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Cliente: </span>
                                {sug.match.customer_name || '-'}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Valor: </span>
                                <span className="font-bold">
                                  R$ {Number(sug.match.net_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Data: </span>
                                {new Date(sug.match.sale_date).toLocaleDateString('pt-BR')}
                              </div>
                            </>
                          )}
                          {sug.match_type === 'payment' && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Fornecedor: </span>
                                {sug.match.payee_name}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Valor: </span>
                                <span className="font-bold">
                                  R$ {Number(sug.match.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Data: </span>
                                {new Date(sug.match.payment_date).toLocaleDateString('pt-BR')}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">🤖 Motivo: </span>
                      {sug.reason}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="medium" className="space-y-4 mt-4">
          {mediumConfidence.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma sugestão de média confiança encontrada
              </CardContent>
            </Card>
          ) : (
            mediumConfidence.map((sug, i) => (
              <Card key={i} className="border-yellow-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {sug.statement.description}
                      </CardTitle>
                      <CardDescription>
                        {new Date(sug.statement.transaction_date).toLocaleDateString('pt-BR')} •
                        R$ {Math.abs(Number(sug.statement.amount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getConfidenceBadge(sug.confidence)}
                      {getMatchTypeBadge(sug.match_type)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{sug.reason}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="low" className="space-y-4 mt-4">
          {lowConfidence.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma sugestão de baixa confiança encontrada
              </CardContent>
            </Card>
          ) : (
            lowConfidence.map((sug, i) => (
              <Card key={i} className="border-red-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {sug.statement.description}
                      </CardTitle>
                      <CardDescription>
                        {new Date(sug.statement.transaction_date).toLocaleDateString('pt-BR')} •
                        R$ {Math.abs(Number(sug.statement.amount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getConfidenceBadge(sug.confidence)}
                      {getMatchTypeBadge(sug.match_type)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {sug.reason}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
