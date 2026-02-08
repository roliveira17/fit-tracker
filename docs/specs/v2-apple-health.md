# Feature 2: Importação Apple Health

> **PRD v2** — Importar dados de saúde do iPhone/Apple Watch via arquivo ZIP/XML.

---

## Visão Geral

| Campo | Valor |
|-------|-------|
| **Prioridade** | Alta |
| **Complexidade** | Alta |
| **Tasks** | 14 |
| **Dependências npm** | `jszip`, `fast-xml-parser` |
| **Status** | NÃO INICIADO |

---

## Por que essa feature?

O Apple Health é a fonte mais rica de dados de saúde para usuários de iPhone/Apple Watch. Ao importar esses dados, o usuário pode:

1. **Evitar digitação manual** — Peso, body fat, treinos e sono já registrados automaticamente
2. **Ter histórico completo** — Anos de dados de saúde disponíveis instantaneamente
3. **Maior precisão** — Dados de dispositivos são mais confiáveis que estimativas

---

## Fluxo do Usuário

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. iPhone: Ajustes → Saúde → Exportar Dados de Saúde           │
│    (Gera arquivo ZIP com export.xml)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. App: Página /import → Upload do ZIP                          │
│    - Dropzone aceita .zip                                       │
│    - Feedback de "Processando..."                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Parser: Descompactar → Ler XML → Extrair entidades           │
│    - Roda no browser (não envia para servidor)                  │
│    - Detecta tipos de dados disponíveis                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Preview: Mostrar resumo antes de importar                    │
│    - X registros de peso                                        │
│    - Y sessões de treino                                        │
│    - Z noites de sono                                           │
│    - Usuário confirma importação                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Importação: Salvar dados com deduplicação                    │
│    - Detecta duplicatas por data                                │
│    - Aplica regra-mãe (mais detalhado + mais recente)          │
│    - Mostra resumo final                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tasks Detalhadas

### 2.1 Parser (3 tasks)

#### Task 2.1.1 — Descompactar ZIP no browser

**O que faz:** Recebe arquivo ZIP do Apple Health e extrai o conteúdo XML.

**Arquivo:** `lib/import/appleHealth.ts`

**Dependência:** `jszip`

**Interface:**
```typescript
interface AppleHealthZipResult {
  success: boolean;
  xmlContent: string | null;
  error: string | null;
  fileName: string | null;
}

function extractAppleHealthXml(zipFile: File): Promise<AppleHealthZipResult>
```

**Critérios de aceite:**
- [ ] ZIP válido é descompactado corretamente
- [ ] Encontra `export.xml` dentro da estrutura do ZIP
- [ ] Retorna erro amigável se ZIP inválido
- [ ] Retorna erro se `export.xml` não encontrado

---

#### Task 2.1.2 — Parser XML para entidades

**O que faz:** Lê o XML do Apple Health e converte para estruturas JavaScript.

**Arquivo:** `lib/import/appleHealthParser.ts`

**Dependência:** `fast-xml-parser`

**Estrutura do XML Apple Health:**
```xml
<HealthData>
  <Record type="HKQuantityTypeIdentifierBodyMass" value="75.5" unit="kg"
          startDate="2024-01-15 08:00:00" endDate="2024-01-15 08:00:00" />
  <Record type="HKQuantityTypeIdentifierBodyFatPercentage" value="0.18" unit="%"
          startDate="2024-01-15 08:00:00" />
  <Workout workoutActivityType="HKWorkoutActivityTypeRunning"
           duration="30" totalDistance="5" totalEnergyBurned="300" />
  <!-- ... milhares de registros ... -->
</HealthData>
```

**Interface:**
```typescript
interface AppleHealthRecord {
  type: string;
  value: number;
  unit: string;
  startDate: string;
  endDate: string;
  sourceName?: string;
}

interface AppleHealthWorkout {
  activityType: string;
  duration: number;
  distance?: number;
  energyBurned?: number;
  startDate: string;
  endDate: string;
}

interface ParsedAppleHealthData {
  records: AppleHealthRecord[];
  workouts: AppleHealthWorkout[];
  sleepAnalysis: AppleHealthSleepEntry[];
}

function parseAppleHealthXml(xmlContent: string): ParsedAppleHealthData
```

