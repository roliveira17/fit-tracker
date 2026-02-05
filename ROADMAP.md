# Fit Track v3 — Roadmap e Progresso

> Arquivo unico de acompanhamento do projeto.
> Ultima atualizacao: 2026-02-04

---

## Resumo Geral

| Area | Status | Detalhe |
|------|--------|---------|
| Backend Supabase (M1-M9) | 100% (53/53) | Todos milestones completos |
| Frontend v1 (core) | 100% | Onboarding, Chat, Home, Insights, Profile, Import |
| Frontend v2 (extras) | 97% (60/62) | Audio, foto, Apple Health, auth, export, notificacoes, import calma |
| Food API | 70% (12/17) | Fases 1-2 completas, Fase 3 pendente |
| QA / Testes E2E | 53% (8/15) | P0+P1 passando, P2+P3 pendentes |
| Design System | 100% | 3 fases completas (setup, componentes, telas) |
| Deploy | Ativo | https://fit-tracker-murex.vercel.app |

---

## Pendencias Ativas

### 1. Import Apple Health — Correção de Persistência no Supabase  🏗️ [2026-02-05]

**Status:** Correção implementada + Fix RPC ambiguidade. Aguardando teste do usuário.

**Problemas Corrigidos (2026-02-05):**
- ✅ Erro no Supabase era silenciosamente ignorado → `importAppleHealth` agora lança exceção
- ✅ localStorage sempre executava como fallback → Separação clara: Supabase (logado) / localStorage (offline)
- ✅ UI mostrava "sucesso" mesmo com Supabase vazio → Mensagens de erro explícitas
- ✅ Ambiguidade RPC (2 versões no Supabase) → Adicionado `p_glucose: []` para desambiguar

**Arquivos modificados:**
- `lib/supabase.ts`: linha 498-522 (lança exceção + `p_glucose: []`)
- `hooks/useImportLogic.ts`: linha 147-240 (separação Supabase/localStorage + melhor erro)
- `lib/import/appleHealthMapper.ts`: logs de debug para sono
- Docs: `docs/learnings/apple-health-fix-2026-02-05.md` (completo)

**Próximo passo:**
- Usuário deve testar import com login
- Se funcionar: marcar como ✅ concluído
- Se falhar: investigar erro específico

**Sono ainda pendente:** Ver item #2 abaixo.

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

### 4. Testes E2E — 7 testes pendentes (BAIXA)

| # | Teste | Prioridade |
|---|-------|------------|
| T009 | Chat com Audio | P2 |
| T010 | Chat com Foto | P2 |
| T011 | Importar Apple Health | P2 |
| T012 | Exportar Dados | P2 |
| T013 | Login Google | P3 |
| T014 | Notificacoes | P3 |
| T015 | Reset App | P3 |

Playwright configurado. Testes T001-T008 passam.

### 5. v2 Features — 2 itens pendentes (BAIXA)

- [ ] Preview de dados antes de importar Apple Health
- [ ] Barra de progresso para importacao de arquivos grandes

### 6. Button legado — migrar para design system (BAIXA)

Arquivo `components/ui/button.tsx` e compatibilidade com shadcn/ui antigo. Pode ser removido quando todos os imports forem migrados.

---

## Sessao 2026-02-04 — Onde Paramos

### Concluido nesta sessao:
- Refactoring completo da tela Import → design "Importar com Calma" (light theme cream/green)
- Extracao de logica de import para hook `hooks/useImportLogic.ts`
- 7 componentes novos em `components/import/calma/`
- Fix: Chat AI agora tem acesso a dados de glicemia (system prompt + context)
- Fix: Pipeline glucose import → Supabase (CHECK constraint + RPC + error handling)
- Fix: `getGlucoseStats` passando `p_user_id` corretamente
- Melhoria: Chat mostra media diaria de glicemia em vez de leituras minuto-a-minuto
- Migration SQL aplicada no Supabase: `20260207_001_fix_glucose_import.sql`
- Reorganizacao completa da documentacao do projeto

### Proximos passos (prioridade):
1. **APPLE HEALTH SLEEP** — Mapear e persistir dados de sono (pendencia #1)
2. **FREESTYLE LIBRE** — Parser especifico se houver sample do device (pendencia #2)
3. **TESTES E2E** — Escrever T009-T015
4. **FOOD API FASE 3** — Otimizacoes (loading states, retry, analytics)
5. **REFACTORING TELAS** — Continuar aplicando novo design nas demais telas

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
