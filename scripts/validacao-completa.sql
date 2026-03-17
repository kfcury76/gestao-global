-- ============================================================================
-- QUERIES DE VALIDAÇÃO COMPLETA - Sistema de Custos
-- Data: 2026-03-17
-- Descrição: Valida todas as migrations das Fases 1, 2 e 3
-- ============================================================================

-- ============================================================================
-- FASE 1: CMV (Custo de Mercadoria Vendida)
-- ============================================================================

\echo '\n============================================'
\echo 'FASE 1: CMV (Custo de Mercadoria Vendida)'
\echo '============================================\n'

-- 1.1. Verificar tabelas criadas
\echo '1.1. Verificando tabelas criadas...'
SELECT
    table_name,
    CASE
        WHEN table_name IN ('ingredients', 'ingredient_price_history', 'product_recipes', 'recipe_items') THEN '✅'
        ELSE '❌'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ingredients', 'ingredient_price_history', 'product_recipes', 'recipe_items')
ORDER BY table_name;

-- 1.2. Contar ingredientes por categoria
\echo '\n1.2. Ingredientes por categoria:'
SELECT
    category,
    COUNT(*) as total,
    ROUND(AVG(current_price), 2) as preco_medio,
    MIN(current_price) as preco_min,
    MAX(current_price) as preco_max
FROM ingredients
WHERE is_active = true
GROUP BY category
ORDER BY total DESC;

-- 1.3. Verificar ingredientes seed
\echo '\n1.3. Total de ingredientes:'
SELECT
    COUNT(*) as total_ingredientes,
    COUNT(*) FILTER (WHERE is_active = true) as ativos,
    COUNT(*) FILTER (WHERE is_active = false) as inativos,
    COUNT(*) FILTER (WHERE current_price > 0) as com_preco
FROM ingredients;

-- 1.4. Histórico de preços
\echo '\n1.4. Histórico de preços:'
SELECT
    COUNT(*) as total_registros,
    COUNT(DISTINCT ingredient_id) as ingredientes_com_historico,
    MIN(purchase_date) as data_mais_antiga,
    MAX(purchase_date) as data_mais_recente,
    COUNT(*) FILTER (WHERE source = 'manual') as manual,
    COUNT(*) FILTER (WHERE source = 'nfe') as nfe,
    COUNT(*) FILTER (WHERE source = 'import') as importacao
FROM ingredient_price_history;

-- 1.5. Receitas criadas
\echo '\n1.5. Receitas criadas:'
SELECT
    category,
    size,
    COUNT(*) as total_receitas
FROM product_recipes
WHERE is_active = true
GROUP BY category, size
ORDER BY category, size;

-- 1.6. CMV calculado (VIEW)
\echo '\n1.6. CMV calculado (primeiros 5 produtos):'
SELECT
    product_name,
    size,
    ROUND(cmv_current, 2) as cmv_atual,
    ROUND(cmv_avg, 2) as cmv_medio,
    ingredient_count as ingredientes
FROM product_cmv
ORDER BY cmv_current DESC
LIMIT 5;

-- 1.7. Testar function get_recipe_cmv
\echo '\n1.7. Detalhamento CMV da primeira receita:'
SELECT
    ingredient_name,
    category,
    quantity,
    unit,
    ROUND(price_current, 2) as preco,
    ROUND(subtotal_current, 2) as subtotal
FROM get_recipe_cmv(
    (SELECT id FROM product_recipes LIMIT 1)
)
LIMIT 10;

-- 1.8. Verificar índices
\echo '\n1.8. Índices criados:'
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('ingredients', 'ingredient_price_history', 'product_recipes', 'recipe_items')
ORDER BY tablename, indexname;

-- ============================================================================
-- FASE 2: CUSTOS FIXOS
-- ============================================================================

\echo '\n============================================'
\echo 'FASE 2: CUSTOS FIXOS'
\echo '============================================\n'

-- 2.1. Verificar tabelas criadas
\echo '2.1. Verificando tabelas criadas...'
SELECT
    table_name,
    CASE
        WHEN table_name IN ('fixed_cost_categories', 'fixed_costs') THEN '✅'
        ELSE '❌'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('fixed_cost_categories', 'fixed_costs')
ORDER BY table_name;

-- 2.2. Categorias criadas
\echo '\n2.2. Categorias de custos fixos:'
SELECT
    name,
    type,
    ROUND(expected_value, 2) as valor_esperado,
    is_active
FROM fixed_cost_categories
ORDER BY name;

-- 2.3. Total de categorias por tipo
\echo '\n2.3. Categorias por tipo:'
SELECT
    type,
    COUNT(*) as total,
    ROUND(SUM(expected_value), 2) as valor_total_esperado
FROM fixed_cost_categories
WHERE is_active = true
GROUP BY type
ORDER BY type;

-- 2.4. Lançamentos de custos fixos
\echo '\n2.4. Lançamentos de custos fixos (mês atual):'
SELECT
    reference_month,
    category,
    ROUND(value, 2) as valor,
    payment_status,
    due_date
FROM fixed_costs
WHERE reference_month = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY due_date;

-- 2.5. Resumo mensal (VIEW)
\echo '\n2.5. Resumo mensal (últimos 3 meses):'
SELECT
    TO_CHAR(reference_month, 'MM/YYYY') as mes,
    total_entries as lancamentos,
    ROUND(total_value, 2) as total,
    ROUND(paid_value, 2) as pago,
    ROUND(pending_value, 2) as pendente,
    paid_count,
    pending_count
FROM fixed_costs_summary
ORDER BY reference_month DESC
LIMIT 3;

