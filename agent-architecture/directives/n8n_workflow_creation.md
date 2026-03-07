# Diretiva: Criação de Fluxos de Trabalho n8n

## Objetivo
Criar workflows n8n robustos, escaláveis e resilientes a erros, utilizando a arquitetura de 3 camadas.

## Camada 1: Diretiva (Design)
Antes de criar o workflow, defina:
- **Gatilho (Trigger)**: O que inicia o fluxo? (Webhook, Cron, Evento).
- **Entrada Esperada**: Formato do JSON de entrada.
- **Processamento**: Passos lógicos necessários.
- **Saída Esperada**: O que o workflow deve retornar ou para onde enviar dados.

## Camada 2: Orquestração (Implementação)
Ao implementar no n8n:
1. **Uso de Expressões**: Siga o `n8n-skills`. Use `{{ $json.body.campo }}` para dados de webhook.
2. **Nós de Código**: Prefira JavaScript para manipulções de dados complexas. Use o formato de retorno correto: `[{ json: { ... } }]`.
3. **Padrões de Erro**: Sempre configure caminhos de erro ou "On Error: Continue" conforme a necessidade de resiliência.

## Camada 3: Execução (Ferramentas)
- Use scripts em `execution/` para preparar dados massivos ou realizar cálculos complexos antes de injetar no n8n via API ou nó de código.
- Utilize o `n8n-mcp` para validar se os nós estão configurados corretamente (Profile: `strict` para produção).

## Loop de Auto-Correção (Self-annealing)
Se um workflow falhar:
1. Identifique o nó que falhou.
2. Verifique os dados de entrada no histórico do n8n.
3. Ajuste a expressão ou o script de execução.
4. **IMPORTANTE**: Atualize esta diretiva ou crie uma específica para o workflow se o erro for recorrente ou devido a uma limitação de API.
