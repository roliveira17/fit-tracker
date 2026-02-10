# O Que Funciona — Padroes e Estrategias

Padroes que deram certo no desenvolvimento do Fit Track v3.

---

## Arquitetura

### Dual Storage (Supabase + localStorage)
- Supabase como primario quando autenticado, localStorage como fallback offline
- Mesmos tipos de dados em ambos — facilita migracao quando usuario faz login
- `lib/supabase.ts` e `lib/storage.ts` espelham a mesma interface
- **Importante:** Dedup deve ser separado por path. Supabase usa UNIQUE constraints server-side. localStorage usa dedup client-side. Nunca misturar (ver armadilha #7)

### RPCs SECURITY DEFINER
- Todas as escritas autenticadas passam por RPCs em vez de INSERT direto
- Bypass de RLS controlado — funcao roda como superuser, mas valida user_id internamente
- Vantagem: logica complexa (multi-tabela, validacao, aggregacao) fica no SQL

### Food Lookup Pipeline (5 camadas)
- Cache in-memory → banco local (1196 alimentos PT-BR) → TBCA (5668 itens) → OpenFoodFacts API → OpenAI fallback
- Alta taxa de acerto sem depender de API externa na maioria dos casos
- Barcode cache no Supabase evita chamadas repetidas a OpenFoodFacts

## Frontend

### Extracao de logica para hooks
- `useImportLogic` extraiu ~600 linhas de logica da pagina de import
- Pagina ficou com 153 linhas (so layout e composicao)
- Facilita teste unitario da logica separada da UI

### Tema Light Unificado (Retrofit Stitch)
- Default `bg-[#F5F3EF] text-gray-800` no ScreenContainer — todas as paginas herdam automaticamente
- Cards brancos (`bg-white shadow-soft rounded-2xl`) sobre fundo cinza claro
- Accent color `calma-primary` (verde #4F633A) para botoes e destaques ativos
- Tokens `calma-*` no Tailwind para manter consistencia
- Paginas que precisam de bg diferente (Chat, Import) sobreescrevem via `className` no ScreenContainer
- **Migracao dark→light em lote:** usar PowerShell Get-ChildItem + -replace para trocar tokens em massa (bg-surface-card→bg-white, text-text-secondary→text-gray-500, etc)

### Tema Calma (Import Page)
- Tema light separado (cream/green) com tokens `calma-*` no Tailwind
- Componentes isolados em `components/import/calma/`
- DM Serif Display para titulos hero

### Mobile-First 390x844
- Viewport do iPhone 12/13 como referencia
- Playwright testa nesse viewport
- Design escala para desktop naturalmente

## AI/Chat

### Contexto agregado para GPT
- `formatUserContextForPrompt()` monta contexto estruturado com dados do usuario
- Glicemia: resumo diario (media, min, max) em vez de leituras individuais
- System prompt com responsabilidades explicitas — evita alucinacao sobre capacidades

### Intent classification + parsing separados
- Primeiro GPT classifica intent (food, exercise, weight, glucose, question)
- Depois parser especifico processa a resposta
- Evita prompts gigantes e reduz custo

## Testes

### Playwright com dev server automatico
- `webServer` no playwright.config.ts sobe o Next.js automaticamente
- Testes rodam independentes — basta `npx playwright test`
- Viewport mobile configurado globalmente

### E2E tests: padroes que funcionam
- `page.locator('input[type="file"]').setInputFiles({...})` para testar upload sem arquivo real
- `page.route("**/api/...", ...)` para mockar APIs — mas verificar estrutura exata do response
- `section.locator("button").first().waitFor({ timeout: 3000 }).then(() => true).catch(() => false)` para features opcionais (ex: Notification API)
- `test.skip()` para pular testes quando recurso do browser não está disponível (headless Chromium não suporta Notification API)
- Sempre usar `.first()` quando regex pode casar com múltiplos elementos (strict mode violation)

## Workflow

### PENDENCIAS.md como fonte unica de verdade
- Um arquivo centraliza status, blockers e proximos passos
- Sessoes datadas ("Onde Paramos") facilitam continuidade entre sessoes
- Historico de milestones documenta o que ja foi feito e quando

### Investigacao com agentes em paralelo
- Usar 3 agentes Explore com hipoteses diferentes acelera debug de problemas cross-domain
- Agente 1: frontend flow, Agente 2: database/SQL, Agente 3: auth/session
- Cada agente retorna analise independente — cruzar resultados revela bugs que nenhum acharia sozinho
