// =============================================
// EDGE FUNCTION: Process NFe
// Descrição: Processa XML de Nota Fiscal Eletrônica (NF-e)
// =============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Interface para dados parseados da NF-e
interface NFeParsed {
  // Dados da NF-e
  nfeKey: string
  nfeNumber: string
  nfeSeries: string
  nfeModel: string

  // Fornecedor
  supplierName: string
  supplierCnpj: string
  supplierAddress: string

  // Datas
  issueDate: string
  dueDate?: string

  // Valores
  totalProducts: number
  totalTax: number
  totalDiscount: number
  totalFreight: number
  totalValue: number

  // Itens
  items: NFeItem[]
}

interface NFeItem {
  itemNumber: number
  productCode?: string
  productEan?: string
  productName: string
  productNcm?: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  icmsValue?: number
  ipiValue?: number
  pisValue?: number
  cofinsValue?: number
}

// Parser de XML simplificado
function parseNFeXML(xmlText: string): NFeParsed {
  // Remove namespaces para facilitar parsing
  const cleanXml = xmlText.replace(/xmlns[^=]*="[^"]*"/g, '')

  // Helper para extrair valores de tags XML
  const getTagValue = (xml: string, tag: string): string => {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i')
    const match = xml.match(regex)
    return match ? match[1].trim() : ''
  }

  const getTagContent = (xml: string, tag: string): string => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i')
    const match = xml.match(regex)
    return match ? match[1] : ''
  }

  const getAllTagsContent = (xml: string, tag: string): string[] => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'gi')
    const matches = []
    let match
    while ((match = regex.exec(xml)) !== null) {
      matches.push(match[1])
    }
    return matches
  }

  // Parse principal
  const ide = getTagContent(cleanXml, 'ide')
  const emit = getTagContent(cleanXml, 'emit')
  const enderEmit = getTagContent(emit, 'enderEmit')
  const total = getTagContent(cleanXml, 'total')
  const icmsTot = getTagContent(total, 'ICMSTot')
  const cobr = getTagContent(cleanXml, 'cobr')
  const det = getAllTagsContent(cleanXml, 'det')

  // Extrai chave de acesso
  const infNFe = cleanXml.match(/<infNFe[^>]*Id="NFe(\d{44})"/)
  const nfeKey = infNFe ? infNFe[1] : ''

  // Parse dos itens
  const items: NFeItem[] = det.map((detItem, index) => {
    const prod = getTagContent(detItem, 'prod')
    const imposto = getTagContent(detItem, 'imposto')
    const icms = getTagContent(imposto, 'ICMS')
    const ipi = getTagContent(imposto, 'IPI')
    const pis = getTagContent(imposto, 'PIS')
    const cofins = getTagContent(imposto, 'COFINS')

    return {
      itemNumber: index + 1,
      productCode: getTagValue(prod, 'cProd'),
      productEan: getTagValue(prod, 'cEAN') || undefined,
      productName: getTagValue(prod, 'xProd'),
      productNcm: getTagValue(prod, 'NCM') || undefined,
      quantity: parseFloat(getTagValue(prod, 'qCom') || '0'),
      unit: getTagValue(prod, 'uCom'),
      unitPrice: parseFloat(getTagValue(prod, 'vUnCom') || '0'),
      totalPrice: parseFloat(getTagValue(prod, 'vProd') || '0'),
      icmsValue: parseFloat(getTagValue(icms, 'vICMS') || '0') || undefined,
      ipiValue: parseFloat(getTagValue(ipi, 'vIPI') || '0') || undefined,
      pisValue: parseFloat(getTagValue(pis, 'vPIS') || '0') || undefined,
      cofinsValue: parseFloat(getTagValue(cofins, 'vCOFINS') || '0') || undefined,
    }
  })

  // Parse de vencimento (cobr > dup > dVenc)
  let dueDate: string | undefined
  const dup = getTagContent(cobr, 'dup')
  if (dup) {
    const dVenc = getTagValue(dup, 'dVenc')
    if (dVenc) {
      // Converte de YYYY-MM-DD para ISO
      dueDate = new Date(dVenc).toISOString()
    }
  }

  return {
    nfeKey,
    nfeNumber: getTagValue(ide, 'nNF'),
    nfeSeries: getTagValue(ide, 'serie'),
    nfeModel: getTagValue(ide, 'mod'),

    supplierName: getTagValue(emit, 'xNome') || getTagValue(emit, 'xFant'),
    supplierCnpj: getTagValue(emit, 'CNPJ'),
    supplierAddress: [
      getTagValue(enderEmit, 'xLgr'),
      getTagValue(enderEmit, 'nro'),
      getTagValue(enderEmit, 'xBairro'),
      getTagValue(enderEmit, 'xMun'),
      getTagValue(enderEmit, 'UF'),
      getTagValue(enderEmit, 'CEP'),
    ].filter(Boolean).join(', '),

    issueDate: new Date(getTagValue(ide, 'dhEmi') || getTagValue(ide, 'dEmi')).toISOString(),
    dueDate,

    totalProducts: parseFloat(getTagValue(icmsTot, 'vProd') || '0'),
    totalTax: (
      parseFloat(getTagValue(icmsTot, 'vICMS') || '0') +
      parseFloat(getTagValue(icmsTot, 'vIPI') || '0') +
      parseFloat(getTagValue(icmsTot, 'vPIS') || '0') +
      parseFloat(getTagValue(icmsTot, 'vCOFINS') || '0')
    ),
    totalDiscount: parseFloat(getTagValue(icmsTot, 'vDesc') || '0'),
    totalFreight: parseFloat(getTagValue(icmsTot, 'vFrete') || '0'),
    totalValue: parseFloat(getTagValue(icmsTot, 'vNF') || '0'),

    items,
  }
}

