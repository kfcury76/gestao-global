# 📧 Automação de Email - Recebimento e Processamento de NF-e

**Data:** 04/03/2026
**Status:** ✅ Pronto para Instalação

---

## 🎯 O que será Automatizado

### Fluxo Completo:

```
1. Email chega em: cosiararas@gmail.com
   ↓
2. Sistema detecta anexo XML
   ↓
3. Extrai e valida XML da NF-e
   ↓
4. Processa via Supabase Edge Function
   ↓
5. Salva no banco de dados
   ↓
6. Encaminha cópia para: jhenyffer.fiscal@betenghelli.com.br
   ↓
7. Marca email como processado
```

**Tempo de processamento:** ~5-10 segundos por NF-e
**Frequência:** A cada 1 minuto (verifica novos emails)

---

## 📋 Duas Opções Disponíveis

| Característica | **Opção A: N8N** | **Opção B: Google Apps Script** |
|----------------|------------------|----------------------------------|
| **Custo** | Servidor necessário | ✅ Gratuito |
| **Complexidade** | Média | Baixa |
| **Manutenção** | Fácil (interface visual) | Média |
| **Confiabilidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Escalabilidade** | Alta | Limitada* |
| **Recomendado para** | Produção | Testes/Pequeno volume |

*Google Apps Script tem limite de 90 minutos de execução por dia

---

## 🚀 OPÇÃO A: N8N Workflow (Recomendado)

### Pré-requisitos:

- [ ] N8N instalado e rodando
- [ ] Acesso ao Gmail API
- [ ] Credenciais OAuth2 do Gmail configuradas
- [ ] Supabase Edge Function já deployada

---

### Passo 1: Criar Credenciais Gmail OAuth2

1. Acesse: https://console.cloud.google.com
2. Crie um novo projeto (ou use existente)
3. Ative a **Gmail API**
4. Vá em **Credenciais** > **Criar Credenciais** > **ID do Cliente OAuth 2.0**
5. Configure:
   - Tipo: **Aplicativo da Web**
   - URIs de redirecionamento: `https://SEU_N8N_URL/rest/oauth2-credential/callback`
6. Copie **Client ID** e **Client Secret**

---

### Passo 2: Configurar Credenciais no N8N

1. Abra N8N
2. Vá em **Credentials**
3. Clique em **+ Add Credential**
4. Selecione **Gmail OAuth2 API**
5. Preencha:
   - **Name:** `Gmail - cosiararas@gmail.com`
   - **Client ID:** (copie do Google Cloud)
   - **Client Secret:** (copie do Google Cloud)
6. Clique em **Connect my account**
7. Faça login com `cosiararas@gmail.com`
8. Autorize as permissões
9. Salve

---

### Passo 3: Criar Labels no Gmail

1. Acesse Gmail (cosiararas@gmail.com)
2. Crie as seguintes labels:
   - `NF-e/Processada` (cor verde)
   - `NF-e/Erro` (cor vermelha)
   - `NF-e/Pendente` (cor amarela)

---

### Passo 4: Configurar Variáveis de Ambiente no N8N

No arquivo `.env` do N8N, adicione:

