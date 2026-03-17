// =====================================================
// Edge Function: get-cmv-analysis
// Descrição: Análise consolidada de CMV (para dashboards)
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalysisRequest {
  period?: "7d" | "30d" | "90d" | "all"; // Período de análise
  category?: string; // Filtrar por categoria
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

    const { period = "30d", category } = await req.json() as AnalysisRequest;

    // Calcular data de início baseado no período
    const daysMap = { "7d": 7, "30d": 30, "90d": 90, "all": 365 * 10 };
    const daysAgo = daysMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // 1. CMV por Produto
    let query = supabaseClient
      .from("product_cmv")
      .select("*")
      .eq("active", true);

    if (category) {
      query = query.eq("category", category);
    }

    const { data: products, error: productsError } = await query;
    if (productsError) throw productsError;

    // 2. Ingredientes mais caros (top 10)
    const { data: expensiveIngredients, error: expensiveError } = await supabaseClient
      .from("ingredients")
      .select("name, category, current_price, unit")
      .eq("active", true)
      .order("current_price", { ascending: false })
      .limit(10);

    if (expensiveError) throw expensiveError;

    // 3. Histórico de preços (últimos N dias)
    const { data: priceHistory, error: historyError } = await supabaseClient
      .from("ingredient_price_history")
      .select("ingredient_id, price, invoice_date, ingredients(name)")
      .gte("invoice_date", startDate.toISOString().split("T")[0])
      .order("invoice_date", { ascending: true });

    if (historyError) throw historyError;

    // 4. Ingredientes com maior variação de preço
    const priceVariations: any[] = [];
    const ingredientPrices: Record<string, number[]> = {};

    // Agrupar preços por ingrediente
    priceHistory.forEach((item: any) => {
      const ingredientName = item.ingredients?.name;
      if (!ingredientName) return;

      if (!ingredientPrices[ingredientName]) {
        ingredientPrices[ingredientName] = [];
      }
      ingredientPrices[ingredientName].push(parseFloat(item.price));
    });

    // Calcular variação percentual
    Object.entries(ingredientPrices).forEach(([name, prices]) => {
      if (prices.length < 2) return;

      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const variation = ((maxPrice - minPrice) / minPrice) * 100;

      priceVariations.push({
        ingredient_name: name,
        min_price: minPrice,
        max_price: maxPrice,
        variation_percent: parseFloat(variation.toFixed(2)),
      });
    });

    // Ordenar por maior variação
    priceVariations.sort((a, b) => b.variation_percent - a.variation_percent);

    // 5. Estatísticas gerais
    const totalIngredients = await supabaseClient
      .from("ingredients")
      .select("id", { count: "exact", head: true })
      .eq("active", true);

    const totalRecipes = await supabaseClient
      .from("product_recipes")
      .select("id", { count: "exact", head: true })
      .eq("active", true);

    // 6. CMV médio por categoria
    const cmvByCategory: Record<string, any> = {};
    products?.forEach((product: any) => {
      if (!cmvByCategory[product.category]) {
        cmvByCategory[product.category] = {
          category: product.category,
          total_products: 0,
          avg_cmv: 0,
          min_cmv: Number.MAX_VALUE,
          max_cmv: 0,
          total_cmv: 0,
        };
      }

      const cmv = parseFloat(product.cmv_per_unit) || 0;
      cmvByCategory[product.category].total_products++;
      cmvByCategory[product.category].total_cmv += cmv;
      cmvByCategory[product.category].min_cmv = Math.min(cmvByCategory[product.category].min_cmv, cmv);
      cmvByCategory[product.category].max_cmv = Math.max(cmvByCategory[product.category].max_cmv, cmv);
    });

    // Calcular média
    Object.values(cmvByCategory).forEach((cat: any) => {
      cat.avg_cmv = parseFloat((cat.total_cmv / cat.total_products).toFixed(2));
      delete cat.total_cmv;
    });

    // 7. Ingredientes sem histórico de preço (alertas)
    const { data: ingredientsWithoutHistory } = await supabaseClient
      .from("ingredients")
      .select("id, name, category")
      .eq("active", true)
      .is("current_price", null);

    // 8. Top 5 ingredientes que mais impactam o CMV
    const ingredientImpact: Record<string, any> = {};

    products?.forEach((product: any) => {
      // Buscar itens de cada receita (seria melhor fazer join, mas vamos simular)
      // Na prática, você faria um join ou RPC
    });

    const response = {
      success: true,
      period,
      stats: {
        total_ingredients: totalIngredients.count || 0,
        total_recipes: totalRecipes.count || 0,
        ingredients_without_price: ingredientsWithoutHistory?.length || 0,
      },
      products: products?.map((p: any) => ({
        product_name: p.product_name,
        product_code: p.product_code,
        category: p.category,
        cmv_per_unit: parseFloat(p.cmv_per_unit),
        total_ingredients: p.total_ingredients,
      })),
      cmv_by_category: Object.values(cmvByCategory),
      expensive_ingredients: expensiveIngredients?.map((i: any) => ({
        name: i.name,
        category: i.category,
        price: parseFloat(i.current_price),
        unit: i.unit,
      })),
      price_variations: priceVariations.slice(0, 10), // Top 10 variações
      alerts: {
        ingredients_without_price: ingredientsWithoutHistory?.map((i: any) => ({
          name: i.name,
          category: i.category,
        })) || [],
      },
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
