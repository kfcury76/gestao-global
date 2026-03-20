// ============================================================================
// Edge Function: extract-secullum-pdf (CSV Version)
// Descrição: Extrai dados de folha de ponto do Secullum (CSV convertido manualmente)
// Input: { file_content: string, file_type: "csv", reference_month?: string }
// Output: { success: true, employees: [...], matched: N, not_matched: N }
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecullumEmployee {
  name: string
  absences: number // faltas (dias)
  late_minutes: number // atrasos (minutos)
  overtime_65_hours: number // HE 65%
  overtime_100_hours: number // HE 100%
  night_hours: number // hora noturna
  employee_id?: string | null
  base_salary?: number | null
  match_status: 'found' | 'not_found' | 'ambiguous'
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { file_content, file_type, reference_month } = await req.json()

    if (!file_content || !file_type) {
      return new Response(
        JSON.stringify({ error: 'file_content e file_type são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (file_type !== 'csv') {
      return new Response(
        JSON.stringify({
          error: 'Apenas CSV é suportado. Converta o PDF/Excel do Secullum para CSV antes de enviar.',
          supported_formats: ['csv'],
          csv_format_example: 'nome,faltas,atrasos_minutos,he_65,he_100,horas_noturnas'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parsear CSV
    const employees = parseCSV(file_content)

    if (employees.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum funcionário encontrado no CSV. Verifique o formato.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar funcionários do Supabase para matching
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_ANON_KEY não configurados')
    }

    const dbEmployeesResponse = await fetch(
      `${supabaseUrl}/rest/v1/employees?is_active=eq.true&select=id,name,cpf,position,department,base_salary`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        }
      }
    )

    if (!dbEmployeesResponse.ok) {
      throw new Error(`Erro ao buscar funcionários: ${dbEmployeesResponse.status}`)
    }

    const dbEmployees = await dbEmployeesResponse.json()

    // Enriquecer com dados de funcionários (matching por nome)
    const enrichedEmployees = enrichWithEmployeeData(employees, dbEmployees)

    // Contar matching
    const matched = enrichedEmployees.filter(emp => emp.match_status === 'found').length
    const notMatched = enrichedEmployees.filter(emp => emp.match_status === 'not_found').length
    const ambiguous = enrichedEmployees.filter(emp => emp.match_status === 'ambiguous').length

    return new Response(
      JSON.stringify({
        success: true,
        reference_month: reference_month || new Date().toISOString().slice(0, 7),
        total_employees: employees.length,
        matched: matched,
        not_matched: notMatched,
        ambiguous: ambiguous,
        employees: enrichedEmployees
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao extrair Secullum:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================================
// Parser CSV
// ============================================================================

function parseCSV(csvContent: string): SecullumEmployee[] {
  const employees: SecullumEmployee[] = []
  const lines = csvContent.trim().split('\n')

  if (lines.length < 2) {
    throw new Error('CSV vazio ou sem dados')
  }

  // Primeira linha = cabeçalho
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

  // Detectar índices das colunas
  const nameIdx = headers.findIndex(h => h.includes('nome') || h === 'name')
  const absencesIdx = headers.findIndex(h => h.includes('falta') || h === 'absences')
  const lateIdx = headers.findIndex(h => h.includes('atraso') || h.includes('late'))
  const he65Idx = headers.findIndex(h => h.includes('he_65') || h.includes('he65') || h.includes('he 65'))
  const he100Idx = headers.findIndex(h => h.includes('he_100') || h.includes('he100') || h.includes('he 100'))
  const nightIdx = headers.findIndex(h => h.includes('noturna') || h.includes('night') || h.includes('horas_noturnas'))

  if (nameIdx === -1) {
    throw new Error('Coluna "nome" não encontrada no CSV. Certifique-se de que a primeira linha contém os cabeçalhos.')
  }

  // Parsear cada linha de dados
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(',').map(v => v.trim())

    if (values.length < headers.length) {
      console.warn(`Linha ${i + 1} ignorada: número de colunas inválido`)
      continue
    }

    const name = values[nameIdx]
    if (!name) {
      console.warn(`Linha ${i + 1} ignorada: nome vazio`)
      continue
    }

    employees.push({
      name: name,
      absences: absencesIdx !== -1 ? parseInt(values[absencesIdx]) || 0 : 0,
      late_minutes: lateIdx !== -1 ? parseInt(values[lateIdx]) || 0 : 0,
      overtime_65_hours: he65Idx !== -1 ? parseFloat(values[he65Idx].replace(',', '.')) || 0 : 0,
      overtime_100_hours: he100Idx !== -1 ? parseFloat(values[he100Idx].replace(',', '.')) || 0 : 0,
      night_hours: nightIdx !== -1 ? parseFloat(values[nightIdx].replace(',', '.')) || 0 : 0,
      match_status: 'not_found'
    })
  }

  return employees
}

// ============================================================================
// Matching com Funcionários Cadastrados
// ============================================================================

function enrichWithEmployeeData(
  employees: SecullumEmployee[],
  dbEmployees: any[]
): SecullumEmployee[] {
  return employees.map(emp => {
    const normalizedName = normalizeString(emp.name)

    // Busca exata
    const exactMatch = dbEmployees.find((dbEmp: any) =>
      normalizeString(dbEmp.name) === normalizedName
    )

    if (exactMatch) {
      return {
        ...emp,
        employee_id: exactMatch.id,
        base_salary: exactMatch.base_salary,
        cpf: exactMatch.cpf,
        position: exactMatch.position,
        department: exactMatch.department,
        match_status: 'found'
      }
    }

    // Busca fuzzy (contém)
    const fuzzyMatches = dbEmployees.filter((dbEmp: any) => {
      const dbNormalized = normalizeString(dbEmp.name)
      return dbNormalized.includes(normalizedName) || normalizedName.includes(dbNormalized)
    })

    if (fuzzyMatches.length === 1) {
      return {
        ...emp,
        employee_id: fuzzyMatches[0].id,
        base_salary: fuzzyMatches[0].base_salary,
        cpf: fuzzyMatches[0].cpf,
        position: fuzzyMatches[0].position,
        department: fuzzyMatches[0].department,
        match_status: 'found',
        match_type: 'fuzzy'
      }
    }

    if (fuzzyMatches.length > 1) {
      return {
        ...emp,
        employee_id: null,
        base_salary: null,
        match_status: 'ambiguous',
        possible_matches: fuzzyMatches.map((m: any) => ({
          id: m.id,
          name: m.name,
          position: m.position
        }))
      }
    }

    // Não encontrado
    return {
      ...emp,
      employee_id: null,
      base_salary: null,
      match_status: 'not_found'
    }
  })
}

// ============================================================================
// Funções Auxiliares
// ============================================================================

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z\s]/g, '') // remove caracteres especiais
    .trim()
    .replace(/\s+/g, ' ') // normaliza espaços
}
