# Handoff de Sessão — Marmitaria Araras
> Salvo em: 2026-03-01
> Retomar com: "leia o SESSION_HANDOFF.md e continue de onde paramos"

## O que foi feito nesta sessão (COMPLETO ✅)

### 1. `cosiararas/src/data/cosiMarmitaMenu.ts`
Reescrito com proteínas e preços corretos do Cosí:
- `price` no grupo = surcharge para **Pequena** (sobre base R$35)
- `COSI_FAMILIA_SURCHARGES` = surcharge adicional para **Família** (sobre base R$80)
- Tabela `COSI_PROTEIN_TABLE` exportada para o admin

### 2. `cosiararas/src/pages/MarmitaCardapio.tsx`
- UI inline builder: duas caixas de tamanho (Pequena/Família) + proteínas ordenadas por preço
- Cálculo de preço corrigido: usa `PEQUENA_BASE=35` / `FAMILIA_BASE=80` + `COSI_FAMILIA_SURCHARGES[proteinId]`
- `isStoreOpen()` retornando `true` (modo teste) — **reativar depois**
- Grupo `tamanho` removido do data (approach antigo)

### 3. `controle/src/pages/Marmitaria.tsx` (repo kfcury76/controle)
Reescrito com 3 abas:
- **Pedidos Online**: filtro `.in('source', ['marmitaria_araras', 'cosiararas'])` + badges de source
- **Cardápio Cosí** (NOVA): tabela editável de preços por proteína (Pequena + Família) + taxas de entrega
  - Salva em `cosi_menu_config` no Supabase (fallback: localStorage com aviso)
- **POS Balcão**: sem alterações

### 4. Deploy ✅
- `cosiararas.com.br` → deployado com sucesso
- `controle.cosiararas.com.br` → deployado com sucesso

---

## Pendente (próximos passos — em ordem de prioridade)

### A. Criar tabela `cosi_menu_config` no Supabase ⬅️ PRÓXIMO
A aba "Cardápio Cosí" no admin salva localmente por enquanto.
Rodar no **Supabase Studio** (SQL Editor) em `energetictriggerfish-supabase.cloudfy.live`:

```sql
CREATE TABLE cosi_menu_config (
  id text PRIMARY KEY,
  name text,
  preco_pequena numeric,
  preco_familia numeric,
  business_unit text DEFAULT 'cosi'
);

ALTER TABLE cosi_menu_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select" ON cosi_menu_config FOR SELECT USING (true);
CREATE POLICY "auth_all"    ON cosi_menu_config FOR ALL USING (auth.role() = 'authenticated');
```

Depois de criar a tabela:
- Testar salvando na aba "Cardápio Cosí" do admin
- Atualizar `MarmitaCardapio.tsx` para buscar preços do Supabase em vez do arquivo estático

### B. `VITE_MARMITARIA_URL` nas env vars do cosiararas
Necessário para o fluxo de pagamento MP funcionar.
Configurar em: Vercel → projeto cosiararas → Settings → Environment Variables
Valor: URL do `marmitaria-vendas` quando hospedar no Vercel

### C. Reativar horário de funcionamento
Em `src/pages/MarmitaCardapio.tsx`, função `isStoreOpen()`:
- Atualmente retorna `true` (modo teste)
- Restaurar lógica: Seg–Sáb 11h–14h30

### D. Deploy `marmitaria-vendas` no Vercel
O app Next.js ainda não está hospedado.

---

## Tabela de Preços Cosí (referência)

| Proteína | Pequena | Família |
|---|---|---|
| Coxa e Sobrecoxa | R$35 | R$80 |
| Frango Grelhado | R$35 | R$80 |
| Costelinha Barbecue | R$40 | R$90 |
| Frango Parmegiana | R$40 | R$90 |
| Frango à Milanesa | R$40 | R$90 |
| Tilápia | R$45 | R$100 |
| Alcatra | R$45 | R$100 |
| Alcatra à Milanesa/Parmegiana | R$50 | R$105 |

## Arquivos principais modificados nesta sessão
- `cosiararas/src/data/cosiMarmitaMenu.ts`
- `cosiararas/src/pages/MarmitaCardapio.tsx`
- `controle/src/pages/Marmitaria.tsx` (repo kfcury76/controle)
