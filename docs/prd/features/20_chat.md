# PRD — Chat

> **Dependências:** `00_MASTER.md`, `01_GLOSSARIO.md`, `02_ARQUITETURA.md`
> **Relacionado:** `10_onboarding.md` (origem), `40_home.md` (integração)
> **Posição:** Tab default — core do produto

---

## 1. Objetivo

Ser o **principal ponto de interação** entre usuário e Fit Track, permitindo:
- registro natural de informações do dia a dia
- simulações e projeções antes de registrar
- análises pontuais baseadas no histórico
- recomendações práticas e contextualizadas

> O Chat substitui formulários, botões de input e fluxos complexos.

---

## 2. Papel Conceitual

| Papel | Descrição |
|-------|-----------|
| **Primário** | Diário inteligente (registro primeiro) |
| **Secundário** | Analista e coach sob demanda |

### Regra-mãe
> O Chat entende quando o usuário está **declarando**, **perguntando**, **simulando** ou **refletindo**.

---

## 3. Tipos de Input (v1)

### 3.1 Alimentação (prioridade máxima)

**Exemplos:**
- "Comi 60g de arroz"
- "Tomei um Moving"
- "Almocei frango, arroz e salada"

**Comportamento:**
- Declaração factual → registra automaticamente
- Marca recorrente → sugerir salvar como padrão (uma vez)

### 3.2 Exercício

**Exemplos:**
- "Treinei costas e bíceps"
- "Fiz cardio 40 minutos"

**Comportamento:**
- Registra como evento livre
- Não exige estrutura de sets/reps

### 3.3 Estados subjetivos

**Exemplos:**
- "Dormi mal"
- "Estou muito cansado"

**Comportamento:**
- Registra o estado
- Faz **uma** pergunta de follow-up contextual:
  > "Quer me dizer o motivo?"

### 3.4 Peso / BF

**Exemplos:**
- "Peso hoje 77.6"
- "BF 23.7%"

**Comportamento:**
- Registra imediatamente

### 3.5 Perguntas e Simulações

**Exemplos:**
- "Se eu comer o mesmo do almoço, como fica?"
- "Se eu jantar 150g de carne, bato proteína?"

**Comportamento:**
- **Nunca** registra automaticamente
- Calcula cenário
- Mostra resultado
- Pergunta confirmação explícita antes de registrar

---

## 4. Regras de Registro (core logic)

| Tipo de mensagem | Registrar auto | Confirmar |
|------------------|----------------|-----------|
| Declaração factual | ✓ Sim | Não |
| Estado subjetivo | ✓ Sim | Pergunta follow-up |
| Pergunta/simulação | ✗ Não | Sim (antes de registrar) |
| Correção | ✓ Atualiza | Não |

(ver `01_GLOSSARIO.md#6` para definições)

---

## 5. Correções

- Sempre por texto natural
- Exemplo:
  > "Não, foram 80g, não 60g"

**Comportamento:**
- Atualiza o último registro relacionado
- Confirma implicitamente pela resposta

---

## 6. Sugestões de Ações (Chips)

### Quando aparecem
- Quando não há input recente
- Após respostas analíticas

### Formato
- Componente `ChipGroup` (ver `02_ARQUITETURA.md#4.3`)
- Texto curto, orientado a ação

**Exemplos:**
- "Registrar refeição"
- "Como ficou meu déficit hoje?"
- "Registrar peso"

---

## 7. Proatividade

> O Chat **nunca** inicia mensagens sozinho.
(ver `00_MASTER.md#5`)

- Nenhum push
- Nenhuma interrupção
- Apenas reação ao input do usuário

---

## 8. Tom e Linguagem

| Fazer | Evitar |
|-------|--------|
| Direto | Frases motivacionais genéricas |
| Humano | Linguagem infantilizada |
| Técnico quando necessário | Jargão desnecessário |

**Exemplo bom:**
> "Proteína abaixo do alvo. Caso coma 150g de carne como no jantar de hoje, você bate a meta."

---

## 9. Memória (v1)

(ver `00_MASTER.md#6` para regras globais)

### Fluxo de salvamento

```
1. Usuário registra alimento recorrente
2. Chat pergunta: "Quer que eu salve isso como padrão?"
3. Se confirmado, salva:
   - nome
   - marca
   - porção padrão
   - macros
4. Uso futuro: sugerir repetições
```

---

## 10. Áudio

| Entrada | Processamento | Saída |
|---------|---------------|-------|
| Áudio do usuário | Transcrito para texto | Resposta sempre em texto (v1) |

---

## 11. Estados

| Estado | Descrição |
|--------|-----------|
| Idle | Aguardando input |
| Processando | Interpretando mensagem |
| Registrado | Confirmação de registro |
| Simulação | Resultado sem registro |
| Confirmação | Aguardando OK para registrar |
| Erro | Pedir esclarecimento |

---

## 12. Fora do Escopo (v1)

- Chat com foto
- Voz de resposta
- Push notifications
- Autonomia total da AI

(ver `00_MASTER.md#7` para lista completa)

---

## 13. Métricas de Sucesso

| Métrica | Alvo |
|---------|------|
| Uso recorrente do Chat | > 5x/semana |
| Taxa de correção repetida | < 10% |
| Conversão simulação → registro | > 50% |

---

## 14. Checklist de Implementação

### Componentes necessários
- [ ] `ChatInput` (texto + botão áudio)
- [ ] `ChatMessage` (mensagem do usuário)
- [ ] `ChatResponse` (resposta da AI)
- [ ] `ChipGroup` (sugestões)
- [ ] `LoadingSpinner` (processando)
- [ ] `Toast` (feedback de registro)

### Lógica de interpretação
- [ ] Classificador de tipo de mensagem (declaração/pergunta/simulação/correção)
- [ ] Parser de alimentação (alimento, quantidade, macros)
- [ ] Parser de exercício (tipo, duração)
- [ ] Parser de peso/BF
- [ ] Parser de estados subjetivos
- [ ] Detector de correção

### Lógica de registro
- [ ] Criar `Meal` + `MealItem`
- [ ] Criar `Workout`
- [ ] Criar `WeightLog`
- [ ] Criar `BodyFatLog`
- [ ] Update em correção

### Simulações
- [ ] Cálculo de cenário calórico
- [ ] Cálculo de meta de proteína
- [ ] Fluxo de confirmação antes de registrar

### Memória
- [ ] Detecção de alimento recorrente
- [ ] Prompt de salvamento
- [ ] Storage de alimentos salvos
- [ ] Sugestão de repetição

### Áudio
- [ ] Captura de áudio
- [ ] Integração com transcription API
- [ ] Processamento do texto transcrito

### Integrações
- [ ] API de LLM para interpretação
- [ ] Base de dados nutricional (lookup de macros)

