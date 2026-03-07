# ✅ Checklist de Implantação - Sistema de Impressão

## 🗄️ Banco de Dados (Supabase)

- [ ] **Executar migration `04_print_queue.sql`**
  - Arquivo: `controle/src/lib/sql/04_print_queue.sql`
  - Local: Supabase Studio > SQL Editor
  - Verificar: `SELECT * FROM print_queue LIMIT 1;`

- [ ] **Verificar RLS (Row Level Security)**
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'print_queue';
  ```
  - Deve ter 2 policies: `anon_insert_print_queue` e `auth_all_print_queue`

- [ ] **Habilitar Realtime (Opcional mas Recomendado)**
  - Supabase Studio > Database > Replication
  - Adicionar tabela `print_queue`

---

## 💻 Painel de Controle (controle.cosiararas.com.br)

### Arquivos Criados/Modificados:

- [ ] **PrintDestinationButton.tsx**
  - [ ] Arquivo existe em `src/components/print/PrintDestinationButton.tsx`
  - [ ] Dropdown funciona (Cosí / Marmitaria)
  - [ ] Toast notifications aparecem

- [ ] **Marmitaria.tsx**
  - [ ] Import do `PrintDestinationButton` adicionado
  - [ ] Botão aparece em cada card de pedido
  - [ ] Aba "Pedidos Online" funciona

- [ ] **Pedidos.tsx**
  - [ ] Atualizado com novo componente
  - [ ] Pedidos corporativos têm `orderType='corporativo'`
  - [ ] Encomendas têm `orderType='encomenda'`
  - [ ] Marmitas têm `orderType='marmita_normal'`

### Testar no Admin:

- [ ] Fazer login: https://controle.cosiararas.com.br
- [ ] Navegar para "Pedidos Online"
- [ ] Clicar em "Imprimir" em um pedido
- [ ] Verificar dropdown com 2 opções
- [ ] Selecionar destino e confirmar toast
- [ ] Verificar inserção no Supabase:
  ```sql
  SELECT * FROM print_queue ORDER BY created_at DESC LIMIT 5;
  ```

---

## 🖨️ Daemon de Impressão - Marmitaria

### Instalação:

- [ ] **Node.js instalado** (v18+)
  - Verificar: `node --version`

- [ ] **Repositório clonado/disponível**
  - Caminho: `~/.gemini/antigravity/scratch/marmitaria_araras/marmitaria-print`

- [ ] **Arquivo .env configurado**
  ```env
  SUPABASE_URL=https://energetictriggerfish-supabase.cloudfy.live
  SUPABASE_SERVICE_ROLE_KEY=[PEGAR_NO_SUPABASE]
  PRINT_TARGET=marmitaria
  MARMITARIA_PRINTER_INTERFACE=\\.\COM3  # ou porta correta
  PRINTER_TYPE=EPSON
  ```

- [ ] **Dependências instaladas**
  ```bash
  cd marmitaria-print
  npm install
  ```

### Teste Manual:

- [ ] **Iniciar daemon**
  ```bash
  npm run start:marmitaria
  ```

- [ ] **Verificar logs**
  - Deve mostrar: "🖨️ Daemon de impressão iniciado"
  - Deve mostrar: "📍 Target: marmitaria"
  - Deve mostrar: "👂 Aguardando pedidos..."

- [ ] **Enviar pedido de teste pelo admin**
  - Selecionar "Imprimir na Marmitaria"
  - Verificar log: "📥 Novo pedido recebido"
  - Verificar log: "✅ Pedido impresso"

- [ ] **Verificar impressora**
  - Pedido impresso fisicamente

### Produção:

- [ ] **Inicialização automática configurada**
  - Windows: Task Scheduler
  - Linux: systemd service
  - Mac: launchd

- [ ] **Daemon rodando em segundo plano**
  - Verificar processo: `ps aux | grep "marmitaria-print"`

- [ ] **Logs sendo salvos**
  - Redirecionar output: `npm run start:marmitaria > daemon.log 2>&1 &`

---

## 🏪 Daemon de Impressão - Cosí (Opcional)

Se quiser imprimir também no Cosí:

- [ ] **Instalar na máquina do Cosí**
- [ ] **Configurar .env com `PRINT_TARGET=cosi`**
- [ ] **Configurar IP da impressora TCP/IP**
  ```env
  COSI_PRINTER_IP=192.168.x.x
  COSI_PRINTER_PORT=9100
  ```
- [ ] **Iniciar daemon:** `npm run start:cosi`

---

## 🧪 Testes End-to-End

### Cenário 1: Pedido de Marmita Normal
- [ ] Cliente faz pedido em cosiararas.com.br
- [ ] Pedido aparece no admin em "Pedidos Online"
- [ ] Admin clica em "Imprimir" → "Marmitaria"
- [ ] Pedido entra na fila (`print_queue`)
- [ ] Daemon da marmitaria pega o pedido
- [ ] Impressora USB imprime

### Cenário 2: Pedido Corporativo
- [ ] Cliente faz pedido corporativo (via link /marmita/slug)
- [ ] Pedido aparece em "Pedidos" com tag 🏢 Corporativo
- [ ] Admin clica em "Imprimir" → "Marmitaria"
- [ ] Daemon imprime com layout corporativo

### Cenário 3: Encomenda
- [ ] Cliente faz encomenda
- [ ] Pedido aparece em "Pedidos" com tag 🎂 Encomenda
- [ ] Admin pode escolher onde imprimir
- [ ] Daemon imprime corretamente

### Cenário 4: Múltiplos Pedidos
- [ ] Enviar 3 pedidos para a fila rapidamente
- [ ] Daemon processa todos em ordem (FIFO)
- [ ] Todos aparecem com `status='printed'` na tabela

---

## 📊 Monitoramento em Produção

### Queries Úteis:

- [ ] **Ver fila atual:**
  ```sql
  SELECT * FROM print_queue
  WHERE status='pending'
  ORDER BY created_at;
  ```

- [ ] **Ver pedidos impressos hoje:**
  ```sql
  SELECT COUNT(*) FROM print_queue
  WHERE DATE(printed_at) = CURRENT_DATE
  AND status='printed';
  ```

- [ ] **Ver erros:**
  ```sql
  SELECT * FROM print_queue
  WHERE status='failed'
  ORDER BY created_at DESC;
  ```

### Health Checks:

- [ ] **Daemon está rodando?**
  - Windows: Task Manager
  - Linux/Mac: `ps aux | grep marmitaria-print`

- [ ] **Impressora conectada?**
  - Verificar no Gerenciador de Dispositivos
  - Imprimir página de teste do SO

- [ ] **Supabase acessível?**
  - Testar: https://energetictriggerfish-supabase.cloudfy.live/rest/v1/
  - Deve retornar 401 (auth requerido) - isso é normal

---

## 📚 Documentação

- [ ] **PRINT_SYSTEM_README.md** - Documentação técnica
- [ ] **MARMITARIA_SETUP.md** - Guia de instalação para equipe
- [ ] **CLAUDE.md e SESSION_HANDOFF.md** - Contexto do projeto

---

## 👥 Treinamento da Equipe

- [ ] **Admin treinado para:**
  - Acessar painel de controle
  - Visualizar pedidos online
  - Clicar em "Imprimir" e escolher destino
  - Entender diferença entre Cosí e Marmitaria

- [ ] **Técnico treinado para:**
  - Reiniciar daemon se necessário
  - Verificar logs
  - Resolver problemas básicos de impressora

---

## 🚀 Deploy Final

- [ ] **Fazer backup do código atual**
- [ ] **Commit e push das mudanças**
  ```bash
  git add .
  git commit -m "feat: sistema de impressão com roteamento Cosí/Marmitaria"
  git push origin main
  ```

- [ ] **Deploy do painel (se Vercel/Netlify)**
  - Verificar build passou
  - Verificar site está acessível

- [ ] **Documentar senhas e acessos**
  - Senha admin
  - Chave Supabase service_role
  - IPs das impressoras

---

## ✅ Checklist Final - Pronto para Produção

- [ ] Todas as migrations executadas
- [ ] Painel de controle funcional
- [ ] Daemon instalado na Marmitaria
- [ ] Daemon configurado para iniciar automaticamente
- [ ] Pelo menos 1 pedido de teste impresso com sucesso
- [ ] Equipe treinada
- [ ] Documentação disponível para consulta
- [ ] Contato de suporte definido

---

🎉 **Sistema pronto para uso!**

**Data de implantação:** _______________________

**Responsável:** _______________________

**Assinatura:** _______________________
