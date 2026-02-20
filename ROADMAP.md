# Fit Track v3 — Roadmap e Progresso

> Arquivo unico de acompanhamento do projeto.
> Ultima atualizacao: 2026-02-19

---

## Resumo Geral

| Area | Status | Detalhe |
|------|--------|---------|
| Backend Supabase (M1-M10) | 100% (56/56) | Todos milestones completos |
| Frontend v1 (core) | 100% | Onboarding, Chat, Home, Insights, Profile, Import |
| Frontend v2 (extras) | 98% (61/62) | Audio, foto inteligente, Apple Health, auth, export, notificacoes, import calma |
| Chat Cards Retrofit (Stitch) | 100% (8/8) | Todos cards retrofitados + 2 pipelines novos |
| Food API | 76% (13/17) | Fases 1-2 completas, Fase 3 parcial (retry TBCA feito) |
| QA / Testes E2E | 100% (15/15) | Todos implementados, 35 pass + 3 skip |
| Design System | 100% | Retrofit Stitch (light) completo — todas telas + floating pill nav + auth pages |
| Deploy | Ativo | https://fit-tracker-murex.vercel.app |

---

## Pendencias Ativas

### 1. Import Apple Health — Correção de Persistência no Supabase  ✅ [2026-02-08]

**Status:** Corrigido e migration aplicada. 5 bugs resolvidos (codigo 2026-02-07) + migration no Supabase (2026-02-08).

**Problemas Corrigidos (2026-02-05):**
- ✅ Erro no Supabase era silenciosamente ignorado → `importAppleHealth` agora lança exceção
- ✅ localStorage sempre executava como fallback → Separação clara: Supabase (logado) / localStorage (offline)
- ✅ UI mostrava "sucesso" mesmo com Supabase vazio → Mensagens de erro explícitas
- ✅ Ambiguidade RPC (2 versões no Supabase) → Adicionado `p_glucose: []` para desambiguar

**Problemas Corrigidos (2026-02-07):**
- ✅ Dedup usava localStorage mesmo para usuario logado → Agora envia TUDO ao Supabase (server-side dedup)
- ✅ Race condition: `user` podia ser null antes do auth resolver → Loading combinado auth + import
- ✅ CHECK violations causavam rollback total do RPC → Migration com `WHEN OTHERS` em todos os loops
- ✅ Hevy import gravava em localStorage incondicionalmente → Movido para `else` block
- ✅ Sem feedback visual Supabase vs localStorage → UI mostra "nuvem" ou "local"

**Arquivos modificados (2026-02-07):**
- `hooks/useImportLogic.ts`: Fixes 1, 2, 4, 5
- `components/import/calma/ImportResultCalma.tsx`: Fix 5 (feedback visual)
- `supabase/migrations/20260208_001_fix_import_rpc.sql`: Fix 3 (DROP V1 + WHEN OTHERS)

**Migration aplicada:** ✅ `20260208_001_fix_import_rpc.sql` executada no SQL Editor do Supabase em 2026-02-08.

---

### 2. Import Apple Health — Dados de Sono ✅ [2026-02-19]

**Status:** Corrigido. Fallback IN_BED implementado.

- ✅ Parser de sleepEntries implementado
- ✅ Mapper `mapSleepSessions()` implementado
- ✅ Integração com RPC implementada
- ✅ Logs de debug adicionados
- ✅ **Fallback IN_BED** — Usuarios sem Apple Watch cujo export so contem `HKCategoryValueSleepAnalysisInBed` agora tem sessoes de sono contadas como `core` (sono leve)

**Detalhes:** Ver `docs/learnings/apple-health-sleep-debug.md`.

---

### 3. Parser FreeStyle Libre — fallback generico (BAIXA)

O formato FreeStyle Libre eh detectado em `lib/parsers/cgm.ts` mas usa o parser generico, que pode falhar em colunas especificas desse dispositivo.

**Correcao necessaria:**
- Obter arquivo XLSX real de FreeStyle Libre para mapear colunas
- Implementar `parseFreeStyleCGM()` especifico

### 3. Food API — Fase 3 Otimizacoes (BAIXA)

5 tasks, 1 concluida:
- [ ] Loading states durante scan de barcode
- [x] Retry com exponential backoff para TBCA lookup ✅ [2026-02-19]
- [ ] Analytics de uso (cache hit rates, taxa de acerto)
- [ ] Testes E2E para barcode scanner
- [ ] Documentacao da API interna

