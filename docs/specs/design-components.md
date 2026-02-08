# FIT TRACK — CATÁLOGO DE COMPONENTES

> **Referência de todos os componentes visuais do Fit Track.**
> Cada componente inclui estrutura HTML/Tailwind e variações.

---

## ÍNDICE

1. [Layout & Navegação](#1-layout--navegação)
2. [Cards](#2-cards)
3. [Inputs & Controles](#3-inputs--controles)
4. [Botões](#4-botões)
5. [Feedback & Status](#5-feedback--status)
6. [Chat](#6-chat)
7. [Gráficos](#7-gráficos)
8. [Onboarding](#8-onboarding)

---

## 1. LAYOUT & NAVEGAÇÃO

### 1.1 Header

**Variante: Com navegação de data**
```html
<header class="sticky top-0 z-20 flex items-center justify-between p-4 bg-background-dark/80 backdrop-blur-md">
  <button class="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
    <span class="material-symbols-outlined text-white">chevron_left</span>
  </button>
  <div class="flex flex-col items-center">
    <h2 class="text-lg font-bold leading-tight tracking-tight">Hoje</h2>
    <span class="text-xs font-medium text-text-secondary">Quarta, 24 Out</span>
  </div>
  <button class="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
    <span class="material-symbols-outlined text-white">chevron_right</span>
  </button>
</header>
```

**Variante: Simples (back + título)**
```html
<header class="sticky top-0 z-20 flex items-center px-4 h-16 bg-background-dark/95 backdrop-blur-md border-b border-white/5">
  <button class="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
    <span class="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
  </button>
  <h1 class="text-lg font-bold tracking-tight flex-1 text-center pr-10">
    Título da Tela
  </h1>
</header>
```

**Variante: Com ação à direita**
```html
<header class="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background-dark/95 backdrop-blur-md border-b border-white/10">
  <button class="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
    <span class="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
  </button>
  <h1 class="text-lg font-bold tracking-tight">Insights</h1>
  <button class="flex h-10 items-center gap-2 rounded-full bg-primary/20 px-4 text-primary hover:bg-primary/30 transition-colors">
    <span class="material-symbols-outlined text-[20px]">smart_toy</span>
    <span class="text-sm font-bold">AI Chat</span>
  </button>
</header>
```

---

### 1.2 BottomNav

**Variante: Simples**
```html
<nav class="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-background-dark/95 backdrop-blur max-w-md mx-auto">
  <div class="flex justify-around items-center py-3 pb-6">
    <button class="flex flex-col items-center gap-1 text-primary">
      <span class="material-symbols-outlined fill-1">home</span>
      <span class="text-[10px] font-medium">Home</span>
    </button>
    <button class="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors">
      <span class="material-symbols-outlined">restaurant</span>
      <span class="text-[10px] font-medium">Diário</span>
    </button>
    <button class="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors">
      <span class="material-symbols-outlined">bar_chart</span>
      <span class="text-[10px] font-medium">Evolução</span>
    </button>
    <button class="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors">
      <span class="material-symbols-outlined">person</span>
      <span class="text-[10px] font-medium">Perfil</span>
    </button>
  </div>
</nav>
```

**Variante: Com FAB central**
```html
<nav class="fixed bottom-0 left-0 right-0 z-40 bg-background-dark border-t border-white/10 pb-6 pt-2">
  <div class="flex justify-around items-center">
    <button class="flex flex-col items-center gap-1 p-2 text-text-secondary hover:text-primary transition-colors">
      <span class="material-symbols-outlined">home</span>
      <span class="text-[10px] font-medium">Início</span>
    </button>
    <button class="flex flex-col items-center gap-1 p-2 text-primary">
      <span class="material-symbols-outlined fill-1">insights</span>
      <span class="text-[10px] font-medium">Insights</span>
    </button>
    <!-- FAB Central -->
    <div class="relative -top-5">
      <button class="flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform">
        <span class="material-symbols-outlined text-[28px]">add</span>
      </button>
    </div>
    <button class="flex flex-col items-center gap-1 p-2 text-text-secondary hover:text-primary transition-colors">
      <span class="material-symbols-outlined">restaurant</span>
      <span class="text-[10px] font-medium">Diário</span>
    </button>
    <button class="flex flex-col items-center gap-1 p-2 text-text-secondary hover:text-primary transition-colors">
      <span class="material-symbols-outlined">person</span>
      <span class="text-[10px] font-medium">Perfil</span>
    </button>
  </div>
</nav>
```

---

### 1.3 FAB (Floating Action Button)

```html
<div class="fixed bottom-24 right-4 z-50">
  <button class="group flex items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-background-dark shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
    <span class="material-symbols-outlined text-primary group-hover:animate-pulse">auto_awesome</span>
    <span class="font-bold text-sm">Fit AI</span>
  </button>
</div>
```

---

## 2. CARDS

### 2.1 SummaryCard (Hero)

```html
<section class="rounded-2xl bg-surface-dark p-6 shadow-lg border border-white/5 relative overflow-hidden">
  <!-- Background Glow -->
  <div class="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
  
  <div class="flex flex-col gap-6 relative z-10">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-bold text-white">Resumo Diário</h3>
      <button class="text-white/60 hover:text-white transition-colors">
        <span class="material-symbols-outlined text-xl">more_horiz</span>
      </button>
    </div>
    
    <!-- Content -->
    <div class="flex items-center gap-6">
      <!-- Ring Chart vai aqui -->
      <div class="flex flex-col gap-1 flex-1">
        <p class="text-white/60 text-sm font-medium">Consumo Calórico</p>
        <div class="flex items-end gap-1.5">
          <span class="text-3xl font-bold text-white tracking-tight">1850</span>
          <span class="text-sm font-medium text-white/50 mb-1.5">/ 2200 kcal</span>
        </div>
      </div>
    </div>
  </div>
</section>
```

---

### 2.2 ChartCard

```html
<div class="flex flex-col gap-4 rounded-xl bg-surface-card p-5 border border-border-subtle">
  <div class="flex items-start justify-between">
    <div>
      <h2 class="text-base font-medium text-text-secondary">Evolução de Peso</h2>
      <div class="mt-1 flex items-baseline gap-2">
        <span class="text-3xl font-bold tracking-tight text-white">74.5 kg</span>
        <span class="flex items-center text-sm font-semibold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
          <span class="material-symbols-outlined text-[14px] mr-0.5">trending_down</span>
          1.2%
        </span>
      </div>
    </div>
    <button class="text-text-secondary hover:text-primary transition-colors">
      <span class="material-symbols-outlined">more_horiz</span>
    </button>
  </div>
  
  <!-- Chart Area -->
  <div class="relative h-48 w-full">
    <!-- SVG Chart -->
  </div>
</div>
```

---

### 2.3 StatCard (Mini)

```html
<div class="rounded-xl border border-border-subtle bg-background-dark p-4 flex flex-col justify-between gap-3">
  <div class="flex justify-between items-start">
    <span class="material-symbols-outlined text-blue-400">water_drop</span>
    <span class="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">+250ml</span>
  </div>
  <div>
    <p class="text-white text-lg font-bold">1.8L</p>
    <p class="text-text-secondary text-xs">Meta: 3.0L</p>
  </div>
</div>
```

---

### 2.4 InsightCard (Alert Laranja)

```html
<section class="rounded-xl bg-primary p-5 shadow-lg shadow-primary/20 flex gap-4 items-start">
  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
    <span class="material-symbols-outlined">bolt</span>
  </div>
  <div class="flex flex-col gap-1">
    <h4 class="text-base font-bold text-white">Déficit Alto Detectado</h4>
    <p class="text-sm text-white/90 font-medium leading-relaxed">
      Coma mais <span class="font-bold underline decoration-white/50 underline-offset-2">200kcal</span> para otimizar sua recuperação muscular hoje.
    </p>
  </div>
</section>
```

---

### 2.5 InsightAlert (Com borda lateral)

**Variante: Warning**
```html
<div class="group relative overflow-hidden rounded-xl bg-orange-50 dark:bg-icon-bg/60 p-4 transition-all active:scale-[0.98]">
  <div class="flex items-start gap-4">
    <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-primary/20 text-orange-600 dark:text-primary">
      <span class="material-symbols-outlined">warning</span>
    </div>
    <div class="flex flex-1 flex-col">
      <h3 class="text-sm font-bold text-white">Atenção à Proteína</h3>
      <p class="mt-1 text-xs leading-relaxed text-text-secondary">
        Abaixo da meta em 3 dias. Tente incluir mais ovos ou frango.
      </p>
    </div>
    <span class="material-symbols-outlined text-[20px] text-text-secondary">chevron_right</span>
  </div>
  <!-- Accent Line -->
  <div class="absolute left-0 top-0 h-full w-1 bg-orange-500"></div>
</div>
```

**Variante: Success**
```html
<div class="group relative overflow-hidden rounded-xl bg-icon-bg/60 p-4">
  <div class="flex items-start gap-4">
    <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/20 text-green-500">
      <span class="material-symbols-outlined">check_circle</span>
    </div>
    <div class="flex flex-1 flex-col">
      <h3 class="text-sm font-bold text-white">Hidratação Ideal</h3>
      <p class="mt-1 text-xs leading-relaxed text-text-secondary">
        Meta batida por 5 dias seguidos. Continue assim!
      </p>
    </div>
    <span class="material-symbols-outlined text-[20px] text-text-secondary">chevron_right</span>
  </div>
  <div class="absolute left-0 top-0 h-full w-1 bg-green-500"></div>
</div>
```

---

### 2.6 SectionCard (Profile)

```html
<section class="bg-surface-dark rounded-xl p-5 border border-white/5">
  <div class="flex items-center gap-2 mb-4">
    <span class="material-symbols-outlined text-primary text-[20px]">person</span>
    <h3 class="text-base font-bold text-white">Dados Pessoais</h3>
  </div>
  <div class="space-y-4">
    <!-- Form fields -->
  </div>
</section>
```

---

### 2.7 FileHistoryItem

```html
<div class="group flex items-center gap-4 bg-surface-dark p-4 rounded-xl border border-white/5 hover:border-primary/30 transition-all">
  <!-- Icon -->
  <div class="flex items-center justify-center rounded-lg bg-icon-bg shrink-0 size-12 group-hover:bg-primary/10 transition-colors">
    <span class="material-symbols-outlined text-gray-300 group-hover:text-primary text-[24px]">folder_zip</span>
  </div>
  
  <!-- Info -->
  <div class="flex flex-col justify-center flex-1 min-w-0">
    <p class="text-base font-semibold leading-normal truncate mb-0.5">apple_health_export.zip</p>
    <p class="text-text-secondary text-xs">Hoje, 14:30 • 10 MB</p>
  </div>
  
  <!-- Status -->
  <div class="shrink-0">
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
      <span class="size-1.5 rounded-full bg-green-500"></span>
      Sucesso
    </span>
  </div>
</div>
```

---

## 3. INPUTS & CONTROLES

### 3.1 ChatInput

```html
<div class="flex items-end gap-3 w-full">
  <div class="flex-1 bg-neutral-800 rounded-3xl min-h-[52px] flex items-center px-4 py-2 border border-white/5 focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
    <input 
      class="w-full bg-transparent border-none text-white placeholder-neutral-500 focus:ring-0 p-0 text-base" 
      placeholder="Pergunte algo ao Fit IA..." 
      type="text"
    />
  </div>
  <button class="flex shrink-0 items-center justify-center size-[52px] rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-orange-600 active:scale-95 transition-all">
    <span class="material-symbols-outlined">mic</span>
  </button>
</div>
```

---

### 3.2 ActionChip

```html
<button class="flex shrink-0 items-center justify-center gap-2 rounded-full bg-surface-dark border border-white/5 py-2 px-4 active:scale-95 transition-transform">
  <span class="material-symbols-outlined text-primary text-[18px]">restaurant</span>
  <span class="text-sm font-medium text-text-floral">Registrar almoço</span>
</button>
```

**Container horizontal scrollável:**
```html
<div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
  <!-- Chips aqui -->
</div>
```

---

### 3.3 FormField

```html
<div class="flex flex-col gap-2">
  <label class="text-sm font-medium text-gray-300" for="name">Nome</label>
  <input 
    class="w-full px-4 py-3.5 rounded-lg border border-border-subtle bg-surface-input text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400" 
    id="name" 
    placeholder="Seu nome completo" 
    type="text"
  />
</div>
```

**Variante: Readonly com lock**
```html
<div class="flex flex-col gap-1.5">
  <label class="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Nome Completo</label>
  <div class="flex items-center w-full px-4 h-12 rounded-lg bg-surface-input border border-transparent">
    <input class="bg-transparent border-none w-full text-white focus:ring-0 p-0 text-base font-medium" readonly type="text" value="Carlos Eduardo Silva"/>
    <span class="material-symbols-outlined text-gray-400 text-[18px]">lock</span>
  </div>
</div>
```

---

### 3.4 FormSelect

```html
<div class="flex flex-col gap-2">
  <label class="text-sm font-medium text-gray-300" for="gender">Gênero</label>
  <div class="relative">
    <select class="w-full px-4 py-3.5 rounded-lg border border-border-subtle bg-surface-input text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer" id="gender">
      <option value="male">Masculino</option>
      <option value="female">Feminino</option>
      <option value="other">Outro</option>
    </select>
    <span class="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
      <span class="material-symbols-outlined">expand_more</span>
    </span>
  </div>
</div>
```

---

### 3.5 ToggleItem

```html
<div class="flex items-center justify-between py-3">
  <div class="flex flex-col">
    <span class="text-sm font-medium text-white">Notificações de Treino</span>
    <span class="text-xs text-gray-400">Lembretes diários às 08:00</span>
  </div>
  <label class="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked class="sr-only peer"/>
    <div class="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
  </label>
</div>
```

---

### 3.6 SegmentedControl

```html
<div class="flex h-10 w-full items-center rounded-lg bg-icon-bg/50 p-1">
  <button class="flex h-full flex-1 items-center justify-center rounded-md text-sm font-medium text-text-secondary hover:text-white transition-all">
    7 dias
  </button>
  <button class="flex h-full flex-1 items-center justify-center rounded-md bg-[#4A3B32] text-primary shadow-sm text-sm font-bold transition-all">
    14 dias
  </button>
  <button class="flex h-full flex-1 items-center justify-center rounded-md text-sm font-medium text-text-secondary hover:text-white transition-all">
    30 dias
  </button>
</div>
```

---

### 3.7 Dropzone

```html
<div class="group relative flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed border-border-subtle hover:border-primary hover:bg-primary/5 transition-all duration-300 px-6 py-12">
  <!-- Icon with glow -->
  <div class="relative">
    <div class="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div class="relative flex size-20 items-center justify-center rounded-full bg-icon-bg group-hover:scale-110 transition-transform duration-300">
      <span class="material-symbols-outlined text-[36px] text-primary">cloud_upload</span>
    </div>
  </div>
  
  <!-- Text -->
  <div class="flex flex-col items-center gap-2 text-center">
    <p class="text-lg font-bold leading-tight tracking-tight">Arraste seu arquivo</p>
    <p class="text-sm text-text-secondary max-w-[280px] leading-relaxed">
      Suportamos exportações do <span class="font-medium text-primary">Apple Health (.zip)</span> ou dados do <span class="font-medium text-primary">Hevy (.csv)</span>
    </p>
  </div>
  
  <!-- Button -->
  <button class="flex items-center justify-center rounded-xl h-12 px-8 bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/25 transition-all w-full sm:w-auto">
    <span class="material-symbols-outlined text-[20px] mr-2">folder_open</span>
    Buscar nos Arquivos
  </button>
</div>
```

---

## 4. BOTÕES

### 4.1 PrimaryButton

```html
<button class="w-full bg-primary hover:bg-opacity-90 active:scale-[0.98] transition-all duration-200 text-white font-semibold py-4 px-6 rounded-2xl text-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
  Continuar
  <span class="material-symbols-outlined">arrow_forward</span>
</button>
```

---

### 4.2 SecondaryButton (Ghost)

```html
<button class="w-full py-3 text-text-secondary font-medium text-sm hover:text-white transition-colors">
  Pular
</button>
```

---

### 4.3 SocialButton

**Apple:**
```html
<button class="w-full flex items-center justify-center space-x-3 py-4 px-4 bg-black text-white rounded-xl border border-white/10 hover:bg-gray-900 transition-colors">
  <i class="fab fa-apple text-xl"></i>
  <span class="font-medium text-base">Continuar com Apple</span>
</button>
```

**Google:**
```html
<button class="w-full flex items-center justify-center space-x-3 py-4 px-4 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors">
  <img alt="Google" class="w-5 h-5" src="google-logo.svg"/>
  <span class="font-medium text-base">Continuar com Google</span>
</button>
```

---

### 4.4 DangerButton

```html
<button class="w-full h-14 rounded-lg border border-error/50 hover:bg-error/10 text-error font-medium text-base transition-colors flex items-center justify-center gap-2 group">
  <span class="material-symbols-outlined group-hover:scale-110 transition-transform">sync_problem</span>
  Reprocessar Dados da IA
</button>
```

---

### 4.5 IconButton

```html
<button class="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
  <span class="material-symbols-outlined text-white">arrow_back</span>
</button>
```

---

## 5. FEEDBACK & STATUS

### 5.1 StatusBadge

**Success:**
```html
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
  <span class="size-1.5 rounded-full bg-green-500"></span>
  Sucesso
</span>
```

**Error:**
```html
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
  <span class="size-1.5 rounded-full bg-red-500"></span>
  Erro
</span>
```

**Processing:**
```html
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
  <span class="size-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
  Processando
</span>
```

---

### 5.2 TrendBadge

**Positive (down is good for weight):**
```html
<span class="flex items-center text-sm font-semibold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
  <span class="material-symbols-outlined text-[14px] mr-0.5">trending_down</span>
  1.2%
</span>
```

**Negative:**
```html
<span class="flex items-center text-sm font-semibold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
  <span class="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>
  0.8%
</span>
```

---

### 5.3 StreakBadge

```html
<div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 backdrop-blur-sm">
  <span class="material-symbols-outlined text-primary text-[20px] fill-1">local_fire_department</span>
  <span class="text-primary text-sm font-bold">5 dias seguidos</span>
</div>
```

---

### 5.4 DateSeparator

```html
<div class="flex justify-center">
  <span class="text-xs font-medium text-neutral-500 py-1 px-3 bg-white/5 rounded-full">Hoje</span>
</div>
```

---

## 6. CHAT

### 6.1 ChatBubbleAI

```html
<div class="flex items-end gap-3 self-start max-w-[85%]">
  <!-- Avatar -->
  <div class="bg-center bg-no-repeat bg-cover rounded-full w-8 h-8 shrink-0 overflow-hidden shadow-sm" style="background-image: url('ai-avatar.jpg')"></div>
  
  <!-- Message -->
  <div class="flex flex-col gap-1 items-start">
    <span class="text-xs text-text-secondary ml-1">Fit AI</span>
    <div class="p-4 bg-surface-dark rounded-2xl rounded-bl-sm">
      <p class="text-[15px] leading-relaxed text-text-floral">
        Bom dia! Vi que você dormiu 7 horas hoje. Como está se sentindo para o treino?
      </p>
    </div>
  </div>
</div>
```

---

### 6.2 ChatBubbleUser

```html
<div class="flex items-end gap-3 self-end max-w-[85%] flex-row-reverse">
  <!-- Avatar -->
  <div class="bg-center bg-no-repeat bg-cover rounded-full w-8 h-8 shrink-0 overflow-hidden shadow-sm border-2 border-primary/20" style="background-image: url('user-avatar.jpg')"></div>
  
  <!-- Message -->
  <div class="flex flex-col gap-1 items-end">
    <span class="text-xs text-text-secondary mr-1">Você</span>
    <div class="p-4 bg-primary rounded-2xl rounded-br-sm shadow-md shadow-primary/20">
      <p class="text-[15px] leading-relaxed text-white">
        Estou um pouco cansado, mas vou treinar.
      </p>
    </div>
  </div>
</div>
```

---

## 7. GRÁFICOS

### 7.1 RingChart (Calorias)

```html
<div class="relative size-28 shrink-0">
  <svg class="size-full -rotate-90" viewBox="0 0 36 36">
    <!-- Background Circle -->
    <path 
      class="text-white/10" 
      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="3"
    />
    <!-- Progress Circle -->
    <path 
      class="text-primary drop-shadow-[0_0_4px_rgba(235,96,40,0.5)]" 
      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
      fill="none" 
      stroke="currentColor" 
      stroke-dasharray="84, 100" 
      stroke-linecap="round" 
      stroke-width="3"
    />
  </svg>
  <!-- Center Text -->
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
    <span class="text-xs text-white/60 font-medium">Restam</span>
    <span class="text-lg font-bold text-white">350</span>
    <span class="text-[10px] text-white/40">kcal</span>
  </div>
</div>
```

---

### 7.2 ProgressBar

```html
<div class="flex flex-col gap-2">
  <div class="flex justify-between items-end">
    <div class="flex gap-2 items-center">
      <span class="material-symbols-outlined text-white/70 text-sm">egg_alt</span>
      <p class="text-white text-sm font-medium">Proteína</p>
    </div>
    <p class="text-white text-xs font-medium">
      <span class="text-primary font-bold">140g</span> 
      <span class="text-white/40">/ 200g</span>
    </p>
  </div>
  <div class="h-2.5 w-full rounded-full bg-black/20 overflow-hidden">
    <div class="h-full rounded-full bg-primary" style="width: 70%;"></div>
  </div>
</div>
```

---

### 7.3 LineChart

```html
<div class="relative h-24 w-full pt-4">
  <svg class="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
    <!-- Gradient -->
    <defs>
      <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#eb6028" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#eb6028" stop-opacity="0"/>
      </linearGradient>
    </defs>
    
    <!-- Area -->
    <path d="M0,40 L15,35 L30,38 L45,25 L60,28 L75,15 L90,18 L100,10 L100,50 L0,50 Z" fill="url(#chartGradient)"/>
    
    <!-- Line -->
    <path d="M0,40 L15,35 L30,38 L45,25 L60,28 L75,15 L90,18 L100,10" fill="none" stroke="#eb6028" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
    
    <!-- Active Point -->
    <circle cx="100" cy="10" fill="#eb6028" r="3" stroke="#181311" stroke-width="2"/>
  </svg>
  
  <!-- X Axis Labels -->
  <div class="flex justify-between mt-2 text-[10px] text-text-secondary">
    <span>Seg</span>
    <span>Ter</span>
    <span>Qua</span>
    <span>Qui</span>
    <span>Sex</span>
    <span>Sáb</span>
    <span>Dom</span>
  </div>
</div>
```

---

## 8. ONBOARDING

### 8.1 StepIndicator

**Variante: Pill (ativo alongado)**
```html
<div class="flex justify-center space-x-2">
  <div class="w-2 h-2 rounded-full bg-white/20"></div>
  <div class="w-8 h-2 rounded-full bg-primary shadow-glow"></div>
  <div class="w-2 h-2 rounded-full bg-white/20"></div>
  <div class="w-2 h-2 rounded-full bg-white/20"></div>
  <div class="w-2 h-2 rounded-full bg-white/20"></div>
</div>
```

**Variante: Ring (ativo com borda)**
```html
<div class="flex space-x-2">
  <div class="w-2 h-2 rounded-full bg-gray-600"></div>
  <div class="w-2 h-2 rounded-full bg-gray-600"></div>
  <div class="w-2 h-2 rounded-full bg-primary ring-2 ring-primary ring-offset-2 ring-offset-background-dark"></div>
  <div class="w-2 h-2 rounded-full bg-gray-600"></div>
  <div class="w-2 h-2 rounded-full bg-gray-600"></div>
</div>
```

---

### 8.2 FeatureIcon (Onboarding)

```html
<div class="relative group">
  <!-- Blur glow -->
  <div class="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:opacity-100 transition-opacity"></div>
  
  <!-- Icon container -->
  <div class="relative bg-surface-elevated border border-white/10 p-8 rounded-3xl shadow-xl">
    <span class="material-symbols-outlined text-6xl text-primary drop-shadow-[0_0_8px_rgba(235,96,40,0.6)]">
      dns
    </span>
  </div>
</div>
```

**Variante: Com badge**
```html
<div class="relative">
  <div class="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 shadow-lg">
    <span class="material-symbols-outlined text-6xl text-primary">smart_toy</span>
  </div>
  <!-- Badge -->
  <div class="absolute -top-2 -right-2 w-8 h-8 bg-background-dark rounded-full flex items-center justify-center border-2 border-primary">
    <span class="material-symbols-outlined text-sm text-primary">chat_bubble</span>
  </div>
</div>
```

---

### 8.3 WelcomeHero

```html
<main class="w-full max-w-md h-screen flex flex-col relative overflow-hidden">
  <!-- Hero Image -->
  <div class="relative flex-1 w-full h-1/2 overflow-hidden">
    <img class="absolute inset-0 w-full h-full object-cover" src="hero-image.jpg" alt=""/>
    <!-- Gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-background-dark/60 to-background-dark"></div>
    <!-- Logo -->
    <div class="absolute top-12 left-0 right-0 text-center z-10">
      <h1 class="text-3xl font-bold tracking-tight text-white">Fit Track</h1>
    </div>
  </div>
  
  <!-- Content Card -->
  <div class="px-8 pb-10 pt-4 z-10 w-full flex flex-col items-center text-center bg-background-dark rounded-t-3xl -mt-6">
    <h2 class="text-2xl font-bold mb-4 leading-tight text-text-floral">
      Seu corpo, explicado por dados reais
    </h2>
    <p class="text-base mb-10 text-text-secondary">
      Treino, sono e alimentação em um só lugar, com AI.
    </p>
    <!-- Buttons -->
  </div>
</main>
```

---

## 9. PROFILE

### 9.1 ProfileHeader

```html
<section class="flex flex-col items-center pt-2">
  <div class="relative group cursor-pointer">
    <!-- Avatar -->
    <div class="size-32 rounded-full overflow-hidden border-4 border-surface-dark shadow-xl bg-surface-dark">
      <div class="w-full h-full bg-center bg-cover" style="background-image: url('avatar.jpg')"></div>
    </div>
    <!-- Edit button -->
    <div class="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white shadow-lg border-2 border-background-dark flex items-center justify-center hover:scale-105 transition-transform">
      <span class="material-symbols-outlined text-[20px]">edit</span>
    </div>
  </div>
  <div class="mt-4 text-center">
    <h2 class="text-2xl font-bold text-white">Carlos Silva</h2>
    <p class="text-gray-400 text-sm mt-1">Membro Pro desde 2023</p>
  </div>
</section>
```

---

## 10. UTILITIES

### 10.1 Hide Scrollbar

```css
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

### 10.2 Selection Style

```html
<body class="selection:bg-primary selection:text-white">
```

### 10.3 Safe Area

```html
<!-- Content padding for bottom nav -->
<main class="pb-24">

<!-- Bottom nav with safe area -->
<nav class="pb-6">
```
