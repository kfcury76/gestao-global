// Script de auditoria usando fetch nativo

const supabaseUrl = 'https://energetictriggerfish-supabase.cloudfy.live';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcxMjQ3MjE5LCJleHAiOjE4MDI3ODMyMTl9.ptnClNNSMAfgXzL5YkmAjY_Y1NYAOhya1u1Uzoxrolw';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzEyNDcyMTksImV4cCI6MTgwMjc4MzIxOX0.m10wDBnYdyBbETPFzIIqkAvzWTvrz-ioLSZURUltbY0';

const tables = ['pur_quotes', 'pur_quote_items', 'pur_suppliers'];

async function auditTable(tableName) {
    console.log(`\nAuditando tabela: ${tableName}`);

    // Teste com Anon Key
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=*&limit=1`, {
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
                console.log(`🔴 ALERTA: Tabela [${tableName}] está EXPOSTA PUBLICAMENTE (leitura aberta com anon key). RLS pode estar desativado ou mal configurado.`);
            } else {
                console.log(`🟡 INFO: Tabela [${tableName}] permitiu acesso com anon key, mas retornou vazio. Pode ser RLS ativo ou simplesmente sem dados.`);
            }
        } else {
            console.log(`🟢 OK: Tabela [${tableName}] bloqueou acesso com anon key (Status: ${res.status}). RLS está funcionando.`);
        }
    } catch (err) {
        console.log(`⚪ ERRO no teste anon: ${err.message}`);
    }

    // Teste com Service Role Key (para confirmar se o erro 404 vs 401)
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=*&limit=1`, {
            headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`
            }
        });

        if (res.ok) {
            console.log(`🛠️ Service Role: Acesso confirmado à tabela ${tableName}.`);
        } else {
            console.log(`❌ Service Role: Falha ao acessar tabela ${tableName} (Status: ${res.status}). Talvez a tabela não exista ou o nome esteja errado.`);
        }
    } catch (err) {
        console.log(`⚪ ERRO no teste service_role: ${err.message}`);
    }
}

async function runAudit() {
    console.log('--- INICIANDO AUDITORIA DE SEGURANÇA SUPABASE ---\n');
    for (const table of tables) {
        await auditTable(table);
    }
}

runAudit();
