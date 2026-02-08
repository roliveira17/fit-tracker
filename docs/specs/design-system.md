# FIT TRACK — DESIGN SYSTEM

> **Documento de referência visual do Fit Track.**
> Extraído de 10 telas de referência. Use como fonte única de verdade para implementação.

---

## 1. TOKENS DE COR

### 1.1 Core Palette

```css
:root {
  /* Primary */
  --color-primary: #eb6028;
  --color-primary-hover: #d4562e;
  --color-primary-10: rgba(235, 96, 40, 0.1);
  --color-primary-20: rgba(235, 96, 40, 0.2);
  --color-primary-30: rgba(235, 96, 40, 0.3);
  
  /* Background */
  --color-background-dark: #211511;
  --color-background-light: #f8f6f6;
  
  /* Surfaces */
  --color-surface-dark: #403d39;
  --color-surface-card: #2f221d;
  --color-surface-input: #2a2624;
  --color-surface-elevated: #2d201c;
  
  /* Borders */
  --color-border-subtle: #54423b;
  --color-border-muted: rgba(255, 255, 255, 0.05);
  --color-border-input: #54423b;
  
  /* Text */
  --color-text-primary: #ffffff;
  --color-text-floral: #fffcf2;
  --color-text-secondary: #b9a59d;
  --color-text-muted: rgba(255, 255, 255, 0.4);
  --color-text-disabled: rgba(255, 255, 255, 0.2);
  
  /* Icon Containers */
  --color-icon-bg: #392d28;
  --color-icon-bg-hover: rgba(235, 96, 40, 0.1);
}
```

### 1.2 Semantic Colors

```css
:root {
  /* Success */
  --color-success: #22c55e;
  --color-success-bg: rgba(34, 197, 94, 0.1);
  --color-success-border: rgba(34, 197, 94, 0.2);
  
  /* Error */
  --color-error: #ef4444;
  --color-error-bg: rgba(239, 68, 68, 0.1);
  --color-error-border: rgba(239, 68, 68, 0.2);
  
  /* Warning */
  --color-warning: #eab308;
  --color-warning-bg: rgba(234, 179, 8, 0.1);
  --color-warning-border: rgba(234, 179, 8, 0.2);
  
  /* Info */
  --color-info-water: #60a5fa;
  --color-info-sleep: #c084fc;
  --color-info-water-bg: rgba(96, 165, 250, 0.1);
  --color-info-sleep-bg: rgba(192, 132, 252, 0.1);
}
```

### 1.3 Tailwind Config

```javascript
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary
        "primary": "#eb6028",
        
        // Backgrounds
        "background-light": "#f8f6f6",
        "background-dark": "#211511",
        
        // Surfaces
        "surface-dark": "#403d39",
        "surface-card": "#2f221d",
        "surface-input": "#2a2624",
        "surface-elevated": "#2d201c",
        
        // Borders
        "border-subtle": "#54423b",
        
        // Text
        "text-floral": "#fffcf2",
        "text-secondary": "#b9a59d",
        
        // Icon
        "icon-bg": "#392d28",
        
        // Semantic
        "success": "#22c55e",
        "error": "#ef4444",
        "warning": "#eab308",
      },
    },
  },
}
```

---

## 2. TIPOGRAFIA

### 2.1 Font Family

```css
font-family: "Inter", sans-serif;
```

**Carga do Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### 2.2 Type Scale

| Token | Size | Weight | Line Height | Tracking | Uso |
|-------|------|--------|-------------|----------|-----|
| `display-lg` | 3xl (30px) | 700 | tight | tight | Títulos hero onboarding |
| `display-md` | 2xl (24px) | 700 | tight | tight | Títulos de seção |
| `title-lg` | lg (18px) | 700 | tight | tight | Títulos de tela (header) |
| `title-md` | base (16px) | 700 | normal | normal | Títulos de card |
| `value-xl` | 3xl (30px) | 700 | tight | tight | Valores numéricos grandes |
| `value-lg` | xl (20px) | 700 | normal | normal | Valores numéricos médios |
| `value-md` | lg (18px) | 700 | normal | normal | Valores numéricos pequenos |
| `body-lg` | base (16px) | 400 | relaxed | normal | Corpo de texto principal |
| `body-md` | sm (14px) | 400/500 | relaxed | normal | Corpo de texto secundário |
| `body-sm` | [15px] | 400 | relaxed | normal | Mensagens de chat |
| `label` | xs (12px) | 500 | normal | wider + uppercase | Labels de formulário |
| `caption` | [10px] | 500 | normal | normal | Legendas, nav labels |

### 2.3 Classes Tailwind