```bash
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Ou configure via interface:**
1. N8N > Settings > Environment Variables
2. Adicione as variáveis acima

---

### Passo 5: Importar Workflow

1. No N8N, clique em **Import Workflow**
2. Selecione o arquivo: `n8n_workflows/nfe_email_automation.json`
3. O workflow será criado com todos os nodes

---

### Passo 6: Configurar Nodes

#### Node: "Gmail - Monitorar NF-e"
- Selecione a credencial criada
- Verifique filtro: `has:attachment filename:xml is:unread`
- Polling: `Every Minute`

#### Node: "Processar NF-e (Supabase)"
- Verifique URL: `{{$env.SUPABASE_URL}}/functions/v1/process-nfe`
- Verifique Header: `Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}`

#### Node: "Encaminhar para Fiscal"
- Verifique destinatário: `jhenyffer.fiscal@betenghelli.com.br`

---

### Passo 7: Ativar Workflow

1. Clique em **Activate** (toggle no canto superior direito)
2. O workflow começará a monitorar emails a cada 1 minuto

---

### Passo 8: Testar

1. Envie um email de teste para `cosiararas@gmail.com` com um XML de NF-e anexo
2. Aguarde até 1 minuto
3. Verifique no N8N > Executions se processou
4. Confira se:
   - NF-e foi salva no Supabase
   - Email foi encaminhado para Jhenyffer
   - Label "NF-e/Processada" foi adicionada

---

## 🔧 OPÇÃO B: Google Apps Script (Gratuito)

### Vantagens:
- ✅ 100% gratuito
- ✅ Roda direto no Gmail
- ✅ Sem servidor adicional
- ✅ Instalação rápida

### Limitações:
- ⚠️ Limite de 90 min de execução/dia
- ⚠️ Máximo ~500-1000 NF-e/dia

---

### Passo 1: Criar Projeto no Google Apps Script

1. Acesse: https://script.google.com
2. Clique em **Novo Projeto**
3. Renomeie para: **"Automação NF-e - Cosí Araras"**

---

### Passo 2: Adicionar o Código

1. Cole o código do arquivo: `google_apps_script/nfe_gmail_automation.gs`
2. Modifique as configurações no início do arquivo:

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://SEU_PROJETO.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGc...',
  FISCAL_EMAIL: 'jhenyffer.fiscal@betenghelli.com.br',
  BUSINESS_UNIT: 'cosi',
  MAX_EMAILS_PER_RUN: 10,
};
```

3. Salve: **Ctrl + S**

---

### Passo 3: Autorizar Permissões

1. Clique em **Executar** (ícone ▶️)
2. Selecione função: `processNFeEmails`
3. Clique em **Executar**
4. Autorize as permissões:
   - ✅ Ler emails do Gmail
   - ✅ Enviar emails
   - ✅ Gerenciar labels
   - ✅ Fazer requisições externas (Supabase)
5. Clique em **Permitir**

---

### Passo 4: Testar Manualmente

1. Execute função: `testSearchEmails`
   - Verifica se encontra emails com XML
2. Execute função: `testSupabaseConnection`
   - Testa conexão com Supabase
3. Execute função: `testEmailForward`
   - Testa envio de email para Jhenyffer
4. Execute função: `processNFeEmails`
   - Processa emails reais

**Veja os logs:** Menu > **Execuções**

---

### Passo 5: Criar Trigger Automático

1. Menu lateral > **Gatilhos** (ícone ⏰)
2. Clique em **+ Adicionar gatilho**
3. Configure:
   - **Função:** `processNFeEmails`
   - **Fonte do evento:** `Baseado no tempo`
   - **Tipo:** `Gatilho de minuto em minuto`
   - **Intervalo:** `A cada 1 minuto`
4. Salve

Pronto! O script rodará automaticamente a cada 1 minuto.

---

### Passo 6: Monitorar Execuções

1. Menu lateral > **Execuções**
2. Veja histórico de execuções
3. Clique em qualquer execução para ver logs detalhados

---

## 📊 Monitoramento

### N8N:
- Acesse: N8N > Workflows > "NF-e Email Automation"
- Veja **Executions** para histórico
- Cada email processado aparecerá na lista

### Google Apps Script:
- Acesse: https://script.google.com
- Menu > **Execuções**
- Veja logs de cada execução

### Gmail (ambas opções):
- Emails processados terão label: **NF-e/Processada** (verde)
- Emails com erro terão label: **NF-e/Erro** (vermelho)

### Supabase:
- Dashboard > Table Editor > `fiscal_invoices`
- Veja NF-e importadas em tempo real

---

## 🔔 Notificações (Futuro)

Para receber notificações quando NF-e for processada:

### Via Email:
Já implementado! Email é encaminhado para: `jhenyffer.fiscal@betenghelli.com.br`

