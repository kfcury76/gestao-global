// ============================================================================
// Edge Function: calculate-payroll
// Descrição: Calcula folha de pagamento completa (HE, descontos, INSS, FGTS)
// Input: employee_id + dados Secullum + reference_month
// Output: PayrollEntry completo
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayrollInput {
  employee_id: string
  reference_month: string // 'YYYY-MM-DD' (dia 01)
  absences: number
  late_minutes: number
  overtime_65_hours: number
  overtime_100_hours: number
  night_hours: number
  other_earnings?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const input: PayrollInput = await req.json()

    if (!input.employee_id || !input.reference_month) {
      return new Response(
        JSON.stringify({ error: 'employee_id e reference_month são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar funcionário
    const { data: employee, error: employeeError } = await supabaseClient
      .from('employees')
      .select('*')
      .eq('id', input.employee_id)
      .single()

    if (employeeError || !employee) {
      return new Response(
        JSON.stringify({ error: 'Funcionário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular folha
    const payroll = calculatePayroll(employee, input)

    // Inserir ou atualizar no banco
    const { data: savedPayroll, error: saveError } = await supabaseClient
      .from('payroll_entries')
      .upsert({
        employee_id: input.employee_id,
        reference_month: input.reference_month,
        ...payroll
      }, {
        onConflict: 'employee_id,reference_month'
      })
      .select()
      .single()

    if (saveError) {
      throw saveError
    }

    return new Response(
      JSON.stringify({
        success: true,
        payroll: savedPayroll
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao calcular folha:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================================
// Função de Cálculo de Folha
// ============================================================================

function calculatePayroll(employee: any, input: PayrollInput) {
  const baseSalary = employee.base_salary
  const hourlyRate = baseSalary / 220 // 220 horas/mês (padrão CLT)

  // 1. Horas Extras
  const overtime65Value = input.overtime_65_hours * hourlyRate * 1.65 // 65% adicional
  const overtime100Value = input.overtime_100_hours * hourlyRate * 2.0 // 100% adicional
  const nightShiftValue = input.night_hours * hourlyRate * 1.2 // 20% adicional
  const otherEarnings = input.other_earnings || 0

  // 2. Descontos
  // Faltas: cada falta = 1 dia de trabalho (base_salary / 30)
  const absenceDiscount = input.absences * (baseSalary / 30)

  // Atrasos: cada minuto = (hourly_rate / 60)
  const lateDiscount = input.late_minutes * (hourlyRate / 60)

  const totalDiscounts = absenceDiscount + lateDiscount

  // 3. Salário Bruto
  const grossTotal = baseSalary + overtime65Value + overtime100Value + nightShiftValue + otherEarnings - totalDiscounts

  // 4. INSS (função progressiva)
  const { inssEmployee, inssEmployer } = calculateINSS(grossTotal)

  // 5. FGTS (8% sobre bruto)
  const fgts = grossTotal * 0.08

  // 6. Salário Líquido
  const netTotal = grossTotal - inssEmployee

  return {
    absences: input.absences,
    late_minutes: input.late_minutes,
    overtime_65_hours: input.overtime_65_hours,
    overtime_100_hours: input.overtime_100_hours,
    night_hours: input.night_hours,

    base_salary: parseFloat(baseSalary.toFixed(2)),
    overtime_65_value: parseFloat(overtime65Value.toFixed(2)),
    overtime_100_value: parseFloat(overtime100Value.toFixed(2)),
    night_shift_value: parseFloat(nightShiftValue.toFixed(2)),
    other_earnings: parseFloat(otherEarnings.toFixed(2)),

    discounts: parseFloat(totalDiscounts.toFixed(2)),

    gross_total: parseFloat(grossTotal.toFixed(2)),

    inss_employee: parseFloat(inssEmployee.toFixed(2)),
    inss_employer: parseFloat(inssEmployer.toFixed(2)),
    fgts: parseFloat(fgts.toFixed(2)),

    net_total: parseFloat(netTotal.toFixed(2)),

    status: 'pending'
  }
}

// ============================================================================
// Cálculo de INSS Progressivo (2026)
// ============================================================================

function calculateINSS(grossSalary: number): { inssEmployee: number; inssEmployer: number } {
  let inssEmployee = 0
  let remainder = grossSalary

  // Tabela INSS 2026 (simplificada)
  const brackets = [
    { limit: 1412.00, rate: 0.075 },
    { limit: 2666.68, rate: 0.09 },
    { limit: 4000.03, rate: 0.12 },
    { limit: 7786.02, rate: 0.14 }
  ]

  let previousLimit = 0

  for (const bracket of brackets) {
    if (remainder <= 0) break

    const bracketAmount = bracket.limit - previousLimit
    const taxableAmount = Math.min(remainder, bracketAmount)

    inssEmployee += taxableAmount * bracket.rate
    remainder -= taxableAmount
    previousLimit = bracket.limit
  }

  // INSS Patronal: 20% sobre salário bruto (limitado ao teto)
  const inssBase = Math.min(grossSalary, 7786.02)
  const inssEmployer = inssBase * 0.20

  return { inssEmployee, inssEmployer }
}
