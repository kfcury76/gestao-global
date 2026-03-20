// ============================================================================
// Edge Function: import-nfe
// Descrição: Importa NF-e (XML) e cria registros de invoice + sale
// Input: xml_content (string)
// Output: invoice_id, sale_id
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NFEInput {
  xml_content: string
  business_unit?: 'cosi' | 'marmitaria'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const input: NFEInput = await req.json()

    if (!input.xml_content) {
      return new Response(
        JSON.stringify({ error: 'xml_content é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parsear XML usando DOMParser nativo
    const xml = input.xml_content

    // Extrair dados com regex (simples e funciona)
    const extractTag = (tagName: string): string => {
      const match = xml.match(new RegExp(`<${tagName}>([^<]+)</${tagName}>`))
      return match ? match[1] : ''
    }

    const invoiceNumber = extractTag('nNF')
    const issueDate = extractTag('dhEmi').split('T')[0] // 2026-03-20T10:30:00 -> 2026-03-20
    const customerName = extractTag('xNome')
    const customerDocument = extractTag('CNPJ') || extractTag('CPF')
    const grossAmount = parseFloat(extractTag('vNF') || '0')
    const discountAmount = parseFloat(extractTag('vDesc') || '0')
    const netAmount = grossAmount - discountAmount
    const xmlKey = extractTag('chNFe')

    if (!invoiceNumber || !issueDate) {
      return new Response(
        JSON.stringify({ error: 'XML inválido: faltam campos obrigatórios (nNF, dhEmi)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar invoice
    const invoiceData = {
      invoice_number: invoiceNumber,
      invoice_type: 'nfe',
      issue_date: issueDate,
      business_unit: input.business_unit || 'cosi',
      customer_name: customerName,
      customer_document: customerDocument,
      gross_amount: grossAmount,
      discount_amount: discountAmount,
      net_amount: netAmount,
      xml_content: xml,
      xml_key: xmlKey,
      status: 'confirmed'
    }

    const invoiceResponse = await fetch(
      `${supabaseUrl}/rest/v1/invoices`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': req.headers.get('Authorization') || `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(invoiceData)
      }
    )

    if (!invoiceResponse.ok) {
      const error = await invoiceResponse.text()
      throw new Error(`Erro ao criar invoice: ${error}`)
    }

    const invoices = await invoiceResponse.json()
    const invoice = Array.isArray(invoices) ? invoices[0] : invoices

    // Criar sale vinculada
    const saleData = {
      sale_date: issueDate,
      business_unit: input.business_unit || 'cosi',
      invoice_id: invoice.id,
      customer_name: customerName,
      customer_document: customerDocument,
      gross_amount: grossAmount,
      discount_amount: discountAmount,
      net_amount: netAmount,
      payment_method: 'pix', // Default, pode ser ajustado
      status: 'completed'
    }

    const saleResponse = await fetch(
      `${supabaseUrl}/rest/v1/sales`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': req.headers.get('Authorization') || `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(saleData)
      }
    )

    if (!saleResponse.ok) {
      const error = await saleResponse.text()
      throw new Error(`Erro ao criar sale: ${error}`)
    }

    const sales = await saleResponse.json()
    const sale = Array.isArray(sales) ? sales[0] : sales

    return new Response(
      JSON.stringify({
        success: true,
        invoice: {
          id: invoice.id,
          invoice_number: invoiceNumber,
          issue_date: issueDate,
          customer_name: customerName,
          net_amount: netAmount
        },
        sale: {
          id: sale.id,
          sale_date: issueDate,
          net_amount: netAmount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao importar NF-e:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