**Critérios de aceite:**
- [ ] Parse XML sem travar (arquivos podem ter +100MB)
- [ ] Extrai todos os tipos de Record
- [ ] Extrai Workouts separadamente
- [ ] Extrai SleepAnalysis separadamente
- [ ] Não carrega tudo em memória de uma vez (streaming se possível)

---

#### Task 2.1.3 — Mapeamento HKQuantityType para entidades do app

**O que faz:** Converte tipos do Apple Health para entidades do Fit Track.

**Arquivo:** `lib/import/appleHealthMapper.ts`

**Mapeamento:**
| Apple Health Type | Fit Track Entity |
|-------------------|------------------|
| `HKQuantityTypeIdentifierBodyMass` | `WeightLog` |
| `HKQuantityTypeIdentifierBodyFatPercentage` | `BodyFatLog` |
| `HKWorkoutActivityType*` | `Workout` / `CardioSession` |
| `HKCategoryTypeIdentifierSleepAnalysis` | `SleepSession` |
| `HKQuantityTypeIdentifierHeartRate` | `TimeSeries` |

**Interface:**
```typescript
interface MappedAppleHealthData {
  weightLogs: Omit<WeightLog, "id" | "timestamp">[];
  bodyFatLogs: Omit<BodyFatLog, "id" | "timestamp">[];
  workouts: Omit<Workout, "id" | "timestamp">[];
  sleepSessions: SleepSession[];
  heartRateSeries: TimeSeries[];
}

function mapAppleHealthToEntities(data: ParsedAppleHealthData): MappedAppleHealthData
```

**Critérios de aceite:**
- [ ] Converte unidades corretamente (lbs → kg, etc.)
- [ ] Formata datas no padrão YYYY-MM-DD
- [ ] Agrupa workouts por sessão (não por registro individual)
- [ ] Ignora tipos não suportados silenciosamente

---

### 2.2 Dados Suportados (5 tasks)

#### Task 2.2.1 — Importar Peso (BodyMass)

**O que faz:** Extrai registros de peso e salva como `WeightLog`.

**Tipo Apple Health:** `HKQuantityTypeIdentifierBodyMass`

**Campos extraídos:**
- `value` → peso em kg (converter se necessário)
- `startDate` → data do registro
- `sourceName` → fonte (iPhone, balança, etc.)

**Critérios de aceite:**
- [ ] Converte libras para kg automaticamente
- [ ] Arredonda para 1 casa decimal
- [ ] Marca `source: "import_apple"` no registro

---

#### Task 2.2.2 — Importar Body Fat

**O que faz:** Extrai registros de gordura corporal e salva como `BodyFatLog`.

**Tipo Apple Health:** `HKQuantityTypeIdentifierBodyFatPercentage`

**Campos extraídos:**
- `value` → percentual (0.18 = 18%)
- `startDate` → data do registro

**Critérios de aceite:**
- [ ] Converte decimal para percentual (0.18 → 18)
- [ ] Valida range (5% - 50%)
- [ ] Marca `source: "import_apple"` no registro

---

#### Task 2.2.3 — Importar Workouts/Cardio

**O que faz:** Extrai treinos e salva como `Workout` ou `CardioSession`.

**Tipos Apple Health:**
- `HKWorkoutActivityTypeRunning`
- `HKWorkoutActivityTypeCycling`
- `HKWorkoutActivityTypeSwimming`
- `HKWorkoutActivityTypeWalking`
- `HKWorkoutActivityTypeHiking`
- `HKWorkoutActivityTypeYoga`
- Outros...

**Campos extraídos:**
- `workoutActivityType` → tipo de atividade
- `duration` → duração em minutos
- `totalDistance` → distância em km (se aplicável)
- `totalEnergyBurned` → calorias queimadas
- `startDate` / `endDate` → período

**Critérios de aceite:**
- [ ] Mapeia tipos de workout para categorias do app
- [ ] Converte unidades (milhas → km, etc.)
- [ ] Agrupa por sessão (não duplica)

---

#### Task 2.2.4 — Importar Sono (SleepAnalysis)

**O que faz:** Extrai dados de sono e salva como `SleepSession` + `SleepStage`.

**Tipo Apple Health:** `HKCategoryTypeIdentifierSleepAnalysis`

**Valores possíveis:**
- `HKCategoryValueSleepAnalysisInBed` — Na cama
- `HKCategoryValueSleepAnalysisAsleepCore` — Sono core
- `HKCategoryValueSleepAnalysisAsleepDeep` — Sono profundo
- `HKCategoryValueSleepAnalysisAsleepREM` — Sono REM
- `HKCategoryValueSleepAnalysisAwake` — Acordado

