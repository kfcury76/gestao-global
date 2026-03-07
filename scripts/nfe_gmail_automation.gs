// =====================================================
// GOOGLE APPS SCRIPT - Automação de NF-e via Gmail
// =====================================================
//
// INSTALAÇÃO:
// 1. Acesse: https://script.google.com
// 2. Crie novo projeto
// 3. Cole este código
// 4. Configure as variáveis abaixo
// 5. Adicione trigger de 1 minuto
//
// =====================================================

// ========== CONFIGURAÇÕES ==========
const CONFIG = {
  // Supabase
  SUPABASE_URL: 'https://SEU_PROJETO.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'SEU_SERVICE_ROLE_KEY',

  // Email para encaminhamento
  FISCAL_EMAIL: 'jhenyffer.fiscal@betenghelli.com.br',

  // Labels do Gmail (serão criadas automaticamente)
  LABEL_PROCESSED: 'NF-e/Processada',
  LABEL_ERROR: 'NF-e/Erro',
  LABEL_PENDING: 'NF-e/Pendente',

  // Configurações
  BUSINESS_UNIT: 'cosi',
  MAX_EMAILS_PER_RUN: 10, // Processa até 10 emails por execução
};

// ========== FUNÇÃO PRINCIPAL ==========
function processNFeEmails() {
  try {
    Logger.log('🚀 Iniciando processamento de NF-e...');

    // Criar labels se não existirem
    createLabelsIfNeeded();

    // Buscar emails não lidos com anexo XML
    const query = 'has:attachment filename:xml is:unread -label:' + CONFIG.LABEL_PROCESSED.replace('/', '-');
    const threads = GmailApp.search(query, 0, CONFIG.MAX_EMAILS_PER_RUN);

    Logger.log(`📧 Encontrados ${threads.length} email(s) com XML`);

    if (threads.length === 0) {
      Logger.log('✅ Nenhum email para processar');
      return;
    }

    // Processar cada thread
    threads.forEach((thread, index) => {
      Logger.log(`\n📨 Processando email ${index + 1}/${threads.length}`);
      processThread(thread);
    });

    Logger.log('\n✅ Processamento concluído!');

  } catch (error) {
    Logger.log('❌ Erro geral: ' + error.message);
    sendErrorNotification(error);
  }
}

// ========== PROCESSAR THREAD ==========
function processThread(thread) {
  const messages = thread.getMessages();
  const message = messages[messages.length - 1]; // Última mensagem

  const from = message.getFrom();
  const subject = message.getSubject();
  const date = message.getDate();

  Logger.log(`   De: ${from}`);
  Logger.log(`   Assunto: ${subject}`);

  try {
    // Buscar anexos XML
    const attachments = message.getAttachments();
    const xmlAttachments = attachments.filter(att =>
      att.getName().toLowerCase().endsWith('.xml')
    );

    if (xmlAttachments.length === 0) {
      Logger.log('   ⚠️ Sem anexos XML');
      message.markRead();
      return;
    }

    Logger.log(`   📎 Encontrados ${xmlAttachments.length} arquivo(s) XML`);

    // Processar cada XML
    let processedCount = 0;
    let errorCount = 0;

    xmlAttachments.forEach((attachment, index) => {
      try {
        Logger.log(`   🔄 Processando ${attachment.getName()}...`);

        const xmlContent = attachment.getDataAsString();

        // Validar se é NF-e
        if (!isValidNFe(xmlContent)) {
          Logger.log(`   ⚠️ Não é uma NF-e válida: ${attachment.getName()}`);
          return;
        }

        // Enviar para Supabase
        const result = sendToSupabase(xmlContent);

        if (result.success) {
          Logger.log(`   ✅ NF-e processada: ${result.invoice.nfeNumber}`);
          Logger.log(`      Fornecedor: ${result.invoice.supplier}`);
          Logger.log(`      Valor: R$ ${result.invoice.totalValue}`);
          processedCount++;

          // Encaminhar para fiscal
          forwardToFiscal(message, result);

        } else {
          throw new Error(result.error || 'Erro desconhecido');
        }

      } catch (error) {
        Logger.log(`   ❌ Erro ao processar XML: ${error.message}`);
        errorCount++;
      }
    });

    // Marcar email conforme resultado
    if (processedCount > 0 && errorCount === 0) {
      // Sucesso total
      addLabel(message, CONFIG.LABEL_PROCESSED);
      message.markRead();
      Logger.log(`   🏷️ Marcado como: ${CONFIG.LABEL_PROCESSED}`);

    } else if (errorCount > 0) {
      // Teve erro
      addLabel(message, CONFIG.LABEL_ERROR);
      Logger.log(`   🏷️ Marcado como: ${CONFIG.LABEL_ERROR}`);
    }

  } catch (error) {
    Logger.log(`   ❌ Erro ao processar thread: ${error.message}`);
    addLabel(message, CONFIG.LABEL_ERROR);
  }
}

// ========== VALIDAR NF-e ==========
function isValidNFe(xmlContent) {
  return xmlContent.includes('<nfeProc') ||
         xmlContent.includes('<NFe') ||
         xmlContent.includes('nfe.xsd');
}

