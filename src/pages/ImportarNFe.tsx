import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Upload, CheckCircle, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ImportResult {
  success: boolean
  invoice: any
  sale: any
  architecture: string
  database_location: string
}

export default function ImportarNFePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File

    if (!file) {
      alert('Selecione um arquivo XML')
      setLoading(false)
      return
    }

    try {
      // Ler arquivo XML
      const text = await file.text()

      // Enviar para Edge Function
      const { data, error } = await supabase.functions.invoke('import-nfe', {
        body: {
          xml_content: text
        }
      })

      if (error) throw error
      setResult(data)
    } catch (err: any) {
      console.error('Erro ao importar NF-e:', err)
      alert('Erro: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

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
        <h1 className="text-4xl font-bold mt-2">Importar NF-e (Nota Fiscal Eletrônica)</h1>
        <p className="text-muted-foreground mt-2">
          Faça upload do arquivo XML da NF-e para importar automaticamente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulário de Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de XML</CardTitle>
            <CardDescription>
              Selecione o arquivo XML da NF-e recebido por email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  name="file"
                  accept=".xml"
                  className="hidden"
                  id="xml-upload"
                  required
                />
                <label htmlFor="xml-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Clique para selecionar</span> ou arraste o arquivo XML
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
                    Importar NF-e
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
              Processo de importação automática
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Upload do XML</h4>
                <p className="text-sm text-muted-foreground">
                  Selecione o arquivo XML da NF-e (recebido por email ou baixado do portal)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Extração Automática</h4>
                <p className="text-sm text-muted-foreground">
                  O sistema lê o XML e extrai: número da NF, data, cliente, valores, impostos
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Registro no Sistema</h4>
                <p className="text-sm text-muted-foreground">
                  A nota fiscal e a venda são registradas automaticamente no banco de dados
                </p>
              </div>
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Formato aceito:</strong> Apenas arquivos XML de NF-e no padrão SEFAZ
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Resultado */}
      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <CardTitle className="text-green-800">Importação Concluída com Sucesso!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Nota Fiscal</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Número: </span>
                    <span className="font-mono">{result.invoice.invoice_number}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Emissão: </span>
                    {new Date(result.invoice.issue_date).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cliente: </span>
                    {result.invoice.customer_name}
                  </div>
                  {result.invoice.xml_key && (
                    <div>
                      <span className="text-muted-foreground">Chave: </span>
                      <span className="font-mono text-xs">{result.invoice.xml_key}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Valores</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Valor Bruto: </span>
                    <span className="font-bold">
                      R$ {Number(result.invoice.gross_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Desconto: </span>
                    <span className="text-red-600">
                      R$ {Number(result.invoice.discount_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor Líquido: </span>
                    <span className="font-bold text-green-600">
                      R$ {Number(result.invoice.net_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => setResult(null)}>
                Importar Outra NF-e
              </Button>
              <Link to="/receitas">
                <Button variant="outline">
                  Ver no Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exemplo de XML */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo de XML (NF-e)</CardTitle>
          <CardDescription>
            Estrutura esperada do arquivo XML
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`<?xml version="1.0" encoding="UTF-8"?>
<nfeProc>
  <NFe>
    <infNFe>
      <ide>
        <nNF>000123</nNF>
        <dhEmi>2026-03-01T10:30:00-03:00</dhEmi>
      </ide>
      <emit>
        <xNome>Fornecedor LTDA</xNome>
        <CNPJ>12345678000190</CNPJ>
      </emit>
      <dest>
        <xNome>EMPORIO COSI LTDA</xNome>
        <CNPJ>14080400000169</CNPJ>
      </dest>
      <total>
        <ICMSTot>
          <vNF>1500.00</vNF>
          <vDesc>50.00</vDesc>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe>
    <infProt>
      <chNFe>35260312345678000190550010001230001234567890</chNFe>
    </infProt>
  </protNFe>
</nfeProc>`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
