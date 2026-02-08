# FIT TRACK — PROMPT PARA CLAUDE CODE

> **Use este prompt no Claude Code para migrar o design do Fit Track.**
> Cole este prompt junto com os documentos DESIGN_SYSTEM.md e COMPONENTS.md.

---

## PROMPT PRINCIPAL

```markdown
# Contexto

Você é um desenvolvedor frontend especializado em React/Next.js e Tailwind CSS. Sua tarefa é implementar o novo design system do aplicativo Fit Track.

## Documentação de Referência

Você tem acesso a dois documentos essenciais:
1. `DESIGN_SYSTEM.md` — Tokens de cor, tipografia, espaçamento, bordas, sombras e padrões visuais
2. `COMPONENTS.md` — Catálogo completo de componentes com código HTML/Tailwind

## Regras de Implementação

### Cores (CRÍTICO)
- Primary: `#eb6028` (laranja)
- Background: `#211511` (marrom escuro)
- Surface cards: `#403d39`, `#2f221d`, `#2a2624`
- Bordas: `#54423b`
- Texto secundário: `#b9a59d`
- NUNCA use cores genéricas do Tailwind (gray-500, slate-700, etc.) para elementos principais
- Use as cores customizadas definidas no tailwind.config

### Tipografia
- Font única: Inter (Google Fonts)
- Sempre aplicar `antialiased` no body
- Títulos: `font-bold tracking-tight`
- Labels: `text-xs font-medium uppercase tracking-wider`
- Corpo: `leading-relaxed`

### Espaçamento
- Container: `max-w-md mx-auto`
- Padding tela: `px-4`
- Gap seções: `gap-5` ou `gap-6`
- Padding cards: `p-4` a `p-6`
- Bottom nav clearance: `pb-24` no conteúdo

### Border Radius
- Cards: `rounded-xl` ou `rounded-2xl`
- Inputs: `rounded-lg`
- Botões grandes: `rounded-xl` ou `rounded-2xl`
- Pills/badges: `rounded-full`

### Sombras
- Cards em dark mode: geralmente sem shadow ou `shadow-sm`
- Botões primary: `shadow-lg shadow-primary/30`
- FAB: `shadow-xl shadow-primary/30`

### Ícones
- Usar Material Symbols Outlined
- Tamanhos: `text-[24px]` (nav), `text-[20px]` (cards), `text-[18px]` (inline)
- Para ícones preenchidos (active): adicionar classe `fill-1`

### Transições
- Sempre adicionar transições em elementos interativos
- Padrão: `transition-colors` ou `transition-all duration-200`
- Press effect: `active:scale-95` ou `active:scale-[0.98]`

### Dark Mode
- O app é dark-first
- Sempre usar `<html class="dark">`
- Padrão de classes: `bg-white dark:bg-surface-dark`

## Processo de Migração

Para cada tela, siga esta ordem:

1. **Ler a estrutura atual** do componente/página
2. **Identificar os componentes** correspondentes no COMPONENTS.md
3. **Aplicar os tokens** do DESIGN_SYSTEM.md
4. **Preservar a lógica** existente (state, handlers, etc.)
5. **Testar visualmente** comparando com o design de referência

## Padrão de Resposta

Para cada tarefa, apresente:

### Tarefa: [Nome]
**Descrição:** O que será feito
**Arquivos afetados:** Lista de arquivos
**Mudanças principais:**
- Item 1
- Item 2

**Aguardando aprovação para executar.**

---

Após aprovação, execute e mostre o código modificado.
```

---

## PROMPTS POR TELA

### Migrar Tela: Chat

```markdown
## Tarefa: Migrar tela de Chat

Migrar a tela de Chat para o novo design system.

### Componentes a implementar:
- Header com título "Fit Track" + ícone settings
- ChatBubbleAI (mensagens da IA, alinhadas à esquerda)
- ChatBubbleUser (mensagens do usuário, alinhadas à direita, fundo laranja)
- DateSeparator (pill "Hoje" centralizada)
- ActionChips (scroll horizontal de sugestões)
- ChatInput (input + botão mic laranja)

### Referências:
- Ver COMPONENTS.md seções: 1.1 Header, 6.1 ChatBubbleAI, 6.2 ChatBubbleUser, 3.1 ChatInput, 3.2 ActionChip

### Estrutura:
```
<main> flex flex-col h-screen
├── Header (sticky top)
├── Chat messages (flex-1 overflow-y-auto)
│   ├── DateSeparator
│   ├── ChatBubbleAI
│   ├── ChatBubbleUser
│   └── ...
└── Input area (sticky bottom)
    ├── ActionChips (horizontal scroll)
    └── ChatInput
```

Aguardando aprovação para executar.
```

---

### Migrar Tela: Home

```markdown
## Tarefa: Migrar tela de Home

Migrar a tela Home (dashboard) para o novo design system.

