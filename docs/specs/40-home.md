# PRD — Home

> **Dependências:** `00_MASTER.md`, `01_GLOSSARIO.md`, `02_ARQUITETURA.md`
> **Relacionado:** `20_chat.md` (integração bidirecional), `30_importacao.md` (dados)
> **Posição:** Tab — "Home" (não é default)

---

## 1. Objetivo

Fornecer um resumo diário claro, técnico e acionável do estado atual do usuário.

| Função | Descrição |
|--------|-----------|
| Primária | Responder "Como estou hoje?" em < 10 segundos |
| Secundária | Estimular ação via Chat |

---

## 2. O que é um "Hub Minimalista"

(ver `01_GLOSSARIO.md#hub-minimalista`)

A Home **não é** o lugar principal de input. O Chat cumpre esse papel.

A Home funciona como **painel de orientação rápida**:
1. Responder rapidamente: "Como estou hoje?"
2. Chamar atenção para o que importa agora
3. Estimular ação via Chat

> Ela **não compete** com dashboards detalhados nem com o Chat.

---

## 3. Posição no App

- Home é uma tab dedicada, **não é a tela inicial**
- Ao abrir o app: usuário cai no **Chat**
- Home é acessada conscientemente para "checar status"

---

## 4. Conteúdo (ordem fixa)

### Bloco 1 — Resumo de Hoje (obrigatório)

**Objetivo:** visão instantânea do dia

| Métrica | Formato |
|---------|---------|
| Calorias consumidas | kcal |
| Déficit / superávit estimado | kcal (com indicador visual se estimado) |
| Proteína consumida | g |
| Status do treino | feito / não feito |

**Regras:**
- TDEE sempre exibido (estimado mesmo sem treino importado)
- Valores estimados têm indicador visual discreto

**Componente:** `SummaryCard` (ver `02_ARQUITETURA.md#4.2`)

---

### Bloco 2 — Card Principal (Insight do Dia)

**Objetivo:** chamar atenção para a decisão mais importante hoje

| Elemento | Descrição |
|----------|-----------|
| Headline | Observação objetiva |
| Copy | Linha de coach direta |

**Exemplos:**
- Headline: "Déficit acumulado alto nos últimos 3 dias"
- Copy: "Hoje vale priorizar recuperação. Seu sono vem abaixo da média há 2 dias."

**Regras:**
- Apenas **1 insight por dia**
- Sempre baseado em dados reais ou estimativas explícitas
- Linguagem técnica, não motivacional (ver `00_MASTER.md#3`)

**Componente:** `InsightCard` (ver `02_ARQUITETURA.md#4.2`)

---

### Bloco 3 — Peso & BF (últimos 7 dias)

**Objetivo:** reforçar progresso de curto prazo

| Elemento | Descrição |
|----------|-----------|
| Gráfico | Mini gráfico de peso (7 dias) |
| BF | Último valor registrado (se existir) |

**Regras:**
- Se BF não existir, mostrar apenas peso
- Gráfico técnico, sem animações chamativas

**Componente:** `MiniChart` (ver `02_ARQUITETURA.md#4.2`)

---

### Bloco 4 — Consistência

**Objetivo:** reforçar hábito, não gamificação vazia

| Elemento | Descrição |
|----------|-----------|
| Streak | Dias consecutivos com registro |
| Formato | Simples: "5 dias seguidos" |

**Regras:**
- Sem rankings
- Sem comparação com outros usuários

**Componente:** `ProgressCard` (ver `02_ARQUITETURA.md#4.2`)

---

## 5. Navegação Temporal

| Aspecto | Valor |
|---------|-------|
| Default | Hoje |
| Navegação | Setas: ◀ Ontem \| Amanhã ▶ |
| Restrição | Não permite navegar para datas futuras |

Mudança de dia atualiza todos os blocos simultaneamente.

---

## 6. Zero Data Experience

(ver `01_GLOSSARIO.md#zero-data-experience`)

Quando não há dados suficientes, exibir **checklist guiado**:

