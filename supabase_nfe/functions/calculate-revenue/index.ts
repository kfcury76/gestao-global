// ============================================================================
// Edge Function: calculate-revenue
// Descrição: Calcula receitas agregadas por período
// Input: start_date, end_date, business_unit
// Output: Receitas totais, breakdown por método/categoria, vendas recentes
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RevenueInput {
  start_date: string
  end_date: string
  business_unit?: 'cosi' | 'marmitaria' | 'both'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const input: RevenueInput = await req.json()

    if (!input.start_date || !input.end_date) {
      return new Response(
        JSON.stringify({ error: 'start_date e end_date são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construir query
    let query = `sale_date=gte.${input.start_date}&sale_date=lte.${input.end_date}`

    if (input.business_unit && input.business_unit !== 'both') {
      query += `&business_unit=eq.${input.business_unit}`
    }

    // Buscar vendas
    const salesResponse = await fetch(
      `${supabaseUrl}/rest/v1/sales?${query}&select=*,revenue_categories:revenue_category_id(name)&order=sale_date.desc`,
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

    // Calcular totais
    const totalSales = sales.length
    const grossRevenue = sales.reduce((sum: number, s: any) => sum + parseFloat(s.gross_amount || 0), 0)
    const totalDiscounts = sales.reduce((sum: number, s: any) => sum + parseFloat(s.discount_amount || 0), 0)
    const netRevenue = sales.reduce((sum: number, s: any) => sum + parseFloat(s.net_amount || 0), 0)

    // Agrupar por método de pagamento
    const byPaymentMethod: { [key: string]: number } = {}
    sales.forEach((s: any) => {
      const method = s.payment_method || 'sem_informacao'
      byPaymentMethod[method] = (byPaymentMethod[method] || 0) + parseFloat(s.net_amount || 0)
    })

    // Agrupar por categoria
    const byCategory: { [key: string]: { total: number; count: number } } = {}
    sales.forEach((s: any) => {
      const categoryName = s.revenue_categories?.name || 'Outros'
      if (!byCategory[categoryName]) {
        byCategory[categoryName] = { total: 0, count: 0 }
      }
      byCategory[categoryName].total += parseFloat(s.net_amount || 0)
      byCategory[categoryName].count += 1
    })

    // Converter para array
    const byCategoryArray = Object.entries(byCategory).map(([name, data]) => ({
      category: name,
      total: parseFloat(data.total.toFixed(2)),
      count: data.count,
      average: parseFloat((data.total / data.count).toFixed(2))
    }))

    // Vendas recentes (últimas 10)
    const recentSales = sales.slice(0, 10).map((s: any) => ({
      id: s.id,
      sale_date: s.sale_date,
      customer_name: s.customer_name,
      net_amount: parseFloat(s.net_amount || 0),
      payment_method: s.payment_method,
      business_unit: s.business_unit
    }))

    return new Response(
      JSON.stringify({
        success: true,
        period: {
          start: input.start_date,
          end: input.end_date
        },
        summary: {
          total_sales: totalSales,
          gross_revenue: parseFloat(grossRevenue.toFixed(2)),
          total_discounts: parseFloat(totalDiscounts.toFixed(2)),
          net_revenue: parseFloat(netRevenue.toFixed(2)),
          average_ticket: totalSales > 0 ? parseFloat((netRevenue / totalSales).toFixed(2)) : 0
        },
        by_payment_method: byPaymentMethod,
        by_category: byCategoryArray,
        recent_sales: recentSales
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao calcular receitas:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