**Campos extraídos:**
- `value` → estágio do sono
- `startDate` / `endDate` → período do estágio
- Agregação por noite

**Critérios de aceite:**
- [ ] Agrupa estágios por noite de sono
- [ ] Calcula duração total de sono
- [ ] Calcula duração de cada estágio
- [ ] Identifica noite pelo horário (ex: 22h-7h = mesma noite)

---

#### Task 2.2.5 — Importar Frequência Cardíaca (séries temporais)

**O que faz:** Extrai dados de frequência cardíaca e salva como `TimeSeries`.

**Tipo Apple Health:** `HKQuantityTypeIdentifierHeartRate`

**Campos extraídos:**
- `value` → BPM
- `startDate` → timestamp exato
- `sourceName` → Apple Watch, etc.

**Critérios de aceite:**
- [ ] Armazena séries temporais sem agregação
- [ ] Permite drill-down por período
- [ ] Limita importação (últimos 30 dias por padrão)

---

### 2.3 UI (4 tasks)

#### Task 2.3.1 — Opção "Apple Health" no Dropzone

**O que faz:** Adiciona suporte a arquivos ZIP na página de importação.

**Arquivo:** `app/import/page.tsx`

**Mudanças:**
- Aceitar `.zip` além de `.csv`
- Detectar tipo de arquivo e rotear para parser correto
- Ícone diferente para Apple Health vs Hevy

**Critérios de aceite:**
- [ ] Dropzone aceita arquivos .zip
- [ ] Mensagem de ajuda menciona Apple Health
- [ ] Detecta automaticamente se é Apple Health ou outro ZIP

---

#### Task 2.3.2 — Preview de dados antes de importar

**O que faz:** Mostra resumo dos dados encontrados antes de confirmar importação.

**Arquivo:** `components/import/AppleHealthPreview.tsx`

**Layout:**
```
┌────────────────────────────────────────┐
│ 📱 Dados encontrados no Apple Health   │
├────────────────────────────────────────┤
│ ⚖️  Peso           │ 156 registros     │
│ 📊 Body Fat        │ 42 registros      │
│ 🏃 Treinos         │ 89 sessões        │
│ 😴 Sono            │ 120 noites        │
│ ❤️  Freq. Cardíaca │ 15.420 medições   │
├────────────────────────────────────────┤
│ Período: Jan 2023 — Jan 2024           │
├────────────────────────────────────────┤
│ [Cancelar]              [Importar]     │
└────────────────────────────────────────┘
```

**Critérios de aceite:**
- [ ] Mostra contagem por tipo de dado
- [ ] Mostra período dos dados
- [ ] Botão de confirmar/cancelar
- [ ] Opção de selecionar quais tipos importar (v2.1?)

---

#### Task 2.3.3 — Progresso de importação

**O que faz:** Mostra barra de progresso durante importação de arquivos grandes.

**Arquivo:** `components/import/ImportProgress.tsx`

**Estados:**
1. "Descompactando arquivo..."
2. "Lendo dados de saúde..."
3. "Processando peso... (45%)"
4. "Processando treinos... (67%)"
5. "Verificando duplicatas... (90%)"
6. "Finalizando..."

**Critérios de aceite:**
- [ ] Barra de progresso visual
- [ ] Texto descritivo do passo atual
- [ ] Porcentagem quando possível
- [ ] Não trava a UI durante processamento

---

#### Task 2.3.4 — Resumo pós-importação

**O que faz:** Mostra resultado final da importação com estatísticas.

**Arquivo:** `components/import/ImportSummary.tsx`

**Layout:**
```
┌────────────────────────────────────────┐
│ ✅ Importação concluída!               │
├────────────────────────────────────────┤
│ Importados:                            │
│   • 142 registros de peso              │
│   • 38 registros de body fat           │
│   • 76 sessões de treino               │
│   • 98 noites de sono                  │
├────────────────────────────────────────┤
│ ⚠️ 14 duplicatas ignoradas             │
├────────────────────────────────────────┤
│ [Ver dados]              [Fechar]      │
└────────────────────────────────────────┘
```

**Critérios de aceite:**
- [ ] Mostra total importado por tipo
- [ ] Mostra duplicatas ignoradas
- [ ] Mostra erros (se houver)
- [ ] Link para ver dados importados

