# T002: Navegação Principal

## Metadados

| Campo | Valor |
|-------|-------|
| **ID** | T002 |
| **Nome** | Navegação Principal |
| **Prioridade** | P0 - Crítico |
| **Feature** | BottomNav |
| **Status** | pendente |

## Arquivos Relacionados

- `components/ui/BottomNav.tsx` - Componente de navegação
- `app/home/page.tsx` - Página Home
- `app/insights/page.tsx` - Página Insights
- `app/import/page.tsx` - Página Import/Diário
- `app/profile/page.tsx` - Página Profile
- `app/chat/page.tsx` - Página Chat

## Pré-condições

1. App rodando em `localhost:3000`
2. Onboarding completo (usuário já cadastrado)
3. Usuário na tela Home

## Fluxo do Teste

### Etapa 1: Setup
1. Completar onboarding rapidamente (ou simular localStorage)
2. Navegar para `/home`
3. Verificar que BottomNav está visível

### Etapa 2: Navegação Home → Insights
1. Clicar no item "Insights" na BottomNav
2. Verificar URL mudou para `/insights`
3. Verificar que item "Insights" está ativo (cor primária)

### Etapa 3: Navegação Insights → Import/Diário
1. Clicar no item "Diário" na BottomNav
2. Verificar URL mudou para `/import`
3. Verificar que item "Diário" está ativo

### Etapa 4: Navegação Import → Profile
1. Clicar no item "Perfil" na BottomNav
2. Verificar URL mudou para `/profile`
3. Verificar que item "Perfil" está ativo

### Etapa 5: Navegação Profile → Home
1. Clicar no item "Home/Início" na BottomNav
2. Verificar URL mudou para `/home`
3. Verificar que item "Home" está ativo

### Etapa 6: FAB Central (se variante with-fab)
1. Na Home, verificar que FAB (botão +) está visível
2. Clicar no FAB
3. Verificar navegação para `/chat`

## Resultado Esperado

- Todas as navegações funcionam sem erros
- URLs mudam corretamente
- Item ativo muda de cor (primary)
- FAB leva para o Chat

## Código Playwright

Arquivo: `tests/e2e/T002_navegacao.spec.ts`

## Notas

- BottomNav tem 2 variantes: "simple" (4 tabs) e "with-fab" (4 tabs + FAB central)
- Variante with-fab é usada em Home, Profile, Insights
- Links: /home, /insights, /import, /profile
- FAB redireciona para /chat