```html
<!-- Display -->
<h1 class="text-3xl font-bold tracking-tight">Display Large</h1>
<h2 class="text-2xl font-bold tracking-tight">Display Medium</h2>

<!-- Titles -->
<h3 class="text-lg font-bold tracking-tight">Title Large</h3>
<h4 class="text-base font-bold">Title Medium</h4>

<!-- Values -->
<span class="text-3xl font-bold tracking-tight">1850</span>
<span class="text-xl font-bold">78.5</span>

<!-- Body -->
<p class="text-base leading-relaxed">Body Large</p>
<p class="text-sm leading-relaxed">Body Medium</p>
<p class="text-[15px] leading-relaxed">Chat Message</p>

<!-- Label -->
<label class="text-xs font-medium uppercase tracking-wider">Label</label>

<!-- Caption -->
<span class="text-[10px] font-medium">Caption</span>
```

---

## 3. ESPAÇAMENTO

### 3.1 Spacing Scale

| Token | Value | Uso |
|-------|-------|-----|
| `space-1` | 4px | Gaps mínimos |
| `space-2` | 8px | Padding interno pequeno |
| `space-3` | 12px | Gap entre elementos inline |
| `space-4` | 16px | Padding padrão, gap cards |
| `space-5` | 20px | Padding card médio |
| `space-6` | 24px | Gap entre seções |
| `space-8` | 32px | Padding tela horizontal |
| `space-10` | 40px | Margem grande |
| `space-12` | 48px | Padding top com safe area |

### 3.2 Layout Patterns

```html
<!-- Screen Container -->
<main class="px-4 pb-24 pt-2">

<!-- Section Gap -->
<div class="flex flex-col gap-5">
<!-- ou -->
<div class="flex flex-col gap-6">

<!-- Card Padding -->
<div class="p-4">  <!-- Compact -->
<div class="p-5">  <!-- Default -->
<div class="p-6">  <!-- Spacious -->

<!-- Internal Card Gap -->
<div class="flex flex-col gap-3">
<div class="flex flex-col gap-4">
```

---

## 4. BORDER RADIUS

| Token | Value | Uso |
|-------|-------|-----|
| `rounded-sm` | 4px | Badges pequenos |
| `rounded` | 8px | Inputs, botões pequenos |
| `rounded-lg` | 12px | Cards compactos, dropdowns |
| `rounded-xl` | 16px | Cards padrão |
| `rounded-2xl` | 24px | Cards hero, modais |
| `rounded-3xl` | 32px | Cards onboarding, overlays |
| `rounded-full` | 9999px | Avatares, pills, FABs |

### Uso por Componente

```html
<!-- Buttons -->
<button class="rounded-xl">Default Button</button>
<button class="rounded-2xl">Large Button</button>
<button class="rounded-full">FAB / Pill</button>

<!-- Cards -->
<div class="rounded-xl">Standard Card</div>
<div class="rounded-2xl">Hero Card</div>
<div class="rounded-3xl">Onboarding Card</div>

<!-- Inputs -->
<input class="rounded-lg">
<input class="rounded">  <!-- Compacto -->

<!-- Pills & Badges -->
<span class="rounded-full">Badge</span>
```

---

## 5. SOMBRAS

```javascript
boxShadow: {
  // Padrão Tailwind estendido
  'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  
  // Custom - Primary Glow
  'primary': '0 10px 15px -3px rgba(235, 96, 40, 0.2)',
  'primary-lg': '0 20px 25px -5px rgba(235, 96, 40, 0.3)',
  'glow': '0 0 20px rgba(235, 96, 40, 0.4)',
}
```

### Uso

```html
<!-- Cards em dark mode geralmente não usam shadow -->
<div class="shadow-sm dark:shadow-none">

<!-- Botões primários -->
<button class="shadow-lg shadow-primary/20">
<button class="shadow-lg shadow-primary/30">

<!-- FAB -->
<button class="shadow-xl shadow-primary/30">

<!-- Glow effect (onboarding) -->
<div class="shadow-glow">
```

---

## 6. ÍCONES

### 6.1 Material Symbols

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
```

### 6.2 Tamanhos

| Context | Size Class | Pixel |
|---------|------------|-------|
| Navigation | `text-[24px]` | 24px |
| Card icon | `text-[20px]` | 20px |
| Inline | `text-[18px]` | 18px |
| Small | `text-[16px]` | 16px |
| Caption | `text-[14px]` | 14px |
| Hero (onboarding) | `text-6xl` | 60px |

### 6.3 Filled vs Outlined

```html
<!-- Outlined (default) -->
<span class="material-symbols-outlined">home</span>

<!-- Filled (active state) -->
<span class="material-symbols-outlined fill-1">home</span>