---

### 2.4 Lógica (3 tasks)

#### Task 2.4.1 — Detecção de duplicatas

**O que faz:** Identifica registros que já existem no app para evitar duplicação.

**Arquivo:** `lib/import/deduplication.ts`

**Regras de duplicata:**
- **Peso:** Mesmo dia = duplicata
- **Body Fat:** Mesmo dia = duplicata
- **Treino:** Mesmo dia + mesmo tipo + mesma duração (±5min) = duplicata
- **Sono:** Mesma noite = duplicata

**Interface:**
```typescript
interface DeduplicationResult<T> {
  unique: T[];
  duplicates: T[];
  duplicateCount: number;
}

function deduplicateRecords<T>(
  newRecords: T[],
  existingRecords: T[],
  compareFn: (a: T, b: T) => boolean
): DeduplicationResult<T>
```

**Critérios de aceite:**
- [ ] Identifica duplicatas corretamente
- [ ] Retorna lista de duplicatas para mostrar ao usuário
- [ ] Performance aceitável (O(n log n) ou melhor)

---

#### Task 2.4.2 — Merge com dados existentes (regra-mãe)

**O que faz:** Aplica a regra-mãe do Fit Track: "manter o mais detalhado e mais recente".

**Arquivo:** `lib/import/merge.ts`

**Regras:**
1. Se dados do Chat existem, NUNCA sobrescrever (Chat tem prioridade)
2. Entre duas importações, manter a mais recente
3. Entre importação e dado manual antigo, manter o mais detalhado

**Interface:**
```typescript
interface MergeResult<T> {
  kept: T[];        // Mantidos (existentes ou novos que venceram)
  replaced: T[];    // Substituídos
  added: T[];       // Novos (não existiam)
}

function mergeWithExisting<T>(
  incoming: T[],
  existing: T[],
  rules: MergeRules
): MergeResult<T>
```

**Critérios de aceite:**
- [ ] Dados do Chat nunca são sobrescritos
- [ ] Importação mais recente prevalece sobre antiga
- [ ] Log de decisões para debug

---

#### Task 2.4.3 — Histórico de importações Apple Health

**O que faz:** Registra cada importação para auditoria e possível reprocessamento.

**Arquivo:** `lib/storage.ts` (extensão)

**Campos do registro:**
```typescript
interface ImportRecord {
  id: string;
  date: string;              // Data da importação
  source: "hevy" | "apple_health";
  status: "success" | "partial" | "error";
  itemsImported: number;
  details: {
    weightLogs: number;
    bodyFatLogs: number;
    workouts: number;
    sleepSessions: number;
    duplicatesSkipped: number;
    errors: string[];
  };
}
```

**Critérios de aceite:**
- [ ] Cada importação gera um registro
- [ ] Histórico mostra últimas 20 importações
- [ ] Possível ver detalhes de cada importação

---

## Dependências npm

```bash
# Instalar antes de começar
npm install jszip fast-xml-parser
```

## Variáveis de ambiente

Nenhuma necessária para esta feature (processamento local).

---

## Ordem de implementação recomendada

```
2.1.1 → 2.1.2 → 2.1.3 (Parser completo)
   ↓
2.2.1 → 2.2.2 (Peso e Body Fat - mais simples)
   ↓
2.2.3 → 2.2.4 (Treinos e Sono - mais complexos)
   ↓
2.2.5 (Frequência cardíaca - séries temporais)
   ↓
2.3.1 → 2.3.2 → 2.3.3 → 2.3.4 (UI completa)
   ↓
2.4.1 → 2.4.2 → 2.4.3 (Lógica de merge)
```

---

## Riscos e mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Arquivo XML muito grande (>500MB) | Alta | Usar streaming parser |
| Formato XML muda entre versões iOS | Média | Validar estrutura antes de parsear |
| Unidades variam por região | Alta | Sempre converter para métrico |
| Performance ruim no browser | Média | Web Worker para processamento pesado |

---

## Referências

- [Apple Health Export Documentation](https://developer.apple.com/documentation/healthkit/hkhealthstore/1614173-requestauthorization)
- [HKQuantityType Identifiers](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier)
- [JSZip Documentation](https://stuk.github.io/jszip/)
- [fast-xml-parser Documentation](https://github.com/NaturalIntelligence/fast-xml-parser)
