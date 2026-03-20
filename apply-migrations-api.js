#!/usr/bin/env node

/**
 * Script para aplicar migrations via API REST do Supabase
 * Método: POST para o endpoint /rest/v1/rpc/exec_sql
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://energetictriggerfish-supabase.cloudfy.live';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcxMjQ3MjE5LCJleHAiOjE4MDI3ODMyMTl9.ptnClNNSMAfgXzL5YkmAjY_Y1NYAOhya1u1Uzoxrolw';

const migrations = [
  '20260320_receitas_vendas.sql',
  '20260320_extrato_bancario.sql',
  '20260320_seed_receitas.sql'
];

console.log('');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  🚀 APLICANDO MIGRATIONS VIA API - RECEITAS E PAGAMENTOS      ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');

async function executeSQLViaAPI(sql, filename) {
  return new Promise((resolve, reject) => {
    // Tentar via psql direto através de conexão REST
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: 'energetictriggerfish-supabase.cloudfy.live',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, data });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function applyMigrations() {
  for (let i = 0; i < migrations.length; i++) {
    const filename = migrations[i];
    const filepath = path.join(__dirname, 'supabase_nfe', 'migrations', filename);

    console.log(`📄 ${i + 1}/${migrations.length} - ${filename}`);
    console.log('');

    if (!fs.existsSync(filepath)) {
      console.log(`❌ Arquivo não encontrado: ${filepath}`);
      continue;
    }

    const sql = fs.readFileSync(filepath, 'utf8');
    const lines = sql.split('\n').length;

    console.log(`   ⏳ Executando ${lines} linhas de SQL...`);

    try {
      const result = await executeSQLViaAPI(sql, filename);

      if (result.success) {
        console.log('   ✅ Executado com sucesso!');
      } else {
        console.log('   ⚠️ Erro ao executar:');
        console.log(`   ${result.error}`);
      }
    } catch (error) {
      console.log('   ❌ Erro de rede:');
      console.log(`   ${error.message}`);
    }

    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('🎯 MÉTODO RECOMENDADO: Dashboard Supabase');
  console.log('');
  console.log('1. Acessar: https://energetictriggerfish-supabase.cloudfy.live');
  console.log('2. Menu → SQL Editor');
  console.log('3. New Query');
  console.log('4. Copiar e colar cada migration:');
  console.log('   a) 20260320_receitas_vendas.sql');
  console.log('   b) 20260320_extrato_bancario.sql');
  console.log('   c) 20260320_seed_receitas.sql');
  console.log('5. Run (executar)');
  console.log('');
  console.log('⚡ Tempo estimado: 5-10 minutos');
  console.log('');
}

applyMigrations();
