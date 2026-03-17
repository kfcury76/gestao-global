// =====================================================
// EDGE FUNCTION: manage-custos-fixos
// Descrição: CRUD completo para custos fixos e categorias
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Tipos
interface CategoriaInput {
  nome: string
  descricao?: string
  icone?: string
  cor?: string
  ordem?: number
}

interface CustoFixoInput {
  categoria_id: string
  descricao: string
  valor: number
  tipo_periodicidade: 'mensal' | 'anual' | 'unico'
  data_referencia: string
  recorrente?: boolean
  data_inicio: string
  data_fim?: string | null
  status?: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
  data_pagamento?: string | null
  forma_pagamento?: string | null
  observacoes?: string | null
  anexos?: any
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    // Parse URL e método
    const url = new URL(req.url)
    const method = req.method
    const path = url.pathname
    const searchParams = url.searchParams

    // =====================================================
    // ROTAS: CATEGORIAS
    // =====================================================

    // GET /manage-custos-fixos/categorias - Listar categorias
    if (path.includes('/categorias') && method === 'GET') {
      const ativo = searchParams.get('ativo')

      let query = supabase
        .from('categorias_custos_fixos')
        .select('*')
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true })

      if (ativo !== null) {
        query = query.eq('ativo', ativo === 'true')
      }

      const { data, error } = await query

      if (error) throw error

      return new Response(JSON.stringify({ categorias: data }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // POST /manage-custos-fixos/categorias - Criar categoria
    if (path.includes('/categorias') && method === 'POST') {
      const body: CategoriaInput = await req.json()

      const { data, error } = await supabase
        .from('categorias_custos_fixos')
        .insert([
          {
            nome: body.nome,
            descricao: body.descricao,
            icone: body.icone || 'circle',
            cor: body.cor || '#6366f1',
            ordem: body.ordem || 0,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ categoria: data }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // PUT /manage-custos-fixos/categorias/:id - Atualizar categoria
    if (path.includes('/categorias/') && method === 'PUT') {
      const id = path.split('/').pop()
      const body: Partial<CategoriaInput> = await req.json()

      const updateData: any = {}
      if (body.nome) updateData.nome = body.nome
      if (body.descricao !== undefined) updateData.descricao = body.descricao
      if (body.icone) updateData.icone = body.icone
      if (body.cor) updateData.cor = body.cor
      if (body.ordem !== undefined) updateData.ordem = body.ordem

      const { data, error } = await supabase
        .from('categorias_custos_fixos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ categoria: data }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // DELETE /manage-custos-fixos/categorias/:id - Desativar categoria
    if (path.includes('/categorias/') && method === 'DELETE') {
      const id = path.split('/').pop()

      // Soft delete (marca como inativo)
      const { data, error } = await supabase
        .from('categorias_custos_fixos')
        .update({ ativo: false })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ categoria: data }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // =====================================================
    // ROTAS: CUSTOS FIXOS
    // =====================================================

    // GET /manage-custos-fixos - Listar custos fixos
    if (!path.includes('/categorias') && method === 'GET') {
      const mes = searchParams.get('mes')
      const ano = searchParams.get('ano')
      const categoria_id = searchParams.get('categoria_id')
      const status = searchParams.get('status')
      const recorrente = searchParams.get('recorrente')

      let query = supabase
        .from('custos_fixos')
        .select(`
          *,
          categoria:categorias_custos_fixos(id, nome, icone, cor)
        `)
        .order('data_referencia', { ascending: false })
        .order('created_at', { ascending: false })

      // Filtros
      if (mes && ano) {
        const dataInicio = `${ano}-${mes.padStart(2, '0')}-01`
        const proximoMes = parseInt(mes) === 12 ? 1 : parseInt(mes) + 1
        const proximoAno = parseInt(mes) === 12 ? parseInt(ano) + 1 : parseInt(ano)
        const dataFim = `${proximoAno}-${String(proximoMes).padStart(2, '0')}-01`

        query = query
          .gte('data_referencia', dataInicio)
          .lt('data_referencia', dataFim)
      }

      if (categoria_id) {
        query = query.eq('categoria_id', categoria_id)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (recorrente !== null) {
        query = query.eq('recorrente', recorrente === 'true')
      }

      const { data, error } = await query

      if (error) throw error

      return new Response(JSON.stringify({ custos: data }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // POST /manage-custos-fixos - Criar custo fixo
    if (!path.includes('/categorias') && method === 'POST') {
      const body: CustoFixoInput = await req.json()

      const { data, error } = await supabase
        .from('custos_fixos')
        .insert([
          {
            categoria_id: body.categoria_id,
            descricao: body.descricao,
            valor: body.valor,
            tipo_periodicidade: body.tipo_periodicidade,
            data_referencia: body.data_referencia,
            recorrente: body.recorrente ?? false,
            data_inicio: body.data_inicio,
            data_fim: body.data_fim,
            status: body.status || 'pendente',
            data_pagamento: body.data_pagamento,
            forma_pagamento: body.forma_pagamento,
            observacoes: body.observacoes,
            anexos: body.anexos,
            created_by: user.id,
          },
        ])
        .select(`
          *,
          categoria:categorias_custos_fixos(id, nome, icone, cor)
        `)
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ custo: data }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // PUT /manage-custos-fixos/:id - Atualizar custo fixo
    if (path.match(/\/manage-custos-fixos\/[a-f0-9-]+$/) && method === 'PUT') {
      const id = path.split('/').pop()
      const body: Partial<CustoFixoInput> = await req.json()

      const updateData: any = {}
      if (body.categoria_id) updateData.categoria_id = body.categoria_id
      if (body.descricao) updateData.descricao = body.descricao
      if (body.valor !== undefined) updateData.valor = body.valor
      if (body.tipo_periodicidade) updateData.tipo_periodicidade = body.tipo_periodicidade
      if (body.data_referencia) updateData.data_referencia = body.data_referencia
      if (body.recorrente !== undefined) updateData.recorrente = body.recorrente
      if (body.data_inicio) updateData.data_inicio = body.data_inicio
      if (body.data_fim !== undefined) updateData.data_fim = body.data_fim
      if (body.status) updateData.status = body.status
      if (body.data_pagamento !== undefined) updateData.data_pagamento = body.data_pagamento
      if (body.forma_pagamento !== undefined) updateData.forma_pagamento = body.forma_pagamento
      if (body.observacoes !== undefined) updateData.observacoes = body.observacoes
      if (body.anexos !== undefined) updateData.anexos = body.anexos

      const { data, error } = await supabase
        .from('custos_fixos')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          categoria:categorias_custos_fixos(id, nome, icone, cor)
        `)
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ custo: data }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // DELETE /manage-custos-fixos/:id - Cancelar custo fixo
    if (path.match(/\/manage-custos-fixos\/[a-f0-9-]+$/) && method === 'DELETE') {
      const id = path.split('/').pop()

      // Soft delete (marca como cancelado)
      const { data, error } = await supabase
        .from('custos_fixos')
        .update({ status: 'cancelado' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ custo: data }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // =====================================================
    // ROTAS: AÇÕES ESPECIAIS
    // =====================================================

    // POST /manage-custos-fixos/gerar-recorrentes - Gerar custos recorrentes
    if (path.includes('/gerar-recorrentes') && method === 'POST') {
      const { mes, ano } = await req.json()

      if (!mes || !ano) {
        return new Response(
          JSON.stringify({ error: 'Parâmetros mes e ano são obrigatórios' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase.rpc('gerar_custos_recorrentes', {
        mes: parseInt(mes),
        ano: parseInt(ano),
      })

      if (error) throw error

      return new Response(
        JSON.stringify({
          message: `${data} custos recorrentes gerados para ${mes}/${ano}`,
          quantidade: data,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // GET /manage-custos-fixos/resumo-mensal - Resumo mensal por categoria
    if (path.includes('/resumo-mensal') && method === 'GET') {
      const mes = searchParams.get('mes')
      const ano = searchParams.get('ano')

      if (!mes || !ano) {
        return new Response(
          JSON.stringify({ error: 'Parâmetros mes e ano são obrigatórios' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase.rpc('calcular_custo_fixo_mensal', {
        mes: parseInt(mes),
        ano: parseInt(ano),
      })

      if (error) throw error

      return new Response(JSON.stringify({ resumo: data }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Rota não encontrada
    return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Erro na função:', error)
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
ROTAS DISPONÍVEIS:

CATEGORIAS:
- GET    /manage-custos-fixos/categorias?ativo=true
- POST   /manage-custos-fixos/categorias
- PUT    /manage-custos-fixos/categorias/:id
- DELETE /manage-custos-fixos/categorias/:id

CUSTOS FIXOS:
- GET    /manage-custos-fixos?mes=3&ano=2026&categoria_id=xxx&status=pago
- POST   /manage-custos-fixos
- PUT    /manage-custos-fixos/:id
- DELETE /manage-custos-fixos/:id

AÇÕES:
- POST   /manage-custos-fixos/gerar-recorrentes { mes: 3, ano: 2026 }
- GET    /manage-custos-fixos/resumo-mensal?mes=3&ano=2026

EXEMPLO DE TESTE (curl):
curl -X GET "https://xxx.supabase.co/functions/v1/manage-custos-fixos?mes=3&ano=2026" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
*/
