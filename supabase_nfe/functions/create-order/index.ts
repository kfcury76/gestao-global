import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderData {
  customer_name: string
  customer_phone: string
  customer_address: string
  customer_neighborhood?: string
  customer_reference?: string
  protein: string
  carb: string
  side_dish?: string
  salad?: string
  observations?: string
  base_price: number
  extras_price: number
  delivery_fee: number
  total_price: number
  payment_method: 'pix' | 'credit_card' | 'debit_card' | 'money'
  delivery_type: 'delivery' | 'pickup'
  needs_change?: boolean
  change_for?: number
  source: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const orderData: OrderData = await req.json()

    // Validações
    if (!orderData.customer_name || !orderData.customer_phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome e telefone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!orderData.protein || !orderData.carb) {
      return new Response(
        JSON.stringify({ success: false, error: 'Proteína e carboidrato são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (orderData.delivery_type === 'delivery' && !orderData.customer_address) {
      return new Response(
        JSON.stringify({ success: false, error: 'Endereço é obrigatório para entrega' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Gerar número do pedido
    const { data: lastOrder } = await supabase
      .from('orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1)
      .single()

    const nextOrderNumber = (lastOrder?.order_number || 0) + 1

    // Inserir pedido
    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        order_number: nextOrderNumber,
        order_status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir pedido:', insertError)
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Pedido #${nextOrderNumber} criado com sucesso`)

    return new Response(
      JSON.stringify({ success: true, order }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('Erro na Edge Function:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
