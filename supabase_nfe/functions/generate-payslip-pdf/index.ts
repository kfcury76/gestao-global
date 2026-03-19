// ============================================================================
// Edge Function: generate-payslip-pdf
// Descrição: Gera PDF do contracheque (payslip)
// Input: payroll_entry_id
// Output: URL do PDF (Supabase Storage ou Google Drive)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { payroll_entry_id } = await req.json()

    if (!payroll_entry_id) {
      return new Response(
        JSON.stringify({ error: 'payroll_entry_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar lançamento de folha
    const { data: payroll, error: payrollError } = await supabaseClient
      .from('payroll_entries')
      .select(`
        *,
        employee:employees (
          name,
          cpf,
          position,
          department
        )
      `)
      .eq('id', payroll_entry_id)
      .single()

    if (payrollError || !payroll) {
      return new Response(
        JSON.stringify({ error: 'Lançamento de folha não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Gerar PDF
    const pdfBytes = await generatePayslipPDF(payroll)

    // Upload para Supabase Storage
    const fileName = `contracheque_${payroll.employee.name.replace(/\s/g, '_')}_${payroll.reference_month}.pdf`
    const filePath = `payslips/${new Date().getFullYear()}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('documents')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // Obter URL pública
    const { data: publicUrl } = supabaseClient.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Atualizar payroll_entry com URL do PDF
    await supabaseClient
      .from('payroll_entries')
      .update({ pdf_url: publicUrl.publicUrl })
      .eq('id', payroll_entry_id)

    return new Response(
      JSON.stringify({
        success: true,
        pdf_url: publicUrl.publicUrl,
        file_name: fileName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao gerar contracheque:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================================
// Geração de PDF do Contracheque
// ============================================================================

async function generatePayslipPDF(payroll: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()
  let yPosition = height - 50

  // Helper para desenhar linha
  const drawText = (text: string, x: number, size: number, isBold = false) => {
    page.drawText(text, {
      x,
      y: yPosition,
      size,
      font: isBold ? fontBold : font,
      color: rgb(0, 0, 0)
    })
    yPosition -= size + 5
  }

  // Cabeçalho
  drawText('CONTRACHEQUE', 250, 16, true)
  yPosition -= 10
  drawText('Empório Cosi', 230, 12)
  yPosition -= 20

  // Dados do Funcionário
  drawText(`Funcionário: ${payroll.employee.name}`, 50, 11)
  drawText(`CPF: ${payroll.employee.cpf || 'N/A'}`, 50, 11)
  drawText(`Cargo: ${payroll.employee.position}`, 50, 11)
  drawText(`Departamento: ${payroll.employee.department}`, 50, 11)
  drawText(`Mês de Referência: ${formatMonth(payroll.reference_month)}`, 50, 11)
  yPosition -= 10

  // Linha separadora
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0)
  })
  yPosition -= 15

  // PROVENTOS
  drawText('PROVENTOS', 50, 12, true)
  drawText(`Salário Base: R$ ${payroll.base_salary.toFixed(2)}`, 70, 10)

  if (payroll.overtime_65_value > 0) {
    drawText(`Hora Extra 65%: R$ ${payroll.overtime_65_value.toFixed(2)}`, 70, 10)
  }

  if (payroll.overtime_100_value > 0) {
    drawText(`Hora Extra 100%: R$ ${payroll.overtime_100_value.toFixed(2)}`, 70, 10)
  }

  if (payroll.night_shift_value > 0) {
    drawText(`Hora Noturna: R$ ${payroll.night_shift_value.toFixed(2)}`, 70, 10)
  }

  if (payroll.other_earnings > 0) {
    drawText(`Outros Proventos: R$ ${payroll.other_earnings.toFixed(2)}`, 70, 10)
  }

  yPosition -= 5

  // DESCONTOS
  drawText('DESCONTOS', 50, 12, true)

  if (payroll.discounts > 0) {
    drawText(`Faltas/Atrasos: R$ ${payroll.discounts.toFixed(2)}`, 70, 10)
  }

  drawText(`INSS: R$ ${payroll.inss_employee.toFixed(2)}`, 70, 10)
  yPosition -= 10

  // Linha separadora
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0)
  })
  yPosition -= 15

  // TOTAIS
  drawText(`SALÁRIO BRUTO: R$ ${payroll.gross_total.toFixed(2)}`, 50, 11, true)
  drawText(`TOTAL DE DESCONTOS: R$ ${(payroll.discounts + payroll.inss_employee).toFixed(2)}`, 50, 11, true)
  drawText(`SALÁRIO LÍQUIDO: R$ ${payroll.net_total.toFixed(2)}`, 50, 13, true)

  yPosition -= 20

  // Informações adicionais
  drawText('INFORMAÇÕES ADICIONAIS:', 50, 10, true)
  drawText(`FGTS (8%): R$ ${payroll.fgts.toFixed(2)} (depositado pela empresa)`, 70, 9)
  drawText(`INSS Patronal: R$ ${payroll.inss_employer.toFixed(2)} (pago pela empresa)`, 70, 9)

  yPosition -= 30

  // Rodapé
  drawText('_____________________________', 80, 9)
  drawText('Assinatura do Funcionário', 100, 9)

  return pdfDoc.save()
}

function formatMonth(dateString: string): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const date = new Date(dateString + 'T00:00:00')
  const month = months[date.getMonth()]
  const year = date.getFullYear()

  return `${month}/${year}`
}
