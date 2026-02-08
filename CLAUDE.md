# CLAUDE.md

Instrucoes para Claude Code ao trabalhar neste repositorio.

## Visao Geral

Fit Track v3 — app de tracking fitness com IA (alimentacao, treinos, sono, glicemia). Documentacao e UI em **portugues (pt-BR)**.

```
TIPO:       Fullstack Web App (Mobile-First)
FRAMEWORK:  Next.js 16 (App Router) + React 19
LINGUAGEM:  TypeScript 5.9
BACKEND:    Supabase (PostgreSQL + Auth + RLS)
AI:         OpenAI GPT-4o-mini
DEPLOY:     Vercel — https://fit-tracker-murex.vercel.app
TESTES:     Playwright (E2E) + Vitest (unit)
```

---

## Comandos

```bash
npm run dev          # Dev server com Turbopack
npm run dev:clean    # Mata processos, limpa lock, reinicia (Windows/PowerShell)
npm run build        # Build de producao
npm run lint         # Next.js linting
npx playwright test  # Testes E2E (sobe dev server automaticamente)
npx playwright test tests/e2e/T001-onboarding.spec.ts  # Teste individual
```

---

## Principios de Desenvolvimento

1. Simplicidade primeiro. Nao abstrair prematuramente.
2. Codigo legivel > codigo esperto.
3. Falhar rapido e explicitamente.
4. Menos codigo e melhor.
5. Fazer funcionar, fazer certo, fazer rapido. Nessa ordem.

## Code Style

- Strict typing, zero `any`.
- Named exports.
- Funcoes puras quando possivel.
- Early returns para evitar nesting.
- Maximo ~20 linhas por funcao.
- Maximo 3 parametros. Se mais, usar objeto.
- Nomes descritivos, sem abreviacoes ambiguas.

## Tratamento de Erros

- Nunca catch vazio ou silencioso.
- Logar com contexto: { operacao, entidade, id, erro }.
- Nao expor detalhes internos em respostas ao usuario.

## Testes

- Testar comportamento, nao implementacao.
- Todo bug corrigido ganha teste de regressao.
- Nomes descritivos: 'deve rejeitar pedido sem estoque'.

## Git

- Conventional Commits: feat, fix, refactor, test, docs, chore.
- Commits atomicos — cada um compila e testa.
- Nunca commitar secrets, .env, dados pessoais.

## Seguranca

- Input validation em toda fronteira.
- Secrets em variaveis de ambiente, nunca hardcoded.
- Dependencias atualizadas.

---

## Arquitetura

### Data Flow: Chat → Persistencia

1. Usuario envia mensagem via `/chat` → POST `/api/chat/route.ts`
2. `lib/ai.ts` classifica intent e chama GPT-4o-mini para parsing
3. `lib/parsers.ts` normaliza dados em estruturas tipadas
4. Dados salvos via `lib/supabase.ts` (RPCs) ou `lib/storage.ts` (localStorage fallback)

### Dual Storage

- **`lib/supabase.ts`**: Primario quando autenticado. Todas escritas via RPC com `SECURITY DEFINER`.
  - RPCs chave: `get_home_summary()`, `get_insights()`, `import_apple_health()`, `import_hevy()`, `import_glucose_readings()`
- **`lib/storage.ts`**: Fallback localStorage para uso offline/anonimo. Espelha os mesmos tipos.

### Food Lookup Pipeline

`lib/food-lookup.ts` orquestra resolucao multi-source:
1. `lib/food-cache.ts` (cache in-memory)
2. `lib/food-database.ts` (130 alimentos PT-BR)
3. `lib/tbca-database.ts` (TBCA, 5.668 alimentos, 17MB em `data/`)
4. `lib/openfoodfacts.ts` (API para barcodes)
5. OpenAI fallback

### Import System