### 4. Testes E2E — Implementados  ✅ [2026-02-08]

Todos 15 testes implementados. T001-T009 passam, T010-T015 passam (35/38, 3 skips esperados no T014 por limitação do headless Chromium com Notification API).

| # | Teste | Status | Asserts |
|---|-------|--------|---------|
| T009 | Barcode Scanner | PASS | 3 |
| T010 | Chat com Foto | PASS | 5 |
| T011 | Import Apple Health | PASS | 7 |
| T012 | Exportar Dados | PASS | 7 |
| T013 | Login / Autenticação | PASS | 8 |
| T014 | Notificações | PASS (3 skip) | 6 |
| T015 | Reset App | PASS | 5 |

### 5. v2 Features — 2 itens pendentes (BAIXA)

- [ ] Preview de dados antes de importar Apple Health
- [ ] Barra de progresso para importacao de arquivos grandes

### 6. Button legado — migrar para design system (BAIXA)

Arquivo `components/ui/button.tsx` e compatibilidade com shadcn/ui antigo. Pode ser removido quando todos os imports forem migrados.

---

## Sessao 2026-02-19 — Onde Paramos

### Concluido nesta sessao:
- ✅ **BUG: Foto "Registrar no diario"** — 3 fixes: EditMealSheet setState durante render (crash), handleSaveMeal error handling, PhotoAnalysisCard disabled guard
- ✅ **BUG: Sleep import IN_BED** — Fallback para contar IN_BED como sono leve quando nao ha estagios granulares (usuarios sem Apple Watch)
- ✅ **FEAT: Foto inteligente** — AI detecta tipo de imagem (comida, rotulo nutricional, receita) e mostra card apropriado. Expandido SYSTEM_PROMPT, PhotoAnalysisCard com props configuráveis, novos cases no CardRenderer
- ✅ **Food API: retry TBCA** — `withRetry()` com exponential backoff (300ms, 600ms) para buscas TBCA
- ✅ **Teste T010 atualizado** — Regex adaptada para novo texto neutro "Imagem enviada para analise"

### Testes pre-existentes falhando (nao introduzidos nesta sessao):
- T002: "deve destacar item ativo na BottomNav" — regex procura `text-primary` mas classe atual e `text-calma-primary`
- T007 (5 testes): Insights com dados mockados — testes dependem de layout que mudou em sessoes anteriores

