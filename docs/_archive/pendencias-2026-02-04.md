# Fit Track — Pendencias e Progresso

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
| Design System | 100% | 3 fases completas |
| Deploy | Ativo | https://fit-tracker-murex.vercel.app |

---

## Pendencias Ativas

### ~~1. Home Dashboard — carbs e fat zerados~~ ✅ RESOLVIDO

Corrigido via migration `20260201_001_fix_home_summary_macros.sql`. RPC `get_home_summary()` agora retorna `total_carbs_g` e `total_fat_g`.

---

### 2. Import Apple Health — sono nao importado (MEDIA)

**Arquivo:** `app/import/page.tsx:192`

```tsx
sleep: [] // TODO: mapear dados de sono
```

Os dados de sono sao parseados do Apple Health XML mas nao sao mapeados para o formato do Supabase. O array vai vazio para `importAppleHealth()`.

**Arquivo:** `app/import/page.tsx:223`

```tsx
sleepSessions: mappedData.sleepSessions.length, // TODO: salvar quando tivermos storage
```

Sleep sessions sao contadas na UI mas nao persistidas.

**Correcao necessaria:**
- Mapear `sleepSessions` para o formato esperado pelo RPC `import_apple_health()`
- Persistir no Supabase (tabela `sleep_sessions` + `sleep_stages` ja existem)

---

### 3. Parser FreeStyle Libre — fallback generico (MEDIA)

**Arquivo:** `lib/parsers/cgm.ts:298`

```tsx
case "freestyle":
  // TODO: Implementar parser específico do FreeStyle Libre
  result = parseGenericCGM(workbook);
```

O formato FreeStyle Libre eh detectado mas usa o parser generico, que pode falhar em colunas especificas desse dispositivo.

**Correcao necessaria:**
- Obter arquivo XLSX real de FreeStyle Libre para mapear colunas
- Implementar `parseFreeStyleCGM()` especifico

---

### 4. Food API — Fase 3 Otimizacoes (BAIXA)

**Fonte:** `docs/API/PROGRESS.md`

5 tasks pendentes de otimizacao:

- [ ] Loading states durante scan de barcode
- [ ] Retry com exponential backoff para Open Food Facts API
- [ ] Analytics de uso (cache hit rates, taxa de acerto)
- [ ] Testes E2E para barcode scanner
- [ ] Documentacao da API interna

---

### 5. Testes E2E — 7 testes nao escritos (BAIXA)

**Fonte:** `docs/qa/TEST_INDEX.md`

Funcionalidades prontas, testes automatizados pendentes:

| # | Teste | Prioridade |
|---|-------|------------|
| T009 | Chat com Audio | P2 |
| T010 | Chat com Foto | P2 |
| T011 | Importar Apple Health | P2 |
| T012 | Exportar Dados | P2 |
| T013 | Login Google | P3 |
| T014 | Notificacoes | P3 |
| T015 | Reset App | P3 |

Playwright ja esta configurado. Os 8 testes existentes (T001-T008) passam.

---

### 6. v2 Features — 3 itens pendentes (BAIXA)

**Fonte:** `docs/prd/v2/PROGRESS-v2.md`

- [ ] Preview de dados antes de importar Apple Health
- [ ] Barra de progresso para importacao de arquivos grandes
- [ ] 1 task de auth social pendente (detalhes no arquivo original)

---

### 7. Button legado — migrar para design system (BAIXA)

**Arquivo:** `components/ui/button.tsx:7-8`

```tsx
// TODO: Migrar todos os componentes para usar o novo
// design system e remover este arquivo
```

Arquivo de compatibilidade com shadcn/ui antigo. Pode ser removido quando todos os imports forem migrados para o novo design system.

---

## Historico Completo de Milestones

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

| Feature | Data |
|---------|------|
| Audio no Chat | 2026-01-19 |
| Apple Health Import | 2026-01-21 |
| Auth Social (Google) | 2026-01-21 |
| Chat com Foto | 2026-01-21 |
| Push Notifications | 2026-01-21 |
| Exportacao | 2026-01-21 |
| Refactoring Import → design "Calma" | 2026-02-04 |
| Glucose pipeline fix + chat AI | 2026-02-04 |

### Design System

| Fase | Data |
|------|------|
| Setup (Tailwind, fonts, dark mode) | 2026-01-19 |
| Base Components (12 sets) | 2026-01-19 |
| Screens (10 telas) | 2026-01-19 |

---

## Sessao 2026-02-04 — Onde Paramos

### Concluido nesta sessao:
- ✅ Refactoring completo da tela Import → design "Importar com Calma" (light theme cream/green)
- ✅ Extracao de logica de import para hook `hooks/useImportLogic.ts`
- ✅ 7 componentes novos em `components/import/calma/`
- ✅ Fix: Chat AI agora tem acesso a dados de glicemia (system prompt + context)
- ✅ Fix: Pipeline glucose import → Supabase (CHECK constraint + RPC + error handling)
- ✅ Fix: `getGlucoseStats` passando `p_user_id` corretamente
- ✅ Melhoria: Chat mostra media diaria de glicemia em vez de leituras minuto-a-minuto
- ✅ Migration SQL aplicada no Supabase: `20260207_001_fix_glucose_import.sql`

### Arquivos criados/modificados:
```
hooks/useImportLogic.ts              (NOVO - logica extraida do import)
components/import/calma/             (NOVO - 7 componentes do design calma)
app/import/page.tsx                  (reescrito - 763→153 linhas)
lib/ai.ts                            (glicemia no system prompt)
lib/supabase.ts                      (getGlucoseStats fix + contexto AI diario)
supabase/migrations/20260207_001_fix_glucose_import.sql (NOVO)
tailwind.config.ts                   (tokens calma + serif font)
app/layout.tsx                       (DM Serif Display font)
app/globals.css                      (animacoes calma)
```

### Proximos passos (prioridade):
1. **APPLE HEALTH SLEEP** — Mapear e persistir dados de sono (pendencia #2)
2. **FREESTYLE LIBRE** — Parser especifico se houver sample do device (pendencia #3)
3. **TESTES E2E** — Escrever T009-T015
4. **FOOD API FASE 3** — Otimizacoes (loading states, retry, analytics)
5. **REFACTORING TELAS** — Continuar aplicando novo design nas demais telas

---

## Ideias Futuras (pos-v3)

Nao sao pendencias — sao opcoes para evolucao futura:

1. **PWA / Mobile** — Service worker para offline real + manifest.json
2. **UX do Chat** — Historico persistente no Supabase, sugestoes inteligentes
3. **Integracao Strava** — OAuth + import automatico de corrida/ciclismo
4. **Push Notifications v2** — Lembretes para registrar refeicoes (v4 no PRD)
5. **Sync offline-first** — Resolver conflitos localStorage vs Supabase (v5 no PRD)

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
