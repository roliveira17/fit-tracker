# T004: Registro de Refeição

## Metadados

| Campo | Valor |
|-------|-------|
| **ID** | T004 |
| **Nome** | Registro de Refeição |
| **Prioridade** | P0 - Crítico |
| **Feature** | Chat - Registro de Alimentos |
| **Status** | pendente |

## Arquivos Relacionados

- `app/chat/page.tsx` - Página principal do chat
- `app/api/chat/route.ts` - API de chat com IA
- `lib/storage.ts` - Funções de persistência (saveMeal)
- `lib/ai.ts` - Funções de parsing de refeições

## Pré-condições

1. App rodando em `localhost:3000`
2. Usuário com onboarding completo (localStorage configurado)
3. API de chat funcionando (Claude API key configurada)
4. Chat sem mensagens anteriores (limpo)

## Fluxo do Teste

### Etapa 1: Registrar Refeição Simples
1. Acessar `/chat`
2. Enviar mensagem: "Almocei arroz e frango"
3. Aguardar resposta da IA
4. Verificar que resposta contém "✓ Registrado"
5. Verificar que resposta contém estimativas de calorias/proteína

### Etapa 2: Verificar Persistência
1. Verificar que refeição foi salva no localStorage
2. Verificar estrutura do objeto salvo:
   - `type`: tipo de refeição (lunch)
   - `items`: array de itens
   - `totalCalories`: número > 0
   - `totalProtein`: número > 0
   - `date`: data atual

### Etapa 3: Registrar Refeição Detalhada
1. Enviar mensagem: "Comi 200g de frango grelhado com 150g de batata doce"
2. Verificar que IA identifica quantidades específicas
3. Verificar registro salvo com valores corretos

### Etapa 4: Verificar na Home
1. Navegar para `/home`
2. Verificar que calorias do dia aparecem no resumo
3. Verificar que lista de refeições aparece

## Resultado Esperado

- IA entende e registra refeições corretamente
- Estimativas nutricionais são razoáveis
- Dados persistidos no localStorage
- Refeições aparecem na Home

## Casos de Erro a Testar

1. **Mensagem ambígua**: "comi algo" - IA deve pedir mais detalhes
2. **Refeição inexistente**: IA deve estimar baseado no contexto

## Código Playwright

Arquivo: `tests/e2e/T004_registro_refeicao.spec.ts`

## Notas

- A IA usa Claude para estimar valores nutricionais
- Valores são aproximados e podem variar entre execuções
- O teste verifica ranges aceitáveis, não valores exatos
