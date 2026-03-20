// ============================================================================
// Edge Function: import-bank-statement
// Descrição: Importa extrato bancário (CSV/OFX)
// Input: file_content (string), file_type, bank_account_id
// Output: transactions_count, total_credit, total_debit
// 🤖 BASE PARA TREINAMENTO DO ROBÔ AI DE LEITURA DE PDFs
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BankStatementInput {
  file_content: string
  file_type: 'csv' | 'ofx'
  bank_account_id: string
}

interface Transaction {
  date: string
  description: string
  amount: number
  balance: number
  document?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const input: BankStatementInput = await req.json()

    if (!input.file_content || !input.file_type || !input.bank_account_id) {
      return new Response(
        JSON.stringify({ error: 'file_content, file_type e bank_account_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let transactions: Transaction[] = []

    // Parser CSV
    if (input.file_type === 'csv') {
      transactions = parseCSV(input.file_content)
    }

    // Parser OFX
    if (input.file_type === 'ofx') {
      transactions = parseOFX(input.file_content)
    }

    if (transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma transação encontrada no arquivo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Inserir transações no banco
    const statements = transactions.map(t => ({
      bank_account_id: input.bank_account_id,
      transaction_date: t.date,
      description: t.description,
      amount: t.amount,
      balance: t.balance,
      document_number: t.document || null,
      transaction_type: t.amount >= 0 ? 'credit' : 'debit',
      is_reconciled: false
    }))

    const insertResponse = await fetch(
      `${supabaseUrl}/rest/v1/bank_statements`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': req.headers.get('Authorization') || `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(statements)
      }
    )

    if (!insertResponse.ok) {
      const error = await insertResponse.text()
      throw new Error(`Erro ao inserir transações: ${error}`)
    }

    const inserted = await insertResponse.json()

    // Calcular totais
    const totalCredit = transactions.filter(t => t.amount >= 0).reduce((sum, t) => sum + t.amount, 0)
    const totalDebit = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return new Response(
      JSON.stringify({
        success: true,
        transactions_count: transactions.length,
        total_credit: parseFloat(totalCredit.toFixed(2)),
        total_debit: parseFloat(totalDebit.toFixed(2)),
        transactions: transactions.slice(0, 10) // Primeiras 10 para preview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao importar extrato:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================================
// Parser CSV
// ============================================================================

function parseCSV(content: string): Transaction[] {
  const lines = content.trim().split('\n')
  const transactions: Transaction[] = []

  // Pular header (primeira linha)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Split por vírgula (CSV padrão)
    const parts = line.split(',')

    if (parts.length >= 4) {
      const date = parts[0].trim()
      const description = parts[1].trim()
      const amount = parseFloat(parts[2].trim())
      const balance = parseFloat(parts[3].trim())
      const document = parts.length > 4 ? parts[4].trim() : undefined

      // Validar data (formato YYYY-MM-DD)
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        transactions.push({ date, description, amount, balance, document })
      }
    }
  }

  return transactions
}

// ============================================================================
// Parser OFX (simplificado)
// ============================================================================

function parseOFX(content: string): Transaction[] {
  const transactions: Transaction[] = []

  // Extrair blocos <STMTTRN>
  const trnMatches = content.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/g)

  for (const match of trnMatches) {
    const block = match[1]

    const extractValue = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}>([^<]+)`))
      return m ? m[1].trim() : ''
    }

    const dateStr = extractValue('DTPOSTED') // 20260320
    const amount = parseFloat(extractValue('TRNAMT'))
    const description = extractValue('MEMO') || extractValue('NAME')
    const document = extractValue('REFNUM') || extractValue('FITID')

    // Converter data OFX (YYYYMMDD) para YYYY-MM-DD
    const date = dateStr.length === 8
      ? `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
      : new Date().toISOString().split('T')[0]

    // OFX não tem saldo em cada transação, usar 0 por padrão
    const balance = 0

    if (date && !isNaN(amount)) {
      transactions.push({ date, description, amount, balance, document })
    }
  }

  return transactions
}
