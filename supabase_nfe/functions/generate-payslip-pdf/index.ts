// ============================================================================
// Edge Function: generate-payslip-pdf (HTML Version)
// Descrição: Gera HTML formatado do contracheque para conversão em PDF no frontend
// Input: { payroll_entry_id: string }
// Output: { success: true, html: string, employee_name: string, reference_month: string }
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payroll_entry_id } = await req.json()

    if (!payroll_entry_id) {
      return new Response(
        JSON.stringify({ error: 'payroll_entry_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar dados do Supabase via REST API
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_ANON_KEY não configurados')
    }

    // Buscar lançamento de folha com dados do funcionário
    const response = await fetch(
      `${supabaseUrl}/rest/v1/payroll_entries?id=eq.${payroll_entry_id}&select=*,employee:employees(name,cpf,position,department)`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro ao buscar payroll_entry: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Lançamento de folha não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payroll = data[0]
    const employee = payroll.employee

    if (!employee) {
      return new Response(
        JSON.stringify({ error: 'Funcionário não encontrado para este lançamento' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Gerar HTML do contracheque
    const html = generatePayslipHTML(payroll, employee)

    return new Response(
      JSON.stringify({
        success: true,
        html: html,
        employee_name: employee.name,
        reference_month: formatMonth(payroll.reference_month),
        payroll_entry_id: payroll.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao gerar contracheque HTML:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================================
// Geração de HTML do Contracheque
// ============================================================================

function generatePayslipHTML(payroll: any, employee: any): string {
  const monthFormatted = formatMonth(payroll.reference_month)

  // Calcular totais
  const totalProventos =
    (payroll.base_salary || 0) +
    (payroll.overtime_65_value || 0) +
    (payroll.overtime_100_value || 0) +
    (payroll.night_shift_value || 0) +
    (payroll.other_earnings || 0)

  const totalDescontos =
    (payroll.discounts || 0) +
    (payroll.inss_employee || 0)

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contracheque - ${employee.name} - ${monthFormatted}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #333;
      max-width: 210mm;
      margin: 0 auto;
      padding: 10mm;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2c3e50;
    }

    .header h1 {
      font-size: 24pt;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 5px;
    }

    .header .company {
      font-size: 14pt;
      color: #7f8c8d;
      margin-bottom: 10px;
    }

    .info-section {
      margin: 20px 0;
      padding: 15px;
      background-color: #ecf0f1;
      border-radius: 5px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      padding: 5px 0;
    }

    .info-label {
      font-weight: bold;
      color: #34495e;
    }

    .info-value {
      color: #2c3e50;
    }

    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: #2c3e50;
      margin: 25px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #3498db;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }

    th, td {
      padding: 10px 12px;
      text-align: left;
      border: 1px solid #bdc3c7;
    }

    th {
      background-color: #34495e;
      color: white;
      font-weight: bold;
      font-size: 11pt;
    }

    td {
      background-color: #fff;
    }

    tr:nth-child(even) td {
      background-color: #f8f9fa;
    }

    .value-column {
      text-align: right;
      font-weight: 500;
    }

    .total-row {
      font-weight: bold;
      background-color: #3498db !important;
      color: white !important;
    }

    .total-row td {
      background-color: #3498db;
      color: white;
      font-size: 12pt;
      padding: 12px;
    }

    .final-total {
      background-color: #27ae60 !important;
    }

    .final-total td {
      background-color: #27ae60;
      font-size: 14pt;
      padding: 15px;
    }

    .additional-info {
      margin-top: 30px;
      padding: 15px;
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 5px;
    }

    .additional-info h3 {
      color: #856404;
      margin-bottom: 10px;
      font-size: 12pt;
    }

    .additional-info p {
      margin: 5px 0;
      color: #856404;
      font-size: 10pt;
    }

    .signature-section {
      margin-top: 50px;
      padding-top: 30px;
      display: flex;
      justify-content: space-around;
    }

    .signature-box {
      text-align: center;
      width: 40%;
    }

    .signature-line {
      border-top: 2px solid #2c3e50;
      margin-top: 60px;
      padding-top: 10px;
      font-size: 10pt;
      color: #7f8c8d;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #bdc3c7;
      text-align: center;
      font-size: 9pt;
      color: #95a5a6;
    }

    @media print {
      body {
        padding: 0;
      }

      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- CABEÇALHO -->
  <div class="header">
    <h1>CONTRACHEQUE</h1>
    <div class="company">Empório Cosi</div>
    <div style="font-size: 10pt; color: #95a5a6;">CNPJ: 00.000.000/0001-00</div>
  </div>

  <!-- DADOS DO FUNCIONÁRIO -->
  <div class="info-section">
    <div class="info-row">
      <span class="info-label">Funcionário:</span>
      <span class="info-value">${employee.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">CPF:</span>
      <span class="info-value">${employee.cpf || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Cargo:</span>
      <span class="info-value">${employee.position || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Departamento:</span>
      <span class="info-value">${employee.department || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Mês de Referência:</span>
      <span class="info-value">${monthFormatted}</span>
    </div>
  </div>

  <!-- PROVENTOS -->
  <h2 class="section-title">PROVENTOS</h2>
  <table>
    <thead>
      <tr>
        <th>Descrição</th>
        <th class="value-column">Valor (R$)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Salário Base</td>
        <td class="value-column">${formatCurrency(payroll.base_salary || 0)}</td>
      </tr>
      ${payroll.overtime_65_value > 0 ? `
      <tr>
        <td>Hora Extra 65% (${payroll.overtime_65_hours || 0}h)</td>
        <td class="value-column">${formatCurrency(payroll.overtime_65_value)}</td>
      </tr>
      ` : ''}
      ${payroll.overtime_100_value > 0 ? `
      <tr>
        <td>Hora Extra 100% (${payroll.overtime_100_hours || 0}h)</td>
        <td class="value-column">${formatCurrency(payroll.overtime_100_value)}</td>
      </tr>
      ` : ''}
      ${payroll.night_shift_value > 0 ? `
      <tr>
        <td>Hora Noturna (${payroll.night_hours || 0}h)</td>
        <td class="value-column">${formatCurrency(payroll.night_shift_value)}</td>
      </tr>
      ` : ''}
      ${payroll.other_earnings > 0 ? `
      <tr>
        <td>Outros Proventos</td>
        <td class="value-column">${formatCurrency(payroll.other_earnings)}</td>
      </tr>
      ` : ''}
      <tr class="total-row">
        <td>TOTAL DE PROVENTOS</td>
        <td class="value-column">${formatCurrency(totalProventos)}</td>
      </tr>
    </tbody>
  </table>

  <!-- DESCONTOS -->
  <h2 class="section-title">DESCONTOS</h2>
  <table>
    <thead>
      <tr>
        <th>Descrição</th>
        <th class="value-column">Valor (R$)</th>
      </tr>
    </thead>
    <tbody>
      ${payroll.discounts > 0 ? `
      <tr>
        <td>Faltas/Atrasos (${payroll.absences || 0} dias, ${payroll.late_minutes || 0} min)</td>
        <td class="value-column">${formatCurrency(payroll.discounts)}</td>
      </tr>
      ` : ''}
      <tr>
        <td>INSS (Contribuição do Funcionário)</td>
        <td class="value-column">${formatCurrency(payroll.inss_employee || 0)}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL DE DESCONTOS</td>
        <td class="value-column">${formatCurrency(totalDescontos)}</td>
      </tr>
    </tbody>
  </table>

  <!-- TOTAIS FINAIS -->
  <h2 class="section-title">RESUMO FINANCEIRO</h2>
  <table>
    <tbody>
      <tr>
        <td><strong>Salário Bruto</strong></td>
        <td class="value-column"><strong>${formatCurrency(payroll.gross_total || 0)}</strong></td>
      </tr>
      <tr>
        <td><strong>(-) Total de Descontos</strong></td>
        <td class="value-column"><strong>${formatCurrency(totalDescontos)}</strong></td>
      </tr>
      <tr class="final-total">
        <td><strong>SALÁRIO LÍQUIDO A RECEBER</strong></td>
        <td class="value-column"><strong>${formatCurrency(payroll.net_total || 0)}</strong></td>
      </tr>
    </tbody>
  </table>

  <!-- INFORMAÇÕES ADICIONAIS -->
  <div class="additional-info">
    <h3>INFORMAÇÕES ADICIONAIS - ENCARGOS PATRONAIS</h3>
    <p><strong>FGTS (8%):</strong> R$ ${formatCurrency(payroll.fgts || 0)} - Depositado pela empresa em sua conta do FGTS</p>
    <p><strong>INSS Patronal:</strong> R$ ${formatCurrency(payroll.inss_employer || 0)} - Contribuição da empresa ao INSS</p>
    <p style="margin-top: 10px; font-size: 9pt;">
      <em>Nota: Os valores acima são encargos pagos pela empresa e não afetam seu salário líquido.</em>
    </p>
  </div>

  <!-- ASSINATURAS -->
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">
        Assinatura do Funcionário
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        Assinatura do Empregador
      </div>
    </div>
  </div>

  <!-- RODAPÉ -->
  <div class="footer">
    Documento gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
  </div>
</body>
</html>
  `.trim()
}

// ============================================================================
// Funções Auxiliares
// ============================================================================

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

function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
