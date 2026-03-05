# PesquisaHub

Plataforma de criação e coleta de pesquisas por cidades.

## Stack

- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Gráficos:** Recharts
- **OCR:** WebRTC + Tesseract.js (integração futura)
- **Icons:** Lucide React

## Setup Local

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. No SQL Editor, execute o conteúdo do arquivo `pesquisahub-schema.sql`
3. Copie a **URL** e a **anon key** do projeto

### 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas credenciais:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`

### 4. Criar primeiro usuário

1. No Supabase Dashboard → Authentication → Users → "Add User"
2. Após criar, vá em SQL Editor e execute:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'UUID-DO-USUARIO';
```

## Deploy no Vercel

### Opção A: Via GitHub

1. Suba o projeto para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) → "New Project" → Importe o repo
3. Configure as Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Opção B: Via CLI

```bash
npm i -g vercel
vercel
```

## Estrutura do Projeto

```
pesquisahub/
├── app/
│   ├── globals.css
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Redirect → /dashboard
│   ├── login/page.tsx          # Tela de login
│   └── (app)/                  # Route group (autenticado)
│       ├── layout.tsx          # AuthProvider + Sidebar
│       ├── dashboard/page.tsx  # Dashboard com gráficos
│       ├── cities/page.tsx     # CRUD de cidades
│       ├── folders/page.tsx    # Pastas por cidade
│       ├── forms/
│       │   ├── page.tsx        # Lista de pesquisas
│       │   ├── builder/page.tsx # Criador de perguntas
│       │   └── respond/page.tsx # Responder pesquisa
│       ├── scan/page.tsx       # Scanner OCR
│       ├── results/page.tsx    # Gráficos de resultados
│       └── users/page.tsx      # Gestão de usuários
├── components/
│   └── layout/
│       ├── Sidebar.tsx
│       └── AppShell.tsx
├── hooks/
│   ├── use-auth.tsx            # Auth context + provider
│   └── use-data.ts             # Hooks Supabase (CRUD)
├── lib/
│   ├── supabase-browser.ts     # Client-side Supabase
│   ├── supabase-server.ts      # Server-side Supabase
│   └── utils.ts                # cn() helper
├── types/
│   └── database.ts             # TypeScript types
├── middleware.ts                # Auth middleware
└── pesquisahub-schema.sql      # SQL completo do banco
```

## Funcionalidades

- ✅ Login com Supabase Auth
- ✅ Roles: Admin, Pesquisador, Parceiro
- ✅ CRUD de Cidades
- ✅ Sistema de Pastas
- ✅ Criador de Formulários (5 tipos de pergunta)
- ✅ Coleta de respostas digital
- ✅ Scanner OCR (câmera + upload)
- ✅ Dashboard com gráficos automáticos
- ✅ Exportação CSV
- ✅ Row Level Security (RLS)
- ✅ Middleware de autenticação

## Próximos Passos

- [ ] Integrar Tesseract.js para OCR real
- [ ] Geração de PDF imprimível
- [ ] Exportação Excel/PDF dos resultados
- [ ] Geolocalização nas respostas
- [ ] Notificações em tempo real (Supabase Realtime)
- [ ] PWA para uso offline em campo