### Via WhatsApp (Futuro):
- Integrar Twilio ou Evolution API
- Enviar mensagem quando NF-e > R$ 5.000

### Via Slack/Discord (Futuro):
- Webhook para canal #financeiro
- Alertas de NF-e processadas

---

## ❓ FAQ e Troubleshooting

### Emails não estão sendo processados

**Google Apps Script:**
1. Verifique se o trigger está ativo
2. Veja logs em **Execuções**
3. Teste função manualmente

**N8N:**
1. Verifique se workflow está ativo (toggle verde)
2. Veja **Executions** para erros
3. Teste manualmente: **Execute Workflow**

---

### Erro: "Invalid credentials"

**Causa:** Token OAuth2 expirado

**Solução:**
1. N8N: Credentials > Gmail OAuth2 > Reconnect
2. Apps Script: Execute função novamente e reautorize

---

### NF-e não foi salva no banco

**Causa:** Edge Function com erro

**Solução:**
1. Acesse Supabase > Functions > `process-nfe` > Logs
2. Veja erro específico
3. Teste Edge Function manualmente:

```bash
curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/process-nfe \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"xmlContent":"<nfeProc>...</nfeProc>","businessUnit":"cosi"}'
```

---

### Email não foi encaminhado para Jhenyffer

**Apps Script:**
1. Verifique se `CONFIG.FISCAL_EMAIL` está correto
2. Veja logs da função `forwardToFiscal`

**N8N:**
1. Verifique node "Encaminhar para Fiscal"
2. Certifique-se de que credencial Gmail está ativa

---

### Limite de execução atingido (Apps Script)

**Erro:** `Service invoked too many times for one day`

**Solução:**
1. Reduza `MAX_EMAILS_PER_RUN` de 10 para 5
2. Aumente intervalo do trigger de 1 min para 5 min
3. Considere migrar para N8N

---

## 📈 Estatísticas Esperadas

### Volume Estimado:
- ~20-50 NF-e/dia (pequeno negócio)
- ~100-200 NF-e/dia (médio negócio)

### Performance:
- **Google Apps Script:** 5-8 segundos por NF-e
- **N8N:** 3-5 segundos por NF-e

### Limites:
- **Apps Script:** ~1.000 NF-e/dia (limite do Google)
- **N8N:** Ilimitado (depende do servidor)

---

## 🎯 Próximos Passos

Após instalar e testar:

1. [ ] Monitorar por 1 semana
2. [ ] Verificar taxa de erro
3. [ ] Ajustar filtros de email se necessário
4. [ ] Implementar notificações de vencimento
5. [ ] Criar dashboard de estatísticas

---

## 📁 Arquivos Criados

```
cosi_ecossistema/
├── 📄 EMAIL_AUTOMATION_SETUP.md (este arquivo)
│
├── 📁 n8n_workflows/
│   └── 📄 nfe_email_automation.json (workflow N8N)
│
└── 📁 google_apps_script/
    └── 📄 nfe_gmail_automation.gs (código Apps Script)
```

---

## ✅ Checklist de Instalação

### Opção A: N8N
- [ ] Credenciais Gmail OAuth2 criadas
- [ ] Credenciais adicionadas no N8N
- [ ] Labels criadas no Gmail
- [ ] Variáveis de ambiente configuradas
- [ ] Workflow importado
- [ ] Workflow ativado
- [ ] Teste realizado com sucesso

### Opção B: Google Apps Script
- [ ] Projeto criado no Apps Script
- [ ] Código colado e configurado
- [ ] Permissões autorizadas
- [ ] Testes manuais executados
- [ ] Trigger automático criado
- [ ] Primeira execução bem-sucedida

---

## 📞 Suporte

**Dúvidas sobre:**
- N8N: https://docs.n8n.io
- Apps Script: https://developers.google.com/apps-script
- Supabase Functions: https://supabase.com/docs/guides/functions

---

**🚀 Sistema pronto para automatizar 100% do recebimento de NF-e!**

**Desenvolvido por:** Claude Code
**Data:** 04/03/2026
