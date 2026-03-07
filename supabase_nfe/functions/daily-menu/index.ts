import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Conexão com o banco externo
const supabaseUrl = "https://hwmloddaupjabmmtgqco.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bWxvZGRhdXBqYWJtbXRncWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDA5NTMsImV4cCI6MjA4MjA3Njk1M30.7w8QFSo1ll_JwFidkDUi7BiLLmy3Bw1mGRr9cCPEIVw";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Buscar proteínas
    const { data: proteins, error: proteinsError } = await supabase
      .from("proteins")
      .select("id, name, description, price, available")
      .eq("available", true)
      .order("name");

    if (proteinsError) {
      console.error("Erro ao buscar proteínas:", proteinsError);
    }

    // Buscar acompanhamentos
    const { data: sides, error: sidesError } = await supabase
      .from("sides")
      .select("id, name, description, category, available")
      .eq("available", true)
      .order("category, name");

    if (sidesError) {
      console.error("Erro ao buscar acompanhamentos:", sidesError);
    }

    // Buscar tamanhos de marmita
    const { data: sizes, error: sizesError } = await supabase
      .from("marmita_sizes")
      .select("id, name, description, base_price, max_sides, available")
      .eq("available", true)
      .order("base_price");

    if (sizesError) {
      console.error("Erro ao buscar tamanhos:", sizesError);
    }

    // Montar buffet (acompanhamentos + proteínas)
    let buffetId = 1;
    const buffet: any[] = [];

    // Adicionar acompanhamentos ao buffet
    if (sides) {
      for (const side of sides) {
        buffet.push({
          id: buffetId++,
          name: side.name,
          category: side.category === "Carboidrato" ? "Acompanhamentos" : side.category,
          description: side.description || null,
          price: null,
        });
      }
    }

    // Adicionar proteínas ao buffet
    if (proteins) {
      for (const protein of proteins) {
        buffet.push({
          id: buffetId++,
          name: protein.name,
          category: "Proteínas",
          description: protein.description || null,
          price: protein.price > 0 ? protein.price : null,
        });
      }
    }

    // Montar marmitas pré-configuradas
    const marmitas: any[] = [];
    if (sizes && proteins && sides) {
      const defaultSides = sides.slice(0, 3).map((s: any) => s.name);

      sizes.forEach((size: any, index: number) => {
        const protein = proteins[index % proteins.length];
        const sidesToUse = sides.slice(0, size.max_sides).map((s: any) => s.name);
        
        marmitas.push({
          id: index + 1,
          name: `Marmita ${size.name.charAt(0)} - ${protein?.name || "Variada"}`,
          size: size.name,
          protein: protein?.name || "A escolher",
          sides: sidesToUse,
          price: Number(size.base_price) + Number(protein?.price || 0),
        });
      });
    }

    // Montar resposta final
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    const response = {
      date: dateStr,
      buffet,
      marmitas,
      metadata: {
        source: "lovable-api",
        version: "1.0",
        updated_at: today.toISOString(),
      },
    };

    console.log(`API daily-menu: ${buffet.length} itens buffet, ${marmitas.length} marmitas`);

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na função daily-menu:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