```
┌─────────────────────────────────────────┐
│  Vamos começar                          │
│─────────────────────────────────────────│
│  [ ] Importar dados do Apple Health     │
│  [ ] Registrar primeira refeição        │
│  [ ] Registrar peso                     │
└─────────────────────────────────────────┘
```

**Regras:**
- Checklist desaparece conforme ações são concluídas
- Sempre direciona para Chat ou Importar

**Componente:** `EmptyState` (ver `02_ARQUITETURA.md#4.4`)

---

## 7. Input de Dados

> **Nenhum input direto acontece na Home**
(ver `00_MASTER.md#3` — princípio chat-first)

- Não há botões de adicionar refeição, treino ou peso
- Todas as ações direcionam para o **Chat**

---

## 8. Integração com Chat

### Comportamento de clique

Cards e números são clicáveis → levam ao Chat com sugestões contextuais.

**Exemplos de sugestões:**
- "Quer registrar sua refeição agora?"
- "Quer me contar como foi seu treino?"

**Componente:** `ChipGroup` (ver `02_ARQUITETURA.md#4.3`)

---

## 9. Sono

| Aspecto | Valor |
|---------|-------|
| Exibição | Score único |
| Fonte | Apple Health |
| Detalhe | Stages ficam em Insights (ver `50_insights.md`) |

---

## 10. Estados

| Estado | Descrição |
|--------|-----------|
| Loading | Carregando dados |
| Sem dados suficientes | Zero Data Experience |
| Dados parciais | Exibe o que tem, indica o que falta |
| Dados completos | Todos os blocos populados |
| Erro de sincronização | Mensagem discreta |

---

## 11. Tom e Linguagem

(ver `00_MASTER.md#3` — dados > motivação)

| Fazer | Evitar |
|-------|--------|
| Objetivo | Frases motivacionais |
| Técnico | Linguagem infantilizada |
| Direto | Celebrações exageradas |

**Exemplo bom:**
> "Proteína abaixo do alvo hoje. Ainda dá tempo de corrigir."

---

## 12. Fora do Escopo (v1)

- Dashboards avançados
- Comparações históricas longas
- Customização de cards

---

## 13. Métricas de Sucesso

| Métrica | Alvo |
|---------|------|
| Usuário entende status em < 10 segundos | feedback qualitativo |
| Home gera cliques para o Chat | > 30% das sessões |
| Redução de abandono pós-onboarding | < 40% churn D7 |

---

## 14. Checklist de Implementação

### Componentes necessários
- [ ] `ScreenContainer` (layout)
- [ ] `Header` com navegação temporal
- [ ] `SummaryCard` (4 métricas principais)
- [ ] `InsightCard` (headline + copy)
- [ ] `MiniChart` (peso 7 dias)
- [ ] `ProgressCard` (streak)
- [ ] `EmptyState` (checklist inicial)
- [ ] `ChipGroup` (sugestões ao clicar)

### Lógica de dados
- [ ] Fetch de `Meal` do dia → calorias + proteína
- [ ] Fetch de `Workout` do dia → status treino
- [ ] Cálculo de déficit/superávit (consumo - TDEE)
- [ ] Fetch de `WeightLog` últimos 7 dias
- [ ] Fetch de último `BodyFatLog`
- [ ] Fetch de `SleepSession` → score
- [ ] Cálculo de streak (dias consecutivos com registro)

### Lógica de insight
- [ ] Algoritmo de seleção de insight principal
- [ ] Priorização por relevância/urgência
- [ ] Geração de copy contextual

### Navegação temporal
- [ ] State de data selecionada
- [ ] Bloqueio de datas futuras
- [ ] Atualização de todos os blocos ao mudar data

### Zero Data Experience
- [ ] Detecção de `hasMinimumData`
- [ ] Checklist com estado de cada item
- [ ] Navegação para Chat/Importar

### Integração com Chat
- [ ] Deep link para Chat com contexto
- [ ] Passagem de sugestões contextuais