`app/import/page.tsx` com 4 fontes (UI usa tema "Calma" light — cream/green):
- **Apple Health**: ZIP → XML via JSZip → parsing em `lib/import/appleHealth*.ts` → Supabase RPC
- **Hevy**: CSV parsing em `lib/parsers/hevy.ts`
- **CGM (Glicemia)**: XLSX parsing em `lib/parsers/cgm.ts` → RPC `import_glucose_readings()`
- **Barcode**: `components/import/BarcodeScanner.tsx` via html5-qrcode → OpenFoodFacts → `lib/barcode-cache.ts`

Logica de import extraida para `hooks/useImportLogic.ts`. Componentes Calma em `components/import/calma/`.

### Auth

Supabase Auth com Google OAuth. Provider em `components/providers/SupabaseAuthProvider.tsx`. Helpers em `lib/auth.ts`. Todas tabelas tem RLS.

### Navegacao

```
Bottom Tabs: [Chat] [Home] [Importar] [Insights] [Profile]
Onboarding:  Welcome → Feature Tour (4 telas) → Perfil Basico → Chat
```

---

## Convencoes

- **Path alias**: `@/*` mapeia para raiz do projeto
- **Supabase RPCs**: Todas escritas autenticadas via RPC SECURITY DEFINER, nunca INSERT direto
- **Mobile-first**: Viewport 390x844. Playwright testa neste tamanho
- **Cores**: Primary orange `#eb6028`, tokens custom no `tailwind.config.ts`
- **Tema Calma**: Import page usa tema light separado (cream `#FDF8F3` / green `#4F633A`). Tokens `calma-*`
- **DM Serif Display**: Titulos hero na Import page. Variavel `--font-serif-display`
- **Componentes**: Custom em `components/ui/`, nao shadcn/ui puro

---

## Banco de Dados

Migrations em `supabase/migrations/` (executar em ordem no SQL Editor do Supabase Dashboard).

Tabelas: `profiles`, `meals`/`meal_items`, `workouts`/`workout_sets`, `sleep_sessions`/`sleep_stages`, `weight_logs`, `body_fat_logs`, `glucose_logs`, `foods`, `barcode_cache`, `import_records`.

Schema em `docs/specs/backend-data-model.md`.

---

## Variaveis de Ambiente

Em `.env.local` (ver `.env.example`):
- `OPENAI_API_KEY` — OpenAI (server-side)
- `NEXT_PUBLIC_SUPABASE_URL` — URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Chave anonima
- `SUPABASE_SERVICE_ROLE_KEY` — Service role (server-side)

---

## Estrutura de Documentacao

```
ROADMAP.md                  # Status, pendencias, proximos passos
docs/
├── specs/                  # Especificacoes de features
│   ├── prd-master.md       # PRD principal
│   ├── 10-onboarding.md    # Spec por feature (10-60)
│   ├── v2-*.md             # Features v2
│   ├── backend-*.md        # Backend specs
│   ├── food-api-*.md       # Food API
│   └── design-*.md         # Design system
├── decisions/              # ADRs (Architecture Decision Records)
│   ├── 001-auth-rls.md     # Auth + RLS
│   └── 002-barcode-api.md  # Barcode pipeline
├── learnings/              # Licoes aprendidas
│   ├── o-que-funciona.md   # Padroes que deram certo
│   └── armadilhas.md       # Bugs dificeis e solucoes
├── context/                # Contexto de negocio
│   ├── business-context.md # Persona do usuario
│   ├── glossario.md        # Termos e definicoes
│   └── samples.md          # Dados de teste e referencia
├── qa/                     # Testes E2E
│   ├── TEST_INDEX.md       # Indice de test cases
│   └── tests/              # T001-T008 specs
├── _prompts/               # Templates de prompts
└── _archive/               # Docs concluidos/historicos
```

Antes de implementar, ler spec. Ao finalizar, atualizar ROADMAP.md e learnings.

---

## Compact Instructions

Ao compactar, preservar:
- Arquivos modificados na sessao
- Comandos de teste que passaram/falharam
- Decisoes tomadas e motivos
- Estado atual das tarefas

---

## Known Issues

Rastreados em `ROADMAP.md`. Principais:
- Apple Health sleep data parsed mas nao persistida
- FreeStyle Libre CGM usa parser generico
