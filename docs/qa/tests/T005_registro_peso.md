# T005: Registro de Peso

## Metadados

| Campo | Valor |
|-------|-------|
| **ID** | T005 |
| **Nome** | Registro de Peso |
| **Prioridade** | P1 - Core |
| **Feature** | Chat - Registro de Peso |
| **Status** | pendente |

## Arquivos Relacionados

- `app/chat/page.tsx` - Página principal do chat
- `app/api/chat/route.ts` - API de chat com IA
- `lib/parsers.ts` - Função `parseWeight()` (linhas 391-439)
- `lib/storage.ts` - Funções `saveWeightLog()`, `getWeightLogs()`

## Pré-condições

1. App rodando em `localhost:3000`
2. Usuário com onboarding completo (localStorage configurado)
3. API de chat funcionando (OpenAI API key configurada)
4. Chat sem mensagens anteriores (limpo)

## Fluxo do Teste

### Etapa 1: Registrar Peso com "kg"
1. Acessar `/chat`
2. Enviar mensagem: "Meu peso é 75kg"
3. Aguardar resposta da IA
4. Verificar que resposta contém "✓ Registrado"
5. Verificar toast "Peso registrado!"

### Etapa 2: Registrar Peso com Vírgula
1. Enviar mensagem: "75,5kg"
2. Aguardar resposta da IA
3. Verificar que registra 75.5 (convertendo vírgula para ponto)

### Etapa 3: Registrar Peso Contextual
1. Enviar mensagem: "Estou com 80"
2. Verificar que IA identifica como peso
3. Verificar que registra 80kg

### Etapa 4: Verificar Persistência
1. Verificar que peso foi salvo no localStorage
2. Verificar estrutura do objeto salvo:
   - `id`: string (weight_timestamp_random)
   - `weight`: número (ex: 75.5)
   - `date`: string (YYYY-MM-DD)
   - `timestamp`: ISO string
   - `rawText`: texto original

### Etapa 5: Verificar Validação de Limites
1. Peso deve estar entre 30-300kg
2. Valores fora desse range devem ser rejeitados

## Resultado Esperado

- IA entende e registra pesos corretamente
- Suporte a kg, vírgula e contexto
- Dados persistidos no localStorage
- Toast de confirmação exibido

## Padrões de Regex Suportados

```typescript
/peso\s*(?:de\s*)?(\d+[.,]?\d*)\s*(?:kg)?/i   // "peso de 75kg"
/(\d+[.,]?\d*)\s*kg/i                          // "75kg"
/estou\s*(?:com\s*)?(\d+[.,]?\d*)/i            // "estou com 75"
/(\d{2,3}[.,]\d{1,2})/                         // "77.5" ou "77,5"
```

## Código Playwright

Arquivo: `tests/e2e/T005_registro_peso.spec.ts`

## Notas

- A IA usa regex primeiro e IA como fallback
- Peso aceita valores entre 30-300kg
- Suporta "," e "." como separador decimal