### Componentes a implementar:
- Header com navegação de data (chevron left/right, "Hoje", data)
- StreakBadge (pill com fogo "5 dias seguidos")
- SummaryCard hero (ring chart de calorias + proteína + treino checkbox)
- InsightCard laranja (alerta de déficit)
- ChartCard peso (gráfico de linha semanal)
- StatCard água (mini card azul)
- StatCard sono (mini card roxo)
- FAB "Fit AI"
- BottomNav

### Referências:
- Ver COMPONENTS.md seções: 1.1 Header, 2.1 SummaryCard, 2.2 ChartCard, 2.3 StatCard, 2.4 InsightCard, 5.3 StreakBadge, 1.2 BottomNav, 1.3 FAB

### Layout:
```
<main> flex flex-col min-h-screen
├── Header (sticky, navegação data)
├── Content (flex-1 px-4 pb-24)
│   ├── StreakBadge (centralizado)
│   ├── SummaryCard (hero)
│   ├── InsightCard (alerta)
│   ├── ChartCard (peso)
│   └── Grid 2 cols
│       ├── StatCard água
│       └── StatCard sono
├── FAB (fixed bottom-right)
└── BottomNav (fixed bottom)
```

Aguardando aprovação para executar.
```

---

### Migrar Tela: Importar

```markdown
## Tarefa: Migrar tela de Importar

Migrar a tela de Importar Dados para o novo design system.

### Componentes a implementar:
- HeaderSimple (back + "Importar Dados")
- Dropzone (área de upload com ícone, texto e botão)
- Section header ("Histórico Recente" + "Limpar tudo")
- FileHistoryItem (3 itens com status diferentes)
- StatusBadge (sucesso/erro/processando)
- Help link no footer

### Referências:
- Ver COMPONENTS.md seções: 1.1 Header (variante simples), 3.7 Dropzone, 2.7 FileHistoryItem, 5.1 StatusBadge

### Layout:
```
<main> flex flex-col min-h-screen
├── Header (sticky)
├── Content (flex-1)
│   ├── Dropzone section (p-6)
│   ├── Section header
│   ├── FileHistoryItem list (gap-3)
│   └── Help link (footer)
```

Aguardando aprovação para executar.
```

---

### Migrar Tela: Insights

```markdown
## Tarefa: Migrar tela de Insights

Migrar a tela de Insights para o novo design system.

### Componentes a implementar:
- HeaderWithAction (back + "Insights" + botão "AI Chat")
- SegmentedControl (7 dias / 14 dias / 30 dias)
- ChartCard peso (com TrendBadge verde)
- InsightAlert warning (proteína)
- ChartCard calorias (bar chart)
- InsightAlert success (hidratação)
- BottomNavWithFAB

### Referências:
- Ver COMPONENTS.md seções: 1.1 Header (variante com ação), 3.6 SegmentedControl, 2.2 ChartCard, 2.5 InsightAlert, 7.3 LineChart, 1.2 BottomNav (variante com FAB)

### Layout:
```
<main> flex flex-col min-h-screen
├── Header (sticky)
│   ├── Nav row
│   └── SegmentedControl
├── Content (flex-1 px-4 pb-24)
│   ├── ChartCard peso
│   ├── InsightAlert warning
│   ├── ChartCard calorias (bar)
│   └── InsightAlert success
└── BottomNavWithFAB (fixed)
```

Aguardando aprovação para executar.
```

---

### Migrar Tela: Profile

```markdown
## Tarefa: Migrar tela de Profile

Migrar a tela de Perfil para o novo design system.

### Componentes a implementar:
- HeaderSimple (back + "Meu Perfil")
- ProfileHeader (avatar grande com botão edit)
- SectionCard "Dados Pessoais" (nome readonly, email)
- SectionCard "Dados Físicos" (altura, peso, idade em grid)
- SectionCard "Preferências" (3 ToggleItems)
- DangerButton (Reprocessar)
- BottomNavWithFAB

### Referências:
- Ver COMPONENTS.md seções: 1.1 Header, 9.1 ProfileHeader, 2.6 SectionCard, 3.3 FormField, 3.5 ToggleItem, 4.4 DangerButton

### Layout:
```
<main> flex flex-col min-h-screen
├── Header (sticky)
├── Content (flex-1 px-4 pb-24 space-y-6)
│   ├── ProfileHeader
│   ├── SectionCard Dados Pessoais
│   ├── SectionCard Dados Físicos
│   ├── SectionCard Preferências
│   └── DangerButton + helper text
└── BottomNavWithFAB (fixed)
```

Aguardando aprovação para executar.
```

---

### Migrar Tela: Onboarding

```markdown
## Tarefa: Migrar fluxo de Onboarding (5 telas)

Migrar as 5 telas de onboarding para o novo design system.

### Telas:
1. **Welcome** — Hero image + título + botões social login
2. **Feature 1** — Dados sem ruído (ícone dns)
3. **Feature 2** — Progresso (ilustração chart animado)
4. **Feature 3** — AI Coach (ícone smart_toy com badge)
5. **Perfil Básico** — Formulário de cadastro