// Função principal
serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { xmlContent, businessUnit = 'cosi', costCategory } = await req.json()

    if (!xmlContent) {
      return new Response(
        JSON.stringify({ error: 'XML content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse XML
    console.log('Parsing NFe XML...')
    const nfeData = parseNFeXML(xmlContent)
    console.log('NFe parsed:', { nfeKey: nfeData.nfeKey, itemsCount: nfeData.items.length })

    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar se a NF-e já existe
    const { data: existing } = await supabase
      .from('fiscal_invoices')
      .select('id, nfe_key')
      .eq('nfe_key', nfeData.nfeKey)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({
          error: 'Invoice already exists',
          invoiceId: existing.id,
          nfeKey: existing.nfe_key
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Inserir nota fiscal
    const { data: invoice, error: invoiceError } = await supabase
      .from('fiscal_invoices')
      .insert({
        nfe_key: nfeData.nfeKey,
        nfe_number: nfeData.nfeNumber,
        nfe_series: nfeData.nfeSeries,
        nfe_model: nfeData.nfeModel,
        supplier_name: nfeData.supplierName,
        supplier_cnpj: nfeData.supplierCnpj,
        supplier_address: nfeData.supplierAddress,
        issue_date: nfeData.issueDate,
        due_date: nfeData.dueDate,
        total_products: nfeData.totalProducts,
        total_tax: nfeData.totalTax,
        total_discount: nfeData.totalDiscount,
        total_freight: nfeData.totalFreight,
        total_value: nfeData.totalValue,
        status: 'pending',
        payment_status: 'pending',
        cost_category: costCategory,
        business_unit: businessUnit,
        xml_data: xmlContent,
        processed_at: new Date().toISOString(),
        auto_processed: true,
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error inserting invoice:', invoiceError)
      throw invoiceError
    }

    console.log('Invoice created:', invoice.id)

    // Inserir itens
    const itemsToInsert = nfeData.items.map(item => ({
      invoice_id: invoice.id,
      item_number: item.itemNumber,
      product_code: item.productCode,
      product_ean: item.productEan,
      product_name: item.productName,
      product_ncm: item.productNcm,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      icms_value: item.icmsValue,
      ipi_value: item.ipiValue,
      pis_value: item.pisValue,
      cofins_value: item.cofinsValue,
    }))

    const { data: items, error: itemsError } = await supabase
      .from('fiscal_invoice_items')
      .insert(itemsToInsert)
      .select()

    if (itemsError) {
      console.error('Error inserting items:', itemsError)
      throw itemsError
    }

    console.log(`${items.length} items inserted`)

    // Criar entrada de pagamento
    if (nfeData.dueDate) {
      await supabase
        .from('payment_schedule')
        .insert({
          invoice_id: invoice.id,
          installment_number: 1,
          due_date: nfeData.dueDate.split('T')[0], // Apenas a data
          amount: nfeData.totalValue,
          status: 'pending',
        })

      console.log('Payment schedule created')
    }

    // Criar lançamento de custo
    await supabase
      .from('cost_entries')
      .insert({
        invoice_id: invoice.id,
        description: `NF-e ${nfeData.nfeNumber} - ${nfeData.supplierName}`,
        category: costCategory || 'outros',
        amount: nfeData.totalValue,
        entry_date: nfeData.issueDate.split('T')[0],
        business_unit: businessUnit,
        supplier_name: nfeData.supplierName,
        supplier_cnpj: nfeData.supplierCnpj,
      })

    console.log('Cost entry created')

    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        invoice: {
          id: invoice.id,
          nfeKey: invoice.nfe_key,
          nfeNumber: invoice.nfe_number,
          supplier: invoice.supplier_name,
          totalValue: invoice.total_value,
          itemsCount: items.length,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing NFe:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
