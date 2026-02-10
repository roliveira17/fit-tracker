# Fit Track — Pendencias e Progresso

> Arquivo unico de acompanhamento do projeto.
> Ultima atualizacao: 2026-02-08

---

## Resumo Geral

| Area | Status | Detalhe |
|------|--------|---------|
| Backend Supabase (M1-M8) | 100% (50/50) | Todos milestones completos |
| Frontend v1 (core) | 100% | Onboarding, Chat, Home, Insights, Profile, Import |
| Frontend v2 (extras) | 95% (59/62) | Audio, foto, Apple Health, auth, export, notificacoes |
| Food API | 70% (12/17) | Fases 1-2 completas, Fase 3 pendente |
| QA / Testes E2E | 100% (15/15) | Todos testes passando |
| Design System | 100% | 3 fases completas |
| Deploy | Ativo | https://fit-tracker-murex.vercel.app |

---

## Pendencias Ativas

### 1. Home Dashboard — carbs e fat zerados (ALTA)

**Arquivo:** `app/home/page.tsx:124-125`

```tsx
carbs: 0, // TODO: Adicionar ao RPC
fat: 0,   // TODO: Adicionar ao RPC
```

O RPC `get_home_summary()` retorna apenas `calories_in` e `protein`. Carbs e fat estao hardcoded como 0. O usuario ve dados incompletos de macros no dashboard.

**Correcao necessaria:**
- Atualizar a funcao SQL `get_home_summary()` no Supabase para retornar `total_carbs_g` e `total_fat_g`
- Atualizar `app/home/page.tsx` para usar os novos campos

---

### 2. Import Apple Health — sono nao importado (MEDIA)

**Arquivo:** `app/import/page.tsx:192`

```tsx
sleep: [] // TODO: mapear dados de sono
```

Os dados de sono sao parseados do Apple Health XML mas nao sao mapeados para o formato do Supabase. O array vai vazio para `importAppleHealth()`.

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

5 tasks pendentes de otimizacao:

- [x] Retry com exponential backoff (implementado em openfoodfacts.ts)
- [ ] Loading states durante scan de barcode
- [ ] Analytics de uso (cache hit rates, taxa de acerto)
- [ ] Testes E2E para barcode scanner
- [ ] Documentacao da API interna

---

### 5. v2 Features — 2 itens pendentes (BAIXA)

- [ ] Preview de dados antes de importar Apple Health
- [ ] Barra de progresso para importacao de arquivos grandes

---

### 6. Button legado — migrar para design system (BAIXA)

**Arquivo:** `components/ui/button.tsx:7-8`

```tsx
// TODO: Migrar todos os componentes para usar o novo
// design system e remover este arquivo
```

Arquivo de compatibilidade com shadcn/ui antigo. Pode ser removido quando todos os imports forem migrados para o novo design system.

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

### QA / Testes E2E

| Test | Descricao | Status |
|------|-----------|--------|
| T001 | Onboarding completo | Pass |
| T002 | Chat texto simples | Pass |
| T003 | Chat multiplos itens | Pass |
| T004 | Home dashboard | Pass |
| T005 | Insights graficos | Pass |
| T006 | Profile edicao | Pass |
| T007 | Navegacao tabs | Pass |
| T008 | Dark mode | Pass |
| T009 | Chat com audio | Skip (mic) |
| T010 | Chat com foto | Pass |
| T011 | Import Apple Health | Pass |
| T012 | Export dados | Skip (download) |
| T013 | Login Google | Skip (OAuth) |
| T014 | Notificacoes | Pass |
| T015 | Reset app | Pass |

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
