# T003: Chat Básico

## Metadados

| Campo | Valor |
|-------|-------|
| **ID** | T003 |
| **Nome** | Chat Básico |
| **Prioridade** | P0 - Crítico |
| **Feature** | Chat |
| **Status** | pendente |

## Arquivos Relacionados

- `app/chat/page.tsx` - Página principal do chat
- `components/chat/MessageBubble.tsx` - Componente de mensagem
- `components/chat/TypingIndicator.tsx` - Indicador de digitação
- `components/chat/ChipGroup.tsx` - Chips de sugestões
- `components/ui/ChatInput.tsx` - Input de mensagem
- `app/api/chat/route.ts` - API de chat com IA

## Pré-condições

1. App rodando em `localhost:3000`
2. Usuário com onboarding completo (localStorage configurado)
3. API de chat funcionando (Claude API key configurada)

## Fluxo do Teste

### Etapa 1: Acesso ao Chat
1. Acessar `/chat`
2. Verificar que tela de chat carrega
3. Verificar saudação personalizada "Olá, [nome]!"
4. Verificar chips de sugestões visíveis

### Etapa 2: Estado Inicial
1. Verificar que o chat está vazio (sem mensagens)
2. Verificar sugestões: "Almocei arroz e frango", "Fiz 30min de esteira", etc.
3. Verificar input de mensagem visível
4. Verificar botões de ação (microfone, câmera, enviar)

### Etapa 3: Enviar Mensagem via Input
1. Digitar "Olá, tudo bem?"
2. Clicar no botão enviar (ou pressionar Enter)
3. Verificar mensagem do usuário aparece
4. Verificar indicador de "digitando" aparece
5. Aguardar resposta da IA
6. Verificar resposta da IA aparece

### Etapa 4: Enviar Mensagem via Sugestão
1. Clicar em chip de sugestão
2. Verificar mensagem é enviada automaticamente
3. Aguardar resposta da IA
4. Verificar resposta aparece

### Etapa 5: Histórico
1. Verificar que todas as mensagens estão visíveis
2. Verificar scroll para última mensagem funciona
3. Verificar botão "Limpar histórico" visível

## Resultado Esperado

- Chat carrega com estado inicial correto
- Mensagens são enviadas e exibidas corretamente
- IA responde às mensagens
- Chips de sugestão funcionam
- Histórico de mensagens é exibido

## Casos de Erro a Testar

1. **API offline**: Verificar mensagem de erro amigável
2. **Mensagem vazia**: Botão enviar deve estar desabilitado

## Código Playwright

Arquivo: `tests/e2e/T003_chat_basico.spec.ts`

## Notas

- O teste usa mocks para a API de chat em ambiente de teste
- Sugestões iniciais são exibidas apenas quando não há mensagens
- O chat salva mensagens no localStorage automaticamente