### Concluido na sessao 2026-02-18 (sessao 2):
- ✅ **Auth cleanup** — Removido NextAuth legado (4 arquivos, 15 pacotes), retrofitado login/callback/onboarding para tema light [PR #4]
- ✅ **Login Google funcionando** — Supabase restaurado do pause, OAuth flow validado end-to-end
- ✅ **Import bg fix** — Alinhada cor de fundo da pagina Import com tema unificado (#F5F3EF)
- ✅ **Fix Insights crash** — Normalizer para RPC `getInsights()`, guards de optional chaining para glucose nos engines, fallbacks em `supabaseToUserProfile()`

### Concluido na sessao 2026-02-18 (sessao 1):
- ✅ **Fix Insights** — Pagina nao abria: auth race condition, try/catch, guards, padding [PR #2]
- ✅ **Chat cores alinhadas** — Removido gradient cream, todos componentes usando tokens calma-* [PR #2]
- ✅ **BottomNav floating pill** — Redesign minimalista: floating pill, so icones, glass effect [PR #3]
- ✅ PR #2 e PR #3 mergeadas na master, deploy na Vercel

### Concluido na sessao 2026-02-09:
- ✅ Retrofit Home, Profile, Onboarding para design Stitch (light/Calma)
- ✅ Design system unificado: ScreenContainer default light (#F5F3EF)
- ✅ Engines Insights criadas: score, deltas, correlacoes, recomendacoes
- ✅ Novos componentes SVG: ScoreRing, CalorieRing, Sparkline, FrequencyDots, MacroBar
- ✅ 12 testes E2E atualizados para novo layout

### Concluido na sessao 2026-02-08:
- ✅ Retrofit visual de TODOS os chat cards para design Stitch (8 cards)
- ✅ Pipeline Weekly Analysis + Glucose Analysis
- ✅ Migration Apple Health + Testes E2E T010-T015

### Pendente:
1. ~~**VERIFICAR MIGRATIONS**~~ ✅ Ambas aplicadas: `insights_extended` (reaplicada com bloco glucose) + `sleep_insights`
2. **TESTAR IMPORT** — Re-testar Apple Health import com login (sono deve funcionar agora com fallback IN_BED)
3. **TESTES E2E** — Corrigir T002 (regex `text-primary` → `text-calma-primary`) e T007 (layout de Insights desatualizado)
4. **FOOD API FASE 3** — Pendentes: loading states no chat, analytics UI, E2E barcode, docs
5. **v2 pendentes** — Preview de dados antes de importar, barra de progresso para arquivos grandes

---

## Historico de Milestones

### Backend (Supabase)

| Milestone | Data | Tasks |
|-----------|------|-------|
| M1: Foundation (Auth + Profile) | 2026-01-26 | 9/9 |
| M2: Core Data (CRUD) | 2026-01-26 | 12/12 |
| M3: Import (Apple Health + Hevy) | 2026-01-26 | 6/6 |
| M4: Polish (Indices + RLS + Docs) | 2026-01-26 | 5/5 |
| M5: Glicemia + AI Context | 2026-01-26 | 6/6 |
| M6: Validacao com Dados Reais | 2026-01-26 | 5/5 |
| M7: v2 Production Fixes | 2026-01-27 | 4/4 |
| M8: Barcode Scanner Fixes | 2026-02-01 | 3/3 |
| M9: Glucose Import Pipeline Fix | 2026-02-04 | 3/3 |
| M10: Apple Health Import Fix | 2026-02-07 | 5/5 |

### Frontend v1

| Feature | Data |
|---------|------|
| Onboarding | 2026-01-17 |
| Chat (texto) | 2026-01-17 |
| Home | 2026-01-17 |
| Insights | 2026-01-17 |
| Profile | 2026-01-17 |
| Import (Hevy CSV) | 2026-01-17 |
| Navegacao | 2026-01-17 |

### Frontend v2

| Feature | Data | Status |
|---------|------|--------|
| Audio no Chat | 2026-01-19 | 10/10 |
| Apple Health Import | 2026-01-21 | 12/14 (sono pendente) |
| Auth Social (Google) | 2026-01-21 | 10/11 |
| Chat com Foto | 2026-01-21 | 9/9 |
| Push Notifications | 2026-01-21 | 9/9 |
| Exportacao | 2026-01-21 | 9/9 |
| Refactoring Import → design "Calma" | 2026-02-04 | Completo |
| Glucose pipeline fix + chat AI | 2026-02-04 | Completo |
| Chat Cards Retrofit (Stitch) | 2026-02-08 | 8/8 cards + 2 pipelines |

### Design System

| Fase | Data | Progresso |
|------|------|-----------|
| Setup (Tailwind, fonts, dark mode) | 2026-01-19 | 4/4 |
| Base Components (12 sets) | 2026-01-19 | 12/12 |
| Screens (10 telas) | 2026-01-19 | 10/10 |
| Retrofit Stitch (light unificado) | 2026-02-18 | Completo — todas telas + auth pages + floating pill nav |

### Food API

| Fase | Data | Progresso |
|------|------|-----------|
| Fase 1: TBCA no Supabase | 2026-01-27 | 6/6 |
| Fase 2: Barcode Scanner | 2026-01-27 | 6/6 |
| Fase 3: Otimizacoes | Pendente | 0/5 |

---

## Ideias Futuras (pos-v3)

Nao sao pendencias — sao opcoes para evolucao futura:

1. **PWA / Mobile** — Service worker para offline real + manifest.json
2. **UX do Chat** — Historico persistente no Supabase, sugestoes inteligentes
3. **Integracao Strava** — OAuth + import automatico de corrida/ciclismo
4. **Push Notifications v2** — Lembretes contextuais baseados em dados
5. **Sync offline-first** — Resolver conflitos localStorage vs Supabase

---

## Infraestrutura

```
Supabase Project: fittrack
Reference ID:     bsutppgtcihgzdblxfqc
Region:           South America (Sao Paulo)
URL:              https://bsutppgtcihgzdblxfqc.supabase.co
Dashboard:        https://supabase.com/dashboard/project/bsutppgtcihgzdblxfqc
Deploy:           https://fit-tracker-murex.vercel.app
```
