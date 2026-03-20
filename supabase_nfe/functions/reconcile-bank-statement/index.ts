// ============================================================================
// Edge Function: reconcile-bank-statement
// Descrição: Conciliação bancária inteligente com AI
// Input: bank_account_id, start_date, end_date
// Output: matches com score de confiança (Alta/Média/Baixa)
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReconcileInput {
  bank_account_id: string
  start_date: string
  end_date: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const input: ReconcileInput = await req.json()

    if (!input.bank_account_id || !input.start_date || !input.end_date) {
      return new Response(
        JSON.stringify({ error: 'bank_account_id, start_date e end_date são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar extratos bancários (apenas créditos, não conciliados)
    const statementsResponse = await fetch(
      `${supabaseUrl}/rest/v1/bank_statements?bank_account_id=eq.${input.bank_account_id}&transaction_date=gte.${input.start_date}&transaction_date=lte.${input.end_date}&transaction_type=eq.credit&is_reconciled=eq.false&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': req.headers.get('Authorization') || `Bearer ${supabaseKey}`,
        }
      }
    )

    if (!statementsResponse.ok) {
      throw new Error('Erro ao buscar extratos')
    }

    const statements = await statementsResponse.json()

    // Buscar vendas do período (±7 dias de margem)
    const startDateMinus7 = new Date(input.start_date)
    startDateMinus7.setDate(startDateMinus7.getDate() - 7)
    const endDatePlus7 = new Date(input.end_date)
    endDatePlus7.setDate(endDatePlus7.getDate() + 7)

    const salesResponse = await fetch(
      `${supabaseUrl}/rest/v1/sales?sale_date=gte.${startDateMinus7.toISOString().split('T')[0]}&sale_date=lte.${endDatePlus7.toISOString().split('T')[0]}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': req.headers.get('Authorization') || `Bearer ${supabaseKey}`,
        }
      }
    )

    if (!salesResponse.ok) {
      throw new Error('Erro ao buscar vendas')
    }

    const sales = await salesResponse.json()

    // Algoritmo de matching
    const matches: any[] = []

    for (const statement of statements) {
      const stmtAmount = Math.abs(statement.amount)
      const stmtDate = new Date(statement.transaction_date)
      const stmtDesc = statement.description.toLowerCase()

      let bestMatch: any = null
      let bestScore = 0

      for (const sale of sales) {
        const saleAmount = parseFloat(sale.net_amount)
        const saleDate = new Date(sale.sale_date)

        // 1. Comparar valor (tolerância R$ 0.01)
        const amountDiff = Math.abs(stmtAmount - saleAmount)
        const amountMatch = amountDiff <= 0.01

        // 2. Comparar data (tolerância ±7 dias)
        const daysDiff = Math.abs((stmtDate.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24))
        const dateMatch = daysDiff <= 7

        // 3. Detectar padrões na descrição
        const patterns = ['pix', 'ted', 'doc', 'transferencia', 'debito', 'credito']
        const hasPattern = patterns.some(p => stmtDesc.includes(p))

        // 4. Calcular score
        let score = 0

        if (amountMatch) score += 50 // Valor exato
        else if (amountDiff <= 1.00) score += 30 // Valor próximo (±R$1)
        else if (amountDiff <= 10.00) score += 10 // Valor distante

        if (daysDiff === 0) score += 30 // Mesma data
        else if (daysDiff <= 3) score += 20 // 1-3 dias
        else if (daysDiff <= 7) score += 10 // 4-7 dias

        if (hasPattern) score += 10 // Padrão detectado

        if (sale.payment_method) {
          const method = sale.payment_method.toLowerCase()
          if (stmtDesc.includes(method)) score += 10 // Método corresponde
        }

        // Guardar melhor match
        if (score > bestScore) {
          bestScore = score
          bestMatch = sale
        }
      }

      // Se encontrou match razoável (score >= 50)
      if (bestMatch && bestScore >= 50) {
        let confidence = 'low'
        if (bestScore >= 90) confidence = 'high'
        else if (bestScore >= 70) confidence = 'medium'

        let reason = ''
        if (bestScore >= 90) reason = 'Valor exato + data próxima + padrão detectado'
        else if (bestScore >= 70) reason = 'Valor e data próximos'
        else reason = 'Possível correspondência'

        matches.push({
          bank_statement: {
            id: statement.id,
            date: statement.transaction_date,
            description: statement.description,
            amount: statement.amount
          },
          sale: {
            id: bestMatch.id,
            sale_date: bestMatch.sale_date,
            customer_name: bestMatch.customer_name,
            net_amount: bestMatch.net_amount,
            payment_method: bestMatch.payment_method
          },
          confidence: bestScore,
          confidence_level: confidence,
          reason: reason
        })
      }
    }

    // Ordenar por confidence DESC
    matches.sort((a, b) => b.confidence - a.confidence)

    // Estatísticas
    const highConfidence = matches.filter(m => m.confidence >= 90).length
    const mediumConfidence = matches.filter(m => m.confidence >= 70 && m.confidence < 90).length
    const lowConfidence = matches.filter(m => m.confidence < 70).length

    return new Response(
      JSON.stringify({
        success: true,
        total_matches: matches.length,
        high_confidence: highConfidence,
        medium_confidence: mediumConfidence,
        low_confidence: lowConfidence,
        matches: matches
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao conciliar extrato:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