### Componentes a implementar:
- WelcomeHero (imagem + gradiente + card sobreposto)
- SocialLoginButton (Apple preto, Google branco)
- FeatureIcon (ícone grande com glow)
- StepIndicator (dots com ativo = pill ou ring)
- PrimaryButton (laranja com seta)
- SecondaryButton (ghost "Pular"/"Voltar")
- FormField, FormSelect, FormDate, FormGrid

### Referências:
- Ver COMPONENTS.md seções: 8.1 StepIndicator, 8.2 FeatureIcon, 8.3 WelcomeHero, 4.1 PrimaryButton, 4.2 SecondaryButton, 4.3 SocialButton, 3.3 FormField, 3.4 FormSelect

### Layout padrão Feature Tour:
```
<main> flex flex-col min-h-screen p-8
├── Spacer
├── StepIndicator
├── Content (flex-1 centered)
│   ├── FeatureIcon
│   ├── Title (text-3xl bold)
│   └── Description (text-secondary)
└── Footer
    ├── PrimaryButton
    └── SecondaryButton
```

Aguardando aprovação para executar.
```

---

## PROMPT DE SETUP INICIAL

Use este prompt primeiro para configurar o projeto:

```markdown
## Tarefa: Setup do Design System no Projeto

Antes de migrar as telas, precisamos configurar o design system no projeto.

### Passos:

1. **Atualizar tailwind.config.ts** com os novos tokens de cor e fonte
2. **Atualizar globals.css** com variáveis CSS customizadas
3. **Adicionar fontes no layout.tsx** (Inter do Google Fonts + Material Symbols)
4. **Criar arquivo de estilos utilitários** se necessário

### Código do tailwind.config.ts:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#eb6028",
        "background-light": "#f8f6f6",
        "background-dark": "#211511",
        "surface-dark": "#403d39",
        "surface-card": "#2f221d",
        "surface-input": "#2a2624",
        "surface-elevated": "#2d201c",
        "border-subtle": "#54423b",
        "text-floral": "#fffcf2",
        "text-secondary": "#b9a59d",
        "icon-bg": "#392d28",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      boxShadow: {
        primary: "0 10px 15px -3px rgba(235, 96, 40, 0.2)",
        "primary-lg": "0 20px 25px -5px rgba(235, 96, 40, 0.3)",
        glow: "0 0 20px rgba(235, 96, 40, 0.4)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
```

### Fontes no layout.tsx:

```tsx
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// No head:
<link 
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
  rel="stylesheet"
/>

// No body:
<body className={`${inter.className} bg-background-dark text-white antialiased`}>
```

Aguardando aprovação para executar.
```

---

## CHECKLIST DE MIGRAÇÃO

Use este checklist para acompanhar o progresso:

```markdown
## Progresso da Migração

### Setup
- [ ] tailwind.config.ts atualizado
- [ ] globals.css atualizado
- [ ] Fontes configuradas
- [ ] Dark mode configurado

### Componentes Base
- [ ] Header (3 variantes)
- [ ] BottomNav (2 variantes)
- [ ] FAB
- [ ] Buttons (Primary, Secondary, Social, Danger, Icon)

### Cards
- [ ] SummaryCard
- [ ] ChartCard
- [ ] StatCard
- [ ] InsightCard
- [ ] InsightAlert
- [ ] SectionCard
- [ ] FileHistoryItem

### Inputs
- [ ] ChatInput
- [ ] ActionChip
- [ ] FormField
- [ ] FormSelect
- [ ] ToggleItem
- [ ] SegmentedControl
- [ ] Dropzone

### Feedback
- [ ] StatusBadge
- [ ] TrendBadge
- [ ] StreakBadge
- [ ] DateSeparator

### Chat
- [ ] ChatBubbleAI
- [ ] ChatBubbleUser

### Gráficos
- [ ] RingChart
- [ ] ProgressBar
- [ ] LineChart
- [ ] BarChart

### Onboarding
- [ ] StepIndicator
- [ ] FeatureIcon
- [ ] WelcomeHero
- [ ] ProfileHeader

### Telas Completas
- [ ] Chat
- [ ] Home
- [ ] Importar
- [ ] Insights
- [ ] Profile
- [ ] Onboarding (5 telas)
```

---

## DICAS IMPORTANTES

1. **Sempre verifique os tokens** — Não use cores arbitrárias, sempre consulte DESIGN_SYSTEM.md

2. **Componentes são modulares** — Extraia componentes reutilizáveis (Button, Card, Input, etc.)

3. **Mantenha a lógica** — Ao migrar, preserve hooks, handlers e state existentes

4. **Teste em dark mode** — O app é dark-first, sempre teste com `class="dark"` no html

5. **Mobile first** — O design é para mobile, use `max-w-md mx-auto` como container

6. **Safe areas** — Não esqueça padding bottom para evitar overlap com BottomNav

7. **Transições** — Todos os elementos interativos devem ter transições suaves