-- 2.6. Testar function get_category_comparison
\echo '\n2.6. Comparação mensal (Aluguel):'
SELECT
    TO_CHAR(current_month, 'MM/YYYY') as mes_atual,
    ROUND(current_total, 2) as total_atual,
    TO_CHAR(previous_month, 'MM/YYYY') as mes_anterior,
    ROUND(previous_total, 2) as total_anterior,
    ROUND(difference, 2) as diferenca,
    ROUND(difference_percent, 2) || '%' as variacao
FROM get_category_comparison('Aluguel');

-- ============================================================================
-- FASE 3: RH/FOLHA DE PAGAMENTO
-- ============================================================================

\echo '\n============================================'
\echo 'FASE 3: RH/FOLHA DE PAGAMENTO'
\echo '============================================\n'

-- 3.1. Verificar tabelas criadas
\echo '3.1. Verificando tabelas criadas...'
SELECT
    table_name,
    CASE
        WHEN table_name IN ('employees', 'payroll_entries') THEN '✅'
        ELSE '❌'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('employees', 'payroll_entries')
ORDER BY table_name;

-- 3.2. Funcionários cadastrados
\echo '\n3.2. Funcionários cadastrados:'
SELECT
    name,
    position,
    department,
    ROUND(base_salary, 2) as salario,
    admission_date,
    is_active
FROM employees
ORDER BY department, name;

-- 3.3. Funcionários por departamento
\echo '\n3.3. Funcionários por departamento:'
SELECT
    department,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_active = true) as ativos,
    ROUND(AVG(base_salary), 2) as salario_medio,
    ROUND(SUM(base_salary), 2) as folha_total
FROM employees
GROUP BY department
ORDER BY department;

-- 3.4. VIEW employee_current_salary
\echo '\n3.4. Salários atuais:'
SELECT
    name,
    position,
    department,
    ROUND(base_salary, 2) as salario,
    years_employed as anos,
    months_employed as meses
FROM employee_current_salary
ORDER BY base_salary DESC;

-- 3.5. Lançamentos de folha
\echo '\n3.5. Lançamentos de folha (se houver):'
SELECT
    TO_CHAR(reference_month, 'MM/YYYY') as mes,
    COUNT(*) as total_funcionarios,
    ROUND(SUM(gross_total), 2) as total_bruto,
    ROUND(SUM(net_total), 2) as total_liquido,
    ROUND(SUM(total_cost), 2) as custo_empresa
FROM payroll_entries
GROUP BY reference_month
ORDER BY reference_month DESC
LIMIT 3;

-- 3.6. Resumo de folha (VIEW)
\echo '\n3.6. Resumo de folha (se houver):'
SELECT
    TO_CHAR(reference_month, 'MM/YYYY') as mes,
    employee_count as funcionarios,
    ROUND(total_gross, 2) as total_bruto,
    ROUND(total_inss_employee, 2) as inss_funcionario,
    ROUND(total_inss_employer, 2) as inss_patronal,
    ROUND(total_fgts, 2) as fgts,
    ROUND(total_net, 2) as total_liquido,
    ROUND(total_cost, 2) as custo_total
FROM payroll_summary
ORDER BY reference_month DESC
LIMIT 3;

-- 3.7. Testar functions de cálculo
\echo '\n3.7. Teste function calculate_inss (salário R$ 2.500):'
SELECT
    ROUND(inss_employee, 2) as inss_funcionario,
    ROUND(inss_employer, 2) as inss_patronal
FROM calculate_inss(2500.00);

\echo '\n3.8. Teste function calculate_fgts (salário R$ 2.500):'
SELECT ROUND(calculate_fgts(2500.00), 2) as fgts;

-- ============================================================================
-- VALIDAÇÃO GERAL
-- ============================================================================

\echo '\n============================================'
\echo 'VALIDAÇÃO GERAL - RESUMO'
\echo '============================================\n'

-- Total de tabelas criadas
\echo 'Total de tabelas criadas:'
SELECT COUNT(*) as total_tabelas
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'ingredients', 'ingredient_price_history', 'product_recipes', 'recipe_items',
    'fixed_cost_categories', 'fixed_costs',
    'employees', 'payroll_entries'
);

-- Total de views criadas
\echo '\nTotal de views criadas:'
SELECT COUNT(*) as total_views
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('product_cmv', 'fixed_costs_summary', 'payroll_summary', 'employee_current_salary');

-- Total de functions criadas
\echo '\nTotal de functions criadas:'
SELECT COUNT(*) as total_functions
FROM pg_proc
WHERE proname IN (
    'calculate_avg_price', 'update_all_avg_prices', 'get_recipe_cmv', 'duplicate_recipe',
    'mark_overdue_costs', 'get_category_comparison',
    'calculate_inss', 'calculate_fgts'
);

-- ============================================================================
-- CHECKLIST FINAL
-- ============================================================================

\echo '\n============================================'
\echo 'CHECKLIST FINAL'
\echo '============================================\n'

\echo '✅ FASE 1 (CMV):'
\echo '  - Tabelas: ingredients, ingredient_price_history, product_recipes, recipe_items'
\echo '  - View: product_cmv'
\echo '  - Functions: calculate_avg_price, update_all_avg_prices, get_recipe_cmv, duplicate_recipe'
\echo ''
\echo '✅ FASE 2 (Custos Fixos):'
\echo '  - Tabelas: fixed_cost_categories, fixed_costs'
\echo '  - View: fixed_costs_summary'
\echo '  - Functions: mark_overdue_costs, get_category_comparison'
\echo ''
\echo '✅ FASE 3 (RH/Folha):'
\echo '  - Tabelas: employees, payroll_entries'
\echo '  - Views: payroll_summary, employee_current_salary'
\echo '  - Functions: calculate_inss, calculate_fgts'
\echo ''
\echo '🎉 Se todos os resultados acima estão OK, as migrations foram aplicadas com sucesso!'
\echo ''
