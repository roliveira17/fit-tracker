# T001: Onboarding Completo

## Metadados

| Campo | Valor |
|-------|-------|
| **ID** | T001 |
| **Nome** | Onboarding Completo |
| **Prioridade** | P0 - Crítico |
| **Feature** | Onboarding |
| **Status** | pendente |

## Arquivos Relacionados

- `app/page.tsx` - Redirect inicial
- `app/onboarding/page.tsx` - Tela de boas-vindas
- `app/onboarding/tour/page.tsx` - Tour de features (4 passos)
- `app/onboarding/profile/page.tsx` - Formulário de perfil
- `lib/storage.ts` - Funções de persistência

## Pré-condições

1. App rodando em `localhost:3000`
2. localStorage limpo (sem dados de usuário)
3. Nenhum perfil existente

## Fluxo do Teste

### Etapa 1: Acesso Inicial
1. Acessar `/`
2. Verificar redirecionamento para `/onboarding`
3. Verificar que tela de boas-vindas carrega

### Etapa 2: Boas-vindas
1. Verificar título "Fit Track" visível
2. Verificar botões de login (Apple, Google, "Continuar sem login")
3. Clicar em "Continuar sem login →"
4. Verificar navegação para `/onboarding/tour`

### Etapa 3: Tour de Features (4 passos)
1. Verificar que step 1 está ativo (dots indicator)
2. Clicar "Continuar" 3 vezes para passar pelos 4 steps
3. No step 4, verificar botão mostra "Começar"
4. Clicar "Começar"
5. Verificar navegação para `/onboarding/profile`

### Etapa 4: Formulário de Perfil
1. Verificar título "Perfil Básico"
2. Preencher campos:
   - Nome: "Teste QA"
   - Gênero: "Masculino"
   - Data de nascimento: "1990-05-15"
   - Altura: "175"
   - Peso: "80"
3. Clicar "Continuar"
4. Verificar navegação para `/chat`

### Etapa 5: Verificação Final
1. Verificar que localStorage contém `fittrack_profile`
2. Verificar que `fittrack_onboarding_complete` = "true"
3. Verificar que BMR foi calculado (deve ser ~1775 para homem 175cm/80kg/34 anos)

## Resultado Esperado

- Usuário completa todas as etapas sem erros
- Perfil salvo corretamente no localStorage
- Flag de onboarding marcada como completa
- Navegação final para tela de Chat
- BMR calculado corretamente

## Casos de Erro a Testar

1. **Campos vazios**: Botão não deve funcionar, erros devem aparecer
2. **Idade < 13 anos**: Erro "Idade mínima é 13 anos"
3. **Altura <= 120**: Erro de validação
4. **Peso <= 35**: Erro de validação

## Código Playwright

Arquivo: `tests/e2e/T001_onboarding.spec.ts`

## Notas

- O tour tem 4 steps fixos
- O formulário de perfil redireciona para `/chat` após sucesso
- BMR é calculado pela fórmula Mifflin-St Jeor
