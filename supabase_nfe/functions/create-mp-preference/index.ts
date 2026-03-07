import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { amount, order_id, description, customer_email, customer_name } = await req.json()

    console.log("🔵 Criando preferência:", { amount, order_id, description })

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")

    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não está configurado")
    }

    const pedidoId = order_id || `TESTE-${Date.now()}`

    const preference = {
      items: [
        {
          title: description || "Pedido",
          quantity: 1,
          currency_id: "BRL",
          unit_price: amount,
        },
      ],
      payer: {
        name: customer_name || "Cliente",
        email: customer_email || "cliente@test.com",
      },
      back_urls: {
        success: `https://cosi.lovable.app/pedido-confirmado?order_id=${pedidoId}`,
        failure: "https://cosi.lovable.app/marmita",
        pending: "https://cosi.lovable.app/marmita",
      },
      auto_return: "approved",
      external_reference: pedidoId,
      expires: false,
      binary_mode: true,
      statement_descriptor: "TESTE",
      payment_methods: {
        installments: 1,
        default_installments: 1,
      },
    }

    console.log("📦 Payload:", JSON.stringify(preference, null, 2))

    const mpResponse = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(preference),
      }
    )

    const mpData = await mpResponse.json()

    console.log("✅ Resposta MP:", JSON.stringify(mpData, null, 2))

    if (!mpResponse.ok) {
      console.error("❌ Erro MP:", mpData)
      throw new Error(`Erro MP: ${JSON.stringify(mpData)}`)
    }

    const guestUrl = `${mpData.init_point}&cache=${Date.now()}&guest=true`;

    return new Response(
      JSON.stringify({
        preferenceId: mpData.id,
        init_point: guestUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("❌ Erro:", error)

    return new Response(
      JSON.stringify({
        error: (error as Error).message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
