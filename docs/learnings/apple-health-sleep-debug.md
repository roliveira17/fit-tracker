# Apple Health Sleep — Debug e Solução

## Data: 2026-02-05

## Problema Reportado

ROADMAP.md indicava: "Dados de sono são parseados do Apple Health XML mas não são mapeados para o formato do Supabase. O array vai vazio para `importAppleHealth()`."

## Investigação

### 1. Código Existente

Após análise completa, descobri que **o código de mapeamento JÁ EXISTE**:

- ✅ **Parser** (`appleHealthParser.ts`): Extrai `sleepEntries` do XML
- ✅ **Mapper** (`appleHealthMapper.ts`): Função `mapSleepSessions()` transforma sleepEntries em SleepSession[]
- ✅ **Hook** (`useImportLogic.ts:158-168`): Mapeia para o formato do RPC
- ✅ **RPC** (`import_apple_health`): Persiste em `sleep_sessions` + `sleep_stages`

### 2. Fluxo Completo

```
ZIP → extractAppleHealthXml → parseAppleHealthXml → sleepEntries[]
  → mapAppleHealthToEntities → mapSleepSessions → SleepSession[]
  → useImportLogic → format para RPC → import_apple_health
  → sleep_sessions + sleep_stages no Supabase
```

### 3. Possível Causa do Problema

A função `mapSleepSessions` só adiciona sessões onde `totalMinutes > 0`. Os minutos são somados baseado em:

```typescript
switch (entry.value) {
  case SLEEP_VALUES.ASLEEP_DEEP:       // conta
  case SLEEP_VALUES.ASLEEP_REM:        // conta
  case SLEEP_VALUES.ASLEEP_CORE:       // conta
  case SLEEP_VALUES.ASLEEP_UNSPECIFIED: // conta
  case SLEEP_VALUES.AWAKE:              // NÃO conta em totalMinutes
  case SLEEP_VALUES.IN_BED:             // NÃO conta
}
```

**Se os valores do Apple Health não corresponderem exatamente aos esperados, as sessões são descartadas silenciosamente.**

### 4. Valores Esperados (Apple Health)

```javascript
const SLEEP_VALUES = {
  IN_BED: "HKCategoryValueSleepAnalysisInBed",
  ASLEEP_UNSPECIFIED: "HKCategoryValueSleepAnalysisAsleepUnspecified",
  ASLEEP_CORE: "HKCategoryValueSleepAnalysisAsleepCore",
  ASLEEP_DEEP: "HKCategoryValueSleepAnalysisAsleepDeep",
  ASLEEP_REM: "HKCategoryValueSleepAnalysisAsleepREM",
  AWAKE: "HKCategoryValueSleepAnalysisAwake",
};
```

## Solução Implementada

### 1. Logs de Debug

Adicionei logs detalhados em `appleHealthMapper.ts`:

- Número de entradas de sono recebidas
- Número de noites agrupadas
- Detalhes de cada noite (minutos por estágio)
- Valores de sono desconhecidos (warning)
- Sessões adicionadas vs ignoradas
- Total de sessões mapeadas

### 2. Logs no Hook

Adicionei log em `useImportLogic.ts` mostrando:
- Quantidade de dados mapeados (weights, bodyFat, workouts, **sleep**, heartRate)

### 3. Próximos Passos

**Teste com arquivo real:**
1. Usuário importa ZIP do Apple Health
2. Verifica console do navegador (DevTools)
3. Logs mostrarão:
   - Se sleepEntries estão sendo parseadas
   - Se valores de sono correspondem aos esperados
   - Se sessões estão sendo mapeadas
   - Se RPC está recebendo os dados

**Se `totalMinutes = 0` para todas as noites:**
- Verificar valores reais de `entry.value` no XML
- Atualizar `SLEEP_VALUES` se necessário
- Ou adicionar lógica de fallback para valores alternativos

**Se `mappedData.sleepSessions.length > 0` mas RPC falha:**
- Verificar erro no console
- Verificar formato dos dados enviados ao RPC
- Verificar constraints da tabela `sleep_sessions`

## Status

- ✅ Código de mapeamento revisado e correto
- ✅ Logs de debug adicionados
- ⏳ **Aguardando teste com arquivo Apple Health real**

## Notas

O ROADMAP pode estar desatualizado — o código de mapeamento já foi implementado mas nunca foi testado com dados reais de sono do Apple Health.
