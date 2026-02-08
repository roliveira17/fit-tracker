# Progresso do Fit Track

> **Histórico detalhado** — status consolidado em [`docs/PENDENCIAS.md`](../PENDENCIAS.md).

> Arquivo de controle para rastrear o progresso da implementação.

---

## Status Atual

| Campo | Valor |
|-------|-------|
| **Feature em andamento** | — |
| **Status** | TODAS FEATURES CONCLUÍDAS |
| **Última atualização** | 2026-01-17 |

---

## Onboarding (10_onboarding.md)

### Componentes necessários
- [x] `ScreenContainer` (layout) ✅
- [x] `Header` (layout) ✅
- [x] Botões de login social (Apple, Google) ✅
- [x] Botão secundário (modo local) ✅
- [x] Carousel/Stepper para Feature Tour ✅
- [x] Form de Perfil Básico ✅
- [x] Validações de campos ✅

### Lógica
- [ ] ~~Integração Apple Sign-In~~ (fora do escopo v1)
- [ ] ~~Integração Google Sign-In~~ (fora do escopo v1)
- [x] Criação de perfil local ✅
- [x] Cálculo de BMR no submit do perfil ✅
- [x] Persistência de `isOnboardingComplete` ✅
- [x] Navegação para Chat após conclusão ✅

### Estados
- [ ] ~~Loading states para login~~ (fora do escopo v1)
- [ ] ~~Tratamento de erro de autenticação~~ (fora do escopo v1)
- [x] Feedback visual de validação ✅

**Status:** CONCLUÍDO (v1 - modo local)

---

## Chat (20_chat.md)

**Status:** CONCLUÍDO (v1 - sem áudio)

### Componentes
- [x] Tela básica de chat ✅
- [x] `MessageBubble` ✅
- [x] `TypingIndicator` ✅
- [x] `ChipGroup` (sugestões rápidas) ✅
- [x] `Toast` (feedback de registro) ✅

### Lógica
- [x] Integração OpenAI API ✅
- [x] Persistência de mensagens ✅
- [x] Classificador de tipo de mensagem ✅
- [x] Parser de alimentação ✅
- [x] Parser de exercício ✅
- [x] Parser de peso/BF ✅
- [x] Lógica de registro (entidades) ✅

### Áudio (v2)
- [ ] ~~Captura de áudio~~ (adiado para v2)
- [ ] ~~Integração com transcription API~~ (adiado para v2)

---

## Importação (30_importacao.md)

**Status:** CONCLUÍDO (v1 - Hevy CSV)

### Componentes
- [x] Página Import com FileDropzone ✅
- [x] Parser CSV (Hevy) ✅
- [x] Feedback de importação (sucesso/erro) ✅
- [x] Histórico de importações ✅

### Lógica
- [x] Parsing de CSV Hevy → workouts ✅
- [x] Detecção de duplicatas ✅
- [x] Persistência de histórico ✅

### Fora do escopo v1
- [ ] Apple Health (ZIP/XML)

---

## Home (40_home.md)

**Status:** CONCLUÍDO

### Componentes
- [x] `SummaryCard` (4 métricas principais) ✅
- [x] `InsightCard` (headline + copy) ✅
- [x] `MiniChart` (peso 7 dias) ✅
- [x] `ProgressCard` (streak) ✅
- [x] `EmptyState` (checklist inicial) ✅

### Lógica
- [x] Página Home básica com navegação temporal ✅
- [x] Fetch de dados do dia (meals, workouts) ✅
- [x] Cálculo de déficit/superávit ✅
- [x] Fetch de peso/BF últimos 7 dias ✅
- [x] Cálculo de streak ✅

### Zero Data Experience
- [x] Detecção de hasMinimumData ✅
- [x] Checklist guiado ✅

---

## Insights (50_insights.md)

**Status:** CONCLUÍDO

### Componentes
- [x] Página Insights básica ✅
- [x] Toggle de período (7/14/30 dias) ✅
- [x] LineChart (peso) ✅
- [x] BarChart (calorias, proteína) ✅
- [x] StatCard (métricas resumidas) ✅
- [x] InsightText (observações textuais) ✅

### Lógica
- [x] Agregação de dados por período ✅
- [x] Cálculo de médias e tendências ✅
- [x] Geração de insights automáticos ✅

---

## Profile (60_profile.md)

**Status:** CONCLUÍDO

### Componentes
- [x] Página Profile básica ✅
- [x] Seção Perfil (form editável) ✅
- [x] Seção Preferências (unidades + timezone) ✅
- [x] Seção Privacidade ✅
- [x] Seção Avançado (limpar dados) ✅

### Lógica
- [x] Edição de perfil com recálculo de BMR ✅
- [x] Validações de campos ✅
- [x] Feedback de sucesso/erro (Toast) ✅
- [x] Limpeza de dados (modal de confirmação) ✅
- [x] Reset total do app ✅

---

## Navegação (global)

**Status:** CONCLUÍDO

### Componentes
- [x] `BottomNav` (navegação inferior) ✅
- [x] Integração com `ScreenContainer` ✅

### Comportamento
- [x] 5 abas: Home, Chat, Insights, Importar, Perfil ✅
- [x] Destaque visual da aba ativa ✅
- [x] Escondido no onboarding ✅

---

## Histórico de Sessões

| Data | Feature | Tasks Completadas | Notas |
|------|---------|-------------------|-------|
| 2026-01-17 | Chat | Classificador, Parsers, Entidades de registro | Lógica completa de registro no localStorage |
| 2026-01-17 | Chat | ChipGroup, Persistência, Toast | Componentes + histórico + feedback visual |
| 2026-01-16 | Onboarding | ScreenContainer, Header, Boas-vindas, Feature Tour, Perfil, Persistência, Chat básico | Fluxo completo + redirecionamento |

---

## Decisões Técnicas

> Registre aqui decisões importantes tomadas durante a implementação.

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-01-16 | localStorage para persistência (v1) | Simplicidade, sem necessidade de backend |

---

## Problemas Conhecidos

> Registre bugs ou problemas para resolver depois.

| # | Descrição | Feature | Status |
|---|-----------|---------|--------|
| — | — | — | — |
