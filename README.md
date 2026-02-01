# Fit Track v3

Aplicativo de tracking fitness com IA - treino, sono e alimentação em um só lugar.

## Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: OpenAI GPT-4o-mini para parsing de alimentos e treinos

## Setup Local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha as variáveis em `.env.local`:

| Variável | Descrição |
|----------|-----------|
| `OPENAI_API_KEY` | Chave da API OpenAI |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |

### 3. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute a migração SQL em `supabase/migrations/20260126_001_initial_schema.sql`
3. Configure OAuth no Dashboard:
   - Authentication > Providers > Google
   - Adicione `http://localhost:3000/auth/callback` nos redirect URLs

### 4. Executar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Banco

```
profiles         - Dados do usuário (nome, altura, peso, meta TDEE)
weight_logs      - Histórico de peso
body_fat_logs    - Histórico de % gordura
meals            - Refeições registradas
meal_items       - Itens de cada refeição
workouts         - Treinos registrados
workout_sets     - Exercícios de cada treino
sleep_sessions   - Sessões de sono
sleep_stages     - Fases do sono (deep, light, REM)
foods            - Banco de alimentos (globais + customizados)
import_records   - Histórico de imports
```

## Features

- Chat com IA para registrar refeições e treinos
- Dashboard com resumo diário (calorias in/out, proteína, peso)
- Insights com gráficos de evolução
- Import de dados do Apple Health e Hevy
- Login com Google/Apple via Supabase Auth
- Modo offline com localStorage como fallback

## Scripts

```bash
npm run dev        # Desenvolvimento com Turbopack
npm run dev:clean  # Limpa processos e reinicia
npm run build      # Build de produção
npm run lint       # Verificar código
```

## Licença

MIT
