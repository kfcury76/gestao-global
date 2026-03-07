# 🍱 Guia Completo de Instalação - Sistema de Impressão na Marmitaria

> **Objetivo:** Configurar o computador da Marmitaria para receber e imprimir pedidos automaticamente

---

## 📋 Pré-requisitos

### Hardware
- ✅ Computador Windows/Mac/Linux na Marmitaria
- ✅ Impressora térmica USB conectada
- ✅ Conexão com internet estável

### Software
- ✅ Node.js versão 18 ou superior ([Baixar aqui](https://nodejs.org/))
- ✅ Git ([Baixar aqui](https://git-scm.com/))

---

## 🚀 Passo a Passo

### 1. **Executar Migration no Supabase** (Uma vez)

Antes de tudo, a tabela `print_queue` precisa estar criada no banco.

1. Acesse o Supabase Studio: https://energetictriggerfish-supabase.cloudfy.live
2. Vá em **SQL Editor**
3. Execute o script:

```bash
# Navegar até a pasta da migration
cd mkt-controler/controle/src/lib/sql
```

Copie e execute o conteúdo de `04_print_queue.sql` no SQL Editor.

Ou execute este comando se já tiver acesso ao CLI:
```sql
psql -h energetictriggerfish-supabase.cloudfy.live -U postgres < 04_print_queue.sql
```

**Verificar se funcionou:**
```sql
SELECT * FROM print_queue LIMIT 1;
```

---

### 2. **Clonar o Repositório (se ainda não tiver)**

```bash
# Criar pasta de projetos
mkdir -p ~/projetos
cd ~/projetos

# Clonar o repositório
git clone https://github.com/kfcury76/[NOME_DO_REPO] marmitaria-print
cd marmitaria-print
```

Ou se já tiver o projeto local, navegue até:
```bash
cd ~/.gemini/antigravity/scratch/marmitaria_araras/marmitaria-print
```

---

### 3. **Configurar Variáveis de Ambiente**

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com seu editor favorito
nano .env
# ou
code .env
```

**Preencher o arquivo `.env`:**

```env
# URL do Supabase (Cloudfy)
SUPABASE_URL=https://energetictriggerfish-supabase.cloudfy.live

# Service Role Key (pegar no Supabase Studio > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=<COLAR_AQUI_A_CHAVE>

# Configuração desta instância
PRINT_TARGET=marmitaria

# Impressora USB (Windows)
MARMITARIA_PRINTER_INTERFACE=\\.\COM3
# Se não funcionar, testar: \\.\USB001 ou nome da impressora compartilhada

# Tipo de impressora
PRINTER_TYPE=EPSON  # ou STAR, CITIZEN
```

**Como descobrir a porta USB no Windows:**
1. Conectar impressora USB
2. Abrir **Gerenciador de Dispositivos**
3. Expandir **Portas (COM & LPT)**
4. Anotar o número da porta (ex: COM3, COM4)

**Linux/Mac:**
```bash
ls /dev/tty*
# Procurar algo como: /dev/ttyUSB0 ou /dev/tty.usbserial
```

---

### 4. **Instalar Dependências**

```bash
npm install
```

Aguarde a instalação de:
- `@supabase/supabase-js` - Cliente Supabase
- `node-thermal-printer` - Driver de impressora térmica
- `dotenv` - Gerenciador de variáveis de ambiente

---

### 5. **Testar Conexão (Opcional mas Recomendado)**

Criar arquivo de teste `test-connection.js`:

```javascript
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('print_queue')
    .select('count')
    .limit(1);

  if (error) {
    console.error('❌ Erro:', error.message);
  } else {
    console.log('✅ Conexão OK!');
  }
}

test();
```

Executar:
```bash
node test-connection.js
```

---

### 6. **Iniciar o Daemon**

```bash
# Modo produção (recomendado)
npm run start:marmitaria

# Ou modo desenvolvimento (com auto-reload)
npm run dev
```

**Você verá:**
```
🖨️  Daemon de impressão iniciado
📍 Target: marmitaria
📡 Conectado ao Supabase
👂 Aguardando pedidos...
```

---

### 7. **Configurar Inicialização Automática**

Para que o daemon inicie automaticamente quando o computador ligar:

#### **Windows (Task Scheduler):**

1. Abrir **Agendador de Tarefas**
2. Criar Tarefa Básica → Nome: "Marmitaria Print Daemon"
3. Gatilho: **Ao iniciar o computador**
4. Ação: **Iniciar programa**
   - Programa: `C:\Program Files\nodejs\node.exe`
   - Argumentos: `C:\caminho\para\marmitaria-print\src\index.ts`
   - Pasta: `C:\caminho\para\marmitaria-print`

Ou criar arquivo `start-daemon.bat`:
```batch
@echo off
cd C:\caminho\para\marmitaria-print
npm run start:marmitaria
pause
```

#### **Linux/Mac (systemd):**

Criar `/etc/systemd/system/marmitaria-print.service`:
```ini
[Unit]
Description=Marmitaria Print Daemon
After=network.target

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/home/seu-usuario/projetos/marmitaria-print
ExecStart=/usr/bin/npm run start:marmitaria
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Habilitar:
```bash
sudo systemctl enable marmitaria-print
sudo systemctl start marmitaria-print
sudo systemctl status marmitaria-print
```

#### **Mac (launchd):**

Criar `~/Library/LaunchAgents/com.marmitaria.print.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.marmitaria.print</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/caminho/para/marmitaria-print/src/index.ts</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Carregar:
```bash
launchctl load ~/Library/LaunchAgents/com.marmitaria.print.plist
```

---

## 🧪 Testar o Sistema Completo

### 1. **Criar Pedido de Teste no Admin**

1. Acessar: https://controle.cosiararas.com.br
2. Login com senha padrão: `Kfcury76@`
3. Ir em **Pedidos Online** (aba Marmitaria)
4. Clicar em **Imprimir** em qualquer pedido
5. Selecionar: **🍱 Imprimir na Marmitaria**

### 2. **Verificar Logs do Daemon**

No terminal onde o daemon está rodando, você verá:
```
📥 Novo pedido recebido: #ABC123
🖨️  Imprimindo pedido...
✅ Pedido impresso com sucesso!
```

### 3. **Verificar Impressora**

O pedido deve sair automaticamente na impressora USB.

---

## ❓ Troubleshooting

### Daemon não conecta ao Supabase
```
❌ Erro: Invalid API Key
```
**Solução:** Verificar se `SUPABASE_SERVICE_ROLE_KEY` está correta no `.env`

### Impressora não imprime
```
❌ Erro: No printer found
```
**Solução:**
1. Verificar se impressora está ligada e conectada
2. Testar outra porta: `\\.\USB001`, `\\.\LPT1`
3. No Windows, verificar se driver está instalado

### Pedidos não chegam
```
⏳ Aguardando pedidos... (sem atividade)
```
**Solução:**
1. Verificar se `PRINT_TARGET=marmitaria` está correto
2. Verificar se migration `04_print_queue.sql` foi executada
3. Verificar se há pedidos pendentes:
   ```sql
   SELECT * FROM print_queue WHERE status='pending' AND target='marmitaria';
   ```

### Daemon para sozinho
**Solução:** Configurar reinício automático (ver passo 7)

---

## 📊 Monitoramento

### Ver pedidos na fila:
```sql
SELECT
  order_id,
  order_type,
  status,
  created_at
FROM print_queue
WHERE target='marmitaria'
ORDER BY created_at DESC
LIMIT 10;
```

### Limpar fila antiga:
```sql
DELETE FROM print_queue
WHERE status='printed'
AND created_at < NOW() - INTERVAL '7 days';
```

### Ver estatísticas:
```sql
SELECT
  DATE(created_at) as dia,
  status,
  COUNT(*) as total
FROM print_queue
WHERE target='marmitaria'
GROUP BY DATE(created_at), status
ORDER BY dia DESC;
```

---

## 📞 Suporte

Em caso de problemas:

1. **Verificar logs do daemon** no terminal
2. **Verificar tabela print_queue** no Supabase
3. **Reiniciar daemon:** `Ctrl+C` e `npm run start:marmitaria`
4. **Consultar documentação:** `PRINT_SYSTEM_README.md`

---

## ✅ Checklist Final

- [ ] Node.js instalado
- [ ] Repositório clonado
- [ ] Arquivo `.env` configurado
- [ ] Migration `04_print_queue.sql` executada no Supabase
- [ ] Dependências instaladas (`npm install`)
- [ ] Daemon iniciado (`npm run start:marmitaria`)
- [ ] Pedido de teste impresso com sucesso
- [ ] Inicialização automática configurada
- [ ] Equipe treinada no uso do painel admin

🎉 **Sistema pronto para produção!**
