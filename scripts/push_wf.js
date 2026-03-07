const fs = require('fs');

const dataRaw = fs.readFileSync('C:\\Users\\khali\\.gemini\\antigravity\\modify_script_wf1.js.json', 'utf8');
const workflow = JSON.parse(dataRaw);

const payload = {
  name: workflow.name,
  nodes: workflow.nodes,
  connections: workflow.connections,
  settings: workflow.settings
};

fetch('https://energetictriggerfish-n8n.cloudfy.live/api/v1/workflows/44AcKa_A5NhJMkiT8b54Y', {
  method: 'PUT',
  headers: {
    'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZTEzM2Q0YS04N2JjLTRhNDYtOGE0MC1jY2VlNzEzMWY4YzAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcxMjYyMjE3fQ.-DcvqqcytGDoZrt1wXCgmPY7z8qs_PoigE6q-VLeVSQ',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
}).then(res => res.json()).then(data => {
  if (data.id) {
    console.log('SUCCESS: Workflow updated. ID:', data.id);
  } else {
    console.log('ERROR:', data);
  }
}).catch(console.error);
