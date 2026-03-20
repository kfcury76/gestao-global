// Script para aplicar migrations de receitas via linha de comando
const fs = require('fs');
const path = require('path');

console.log('');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  📋 APLICAR MIGRATIONS - RECEITAS E PAGAMENTOS                ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');

// Ler as 3 migrations
const migrations = [
  '20260320_receitas_vendas.sql',
  '20260320_extrato_bancario.sql',
  '20260320_seed_receitas.sql'
];

console.log('📄 Migrations a aplicar:');
console.log('');

let totalLines = 0;

migrations.forEach((file, index) => {
  const filePath = path.join(__dirname, 'supabase_nfe', 'migrations', file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').length;
  totalLines += lines;

  console.log(`${index + 1}. ${file} (${lines} linhas)`);
});

console.log('');
console.log(`📊 Total: ${totalLines} linhas de SQL`);
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('🎯 COMO APLICAR:');
console.log('');
console.log('OPÇÃO 1 - Via Supabase Dashboard (Recomendado):');
console.log('  1. Acessar: https://energetictriggerfish-supabase.cloudfy.live');
console.log('  2. Menu → SQL Editor');
console.log('  3. Clicar "New Query"');
console.log('  4. Copiar o conteúdo de cada migration');
console.log('  5. Colar e executar (Run)');
console.log('');
console.log('OPÇÃO 2 - Via CLI (se configurado):');
console.log('  cd c:/Users/khali/.antigravity/gestao/supabase_nfe');
console.log('  npx supabase db push');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('📋 ORDEM DE EXECUÇÃO:');
console.log('');
console.log('1º) 20260320_receitas_vendas.sql');
console.log('    - Cria tabelas: revenue_categories, invoices, sales');
console.log('    - Cria views: daily_sales_summary, revenue_by_category');
console.log('');
console.log('2º) 20260320_extrato_bancario.sql');
console.log('    - Cria tabelas: bank_accounts, bank_statements, payments');
console.log('    - Cria views: bank_balance, payments_summary, reconciliation_status');
console.log('');
console.log('3º) 20260320_seed_receitas.sql');
console.log('    - Insere categorias (5 registros)');
console.log('    - Insere contas bancárias (3 registros)');
console.log('    - Insere vendas de exemplo (8 registros)');
console.log('    - Insere extratos bancários (8 registros)');
console.log('    - Insere pagamentos (5 registros)');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('✅ VALIDAÇÃO PÓS-APLICAÇÃO:');
console.log('');
console.log('Execute no SQL Editor:');
console.log('');
console.log('-- Contar registros');
console.log('SELECT \'revenue_categories\' as tabela, COUNT(*) as total FROM revenue_categories');
console.log('UNION ALL');
console.log('SELECT \'bank_accounts\', COUNT(*) FROM bank_accounts');
console.log('UNION ALL');
console.log('SELECT \'sales\', COUNT(*) FROM sales');
console.log('UNION ALL');
console.log('SELECT \'bank_statements\', COUNT(*) FROM bank_statements');
console.log('UNION ALL');
console.log('SELECT \'payments\', COUNT(*) FROM payments;');
console.log('');
console.log('Esperado:');
console.log('  revenue_categories: 5');
console.log('  bank_accounts: 3');
console.log('  sales: 8');
console.log('  bank_statements: 8');
console.log('  payments: 5');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
