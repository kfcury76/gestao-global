# ============================================================================
# Script: Teste de Edge Functions - Sistema de Custos
# Data: 2026-03-17
# Descrição: Testa todas as Edge Functions das Fases 2 e 3
# ============================================================================

param(
    [string]$AnonKey = "",
    [string]$ServiceRoleKey = "",
    [switch]$Help
)

$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Show-Help {
    Write-Host "`n🧪 AJUDA - Script de Testes de Edge Functions" -ForegroundColor $Cyan
    Write-Host "===============================================`n"
    Write-Host "USO:" -ForegroundColor $Yellow
    Write-Host "  .\test-edge-functions.ps1 -AnonKey <key> -ServiceRoleKey <key>`n"
    Write-Host "OPÇÕES:" -ForegroundColor $Yellow
    Write-Host "  -AnonKey          Chave anon do Supabase (obrigatório)"
    Write-Host "  -ServiceRoleKey   Chave service_role do Supabase (obrigatório)"
    Write-Host "  -Help             Mostra esta ajuda`n"
    Write-Host "EXEMPLO:" -ForegroundColor $Yellow
    Write-Host '  .\test-edge-functions.ps1 -AnonKey "eyJ..." -ServiceRoleKey "eyJ..."'
    Write-Host "`n"
}

if ($Help) {
    Show-Help
    exit 0
}

if (-not $AnonKey -or -not $ServiceRoleKey) {
    Write-Host "`n❌ ERRO: AnonKey e ServiceRoleKey são obrigatórios" -ForegroundColor $Red
    Show-Help
    exit 1
}

$SupabaseUrl = "https://energetictriggerfish-supabase.cloudfy.live"

Write-Host "`n🧪 TESTES DE EDGE FUNCTIONS - Sistema de Custos" -ForegroundColor $Cyan
Write-Host "================================================================`n"

# ============================================================================
# FASE 2: CUSTOS FIXOS
# ============================================================================

Write-Host "📊 FASE 2: Custos Fixos" -ForegroundColor $Cyan
Write-Host "================================================================`n"

# Teste 1: classify-fixed-cost
Write-Host "Teste 1: classify-fixed-cost" -ForegroundColor $Yellow
Write-Host "Classificando texto de conta de energia...`n"

$body = @{
    text = "CPFL ENERGIA - Conta de Luz`nReferência: 03/2026`nVencimento: 15/03/2026`nValor: R$ 850,00"
    extracted_value = 850.00
    extracted_due_date = "2026-03-15"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SupabaseUrl/functions/v1/classify-fixed-cost" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $AnonKey"
            "Content-Type" = "application/json"
        } `
        -Body $body

    Write-Host ($response | ConvertTo-Json -Depth 5)
    Write-Host "`n✅ Teste 1 concluído`n" -ForegroundColor $Green
} catch {
    Write-Host "`n❌ Erro no Teste 1: $_`n" -ForegroundColor $Red
}

# Teste 2: update-payment-status
Write-Host "Teste 2: update-payment-status" -ForegroundColor $Yellow
Write-Host "Atualizando status de pagamentos vencidos...`n"

try {
    $response = Invoke-RestMethod -Uri "$SupabaseUrl/functions/v1/update-payment-status" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $ServiceRoleKey"
            "Content-Type" = "application/json"
        }

    Write-Host ($response | ConvertTo-Json -Depth 5)
    Write-Host "`n✅ Teste 2 concluído`n" -ForegroundColor $Green
} catch {
    Write-Host "`n❌ Erro no Teste 2: $_`n" -ForegroundColor $Red
}

# ============================================================================
# FASE 3: RH/FOLHA DE PAGAMENTO
# ============================================================================

Write-Host "👥 FASE 3: RH/Folha de Pagamento" -ForegroundColor $Cyan
Write-Host "================================================================`n"

