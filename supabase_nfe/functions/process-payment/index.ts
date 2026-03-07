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
    const { token, amount, description, email, order_id } = await req.json()

    console.log("🔵 Processando pagamento:", { token, amount, description, order_id })

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")

    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não está configurado")
    }

    const payment = {
      token,
      transaction_amount: amount,
      description,
      installments: 1,
      payment_method_id: "visa",
      payer: {
        email: email || "cliente@test.com"
      },
      external_reference: order_id,
    }

    console.log("📦 Payload:", JSON.stringify(payment, null, 2))

    const mpResponse = await fetch(
      "https://api.mercadopago.com/v1/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payment),
      }
    )

    const mpData = await mpResponse.json()

    console.log("✅ Resposta MP:", JSON.stringify(mpData, null, 2))

    if (!mpResponse.ok) {
      console.error("❌ Erro MP:", mpData)
      throw new Error(`Erro MP: ${JSON.stringify(mpData)}`)
    }

    return new Response(
      JSON.stringify(mpData),
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
