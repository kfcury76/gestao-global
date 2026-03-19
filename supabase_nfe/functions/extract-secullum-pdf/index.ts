// ============================================================================
// Edge Function: extract-secullum-pdf
// Descrição: Extrai dados de folha de ponto do Secullum Web Pro (PDF/Excel)
// Input: PDF ou Excel em base64
// Output: Array de funcionários com dados de ponto
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { file_content, file_type, reference_month } = await req.json()

    if (!file_content || !file_type) {
      return new Response(
        JSON.stringify({ error: 'file_content e file_type são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let employees: SecullumEmployee[] = []

    if (file_type === 'pdf') {
      employees = await extractFromPDF(file_content)
    } else if (file_type === 'excel' || file_type === 'xlsx') {
      employees = await extractFromExcel(file_content)
    } else {
      return new Response(
        JSON.stringify({ error: 'file_type inválido. Use: pdf, excel, xlsx' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enriquecer com dados de funcionários cadastrados
    const enrichedEmployees = await enrichWithEmployeeData(supabaseClient, employees)

    return new Response(
      JSON.stringify({
        success: true,
        reference_month: reference_month || new Date().toISOString().slice(0, 7),
        employees_count: employees.length,
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
// Extração de PDF (pdfjs-dist)
// ============================================================================

async function extractFromPDF(base64Content: string): Promise<SecullumEmployee[]> {
  // Importar pdfjs-dist
  const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174')

  // Decodificar base64
  const binaryString = atob(base64Content)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Carregar PDF
  const loadingTask = pdfjsLib.getDocument({ data: bytes })
  const pdf = await loadingTask.promise

  let fullText = ''

  // Extrair texto de todas as páginas
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    fullText += pageText + '\n'
  }

  // Parser de texto (padrão Secullum)
  return parseSecullumText(fullText)
}

// ============================================================================
// Extração de Excel (xlsx)
// ============================================================================

async function extractFromExcel(base64Content: string): Promise<SecullumEmployee[]> {
  const XLSX = await import('https://esm.sh/xlsx@0.18.5')

  // Decodificar base64
  const binaryString = atob(base64Content)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Ler Excel
  const workbook = XLSX.read(bytes, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(firstSheet)

  // Parser de dados do Excel
  return parseSecullumExcel(data)
}

// ============================================================================
// Parser de Texto (Secullum PDF)
// ============================================================================

function parseSecullumText(text: string): SecullumEmployee[] {
  const employees: SecullumEmployee[] = []
  const lines = text.split('\n')

  // Padrões de regex para Secullum Web Pro
  // Exemplo de linha: "João Silva    Faltas: 2    Atrasos: 45min    HE 65%: 10h    HE 100%: 5h    H.Noturna: 8h"

  const employeePattern = /^([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+)\s+Faltas:\s*(\d+)\s+Atrasos:\s*(\d+)min\s+HE\s*65%:\s*([\d,]+)h\s+HE\s*100%:\s*([\d,]+)h\s+H\.Noturna:\s*([\d,]+)h/i

  for (const line of lines) {
    const match = line.match(employeePattern)

    if (match) {
      employees.push({
        name: match[1].trim(),
        absences: parseInt(match[2]) || 0,
        late_minutes: parseInt(match[3]) || 0,
        overtime_65_hours: parseFloat(match[4].replace(',', '.')) || 0,
        overtime_100_hours: parseFloat(match[5].replace(',', '.')) || 0,
        night_hours: parseFloat(match[6].replace(',', '.')) || 0,
      })
    }
  }

  return employees
}

// ============================================================================
// Parser de Excel (Secullum)
// ============================================================================

function parseSecullumExcel(data: any[]): SecullumEmployee[] {
  const employees: SecullumEmployee[] = []

  // Assumindo colunas: Nome | Faltas | Atrasos | HE65 | HE100 | HNoturna
  for (const row of data) {
    if (row['Nome'] || row['NOME'] || row['nome']) {
      employees.push({
        name: (row['Nome'] || row['NOME'] || row['nome']).trim(),
        absences: parseInt(row['Faltas'] || row['FALTAS'] || row['faltas'] || 0),
        late_minutes: parseInt(row['Atrasos'] || row['ATRASOS'] || row['atrasos'] || 0),
        overtime_65_hours: parseFloat(row['HE 65%'] || row['HE65'] || row['he65'] || 0),
        overtime_100_hours: parseFloat(row['HE 100%'] || row['HE100'] || row['he100'] || 0),
        night_hours: parseFloat(row['H.Noturna'] || row['Hora Noturna'] || row['noturna'] || 0),
      })
    }
  }

  return employees
}

// ============================================================================
// Enriquecer com Dados de Funcionários Cadastrados
// ============================================================================

async function enrichWithEmployeeData(
  supabase: any,
  employees: SecullumEmployee[]
): Promise<any[]> {
  // Buscar todos os funcionários ativos
  const { data: dbEmployees, error } = await supabase
    .from('employees')
    .select('id, name, cpf, position, department, base_salary')
    .eq('is_active', true)

  if (error) {
    console.error('Erro ao buscar funcionários:', error)
    return employees.map(emp => ({ ...emp, employee_id: null, base_salary: null, match_status: 'not_found' }))
  }

  // Match por nome (normalizado)
  return employees.map(emp => {
    const normalizedName = normalizeString(emp.name)
    const match = dbEmployees.find((dbEmp: any) =>
      normalizeString(dbEmp.name) === normalizedName
    )

    if (match) {
      return {
        ...emp,
        employee_id: match.id,
        cpf: match.cpf,
        position: match.position,
        department: match.department,
        base_salary: match.base_salary,
        match_status: 'found'
      }
    } else {
      return {
        ...emp,
        employee_id: null,
        base_salary: null,
        match_status: 'not_found'
      }
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
}
