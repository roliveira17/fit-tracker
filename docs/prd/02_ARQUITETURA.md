# FIT TRACK — ARQUITETURA

> **Estrutura técnica do produto.**
> Use este documento para garantir consistência na implementação.

---

## 1. Stack Técnica (v1)

| Camada | Tecnologia |
|--------|------------|
| Plataforma | Web first |
| Framework | A definir |
| Design System | Park UI |
| Tema | Dark-first (light opcional) |
| AI | LLM via API (Claude/GPT) |

---

## 2. Mapa de Navegação

### 2.1 Bottom Tabs (ordem fixa)

```
┌─────────────────────────────────────────────────────────┐
│  [Chat]   [Home]   [Importar]   [Insights]   [Profile]  │
└─────────────────────────────────────────────────────────┘
     ↑
   default
```

### 2.2 Fluxos principais

```
┌──────────────────────────────────────────────────────────┐
│                      ONBOARDING                          │
│  Boas-vindas → Feature Tour (4 telas) → Perfil Básico   │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                         APP                              │
│                                                          │
│   Chat ←──────────────→ Home                            │
│     │                     │                              │
│     │                     ▼                              │
│     │              [Clique em card]                      │
│     │                     │                              │
│     ▼                     ▼                              │
│  Registro ←───── Sugestões contextuais                  │
│                                                          │
│   Importar ──────→ Dados populados ──────→ Insights     │
│                                                          │
│   Profile ──────→ Configurações / Reprocessamento       │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Entidades de Dados

### 3.1 Core Entities

| Entidade | Campos principais | Fonte |
|----------|-------------------|-------|
| `User` | nome, gênero, nascimento, altura, timezone | Onboarding |
| `WeightLog` | data, peso (kg), fonte | Chat, Import |
| `BodyFatLog` | data, bf (%), fonte | Chat, Import |
| `Meal` | data, hora, descrição, calorias, proteína, fonte | Chat |
| `MealItem` | meal_id, alimento, quantidade, macros | Chat |
| `Workout` | data, tipo, duração, fonte | Chat, Import |
| `WorkoutSet` | workout_id, exercício, sets, reps, carga | Import (Hevy) |
| `CardioSession` | data, tipo, duração, calorias, fc_média | Import (Apple Health) |
| `SleepSession` | data, início, fim, score, fonte | Import (Apple Health) |
| `SleepStage` | session_id, stage, início, fim | Import (Apple Health) |
| `TimeSeries` | tipo, timestamp, valor, fonte | Import |

### 3.2 Relacionamentos

```
User
 ├── WeightLog (1:N)
 ├── BodyFatLog (1:N)
 ├── Meal (1:N)
 │    └── MealItem (1:N)
 ├── Workout (1:N)
 │    └── WorkoutSet (1:N)
 ├── CardioSession (1:N)
 ├── SleepSession (1:N)
 │    └── SleepStage (1:N)
 └── TimeSeries (1:N)
```

### 3.3 Campos de controle

Toda entidade deve ter:
- `id` (UUID)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `source` (enum: 'chat', 'import_apple', 'import_hevy', 'manual')

---

## 4. Componentes Reutilizáveis

### 4.1 Layout

| Componente | Uso |
|------------|-----|
| `BottomTabs` | Navegação principal |
| `ScreenContainer` | Wrapper padrão de tela |
| `Header` | Cabeçalho com título e ações |

### 4.2 Cards

| Componente | Uso | Telas |
|------------|-----|-------|
| `SummaryCard` | Resumo numérico com label | Home |
| `InsightCard` | Headline + texto explicativo | Home, Insights |
| `MiniChart` | Gráfico pequeno inline | Home |
| `ProgressCard` | Consistência/streak | Home |

### 4.3 Inputs

| Componente | Uso | Telas |
|------------|-----|-------|
| `ChatInput` | Campo de texto + botão áudio | Chat |
| `ChipGroup` | Sugestões clicáveis | Chat, Home |
| `FileDropzone` | Upload de arquivos | Importar |

### 4.4 Feedback

| Componente | Uso |
|------------|-----|
| `LoadingSpinner` | Estado de carregamento |
| `Toast` | Feedback temporário |
| `EmptyState` | Zero Data Experience |
| `ErrorMessage` | Exibição de erros |
| `SuccessSummary` | Resumo pós-ação |

### 4.5 Gráficos

| Componente | Uso | Telas |
|------------|-----|-------|
| `LineChart` | Evolução temporal | Insights, Home |
| `BarChart` | Comparação diária | Insights |
| `TrendIndicator` | Seta + percentual | Home, Insights |

---

## 5. Estados Globais

### 5.1 Auth State

```
- isAuthenticated: boolean
- authMethod: 'apple' | 'google' | 'local'
- user: User | null
```

### 5.2 Onboarding State

```
- isOnboardingComplete: boolean
- currentStep: number
```

### 5.3 Data State

```
- lastImportDate: Date | null
- importSources: ('apple_health' | 'hevy')[]
- hasMinimumData: boolean
```

---

## 6. Regras de Importação

### 6.1 Apple Health (ZIP/XML)

| Tipo de dado | Entidade destino |
|--------------|------------------|
| HKQuantityTypeIdentifierBodyMass | WeightLog |
| HKQuantityTypeIdentifierBodyFatPercentage | BodyFatLog |
| HKWorkoutActivityType* | CardioSession |
| HKCategoryTypeIdentifierSleepAnalysis | SleepSession, SleepStage |
| Séries temporais (HR, etc.) | TimeSeries |

### 6.2 Hevy (CSV)

| Coluna | Entidade destino |
|--------|------------------|
| workout_name, date | Workout |
| exercise, sets, reps, weight | WorkoutSet |

---

## 7. Cálculos

### 7.1 BMR (Mifflin-St Jeor)

```
Homem:  BMR = 10 × peso(kg) + 6.25 × altura(cm) − 5 × idade + 5
Mulher: BMR = 10 × peso(kg) + 6.25 × altura(cm) − 5 × idade − 161
```

### 7.2 TDEE estimado

```
TDEE = BMR × fator_atividade

Fatores:
- Sedentário: 1.2
- Leve: 1.375
- Moderado: 1.55
- Ativo: 1.725
- Muito ativo: 1.9
```

### 7.3 Déficit/Superávit

```
Balanço = Calorias_consumidas − TDEE
- Negativo = déficit
- Positivo = superávit
```

---

## 8. Convenções de Código

### 8.1 Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `InsightCard` |
| Funções | camelCase | `calculateTDEE` |
| Constantes | UPPER_SNAKE | `MAX_IMPORT_SIZE` |
| Entidades | PascalCase | `WeightLog` |
| Arquivos componente | PascalCase | `ChatInput.tsx` |
| Arquivos util | camelCase | `dateUtils.ts` |

### 8.2 Estrutura de pastas sugerida

```
/src
├── components/
│   ├── layout/
│   ├── cards/
│   ├── inputs/
│   ├── feedback/
│   └── charts/
├── screens/
│   ├── onboarding/
│   ├── chat/
│   ├── home/
│   ├── import/
│   ├── insights/
│   └── profile/
├── entities/
├── services/
│   ├── ai/
│   ├── import/
│   └── calculations/
├── hooks/
├── utils/
└── constants/
```

