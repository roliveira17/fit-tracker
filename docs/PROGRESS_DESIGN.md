# FIT TRACK — MIGRAÇÃO DE DESIGN

> **Tracking de progresso da migração para o novo design system.**
> Atualizado automaticamente após cada etapa.

---

## Status Geral

| Fase | Status | Progresso |
|------|--------|-----------|
| Setup | Concluído | 4/4 |
| Componentes Base | Concluído | 12/12 |
| Telas | Em progresso | 8/10 |

**Última atualização:** _18/01/2026_

---

## FASE 1: SETUP

### 1.1 Configuração do Tailwind
- [x] Atualizar `tailwind.config.ts` com tokens de cor
- [x] Adicionar fontFamily (Inter)
- [x] Adicionar boxShadow customizado (primary, glow)
- [x] Verificar plugins (@tailwindcss/forms)

### 1.2 Configuração de Estilos Globais
- [x] Atualizar `globals.css` com variáveis CSS
- [x] Adicionar estilos utilitários (hide-scrollbar, fill-1)

### 1.3 Configuração de Fontes
- [x] Adicionar Google Fonts (Inter) no layout
- [x] Adicionar Material Symbols Outlined
- [x] Aplicar `antialiased` no body

### 1.4 Configuração Dark Mode
- [x] Garantir `class="dark"` no html
- [x] Verificar `darkMode: "class"` no tailwind config

---

## FASE 2: COMPONENTES BASE

### 2.1 Layout & Navegação
- [x] Header (3 variantes)
- [x] BottomNav (2 variantes)
- [x] FAB

### 2.2 Botões
- [x] PrimaryButton
- [x] SecondaryButton
- [x] SocialButton (Apple, Google)
- [x] DangerButton
- [x] IconButton

### 2.3 Inputs
- [x] FormField
- [x] FormSelect
- [x] FormReadonly
- [x] ToggleItem
- [x] ChatInput
- [x] ActionChip
- [x] SegmentedControl
- [x] Dropzone

### 2.4 Cards
- [x] SummaryCard + RingChart
- [x] ChartCard + TrendBadge
- [x] StatCard
- [x] InsightCard
- [x] InsightAlert
- [x] SectionCard
- [x] FileHistoryItem

### 2.5 Feedback
- [x] StatusBadge
- [x] TrendBadge (já em ChartCard)
- [x] StreakBadge
- [x] DateSeparator

### 2.6 Chat
- [x] ChatBubbleAI
- [x] ChatBubbleUser

### 2.7 Gráficos
- [x] RingChart
- [x] ProgressBar
- [x] LineChart
- [x] BarChart

### 2.8 Onboarding
- [x] StepIndicator
- [x] FeatureIcon
- [x] WelcomeHero
- [x] ProfileHeader

---

## FASE 3: TELAS

### 3.1 Onboarding
- [x] Tela 1: Welcome (login)
- [x] Tela 2: Feature - Dados
- [x] Tela 3: Feature - Progresso
- [x] Tela 4: Feature - AI Coach
- [x] Tela 5: Perfil Básico

### 3.2 App Principal
- [x] Chat
- [x] Home
- [x] Importar
- [ ] Insights
- [ ] Profile

---

## Histórico de Sessões

### Sessão 1 — [DATA]
**Tarefas concluídas:**
- _Nenhuma ainda_

**Próximos passos:**
- Iniciar Fase 1: Setup

**Observações:**
- _Nenhuma_

---

## Decisões Técnicas

| Decisão | Justificativa | Data |
|---------|---------------|------|
| _Nenhuma ainda_ | | |

---

## Problemas Conhecidos

| Problema | Status | Solução |
|----------|--------|---------|
| _Nenhum ainda_ | | |
