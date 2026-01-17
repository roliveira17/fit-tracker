# FIT TRACK — GLOSSÁRIO

> **Definições únicas para todo o projeto.**
> Sempre que um termo aparecer em qualquer PRD, a definição aqui é a oficial.

---

## 1. Termos de Negócio

### BMR (Basal Metabolic Rate)
Taxa metabólica basal. Calorias que o corpo gasta em repouso absoluto.
- Calculado via fórmula Mifflin-St Jeor
- Inputs: peso, altura, idade, gênero

### TDEE (Total Daily Energy Expenditure)
Gasto energético total diário. BMR + atividade física + termogênese.
- Estimado inicialmente pelo BMR
- Ajustado por dados reais de treino/cardio importados

### Déficit calórico
Diferença negativa entre calorias consumidas e TDEE.
- Déficit = Consumo - TDEE (quando negativo)
- Superávit = quando positivo

### BF (Body Fat)
Percentual de gordura corporal.
- Fonte: Apple Health ou registro manual
- Não é editável por séries temporais

### Balanço energético
Relação entre entrada (alimentação) e saída (TDEE) de energia.
- Exibido como déficit/superávit diário
- Base para projeções de peso

---

## 2. Termos de Dados

### Séries temporais
Dados granulares com timestamp, vindos de dispositivos (Apple Watch, etc.).
- Exemplos: frequência cardíaca minuto a minuto, stages de sono
- Nunca editáveis manualmente
- Usadas para cálculo de agregações
- Visíveis apenas em drill-down

### Importação parcial
Importação que não contém todos os tipos de dados.
- Exemplo: apenas sono, sem cardio
- Sistema aceita sem exigir completude

### Reprocessamento
Ação de apagar dados importados e reimportar do zero.
- Não afeta dados registrados via Chat
- Ação manual, nunca automática (v1)

### Duplicidade
Quando dois registros cobrem o mesmo evento/período.
- Regra-mãe: manter o mais detalhado e mais recente
- Dados do Chat têm prioridade sobre importações antigas

---

## 3. Termos de UX/UI

### Hub minimalista
Tela com poucos elementos, focada em orientação rápida.
- Home é um hub minimalista
- Não compete com dashboards detalhados

### Drill-down
Ação de clicar em um elemento para ver mais detalhes.
- Abre visualização expandida
- Não abre Chat automaticamente

### Card
Componente visual que agrupa informação relacionada.
- Possui headline + conteúdo
- Clicável (leva a drill-down ou Chat)

### Chip
Botão pequeno com texto curto, usado para ações rápidas.
- Estilo NotebookLM
- Exemplos: "Registrar refeição", "Ver déficit"

### Insight
Observação baseada em dados, exibida em linguagem natural.
- Exemplo: "Peso estável apesar de déficit nos últimos 7 dias"
- Sempre factual, nunca motivacional

### Bottom tabs
Navegação principal fixa na parte inferior da tela.
- 5 tabs: Chat, Home, Importar, Insights, Profile
- Chat é o tab default

### Feature tour
Sequência de telas explicativas no primeiro uso.
- Obrigatório, não pode ser pulado
- Exibido apenas uma vez

### Zero Data Experience
Estado da interface quando não há dados suficientes.
- Exibe checklist guiado
- Direciona para ações de preenchimento

---

## 4. Termos Técnicos

### Web first
Estratégia de desenvolvimento onde a versão web é prioritária.
- Mobile vem depois (ou como PWA)

### Dark-first
Tema escuro como padrão visual.
- Light opcional

### Park UI
Design system base do projeto.
- Componentes pré-definidos
- Estilo técnico e limpo

### Apple Health (export)
Arquivo ZIP contendo XML com dados de saúde do iPhone/Apple Watch.
- Conteúdo: workouts, sono, peso, cardio, séries temporais

### Hevy (export)
Arquivo CSV exportado do app Hevy.
- Conteúdo: sessões de musculação, exercícios, sets, reps, carga

---

## 5. Estados de Tela

| Estado | Descrição |
|--------|-----------|
| Loading | Carregando dados |
| Idle | Aguardando ação do usuário |
| Sem dados | Zero Data Experience |
| Dados parciais | Alguns dados disponíveis, outros não |
| Dados completos | Tudo preenchido |
| Sucesso | Ação concluída com êxito |
| Sucesso parcial | Ação concluída com avisos |
| Erro | Falha que impede continuidade |
| Processando | Ação em andamento (ex: importação) |

---

## 6. Tipos de Mensagem no Chat

| Tipo | Comportamento |
|------|---------------|
| Declaração factual | Registra automaticamente |
| Estado subjetivo | Registra + pergunta follow-up |
| Pergunta/simulação | Não registra, mostra resultado, pede confirmação |
| Correção | Atualiza registro existente |

