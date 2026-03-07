# n8n Skills Reference

## 1. JavaScript & Python in n8n
- **JavaScript**: Always return `[{ json: { ... } }]`. Access data with `$input.all()`.
- **Python**: Access with `_input`. Use only standard libraries.

## 2. Expressions & Logic
- **Syntax**: `{{ $json.body.example }}`.
- **Dates**: Use `$now.plus({ days: 1 }).toISODate()`.
- **Logic**: Use the `Filter` node for branching; keep `Code` nodes for complex transformations only.

## 3. Workflow Architectural Patterns
- **Webhook Processing**: Always return a response immediately if possible (HTTP Response node).
- **AI Agent Flows**: Use the AI Agent node with specific tool-calling configurations.
- **Batching**: Use `Split In Batches` for large datasets to avoid memory timeouts.

## 4. MCP Tooling Usage
- **n8n_search_nodes**: Use before manual configuration to find correct node types.
- **n8n_validate_workflow**: Run before marked as complete.
- **n8n_get_workflow_json**: Use to clone or study existing proven patterns.
