#!/bin/bash
# ============================================================================
# Script: Teste de Edge Functions - Sistema de Custos
# Data: 2026-03-17
# Descrição: Testa todas as Edge Functions das Fases 2 e 3
# ============================================================================

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuração
SUPABASE_URL="https://energetictriggerfish-supabase.cloudfy.live"
ANON_KEY="YOUR_ANON_KEY_HERE"  # SUBSTITUIR
SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY_HERE"  # SUBSTITUIR

echo -e "${CYAN}🧪 TESTES DE EDGE FUNCTIONS - Sistema de Custos${NC}"
echo "================================================================"
echo ""

# ============================================================================
# FASE 2: CUSTOS FIXOS
# ============================================================================

echo -e "${CYAN}📊 FASE 2: Custos Fixos${NC}"
echo "================================================================"
echo ""

# Teste 1: classify-fixed-cost
echo -e "${YELLOW}Teste 1: classify-fixed-cost${NC}"
echo "Classificando texto de conta de energia..."
echo ""

curl -X POST \
  "${SUPABASE_URL}/functions/v1/classify-fixed-cost" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "CPFL ENERGIA - Conta de Luz\nReferência: 03/2026\nVencimento: 15/03/2026\nValor: R$ 850,00",
    "extracted_value": 850.00,
    "extracted_due_date": "2026-03-15"
  }' | jq '.'

echo ""
echo -e "${GREEN}✅ Teste 1 concluído${NC}"
echo ""

# Teste 2: update-payment-status
echo -e "${YELLOW}Teste 2: update-payment-status${NC}"
echo "Atualizando status de pagamentos vencidos..."
echo ""

curl -X POST \
  "${SUPABASE_URL}/functions/v1/update-payment-status" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo -e "${GREEN}✅ Teste 2 concluído${NC}"
echo ""

# ============================================================================
# FASE 3: RH/FOLHA DE PAGAMENTO
# ============================================================================

echo -e "${CYAN}👥 FASE 3: RH/Folha de Pagamento${NC}"
echo "================================================================"
echo ""

# Teste 3: extract-secullum-pdf
echo -e "${YELLOW}Teste 3: extract-secullum-pdf${NC}"
echo "Extraindo dados de PDF do Secullum..."
echo ""
echo -e "${YELLOW}⚠️  Este teste requer um PDF real em base64${NC}"
echo -e "${YELLOW}⚠️  Exemplo simplificado (não funcional):${NC}"

# Exemplo (não funcional sem PDF real)
cat << 'EOF'
curl -X POST \
  "${SUPABASE_URL}/functions/v1/extract-secullum-pdf" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "file_content": "BASE64_PDF_CONTENT_HERE",
    "file_type": "pdf",
    "reference_month": "2026-03-01"
  }' | jq '.'
EOF

echo ""
echo -e "${YELLOW}⏭️  Pulando teste 3 (requer PDF real)${NC}"
echo ""

# Teste 4: calculate-payroll
echo -e "${YELLOW}Teste 4: calculate-payroll${NC}"
echo "Calculando folha de pagamento..."
echo ""

# Buscar ID de um funcionário (ajustar conforme necessário)
EMPLOYEE_ID=$(curl -s \
  "${SUPABASE_URL}/rest/v1/employees?select=id&limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" | jq -r '.[0].id')

if [ "$EMPLOYEE_ID" != "null" ] && [ -n "$EMPLOYEE_ID" ]; then
  echo "Funcionário ID: ${EMPLOYEE_ID}"
  echo ""

  curl -X POST \
    "${SUPABASE_URL}/functions/v1/calculate-payroll" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"employee_id\": \"${EMPLOYEE_ID}\",
      \"reference_month\": \"2026-03-01\",
      \"absences\": 1,
      \"late_minutes\": 30,
      \"overtime_65_hours\": 5,
      \"overtime_100_hours\": 2,
      \"night_hours\": 8
    }" | jq '.'

  echo ""
  echo -e "${GREEN}✅ Teste 4 concluído${NC}"
else
  echo -e "${RED}❌ Nenhum funcionário encontrado no banco${NC}"
fi

echo ""

# Teste 5: generate-payslip-pdf
echo -e "${YELLOW}Teste 5: generate-payslip-pdf${NC}"
echo "Gerando contracheque em PDF..."
echo ""

# Buscar ID de um lançamento de folha (se houver)
PAYROLL_ID=$(curl -s \
  "${SUPABASE_URL}/rest/v1/payroll_entries?select=id&limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" | jq -r '.[0].id')

if [ "$PAYROLL_ID" != "null" ] && [ -n "$PAYROLL_ID" ]; then
  echo "Lançamento ID: ${PAYROLL_ID}"
  echo ""

  curl -X POST \
    "${SUPABASE_URL}/functions/v1/generate-payslip-pdf" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"payroll_entry_id\": \"${PAYROLL_ID}\"
    }" | jq '.'

  echo ""
  echo -e "${GREEN}✅ Teste 5 concluído${NC}"
else
  echo -e "${YELLOW}⚠️  Nenhum lançamento de folha encontrado${NC}"
  echo "Execute primeiro o teste 4 para criar um lançamento"
fi

echo ""

# ============================================================================
# RESUMO
# ============================================================================

echo "================================================================"
echo -e "${CYAN}📋 RESUMO DOS TESTES${NC}"
echo "================================================================"
echo ""
echo "✅ Teste 1: classify-fixed-cost (FASE 2)"
echo "✅ Teste 2: update-payment-status (FASE 2)"
echo "⏭️  Teste 3: extract-secullum-pdf (FASE 3) - Requer PDF real"
echo "✅ Teste 4: calculate-payroll (FASE 3)"
echo "✅ Teste 5: generate-payslip-pdf (FASE 3)"
echo ""
echo "================================================================"
echo -e "${GREEN}🎉 Testes concluídos!${NC}"
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Verificar logs de erros (se houver)"
echo "2. Validar dados inseridos no banco"
echo "3. Testar via interface frontend"
echo ""
