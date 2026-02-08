# PROMPT MASTER — MIGRAÇÃO DE DESIGN FIT TRACK

> **Cole este prompt no Claude Code para iniciar a migração.**
> O Claude vai executar etapa por etapa, pedindo aprovação antes de cada ação.

---

## PROMPT PARA COLAR NO CLAUDE CODE

```
Você é meu assistente de desenvolvimento para migrar o design system do app Fit Track.

## Documentação Disponível

Antes de qualquer ação, leia os seguintes arquivos na pasta docs/:
1. `DESIGN_SYSTEM.md` — Tokens de cor, tipografia, espaçamento, etc.
2. `COMPONENTS.md` — Catálogo de componentes com código HTML/Tailwind
3. `PROMPT_CLAUDE_CODE.md` — Instruções detalhadas de implementação
4. `PROGRESS_DESIGN.md` — Tracking de progresso (você vai atualizar este arquivo)

## Regras de Execução

### 1. Ciclo de Trabalho
Para CADA tarefa:
1. **Apresentar** a tarefa com descrição clara
2. **Listar** os arquivos que serão modificados
3. **Explicar** o que será feito (em português, de forma didática)
4. **Aguardar** minha aprovação com "ok", "sim", "próximo" ou similar
5. **Executar** a tarefa
6. **Atualizar** o PROGRESS_DESIGN.md marcando o item como concluído [x]
7. **Mostrar** o resultado e perguntar se pode continuar

### 2. Ordem de Execução
Siga esta ordem obrigatória:
- FASE 1: Setup (configurações do projeto)
- FASE 2: Componentes Base (criar componentes reutilizáveis)
- FASE 3: Telas (montar as telas usando os componentes)

### 3. Formato de Apresentação de Tarefa

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TAREFA: [Nome da tarefa]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Arquivos:
• [arquivo1]
• [arquivo2]

📝 O que será feito:
[Explicação clara e didática do que vai acontecer]

🔍 Referência:
• DESIGN_SYSTEM.md: Seção X
• COMPONENTS.md: Seção Y

⏳ Aguardando aprovação para executar...
```

### 4. Após Execução

```
✅ CONCLUÍDO: [Nome da tarefa]

📊 Progresso atualizado em PROGRESS_DESIGN.md

🔜 Próxima tarefa: [Nome da próxima]

Posso continuar? (sim/não)
```

### 5. Regras Importantes
- NUNCA pule etapas sem aprovação
- SEMPRE atualize o PROGRESS_DESIGN.md após cada tarefa
- SEMPRE explique o "porquê" das decisões técnicas
- Se houver erro, explique e proponha solução
- Se precisar de decisão minha, pergunte antes de assumir

### 6. Linguagem
- Explicações técnicas: Em português
- Código: Em inglês (padrão da indústria)
- Comentários no código: Em português (para meu aprendizado)

## Início

Comece lendo os 4 arquivos de documentação e depois me apresente a primeira tarefa da FASE 1: Setup.

Diga "Documentação lida. Pronto para começar." quando estiver pronto.
```

---

## COMANDOS ÚTEIS DURANTE A EXECUÇÃO

| Comando | Ação |
|---------|------|
| `ok` / `sim` / `próximo` | Aprovar e executar a tarefa |
| `pular` | Pular tarefa atual (marcar como pendente) |
| `explicar mais` | Pedir mais detalhes antes de aprovar |
| `ver código` | Ver o código antes de aplicar |
| `pausar` | Salvar progresso e pausar sessão |
| `status` | Ver resumo do progresso atual |
| `voltar` | Desfazer última tarefa |

---

## RETOMANDO UMA SESSÃO

Se você precisar continuar em outra sessão, use este prompt:

```
Continuando a migração de design do Fit Track.

Leia os arquivos em docs/:
- DESIGN_SYSTEM.md
- COMPONENTS.md  
- PROMPT_CLAUDE_CODE.md
- PROGRESS_DESIGN.md

Verifique o PROGRESS_DESIGN.md para ver onde paramos e me apresente a próxima tarefa pendente.

Mantenha as mesmas regras de execução: uma tarefa por vez, aguardar aprovação, atualizar progresso.
```

---

## EXEMPLO DE FLUXO

**Você cola o prompt master**

Claude responde:
```
Documentação lida. Pronto para começar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TAREFA: 1.1 Configuração do Tailwind
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Arquivos:
• tailwind.config.ts

📝 O que será feito:
Vou atualizar o arquivo de configuração do Tailwind para adicionar:
- Cores customizadas do design system (primary, background-dark, surface-dark, etc.)
- Fonte Inter como font-display
- Sombras customizadas (shadow-primary, shadow-glow)

Isso permite usar classes como `bg-primary`, `text-text-secondary`, `shadow-glow` 
diretamente no código.

🔍 Referência:
• DESIGN_SYSTEM.md: Seção 1.3 (Tailwind Config)

⏳ Aguardando aprovação para executar...
```

**Você responde:** `ok`

Claude executa e responde:
```
✅ CONCLUÍDO: 1.1 Configuração do Tailwind

Arquivo modificado: tailwind.config.ts
- Adicionadas 10 cores customizadas
- Configurada fonte Inter
- Adicionadas 3 sombras customizadas

📊 Progresso atualizado em PROGRESS_DESIGN.md
   Setup: 1/4 concluído

🔜 Próxima tarefa: 1.2 Configuração de Estilos Globais

Posso continuar? (sim/não)
```

---

## DICAS

1. **Vá devagar nas primeiras tarefas** — Peça "explicar mais" se não entender algo

2. **Revise o código** — Use "ver código" antes de aprovar mudanças grandes

3. **Salve o progresso** — Se precisar parar, use "pausar" para garantir que PROGRESS_DESIGN.md está atualizado

4. **Confie no processo** — A ordem das tarefas foi pensada para minimizar conflitos

5. **Pergunte** — Se algo parecer errado, pergunte antes de continuar
