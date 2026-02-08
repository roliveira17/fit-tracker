# Fit Track v3

App de tracking fitness com IA — alimentacao, treinos, sono e glicemia em um so lugar.

**Stack:** Next.js 16 + React 19 + Supabase + OpenAI GPT-4o-mini + Tailwind CSS

**Deploy:** https://fit-tracker-murex.vercel.app

---

## Setup Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variaveis de ambiente

```bash
cp .env.example .env.local
```

| Variavel | Descricao |
|----------|-----------|
| `OPENAI_API_KEY` | Chave da API OpenAI |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anonima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side) |

### 3. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute as migrations SQL de `supabase/migrations/` em ordem no SQL Editor
3. Configure Google OAuth em Authentication > Providers > Google
4. Adicione `http://localhost:3000/auth/callback` nos redirect URLs

### 4. Executar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## Features

- Chat com IA para registrar refeicoes, treinos, peso, gordura corporal e glicemia
- Chat com audio (gravacao de voz) e analise de fotos de refeicoes
- Dashboard com resumo diario (calorias, macros, peso)
- Insights com graficos de evolucao (macros, sono, treinos, glicemia)
- Import de dados: Apple Health (ZIP), Hevy (CSV), CGM/glicemia (XLSX)
- Scanner de codigo de barras para alimentos (Open Food Facts)
- Login com Google via Supabase Auth
- Modo offline com localStorage como fallback
- Export de dados em JSON/CSV
- Push notifications

---

## Documentacao

Consulte `CLAUDE.md` para arquitetura e convencoes, e `ROADMAP.md` para status do projeto. Specs detalhadas em `docs/`.

## Licenca

MIT
