# Sistema de Gestão - Empório Cosi & Marmitaria Araras

Frontend do sistema de gestão integrado.

## 🚀 Deploy

**URL:** https://gestao.cosiararas.com.br

## 📦 Sistemas Disponíveis

### 1. CMV & Custos
- Dashboard CMV
- Receitas (CRUD)
- Ingredientes (CRUD)
- Custos Fixos (CRUD)

### 2. Recursos Humanos
- Dashboard RH
- Funcionários (CRUD)
- Folha de Pagamento
- Importar Secullum (CSV)
- Gerar Contracheques (PDF)

### 3. Receitas & Vendas
- Dashboard de Receitas
- Importar NF-e (XML)
- Importar Extrato Bancário (CSV)
- Conciliação Bancária

## 🛠️ Tecnologias

- React 18 + TypeScript
- Vite
- Shadcn/ui (Radix UI)
- TailwindCSS
- React Router DOM
- Recharts
- Supabase Client
- TanStack Query

## 📁 Estrutura

```
frontend/
├── src/
│   ├── components/      # Componentes UI (Shadcn)
│   ├── pages/          # Páginas do sistema
│   │   ├── Home.tsx           # Página principal
│   │   ├── CMV.tsx            # Dashboard CMV
│   │   ├── ReceitasCRUD.tsx   # CRUD Receitas
│   │   ├── Ingredientes.tsx   # CRUD Ingredientes
│   │   ├── CustosFixos.tsx    # CRUD Custos Fixos
│   │   ├── RHDashboard.tsx    # Dashboard RH
│   │   ├── Funcionarios.tsx   # CRUD Funcionários
│   │   ├── FolhaPagamento.tsx # Folha de Pagamento
│   │   └── ...
│   ├── lib/            # Utilitários e configs
│   └── App.tsx         # Rotas principais
├── public/             # Assets estáticos
└── package.json
```

## 🔧 Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🌐 Backend

Edge Functions no Supabase Cloud:
- https://yrsckqpprmixhgiuzvsz.supabase.co/functions/v1/*

Database no Cloudfy:
- https://energetictriggerfish-supabase.cloudfy.live

## 📝 Licença

Propriedade de Empório Cosi © 2026
