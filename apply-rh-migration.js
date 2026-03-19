// Script para aplicar migration RH via API do Supabase
const fs = require('fs');
const https = require('https');

// Configuração do Supabase (baseado em CLAUDE.md)
const SUPABASE_URL = 'https://energetictriggerfish-supabase.cloudfy.live';

// Ler arquivo de migration
const migrationSQL = fs.readFileSync('./supabase_nfe/migrations/20260317_rh_payroll.sql', 'utf8');

console.log('📋 Migration RH - Aplicando...');
console.log(`🔗 URL: ${SUPABASE_URL}`);
console.log(`📝 SQL: ${migrationSQL.length} caracteres`);
console.log('');

// Nota: Como não temos acesso direto ao Supabase CLI e precisamos de Service Role Key,
// vamos gerar instruções para aplicar manualmente via Dashboard

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  📌 INSTRUÇÕES PARA APLICAR A MIGRATION MANUALMENTE           ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');
console.log('1. Acessar o Supabase Dashboard:');
console.log(`   ${SUPABASE_URL}`);
console.log('');
console.log('2. Menu → SQL Editor (ou /sql)');
console.log('');
console.log('3. Clicar em "New Query"');
console.log('');
console.log('4. Copiar TODO o conteúdo do arquivo:');
console.log('   supabase_nfe/migrations/20260317_rh_payroll.sql');
console.log('');
console.log('5. Colar no editor SQL');
console.log('');
console.log('6. Clicar em "Run" (ou pressionar Ctrl+Enter)');
console.log('');
console.log('7. Verificar as mensagens de sucesso:');
console.log('   ✅ Migration concluída com sucesso!');
console.log('   📊 Tabelas criadas: employees, payroll_entries');
console.log('   📈 Views criadas: payroll_summary, employee_current_salary');
console.log('   🔢 Functions criadas: calculate_inss, calculate_fgts');
console.log('   👥 Funcionários seed: 5 exemplos');
console.log('');
console.log('══════════════════════════════════════════════════════════════════');
console.log('');
console.log('📄 Conteúdo da migration (pronto para copiar):');
console.log('══════════════════════════════════════════════════════════════════');
console.log('');
console.log(migrationSQL);
console.log('');
console.log('══════════════════════════════════════════════════════════════════');
