# Fit Track v3 — Roadmap e Progresso

> Arquivo unico de acompanhamento do projeto.
> Ultima atualizacao: 2026-02-08

---

## Resumo Geral

| Area | Status | Detalhe |
|------|--------|---------|
| Backend Supabase (M1-M10) | 100% (56/56) | Todos milestones completos |
| Frontend v1 (core) | 100% | Onboarding, Chat, Home, Insights, Profile, Import |
| Frontend v2 (extras) | 97% (60/62) | Audio, foto, Apple Health, auth, export, notificacoes, import calma |
| Food API | 70% (12/17) | Fases 1-2 completas, Fase 3 pendente |
| QA / Testes E2E | 100% (15/15) | Todos implementados, 35 pass + 3 skip |
| Design System | 100% | 3 fases completas (setup, componentes, telas) |
| Deploy | Ativo | https://fit-tracker-murex.vercel.app |

---

## Pendencias Ativas

### 1. Import Apple Health — Correção de Persistência no Supabase  ✅ [2026-02-07]

**Status:** Corrigido. 5 bugs encontrados e resolvidos na sessao 2026-02-07.

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

**Migration pendente:** Executar `20260208_001_fix_import_rpc.sql` no SQL Editor do Supabase Dashboard.

---

### 2. Import Apple Health — Dados de Sono (MEDIA)

**Status:** Parser e mapper implementados, mas precisa teste real.

- ✅ Parser de sleepEntries implementado
- ✅ Mapper `mapSleepSessions()` implementado
- ✅ Integração com RPC implementada
- ✅ Logs de debug adicionados
- ⏳ **Aguardando teste com arquivo Apple Health real**

**Detalhes:** Ver `docs/learnings/apple-health-sleep-debug.md`.

**Após corrigir item #1, testar:**
1. Importar ZIP com dados de sono
2. Verificar logs: `[mapSleepSessions] X sessões mapeadas`
3. Consultar `sleep_sessions` e `sleep_stages` no Supabase
4. Se `sleep: 0`, verificar valores de `SLEEP_VALUES` no XML

---

### 3. Parser FreeStyle Libre — fallback generico (BAIXA)

O formato FreeStyle Libre eh detectado em `lib/parsers/cgm.ts` mas usa o parser generico, que pode falhar em colunas especificas desse dispositivo.

**Correcao necessaria:**
- Obter arquivo XLSX real de FreeStyle Libre para mapear colunas
- Implementar `parseFreeStyleCGM()` especifico

### 3. Food API — Fase 3 Otimizacoes (BAIXA)

5 tasks pendentes:
- [ ] Loading states durante scan de barcode
- [ ] Retry com exponential backoff para Open Food Facts API
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

## Sessao 2026-02-08 — Onde Paramos

### Concluido nesta sessao:
- Testes E2E T010-T015 implementados e passando (35 passed, 3 skipped)
- TEST_INDEX.md atualizado com status dos novos testes
- QA coverage: 100% dos testes planejados implementados (15/15)

### Sessao anterior (2026-02-07):
- Fix: 5 bugs no pipeline Apple Health Import → Supabase
- Migration SQL criada: `20260208_001_fix_import_rpc.sql`
- 3 novos commands em `.claude/commands/`

### Proximos passos (prioridade):
1. **EXECUTAR MIGRATION** — Rodar `20260208_001_fix_import_rpc.sql` no SQL Editor do Supabase
2. **TESTAR IMPORT** — Re-testar Apple Health import com login para validar os 5 fixes
3. **APPLE HEALTH SLEEP** — Verificar dados de sono apos import (pendencia #2)
4. **FREESTYLE LIBRE** — Parser especifico se houver sample do device
5. **FOOD API FASE 3** — Otimizacoes (loading states, retry, analytics)

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

### Design System

| Fase | Data | Progresso |
|------|------|-----------|
| Setup (Tailwind, fonts, dark mode) | 2026-01-19 | 4/4 |
| Base Components (12 sets) | 2026-01-19 | 12/12 |
| Screens (10 telas) | 2026-01-19 | 10/10 |

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
