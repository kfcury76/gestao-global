const fs = require('fs');

const dataRaw = fs.readFileSync('C:\\Users\\khali\\.gemini\\antigravity\\brain\\2661778e-6213-4a08-a74a-88eedb1bac6d\\.system_generated\\steps\\300\\output.txt', 'utf8');

const doc = JSON.parse(dataRaw);
const workflow = doc.data;
const nodes = workflow.nodes;

for (let node of nodes) {
    if (node.id === '539eed6d-6f6b-482c-b7bd-5841a094f9e9' || node.name === 'Normalize Evolution Payload') {
        node.parameters.jsCode = `const body = $input.item.json.body;
const rawPayload = body;

let text = '';
let messageType = 'text';
let mediaUrl = null;
let mimeType = null;
let fileName = null;
let senderPhone = '';
let senderName = 'FORNECEDOR_PENDENTE';

// ── Evolution API v2 (messages.upsert) ───────────────────────────────────
if (body.data && body.data.message) {
  const evData = body.data;
  const evMsg = evData.message;
  senderPhone = evData.key?.remoteJid || body.sender || '';
  senderName = evData.pushName || body.pushName || 'FORNECEDOR_PENDENTE';

  if (evData.key?.fromMe === true) return [];

  if (evMsg.conversation) {
    text = evMsg.conversation;
    messageType = 'text';
  } else if (evMsg.extendedTextMessage?.text) {
    text = evMsg.extendedTextMessage.text;
    messageType = 'text';
  } else if (evMsg.documentMessage) {
    const doc = evMsg.documentMessage;
    messageType = (doc.mimetype || '').includes('xml') ? 'xml' : 'document';
    mediaUrl = doc.url;
    mimeType = doc.mimetype;
    fileName = doc.fileName || doc.title;
  } else if (evMsg.documentWithCaptionMessage?.message?.documentMessage) {
    const doc = evMsg.documentWithCaptionMessage.message.documentMessage;
    messageType = (doc.mimetype || '').includes('xml') ? 'xml' : 'document';
    mediaUrl = doc.url;
    mimeType = doc.mimetype;
    fileName = doc.fileName || doc.title;
  } else if (evMsg.audioMessage || evMsg.pttMessage) {
    const audio = evMsg.audioMessage || evMsg.pttMessage;
    messageType = 'audio';
    mediaUrl = audio.url;
    mimeType = audio.mimetype || 'audio/ogg';
  } else if (evMsg.imageMessage) {
    const img = evMsg.imageMessage;
    messageType = 'image';
    mediaUrl = img.url;
    mimeType = img.mimetype;
    text = img.caption || '';
  } else {
    return [];
  }

} else if (body.messages && body.messages[0]) {
  const message = body.messages[0];
  senderPhone = message.from || message.remoteJid || '';
  senderName = message.pushName || 'FORNECEDOR_PENDENTE';
  text = message.text || message.body || '';
  if (message.type === 'document' || message.document) {
    const doc = message.document || message;
    messageType = (doc.mimetype || '').includes('xml') ? 'xml' : 'document';
    mediaUrl = doc.url || doc.mediaUrl;
    mimeType = doc.mimetype || doc.mimeType;
    fileName = doc.filename || doc.fileName;
  } else if (message.type === 'audio' || message.audio) {
    const audio = message.audio || message;
    messageType = 'audio';
    mediaUrl = audio.url || audio.mediaUrl;
    mimeType = audio.mimetype || audio.mimeType;
  }
} else if (body.body?.messages?.[0]) {
  const message = body.body.messages[0];
  senderPhone = message.from || message.remoteJid || '';
  senderName = message.pushName || 'FORNECEDOR_PENDENTE';
  text = message.text || message.body || '';
} else if (body.chatInput) {
  text = body.chatInput;
  senderPhone = body.remoteJid || body.sessionId || '';
  senderName = body.pushName || 'FORNECEDOR_PENDENTE';
} else {
  return [];
}

if (!text && !mediaUrl) return [];

if (text && (text.includes('Ã') || text.includes('â'))) {
  text = text
    .replace(/Ã§/g, 'ç').replace(/Ã£/g, 'ã').replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é').replace(/Ã/g, 'í').replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú').replace(/Ã‡/g, 'Ç').replace(/Ã•/g, 'Õ')
    .replace(/OR\\u00c7AMENTO/gi, 'ORÇAMENTO')
    .replace(/Pre\\u00e7o/gi, 'Preço').replace(/Unit\\u00e1rio/gi, 'Unitário');
}

return [{
  json: {
    source: 'evolution',
    received_at: new Date().toISOString(),
    supplier_name_raw: senderName,
    supplier_phone_raw: senderPhone,
    message_type: messageType,
    text,
    media_url: mediaUrl,
    mime_type: mimeType,
    file_name: fileName,
    raw_payload: rawPayload
  }
}];`;
    }

    if (node.id === 'f00f248e-d377-4acb-a14a-a6ce4d479697') {
        node.parameters.jsCode = `const crypto = require('crypto');
const data = $input.item.json;

const normalizedText = (data.text || '').trim().replace(/\\s+/g, ' ');
const normalizedMediaUrl = (data.media_url || '').trim();

const hashInput = JSON.stringify({
  supplier_phone_raw: data.supplier_phone_raw,
  message_type: data.message_type,
  text: normalizedText,
  media_url: normalizedMediaUrl,
  mime_type: data.mime_type
});

const contentHash = crypto.createHash('sha256').update(hashInput).digest('hex');

const rawPayload = {
  source: data.source,
  message_type: data.message_type,
  text: data.text,
  media_url: data.media_url,
  mime_type: data.mime_type,
  file_name: data.file_name,
  original_payload: data.raw_payload
};

return {
  json: {
    supplier_name_raw: data.supplier_name_raw || 'FORNECEDOR_PENDENTE',
    supplier_phone_raw: data.supplier_phone_raw,
    source_type: data.source || 'evolution',
    received_at: data.received_at,
    content_hash: contentHash,
    raw_payload: rawPayload
  }
};`;
    }

    if (node.id === '35d2eed8-62e9-4472-97c4-cf4ac021189f') {
        node.parameters.fieldsUi.fieldValues[0].fieldValue = "={{ $json.supplier && $json.supplier !== 'FORNECEDOR_NAO_IDENTIFICADO' && $json.supplier !== 'FORNECEDOR_PENDENTE' ? $json.supplier : $('Compute content_hash').item.json.supplier_name_raw }}";
    }

    if (node.id === 'fd2c1785-f8ba-419a-a6cf-b3f2316a69be') {
        node.parameters.fieldsUi.fieldValues[1].fieldValue = "={{ $('Parse AI JSON Response').item.json.supplier && $('Parse AI JSON Response').item.json.supplier !== 'FORNECEDOR_NAO_IDENTIFICADO' && $('Parse AI JSON Response').item.json.supplier !== 'FORNECEDOR_PENDENTE' ? $('Parse AI JSON Response').item.json.supplier : $('Compute content_hash').item.json.supplier_name_raw }}";
    }
}

fs.writeFileSync('C:\\Users\\khali\\.gemini\\antigravity\\modify_script_wf1.js.json', JSON.stringify(workflow, null, 2));

console.log('Modified workflow written to modify_script_wf1.js.json');
