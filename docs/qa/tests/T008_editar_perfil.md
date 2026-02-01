# T008: Editar Perfil

## Metadados

| Campo | Valor |
|-------|-------|
| **ID** | T008 |
| **Nome** | Editar Perfil |
| **Prioridade** | P1 - Core |
| **Feature** | Profile - Edição de Dados |
| **Status** | pendente |

## Arquivos Relacionados

- `app/profile/page.tsx` - Página de perfil
- `lib/storage.ts` - Funções `saveUserProfile()`, `getUserProfile()`

## Pré-condições

1. App rodando em `localhost:3000`
2. Usuário com onboarding completo (localStorage configurado)

## Fluxo do Teste

### Etapa 1: Visualizar Perfil
1. Acessar `/profile`
2. Verificar que exibe: Nome, Gênero, Idade, Altura, Peso, BMR
3. Verificar botão "Editar" visível

### Etapa 2: Editar Nome
1. Clicar em "Editar"
2. Alterar nome de "João" para "Maria"
3. Clicar em "Salvar"
4. Verificar toast "Perfil atualizado!"
5. Verificar nome atualizado na visualização

### Etapa 3: Editar Peso e Recalcular BMR
1. Entrar em modo edição
2. Alterar peso de 75kg para 80kg
3. Salvar
4. Verificar que BMR foi recalculado

### Etapa 4: Validação de Idade Mínima
1. Entrar em modo edição
2. Tentar data de nascimento que resulte em idade < 13
3. Verificar erro "Idade mínima: 13 anos"

### Etapa 5: Validação de Altura
1. Tentar altura = 100cm (fora do range 120-250)
2. Verificar erro "Altura entre 120-250 cm"

### Etapa 6: Validação de Peso
1. Tentar peso = 30kg (fora do range 35-300)
2. Verificar erro "Peso entre 35-300 kg"

### Etapa 7: Cancelar Edição
1. Entrar em modo edição
2. Alterar alguns valores
3. Clicar "Cancelar"
4. Verificar que valores voltaram ao original

### Etapa 8: Persistência
1. Editar perfil e salvar
2. Recarregar página
3. Verificar que alterações persistiram

## Resultado Esperado

- Perfil exibe dados corretamente
- Edição funciona com validações
- BMR recalcula ao alterar peso/altura/gênero
- Dados persistem no localStorage
- Toast de confirmação exibido

## Fórmula BMR (Mifflin-St Jeor)

```typescript
baseBMR = 10 * weight + 6.25 * height - 5 * age

// Ajuste por gênero:
masculino: baseBMR + 5
feminino:  baseBMR - 161
outro:     baseBMR - 78
```

## Validações

| Campo | Regra | Mensagem |
|-------|-------|----------|
| Nome | Obrigatório | "Nome é obrigatório" |
| Idade | >= 13 && <= 120 | "Idade mínima: 13 anos" / "Data inválida" |
| Altura | 120-250 cm | "Altura entre 120-250 cm" |
| Peso | 35-300 kg | "Peso entre 35-300 kg" |

## Código Playwright

Arquivo: `tests/e2e/T008_editar_perfil.spec.ts`
