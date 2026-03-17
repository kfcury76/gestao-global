// =====================================================
// Edge Function: sync-ingredients
// Descrição: Sincroniza ingredientes a partir de NF-e
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncIngredientRequest {
  fiscal_invoice_id: string; // UUID da NF-e
  items?: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
    supplier_name?: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { fiscal_invoice_id, items } = await req.json() as SyncIngredientRequest;

    if (!fiscal_invoice_id) {
      return new Response(
        JSON.stringify({ error: "fiscal_invoice_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se items não foi fornecido, buscar da NF-e
    let ingredientsToSync = items;

    if (!ingredientsToSync) {
      // Buscar itens da NF-e
      const { data: invoice, error: invoiceError } = await supabaseClient
        .from("fiscal_invoices")
        .select("items")
        .eq("id", fiscal_invoice_id)
        .single();

      if (invoiceError || !invoice) {
        return new Response(
          JSON.stringify({ error: "NF-e não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parsear items da NF-e (assumindo que está em JSON)
      ingredientsToSync = invoice.items || [];
    }

    const syncResults = [];
    const errors = [];

    for (const item of ingredientsToSync) {
      try {
        // Verificar se ingrediente já existe (por nome)
        const { data: existingIngredient } = await supabaseClient
          .from("ingredients")
          .select("id")
          .ilike("name", item.name)
          .single();

        let ingredientId = existingIngredient?.id;

        // Se não existe, criar ingrediente
        if (!ingredientId) {
          const { data: newIngredient, error: createError } = await supabaseClient
            .from("ingredients")
            .insert({
              name: item.name,
              category: inferCategory(item.name),
              unit: normalizeUnit(item.unit),
              current_price: item.price,
              supplier_name: item.supplier_name,
              notes: `Criado automaticamente via NF-e ${fiscal_invoice_id}`,
            })
            .select()
            .single();

          if (createError) {
            errors.push({
              item: item.name,
              error: createError.message,
            });
            continue;
          }

          ingredientId = newIngredient.id;
        }

        // Inserir histórico de preço (trigger vai atualizar current_price automaticamente)
        const { error: historyError } = await supabaseClient
          .from("ingredient_price_history")
          .insert({
            ingredient_id: ingredientId,
            price: item.price,
            quantity: item.quantity,
            unit: normalizeUnit(item.unit),
            supplier_name: item.supplier_name,
            fiscal_invoice_id: fiscal_invoice_id,
            invoice_date: new Date().toISOString().split("T")[0],
            source: "nfe",
          });

        if (historyError) {
          errors.push({
            item: item.name,
            error: historyError.message,
          });
          continue;
        }

        syncResults.push({
          ingredient: item.name,
          ingredient_id: ingredientId,
          price: item.price,
          quantity: item.quantity,
          status: existingIngredient ? "updated" : "created",
        });
      } catch (error) {
        errors.push({
          item: item.name,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncResults.length,
        errors: errors.length,
        results: syncResults,
        errors_detail: errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// =====================================================
// Helper Functions
// =====================================================

function inferCategory(name: string): string {
  const lowerName = name.toLowerCase();

  // Proteínas
  if (
    lowerName.includes("frango") ||
    lowerName.includes("carne") ||
    lowerName.includes("peixe") ||
    lowerName.includes("linguiça") ||
    lowerName.includes("ovo") ||
    lowerName.includes("suíno") ||
    lowerName.includes("bovina")
  ) {
    return "proteina";
  }

  // Embalagens
  if (
    lowerName.includes("marmita") ||
    lowerName.includes("embalagem") ||
    lowerName.includes("pote") ||
    lowerName.includes("descartável")
  ) {
    return "embalagem";
  }

  // Temperos
  if (
    lowerName.includes("óleo") ||
    lowerName.includes("sal") ||
    lowerName.includes("alho") ||
    lowerName.includes("cebola") ||
    lowerName.includes("tempero") ||
    lowerName.includes("molho")
  ) {
    return "tempero";
  }

  // Bebidas
  if (
    lowerName.includes("água") ||
    lowerName.includes("refrigerante") ||
    lowerName.includes("suco") ||
    lowerName.includes("bebida")
  ) {
    return "bebida";
  }

  // Acompanhamentos (default)
  return "acompanhamento";
}

function normalizeUnit(unit: string): string {
  const lowerUnit = unit.toLowerCase().trim();

  const unitMap: Record<string, string> = {
    kg: "kg",
    kgs: "kg",
    quilo: "kg",
    quilograma: "kg",
    g: "g",
    grama: "g",
    gramas: "g",
    l: "litro",
    lt: "litro",
    litro: "litro",
    litros: "litro",
    ml: "ml",
    mililitro: "ml",
    mililitros: "ml",
    un: "unidade",
    und: "unidade",
    unidade: "unidade",
    unidades: "unidade",
    pct: "pacote",
    pacote: "pacote",
    pacotes: "pacote",
    dz: "duzia",
    duzia: "duzia",
    duzias: "duzia",
  };

  return unitMap[lowerUnit] || "unidade";
}
