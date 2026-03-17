// =====================================================
// Edge Function: calculate-recipe-cost
// Descrição: Recalcula CMV de receitas e retorna análise detalhada
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalculateRequest {
  recipe_id?: string; // Calcular uma receita específica
  product_code?: string; // Ou buscar por código do produto
  recalculate_all?: boolean; // Recalcular todas as receitas
}

interface RecipeCMV {
  recipe_id: string;
  product_name: string;
  product_code: string;
  total_cmv: number;
  cmv_per_unit: number;
  items: Array<{
    ingredient_name: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    total_cost: number;
    percentage: number;
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

    const { recipe_id, product_code, recalculate_all } = await req.json() as CalculateRequest;

    let recipes = [];

    if (recalculate_all) {
      // Buscar todas as receitas ativas
      const { data, error } = await supabaseClient
        .from("product_recipes")
        .select("id, product_name, product_code, yield_quantity")
        .eq("active", true);

      if (error) throw error;
      recipes = data || [];
    } else if (recipe_id) {
      // Buscar receita específica por ID
      const { data, error } = await supabaseClient
        .from("product_recipes")
        .select("id, product_name, product_code, yield_quantity")
        .eq("id", recipe_id)
        .single();

      if (error) throw error;
      recipes = [data];
    } else if (product_code) {
      // Buscar receita por código do produto
      const { data, error } = await supabaseClient
        .from("product_recipes")
        .select("id, product_name, product_code, yield_quantity")
        .eq("product_code", product_code)
        .single();

      if (error) throw error;
      recipes = [data];
    } else {
      return new Response(
        JSON.stringify({ error: "Informe recipe_id, product_code ou recalculate_all=true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: RecipeCMV[] = [];

    for (const recipe of recipes) {
      // Buscar detalhamento do CMV usando RPC
      const { data: cmvItems, error: cmvError } = await supabaseClient
        .rpc("get_recipe_cmv", { p_recipe_id: recipe.id });

      if (cmvError) {
        console.error(`Erro ao calcular CMV da receita ${recipe.id}:`, cmvError);
        continue;
      }

      // Calcular total
      const totalCMV = cmvItems.reduce(
        (sum: number, item: any) => sum + parseFloat(item.total_cost),
        0
      );

      // Adicionar percentual de cada ingrediente
      const itemsWithPercentage = cmvItems.map((item: any) => ({
        ingredient_name: item.ingredient_name,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        price_per_unit: parseFloat(item.price_per_unit),
        total_cost: parseFloat(item.total_cost),
        percentage: totalCMV > 0 ? (parseFloat(item.total_cost) / totalCMV) * 100 : 0,
      }));

      results.push({
        recipe_id: recipe.id,
        product_name: recipe.product_name,
        product_code: recipe.product_code,
        total_cmv: parseFloat(totalCMV.toFixed(2)),
        cmv_per_unit: parseFloat((totalCMV / recipe.yield_quantity).toFixed(2)),
        items: itemsWithPercentage,
      });
    }

    // Análise consolidada
    const analysis = {
      total_recipes: results.length,
      total_ingredients: results.reduce((sum, r) => sum + r.items.length, 0),
      average_cmv: results.length > 0
        ? parseFloat((results.reduce((sum, r) => sum + r.cmv_per_unit, 0) / results.length).toFixed(2))
        : 0,
      highest_cmv: results.length > 0
        ? results.reduce((max, r) => r.cmv_per_unit > max.cmv_per_unit ? r : max)
        : null,
      lowest_cmv: results.length > 0
        ? results.reduce((min, r) => r.cmv_per_unit < min.cmv_per_unit ? r : min)
        : null,
    };

    return new Response(
      JSON.stringify({
        success: true,
        recipes: results,
        analysis,
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