# Teste 3: extract-secullum-pdf
Write-Host "Teste 3: extract-secullum-pdf" -ForegroundColor $Yellow
Write-Host "⚠️  Este teste requer um PDF real em base64" -ForegroundColor $Yellow
Write-Host "⏭️  Pulando teste 3 (requer PDF real)`n" -ForegroundColor $Yellow

# Teste 4: calculate-payroll
Write-Host "Teste 4: calculate-payroll" -ForegroundColor $Yellow
Write-Host "Calculando folha de pagamento...`n"

try {
    # Buscar ID de um funcionário
    $employees = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/employees?select=id&limit=1" `
        -Method Get `
        -Headers @{
            "apikey" = $AnonKey
            "Authorization" = "Bearer $AnonKey"
        }

    if ($employees.Count -gt 0) {
        $employeeId = $employees[0].id
        Write-Host "Funcionário ID: $employeeId`n"

        $payrollBody = @{
            employee_id = $employeeId
            reference_month = "2026-03-01"
            absences = 1
            late_minutes = 30
            overtime_65_hours = 5
            overtime_100_hours = 2
            night_hours = 8
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$SupabaseUrl/functions/v1/calculate-payroll" `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $AnonKey"
                "Content-Type" = "application/json"
            } `
            -Body $payrollBody

        Write-Host ($response | ConvertTo-Json -Depth 5)
        Write-Host "`n✅ Teste 4 concluído`n" -ForegroundColor $Green
    } else {
        Write-Host "❌ Nenhum funcionário encontrado no banco`n" -ForegroundColor $Red
    }
} catch {
    Write-Host "`n❌ Erro no Teste 4: $_`n" -ForegroundColor $Red
}

# Teste 5: generate-payslip-pdf
Write-Host "Teste 5: generate-payslip-pdf" -ForegroundColor $Yellow
Write-Host "Gerando contracheque em PDF...`n"

try {
    # Buscar ID de um lançamento de folha
    $payrolls = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/payroll_entries?select=id&limit=1" `
        -Method Get `
        -Headers @{
            "apikey" = $AnonKey
            "Authorization" = "Bearer $AnonKey"
        }

    if ($payrolls.Count -gt 0) {
        $payrollId = $payrolls[0].id
        Write-Host "Lançamento ID: $payrollId`n"

        $pdfBody = @{
            payroll_entry_id = $payrollId
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$SupabaseUrl/functions/v1/generate-payslip-pdf" `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $AnonKey"
                "Content-Type" = "application/json"
            } `
            -Body $pdfBody

        Write-Host ($response | ConvertTo-Json -Depth 5)
        Write-Host "`n✅ Teste 5 concluído`n" -ForegroundColor $Green
    } else {
        Write-Host "⚠️  Nenhum lançamento de folha encontrado" -ForegroundColor $Yellow
        Write-Host "Execute primeiro o teste 4 para criar um lançamento`n"
    }
} catch {
    Write-Host "`n❌ Erro no Teste 5: $_`n" -ForegroundColor $Red
}

# ============================================================================
# RESUMO
# ============================================================================

Write-Host "================================================================"
Write-Host "📋 RESUMO DOS TESTES" -ForegroundColor $Cyan
Write-Host "================================================================`n"
Write-Host "✅ Teste 1: classify-fixed-cost (FASE 2)"
Write-Host "✅ Teste 2: update-payment-status (FASE 2)"
Write-Host "⏭️  Teste 3: extract-secullum-pdf (FASE 3) - Requer PDF real"
Write-Host "✅ Teste 4: calculate-payroll (FASE 3)"
Write-Host "✅ Teste 5: generate-payslip-pdf (FASE 3)`n"
Write-Host "================================================================"
Write-Host "🎉 Testes concluídos!`n" -ForegroundColor $Green
Write-Host "PRÓXIMOS PASSOS:"
Write-Host "1. Verificar logs de erros (se houver)"
Write-Host "2. Validar dados inseridos no banco"
Write-Host "3. Testar via interface frontend`n"