<!-- CSS para filled -->
<style>
.fill-1 {
  font-variation-settings: 'FILL' 1;
}
</style>
```

### 6.4 Ícones Usados

| Ícone | Uso |
|-------|-----|
| `arrow_back` / `arrow_back_ios_new` | Voltar |
| `chevron_left` / `chevron_right` | Navegação data |
| `settings` | Configurações |
| `home` | Tab Home |
| `chat_bubble` / `forum` | Tab Chat |
| `bar_chart` / `insights` | Tab Insights |
| `restaurant` | Tab Diário |
| `person` | Tab Perfil |
| `add` | FAB adicionar |
| `mic` | Input voz |
| `send` | Enviar mensagem |
| `local_fire_department` | Streak |
| `fitness_center` | Treino |
| `water_drop` | Hidratação |
| `bedtime` | Sono |
| `egg_alt` | Proteína |
| `bolt` | Energia/Alerta |
| `warning` | Aviso |
| `check_circle` | Sucesso |
| `cloud_upload` | Upload |
| `folder_zip` / `description` | Arquivos |
| `smart_toy` | AI |
| `edit` | Editar |
| `lock` | Campo bloqueado |
| `expand_more` | Dropdown |
| `more_horiz` | Menu opções |
| `trending_down` / `trending_up` | Tendências |

---

## 7. ANIMAÇÕES E TRANSIÇÕES

### 7.1 Transições Padrão

```html
<!-- Cores -->
<div class="transition-colors duration-200">

<!-- Todas as propriedades -->
<div class="transition-all duration-200">

<!-- Transform -->
<div class="transition-transform duration-200">
```

### 7.2 Interações

```html
<!-- Hover em cards -->
<div class="hover:border-primary/30 transition-colors">

<!-- Press/Active -->
<button class="active:scale-95 transition-transform">
<button class="active:scale-[0.98] transition-all">

<!-- Hover scale -->
<button class="hover:scale-105 transition-transform">
```

### 7.3 Animações Keyframe

```css
/* Pulse para status "processando" */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse { animation: pulse 2s infinite; }

/* Bounce para ícones de destaque */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.animate-bounce { animation: bounce 1s infinite; }

/* Chart bars rising */
@keyframes chartRise {
  0% { height: 0; opacity: 0; }
  100% { height: var(--h); opacity: 1; }
}

/* Border pulse (dropzone) */
@keyframes pulse-border {
  0% { border-color: rgba(235, 96, 40, 0.3); }
  50% { border-color: rgba(235, 96, 40, 0.8); }
  100% { border-color: rgba(235, 96, 40, 0.3); }
}
```

---

## 8. EFEITOS ESPECIAIS

### 8.1 Glassmorphism (Headers)

```html
<header class="bg-background-dark/80 backdrop-blur-md">
<header class="bg-background-dark/95 backdrop-blur-md">
```

### 8.2 Glow Effects

```html
<!-- Icon glow -->
<span class="drop-shadow-[0_0_8px_rgba(235,96,40,0.6)]">

<!-- Element glow -->
<div class="shadow-glow">  <!-- 0 0 20px rgba(235,96,40,0.4) -->

<!-- Background blur decoration -->
<div class="absolute bg-primary/20 blur-3xl rounded-full">
```

### 8.3 Gradients

```html
<!-- Hero image fade -->
<div class="bg-gradient-to-b from-transparent via-background-dark/60 to-background-dark">

<!-- Decorative top gradient -->
<div class="bg-gradient-to-b from-primary/5 to-transparent">

<!-- Chart gradient fill -->
<linearGradient id="chartGradient">
  <stop offset="0%" stop-color="#eb6028" stop-opacity="0.2"/>
  <stop offset="100%" stop-color="#eb6028" stop-opacity="0"/>
</linearGradient>
```

---

## 9. BREAKPOINTS

O app é **mobile-first** com max-width container:

```html
<div class="max-w-md mx-auto">  <!-- 448px max -->
```

| Breakpoint | Width | Uso |
|------------|-------|-----|
| Default | < 448px | Mobile (principal) |
| `sm:` | ≥ 640px | Ajustes tablet |
| `md:` | ≥ 768px | Tablet landscape |

---

## 10. DARK MODE

O app é **dark-first**. Light mode é secundário.

### Forçar Dark Mode

```html
<html class="dark">
```

### Padrão de Classes

```html
<!-- Background -->
<div class="bg-white dark:bg-surface-dark">

<!-- Text -->
<p class="text-gray-900 dark:text-white">
<p class="text-gray-600 dark:text-text-secondary">

<!-- Border -->
<div class="border-gray-200 dark:border-white/5">
<div class="border-gray-300 dark:border-border-subtle">

<!-- Shadow (remove em dark) -->
<div class="shadow-sm dark:shadow-none">
```

---

## 11. CHECKLIST DE IMPLEMENTAÇÃO

Ao criar qualquer tela, verifique:

- [ ] Usar `font-display` (Inter) como font-family
- [ ] Aplicar `antialiased` no body
- [ ] Usar `selection:bg-primary selection:text-white`
- [ ] Container com `max-w-md mx-auto`
- [ ] Background `bg-background-dark`
- [ ] Cores de texto: `text-white` ou `text-text-secondary`
- [ ] Cards com `bg-surface-dark` ou `bg-surface-card`
- [ ] Inputs com `bg-surface-input border-border-subtle`
- [ ] Botões primários com `shadow-lg shadow-primary/30`
- [ ] Transições em elementos interativos
- [ ] Ícones Material Symbols carregados
- [ ] Safe area para bottom nav (`pb-24` no conteúdo)
