// =====================================================
// EDGE FUNCTION: calcular-custo-fixo-diario
// Descrição: Calcula o custo fixo diário (rateio mensal / 30 dias)
// Uso: Para saber quanto custa operar a empresa por dia
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

interface CustoFixoDiarioResponse {
  mes: number
  ano: number
  total_mensal: number
  total_diario: number
  custo_por_hora: number
  custo_por_minuto: number
  dias_uteis: number
  custo_dia_util: number
  categorias: Array<{
    nome: string
    total_mensal: number
    total_diario: number
    percentual: number
    cor: string
    icone: string
  }>
}

serve(async (req) => {
  try {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader = req.headers.get('Authorization')!

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse parâmetros
    const url = new URL(req.url)
    const mesParam = url.searchParams.get('mes')
    const anoParam = url.searchParams.get('ano')

    // Se não informar, usa mês/ano atual
    const hoje = new Date()
    const mes = mesParam ? parseInt(mesParam) : hoje.getMonth() + 1
    const ano = anoParam ? parseInt(anoParam) : hoje.getFullYear()

    // Validação
    if (mes < 1 || mes > 12) {
      return new Response(JSON.stringify({ error: 'Mês inválido (1-12)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // =====================================================
    // 1. Buscar total mensal por categoria (via RPC)
    // =====================================================

    const { data: resumo, error: resumoError } = await supabase.rpc(
      'calcular_custo_fixo_mensal',
      {
        mes,
        ano,
      }
    )

    if (resumoError) throw resumoError

    // =====================================================
    // 2. Calcular totais
    // =====================================================

    const totalMensal = resumo.reduce(
      (acc: number, item: any) => acc + parseFloat(item.total),
      0
    )

    // Rateio: assumimos 30 dias por mês (média)
    const diasMes = 30
    const totalDiario = totalMensal / diasMes

    // Custo por hora (24h por dia)
    const custoPorHora = totalDiario / 24

    // Custo por minuto
    const custoPorMinuto = custoPorHora / 60

    // =====================================================
    // 3. Calcular dias úteis (aproximado: 22 dias úteis/mês)
    // =====================================================

    // Função para contar dias úteis
    const calcularDiasUteis = (mes: number, ano: number): number => {
      const primeiroDia = new Date(ano, mes - 1, 1)
      const ultimoDia = new Date(ano, mes, 0)
      let diasUteis = 0

      for (
        let dia = primeiroDia;
        dia <= ultimoDia;
        dia.setDate(dia.getDate() + 1)
      ) {
        const diaSemana = dia.getDay()
        // 0 = domingo, 6 = sábado
        if (diaSemana !== 0 && diaSemana !== 6) {
          diasUteis++
        }
      }

      return diasUteis
    }

    const diasUteis = calcularDiasUteis(mes, ano)
    const custoDiaUtil = totalMensal / diasUteis

    // =====================================================
    // 4. Formatar categorias com percentuais
    // =====================================================

    const categorias = resumo.map((item: any) => {
      const totalCategoria = parseFloat(item.total)
      const percentual =
        totalMensal > 0 ? (totalCategoria / totalMensal) * 100 : 0

      return {
        nome: item.categoria_nome,
        total_mensal: totalCategoria,
        total_diario: totalCategoria / diasMes,
        percentual: Math.round(percentual * 100) / 100, // 2 casas decimais
        cor: '#6366f1', // Cor padrão (será substituída via JOIN se disponível)
        icone: 'circle',
      }
    })

    // =====================================================
    // 5. Enriquecer com dados das categorias (cores, ícones)
    // =====================================================

    const categoriasIds = resumo.map((item: any) => item.categoria_nome)

    if (categoriasIds.length > 0) {
      const { data: categoriasData, error: catError } = await supabase
        .from('categorias_custos_fixos')
        .select('nome, cor, icone')
        .in('nome', categoriasIds)

      if (!catError && categoriasData) {
        // Merge cor e ícone
        categorias.forEach((cat: any) => {
          const catData = categoriasData.find((c) => c.nome === cat.nome)
          if (catData) {
            cat.cor = catData.cor
            cat.icone = catData.icone
          }
        })
      }
    }

    // =====================================================
    // 6. Resposta
    // =====================================================

    const response: CustoFixoDiarioResponse = {
      mes,
      ano,
      total_mensal: Math.round(totalMensal * 100) / 100,
      total_diario: Math.round(totalDiario * 100) / 100,
      custo_por_hora: Math.round(custoPorHora * 100) / 100,
      custo_por_minuto: Math.round(custoPorMinuto * 100) / 100,
      dias_uteis: diasUteis,
      custo_dia_util: Math.round(custoDiaUtil * 100) / 100,
      categorias: categorias.sort((a, b) => b.total_mensal - a.total_mensal),
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    console.error('Erro ao calcular custo fixo diário:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno do servidor',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

/*
EXEMPLOS DE USO:

1. Custo diário do mês atual:
GET /calcular-custo-fixo-diario

2. Custo diário de março/2026:
GET /calcular-custo-fixo-diario?mes=3&ano=2026

RESPOSTA EXEMPLO:
{
  "mes": 3,
  "ano": 2026,
  "total_mensal": 4169.90,
  "total_diario": 138.99,
  "custo_por_hora": 5.79,
  "custo_por_minuto": 0.10,
  "dias_uteis": 22,
  "custo_dia_util": 189.54,
  "categorias": [
    {
      "nome": "Aluguel",
      "total_mensal": 3500.00,
      "total_diario": 116.67,
      "percentual": 83.94,
      "cor": "#8b5cf6",
      "icone": "home"
    },
    {
      "nome": "Energia Elétrica",
      "total_mensal": 450.00,
      "total_diario": 15.00,
      "percentual": 10.79,
      "cor": "#eab308",
      "icone": "zap"
    },
    // ...
  ]
}

USO NO FRONTEND:
- Exibir "Seu negócio custa R$ X por dia para operar"
- Gráfico de pizza com distribuição por categoria
- Comparação mês a mês (total mensal)
- Cálculo de break-even (faturamento mínimo diário)

TESTE (curl):
curl -X GET "https://xxx.supabase.co/functions/v1/calcular-custo-fixo-diario?mes=3&ano=2026" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
*/
