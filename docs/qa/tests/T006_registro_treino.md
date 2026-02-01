# T006: Registro de Treino

## Metadados

| Campo | Valor |
|-------|-------|
| **ID** | T006 |
| **Nome** | Registro de Treino |
| **Prioridade** | P1 - Core |
| **Feature** | Chat - Registro de Exercícios |
| **Status** | pendente |

## Arquivos Relacionados

- `app/chat/page.tsx` - Página principal do chat
- `app/api/chat/route.ts` - API de chat com IA
- `lib/parsers.ts` - Função `parseExercise()` (linhas 319-385)
- `lib/storage.ts` - Funções `saveWorkout()`, `getWorkouts()`

## Pré-condições

1. App rodando em `localhost:3000`
2. Usuário com onboarding completo (localStorage configurado)
3. API de chat funcionando (OpenAI API key configurada)
4. Chat sem mensagens anteriores (limpo)

## Fluxo do Teste

### Etapa 1: Registrar Cardio Simples
1. Acessar `/chat`
2. Enviar mensagem: "Fiz 30 minutos de esteira"
3. Aguardar resposta da IA
4. Verificar que resposta contém "✓ Registrado"
5. Verificar toast "Treino registrado!"

### Etapa 2: Registrar Musculação
1. Enviar mensagem: "Fiz supino 4x8"
2. Aguardar resposta da IA
3. Verificar que identifica como musculação

### Etapa 3: Registrar Múltiplos Exercícios
1. Enviar mensagem: "Treinei peito e tríceps hoje"
2. Verificar que IA identifica múltiplos exercícios

### Etapa 4: Verificar Persistência
1. Verificar que treino foi salvo no localStorage
2. Verificar estrutura do objeto salvo:
   - `id`: string (workout_timestamp_random)
   - `exercises`: array de ExerciseItem
   - `totalDuration`: número (opcional)
   - `totalCaloriesBurned`: número (opcional)
   - `date`: string (YYYY-MM-DD)
   - `timestamp`: ISO string
   - `rawText`: texto original

### Etapa 5: Verificar Cálculo de Calorias
1. IA deve estimar calorias queimadas baseado no tipo e duração

## Resultado Esperado

- IA entende e registra exercícios corretamente
- Identifica tipo (cardio, musculação, funcional)
- Estima calorias queimadas
- Dados persistidos no localStorage
- Toast de confirmação exibido

## Estrutura de Dados

```typescript
interface ExerciseItem {
  type: string;            // "musculação"|"cardio"|"funcional"|"esporte"
  name: string;            // "Esteira", "Supino", etc
  duration?: number;       // em minutos
  sets?: number;           // 4
  reps?: number;           // 8
  caloriesBurned?: number; // estimativa
}

interface Workout {
  id: string;
  exercises: ExerciseItem[];
  totalDuration?: number;
  totalCaloriesBurned?: number;
  date: string;
  timestamp: string;
  rawText: string;
}
```

## Código Playwright

Arquivo: `tests/e2e/T006_registro_treino.spec.ts`

## Notas

- A IA usa GPT-4o-mini para parsear exercícios
- Valores de calorias são estimativas
- O teste verifica ranges aceitáveis, não valores exatos
