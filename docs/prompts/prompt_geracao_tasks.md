# Prompt Template — Geração de Tasks

> **Use este template para gerar tasks executáveis a partir dos PRDs.**

---

## Instruções de Uso

### Passo 1: Carregar contexto base (OBRIGATÓRIO)

Sempre inclua estes 3 documentos antes de qualquer PRD específico:

```
1. 00_MASTER.md
2. 01_GLOSSARIO.md  
3. 02_ARQUITETURA.md
```

### Passo 2: Carregar PRD específico

Adicione o PRD da feature que deseja implementar:

```
4. features/[XX_feature.md]
```

### Passo 3: Usar o prompt abaixo

---

## Prompt para Geração de Tasks

```
## Contexto

Você é um engenheiro sênior implementando o Fit Track.

Você tem acesso a:
- PRD Master com visão e princípios (00_MASTER.md)
- Glossário com definições técnicas (01_GLOSSARIO.md)
- Arquitetura com componentes e entidades (02_ARQUITETURA.md)
- PRD específico da feature a implementar

## Tarefa

Gere uma lista de tasks e microtasks para implementar a feature descrita no PRD específico.

## Regras

1. **Granularidade**
   - Cada microtask deve ser executável em até 30 minutos
   - Se uma microtask parecer maior, quebre em subtasks

2. **Referências**
   - Use componentes listados em 02_ARQUITETURA.md
   - Use entidades listadas em 02_ARQUITETURA.md
   - Siga convenções de código definidas

3. **Ordem**
   - Tasks devem seguir ordem lógica de dependência
   - Comece por setup/estrutura, depois lógica, depois UI

4. **Completude**
   - Cubra todos os itens do checklist do PRD
   - Inclua estados de erro e edge cases

5. **Formato de saída**

Task 1: [Nome da task]
├── 1.1 [Microtask]
├── 1.2 [Microtask]
└── 1.3 [Microtask]

Task 2: [Nome da task]
├── 2.1 [Microtask]
└── 2.2 [Microtask]

## Output esperado

Gere as tasks no formato acima, cobrindo:
- [ ] Setup inicial (arquivos, estrutura)
- [ ] Entidades/tipos necessários
- [ ] Componentes de UI
- [ ] Lógica de negócio
- [ ] Integrações
- [ ] Estados e feedback
- [ ] Testes (se aplicável)
```

---

## Exemplo de Uso Completo

### Input para a LLM:

```
[Conteúdo do 00_MASTER.md]

---

[Conteúdo do 01_GLOSSARIO.md]

---

[Conteúdo do 02_ARQUITETURA.md]

---

[Conteúdo do features/10_onboarding.md]

---

## Tarefa

Gere tasks e microtasks para implementar o Onboarding conforme o PRD acima.
Siga as regras do prompt template.
```

---

## Variações do Prompt

### Para tasks de UI apenas

```
Gere tasks focadas APENAS em componentes de UI para a feature [X].
Ignore lógica de negócio e integrações.
```

### Para tasks de lógica apenas

```
Gere tasks focadas APENAS em lógica de negócio para a feature [X].
Assuma que os componentes de UI já existem.
```

### Para estimativa de esforço

```
Gere tasks para a feature [X] e inclua estimativa de tempo para cada microtask.
Use o formato:

Task 1: [Nome] 
├── 1.1 [Microtask] — ~XX min
├── 1.2 [Microtask] — ~XX min
```

### Para identificar dependências entre features

```
Analise os PRDs de [Feature A] e [Feature B].
Liste as dependências técnicas entre elas.
Sugira ordem de implementação.
```

---

## Checklist pós-geração

Após gerar as tasks, valide:

- [ ] Todas as microtasks são executáveis em < 30 min?
- [ ] Componentes referenciados existem em 02_ARQUITETURA.md?
- [ ] Entidades referenciadas existem em 02_ARQUITETURA.md?
- [ ] Todos os itens do checklist do PRD foram cobertos?
- [ ] A ordem de tasks faz sentido (dependências respeitadas)?
- [ ] Estados de erro e edge cases foram incluídos?

---

## Dicas

1. **Comece pelo Chat** — é o core do produto e não tem dependências
2. **Depois Onboarding** — é a entrada do usuário
3. **Depois Importação** — popula dados para Home e Insights
4. **Depois Home** — usa dados do Chat e Importação
5. **Depois Insights** — usa dados agregados
6. **Por último Profile** — menos crítico, configurações

Esta ordem minimiza retrabalho e permite testes incrementais.

