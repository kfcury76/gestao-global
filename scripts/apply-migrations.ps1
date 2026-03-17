# ============================================================================
# Script: Aplicar Migrations do Sistema de Custos
# Descrição: Aplica todas as migrations das Fases 1, 2 e 3 no Supabase
# Data: 2026-03-17
# ============================================================================

param(
    [string]$Phase = "all",  # all, 1, 2, 3
    [switch]$Validate,        # apenas validar sem aplicar
    [switch]$Help
)

# Cores para output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Show-Help {
    Write-Host "`n📚 AJUDA - Script de Migrations" -ForegroundColor $Cyan
    Write-Host "================================`n"
    Write-Host "USO:" -ForegroundColor $Yellow
    Write-Host "  .\apply-migrations.ps1 [-Phase <1|2|3|all>] [-Validate] [-Help]`n"
    Write-Host "OPÇÕES:" -ForegroundColor $Yellow
    Write-Host "  -Phase     Fase a aplicar (1=CMV, 2=Custos Fixos, 3=RH, all=Todas)"
    Write-Host "  -Validate  Apenas valida se os arquivos existem (não aplica)"
    Write-Host "  -Help      Mostra esta ajuda`n"
    Write-Host "EXEMPLOS:" -ForegroundColor $Yellow
    Write-Host "  .\apply-migrations.ps1 -Phase 1           # Aplica apenas FASE 1 (CMV)"
    Write-Host "  .\apply-migrations.ps1 -Phase all         # Aplica todas as fases"
    Write-Host "  .\apply-migrations.ps1 -Validate          # Valida sem aplicar"
    Write-Host "`n"
}

if ($Help) {
    Show-Help
    exit 0
}

Write-Host "`n🚀 SISTEMA DE CUSTOS - Aplicação de Migrations" -ForegroundColor $Cyan
Write-Host "================================================`n" -ForegroundColor $Cyan

# Definir migrations por fase
$migrations = @{
    "1" = @(
        @{
            File = "supabase_nfe\migrations\20260317_cmv_ingredients.sql"
            Name = "CMV - Ingredientes"
            Description = "Tabelas: ingredients, ingredient_price_history"
        },
        @{
            File = "supabase_nfe\migrations\20260317_cmv_recipes.sql"
            Name = "CMV - Receitas"
            Description = "Tabelas: product_recipes, recipe_items, VIEW product_cmv"
        }
    )
    "2" = @(
        @{
            File = "supabase_nfe\migrations\20260317_custos_fixos.sql"
            Name = "Custos Fixos"
            Description = "Tabelas: fixed_cost_categories, fixed_costs"
        }
    )
    "3" = @(
        @{
            File = "supabase_nfe\migrations\20260317_rh_payroll.sql"
            Name = "RH/Folha de Pagamento"
            Description = "Tabelas: employees, payroll_entries"
        }
    )
}

# Determinar quais fases aplicar
$phasesToApply = @()
if ($Phase -eq "all") {
    $phasesToApply = @("1", "2", "3")
} else {
    $phasesToApply = @($Phase)
}

# Validar arquivos
Write-Host "🔍 Validando arquivos de migration..." -ForegroundColor $Yellow
$allFilesExist = $true

foreach ($phase in $phasesToApply) {
    Write-Host "`nFASE $phase:" -ForegroundColor $Cyan

    foreach ($migration in $migrations[$phase]) {
        $filePath = Join-Path $PSScriptRoot "..\$($migration.File)"

        if (Test-Path $filePath) {
            Write-Host "  ✅ $($migration.Name)" -ForegroundColor $Green
            Write-Host "     📄 $($migration.File)" -ForegroundColor Gray
        } else {
            Write-Host "  ❌ $($migration.Name) - ARQUIVO NÃO ENCONTRADO" -ForegroundColor $Red
            Write-Host "     📄 $($migration.File)" -ForegroundColor Gray
            $allFilesExist = $false
        }
    }
}

if (-not $allFilesExist) {
    Write-Host "`n❌ ERRO: Alguns arquivos não foram encontrados!" -ForegroundColor $Red
    exit 1
}

Write-Host "`n✅ Todos os arquivos encontrados!" -ForegroundColor $Green

if ($Validate) {
    Write-Host "`n✅ Validação concluída. Use sem -Validate para aplicar." -ForegroundColor $Green
    exit 0
}

# Perguntar confirmação
Write-Host "`n⚠️  ATENÇÃO: As migrations serão aplicadas no Supabase." -ForegroundColor $Yellow
$confirm = Read-Host "Deseja continuar? (s/N)"

if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "`n❌ Operação cancelada pelo usuário." -ForegroundColor $Yellow
    exit 0
}

# Aplicar migrations
Write-Host "`n📊 Aplicando migrations..." -ForegroundColor $Cyan

# IMPORTANTE: Este script assume que você tem Supabase CLI configurado
# Se não tiver, as migrations devem ser aplicadas manualmente via Dashboard

$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue

if ($null -eq $supabaseCli) {
    Write-Host "`n⚠️  Supabase CLI não encontrado!" -ForegroundColor $Yellow
    Write-Host "`nPara aplicar as migrations, você pode:" -ForegroundColor $Cyan
    Write-Host "  1. Instalar Supabase CLI: https://supabase.com/docs/guides/cli"
    Write-Host "  2. OU aplicar manualmente via Dashboard:`n"

    foreach ($phase in $phasesToApply) {
        Write-Host "FASE $phase:" -ForegroundColor $Yellow
        foreach ($migration in $migrations[$phase]) {
            $filePath = Join-Path $PSScriptRoot "..\$($migration.File)"
            Write-Host "  - Copiar conteúdo de: $filePath"
            Write-Host "  - Colar em: https://energetictriggerfish-supabase.cloudfy.live (SQL Editor)"
            Write-Host ""
        }
    }

    exit 0
}

# Se Supabase CLI está disponível, aplicar
Write-Host "`n✅ Supabase CLI encontrado. Aplicando migrations...`n" -ForegroundColor $Green

Set-Location (Join-Path $PSScriptRoot "..\supabase_nfe")

try {
    supabase db push

    Write-Host "`n✅ Migrations aplicadas com sucesso!" -ForegroundColor $Green

    # Executar queries de validação
    Write-Host "`n📊 Executando validações..." -ForegroundColor $Cyan

    Write-Host "`nPara validar manualmente, execute estas queries no SQL Editor:" -ForegroundColor $Yellow
    Write-Host @"

-- FASE 1: CMV
SELECT COUNT(*) as ingredientes FROM ingredients;
SELECT COUNT(*) as receitas FROM product_recipes;
SELECT * FROM product_cmv LIMIT 5;

-- FASE 2: Custos Fixos
SELECT COUNT(*) as categorias FROM fixed_cost_categories;
SELECT COUNT(*) as lancamentos FROM fixed_costs;

-- FASE 3: RH
SELECT COUNT(*) as funcionarios FROM employees;
SELECT * FROM payroll_summary;

"@

} catch {
    Write-Host "`n❌ Erro ao aplicar migrations: $_" -ForegroundColor $Red
    exit 1
}

Write-Host "`n🎉 Processo concluído!" -ForegroundColor $Green