// ========== ENVIAR PARA SUPABASE ==========
function sendToSupabase(xmlContent) {
  const url = `${CONFIG.SUPABASE_URL}/functions/v1/process-nfe`;

  const payload = {
    xmlContent: xmlContent,
    businessUnit: CONFIG.BUSINESS_UNIT,
    costCategory: 'materia_prima',
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log(`   📡 Response code: ${responseCode}`);

    if (responseCode === 200) {
      return JSON.parse(responseText);
    } else {
      const errorData = JSON.parse(responseText);
      return {
        success: false,
        error: errorData.error || `HTTP ${responseCode}`,
      };
    }

  } catch (error) {
    Logger.log(`   ❌ Erro na requisição: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ========== ENCAMINHAR PARA FISCAL ==========
function forwardToFiscal(originalMessage, nfeData) {
  try {
    const subject = `Fwd: ${originalMessage.getSubject()}`;

    const body = `
<p><strong>✅ NF-e processada e importada com sucesso!</strong></p>

<p><strong>Detalhes da NF-e:</strong></p>
<ul>
  <li><strong>Número:</strong> ${nfeData.invoice.nfeNumber}</li>
  <li><strong>Fornecedor:</strong> ${nfeData.invoice.supplier}</li>
  <li><strong>Valor Total:</strong> R$ ${nfeData.invoice.totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</li>
  <li><strong>Itens:</strong> ${nfeData.invoice.itemsCount}</li>
</ul>

<hr>

<p><em>Email encaminhado automaticamente pelo sistema Cosí Araras</em></p>

<hr>

<p><strong>Email original:</strong></p>
${originalMessage.getBody()}
`;

    // Copiar anexos
    const attachments = originalMessage.getAttachments();

    // Enviar email
    GmailApp.sendEmail(
      CONFIG.FISCAL_EMAIL,
      subject,
      body.replace(/<[^>]*>/g, ''), // Plain text
      {
        htmlBody: body,
        attachments: attachments,
        name: 'Sistema Cosí Araras - NF-e',
      }
    );

    Logger.log(`   📤 Email encaminhado para: ${CONFIG.FISCAL_EMAIL}`);

  } catch (error) {
    Logger.log(`   ⚠️ Erro ao encaminhar email: ${error.message}`);
  }
}

// ========== CRIAR LABELS ==========
function createLabelsIfNeeded() {
  const labelNames = [
    CONFIG.LABEL_PROCESSED,
    CONFIG.LABEL_ERROR,
    CONFIG.LABEL_PENDING,
  ];

  labelNames.forEach(labelName => {
    try {
      GmailApp.getUserLabelByName(labelName) || GmailApp.createLabel(labelName);
    } catch (error) {
      Logger.log(`⚠️ Erro ao criar label ${labelName}: ${error.message}`);
    }
  });
}

// ========== ADICIONAR LABEL ==========
function addLabel(message, labelName) {
  try {
    const label = GmailApp.getUserLabelByName(labelName) || GmailApp.createLabel(labelName);
    message.getThread().addLabel(label);
  } catch (error) {
    Logger.log(`⚠️ Erro ao adicionar label: ${error.message}`);
  }
}

// ========== NOTIFICAÇÃO DE ERRO ==========
function sendErrorNotification(error) {
  try {
    GmailApp.sendEmail(
      Session.getActiveUser().getEmail(),
      '❌ Erro no processamento de NF-e',
      `Ocorreu um erro no script de automação de NF-e:\n\n${error.message}\n\n${error.stack}`
    );
  } catch (e) {
    Logger.log('❌ Erro ao enviar notificação: ' + e.message);
  }
}

// ========== FUNÇÕES DE TESTE ==========

// Testar busca de emails
function testSearchEmails() {
  const query = 'has:attachment filename:xml';
  const threads = GmailApp.search(query, 0, 5);
  Logger.log(`Encontrados ${threads.length} emails`);

  threads.forEach((thread, i) => {
    const message = thread.getMessages()[0];
    Logger.log(`\n${i + 1}. ${message.getSubject()}`);
    Logger.log(`   De: ${message.getFrom()}`);
    Logger.log(`   Data: ${message.getDate()}`);

    const attachments = message.getAttachments();
    Logger.log(`   Anexos: ${attachments.length}`);
    attachments.forEach(att => {
      Logger.log(`      - ${att.getName()} (${att.getSize()} bytes)`);
    });
  });
}

// Testar conexão com Supabase
function testSupabaseConnection() {
  const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc>
  <NFe>
    <infNFe Id="NFe12345678901234567890123456789012345678901234">
      <ide>
        <nNF>12345</nNF>
        <serie>1</serie>
        <mod>55</mod>
      </ide>
    </infNFe>
  </NFe>
</nfeProc>`;

  Logger.log('Testando conexão com Supabase...');
  const result = sendToSupabase(testXml);
  Logger.log('Resultado: ' + JSON.stringify(result));
}

// Testar encaminhamento de email
function testEmailForward() {
  Logger.log('Enviando email de teste...');

  GmailApp.sendEmail(
    CONFIG.FISCAL_EMAIL,
    'Teste - Sistema NF-e Cosí Araras',
    'Este é um email de teste do sistema de automação de NF-e.',
    {
      htmlBody: '<p><strong>Teste bem-sucedido!</strong></p><p>O sistema de automação está funcionando.</p>',
    }
  );

  Logger.log('✅ Email de teste enviado!');
}
