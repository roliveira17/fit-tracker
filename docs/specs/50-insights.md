# PRD — Insights & Trends

> **Dependências:** `00_MASTER.md`, `01_GLOSSARIO.md`, `02_ARQUITETURA.md`
> **Relacionado:** `30_importacao.md` (fonte de séries temporais), `40_home.md` (complementar)
> **Posição:** Tab — "Insights"

---

## 1. Objetivo

Permitir **leitura rápida e visual** da evolução recente do usuário.

| Função | Descrição |
|--------|-----------|
| Principal | Avaliação semanal |
| Secundária | Responder perguntas que o Chat não resolve bem visualmente |

> Insights **não substituem** o Chat nem a Home. Eles aprofundam a análise.

---

## 2. Filosofia de Design

| Princípio | Aplicação |
|-----------|-----------|
| Leitura rápida | Mensagem principal em poucos segundos |
| Poucos gráficos | Bem escolhidos, não decorativos |
| Zero customização (v1) | Nada configurável pelo usuário |
| Visual técnico | Limpo, sem distrações |

---

## 3. Domínios (v1)

### 3.1 Peso & Body Fat

| Elemento | Tipo |
|----------|------|
| Peso diário | Gráfico de linha |
| BF | Último valor (se existir) |

**Regras:**
- Peso é a métrica principal
- BF aparece como dado complementar, não em gráfico dedicado

**Componente:** `LineChart` (ver `02_ARQUITETURA.md#4.5`)

---

### 3.2 Nutrição

| Elemento | Tipo |
|----------|------|
| Calorias consumidas/dia | Gráfico de barras |
| Proteína consumida/dia | Gráfico de barras |

**Regras:**
- Gráficos separados para clareza
- Destaque visual para dias fora da meta

**Componente:** `BarChart` (ver `02_ARQUITETURA.md#4.5`)

---

### 3.3 Balanço Energético

| Elemento | Tipo |
|----------|------|
| Déficit/superávit diário | Gráfico de barras (positivo/negativo) |
| Tendência semanal | Linha de tendência sobreposta |

**Regras:**
- Sempre baseado em TDEE (estimado ou real)
- Estimativas devem ter indicador visual

---

## 4. Horizonte Temporal

| Opção | Descrição |
|-------|-----------|
| **Padrão** | Últimos 7 dias |
| Alternativa 1 | Últimos 14 dias |
| Alternativa 2 | Últimos 30 dias |

**Regras:**
- Troca rápida via toggle/selector
- Atualiza **todos** os gráficos simultaneamente

---

## 5. Gráfico vs Número (decisão UX)

### Sempre em gráfico
- Peso (tendência visual importa)
- Calorias (padrão diário importa)
- Déficit/superávit (evolução importa)

### Número + contexto (sem gráfico)
- Body Fat (varia pouco, não precisa de tendência diária)
- Proteína média (aderência é mais importante que tendência)

**Justificativa:**
- Peso e energia dependem de tendência visual
- BF e proteína são melhor interpretados como valores únicos

---

## 6. Séries Temporais

(ver `01_GLOSSARIO.md#séries-temporais`)

- Séries completas (peso bruto, ingestão por refeição) **não aparecem diretamente**
- Disponíveis apenas em **drill-down**
- Insights usam dados agregados

---

## 7. Insights Explicativos

Cards com observações baseadas em dados, misturados entre os gráficos.

**Exemplos:**
- "Peso estável apesar de déficit médio nos últimos 7 dias"
- "Consumo de proteína abaixo da meta em 4 de 7 dias"

**Regras:**
- Sempre baseados em dados
- Linguagem direta e técnica
- Sem tom motivacional (ver `00_MASTER.md#3`)

**Componente:** `InsightCard` (ver `02_ARQUITETURA.md#4.2`)

---

## 8. Interação e Drill-down

(ver `01_GLOSSARIO.md#drill-down`)

| Ação | Resultado |
|------|-----------|
| Clique em gráfico | Abre visualização detalhada do domínio |
| Drill-down | Acesso às séries temporais |
| ⚠️ | **Não** abre Chat automaticamente |

---

## 9. Estados

| Estado | Descrição |
|--------|-----------|
| Loading | Carregando dados |
| Sem dados suficientes | Mensagem clara |
| Dados parciais | Exibe gráficos possíveis |
| Dados completos | Todos os domínios populados |

Mensagens devem ser claras e objetivas.

---

## 10. Fora do Escopo (v1)

- Comparações explícitas (mês vs mês)
- Filtros customizados
- Exportação de dados
- Insights automáticos fora da tela (push)

---

## 11. Métricas de Sucesso

| Métrica | Alvo |
|---------|------|
| Usuário entende evolução semanal rapidamente | < 30 segundos |
| Insights complementam o Chat | feedback qualitativo |
| Baixa necessidade de explicação | < 10% consultas ao suporte |

---

## 12. Checklist de Implementação

### Componentes necessários
- [ ] `ScreenContainer` (layout)
- [ ] `Header` com selector de período
- [ ] `LineChart` (peso)
- [ ] `BarChart` (calorias, proteína, balanço)
- [ ] `TrendIndicator` (linha de tendência)
- [ ] `InsightCard` (observações textuais)
- [ ] Modal/tela de drill-down

### Lógica de dados
- [ ] Agregação de `WeightLog` por período
- [ ] Agregação de `Meal` → calorias/dia
- [ ] Agregação de `Meal` → proteína/dia
- [ ] Cálculo de déficit/superávit diário
- [ ] Cálculo de tendência (regressão linear simples)
- [ ] Fetch de `BodyFatLog` mais recente

### Lógica de insights
- [ ] Detecção de peso estável vs déficit
- [ ] Detecção de dias abaixo da meta de proteína
- [ ] Detecção de padrões de balanço energético
- [ ] Geração de copy para cada insight

### Horizonte temporal
- [ ] Toggle 7/14/30 dias
- [ ] Recálculo de todos os gráficos ao trocar
- [ ] Persistência da preferência (session)

### Drill-down
- [ ] Tela de detalhe por domínio
- [ ] Exibição de séries temporais brutas
- [ ] Navegação de volta

### Estados
- [ ] Detecção de dados mínimos por domínio
- [ ] Exibição parcial quando possível
- [ ] Mensagens de estado vazias

