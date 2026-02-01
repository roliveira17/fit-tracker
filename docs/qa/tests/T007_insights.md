# T007: Visualizar Insights

## Metadados

| Campo | Valor |
|-------|-------|
| **ID** | T007 |
| **Nome** | Visualizar Insights |
| **Prioridade** | P1 - Core |
| **Feature** | Insights - Dashboard de Dados |
| **Status** | pendente |

## Arquivos Relacionados

- `app/insights/page.tsx` - Página principal de insights
- `components/insights/LineChart.tsx` - Gráfico de linha (peso)
- `components/insights/BarChart.tsx` - Gráfico de barras (calorias, proteína)
- `components/insights/StatCard.tsx` - Cards de estatísticas
- `components/insights/InsightText.tsx` - Insights textuais
- `lib/storage.ts` - Funções de leitura de dados

## Pré-condições

1. App rodando em `localhost:3000`
2. Usuário com onboarding completo (localStorage configurado)

## Fluxo do Teste

### Etapa 1: Estado Vazio
1. Acessar `/insights` sem dados
2. Verificar empty state com botão "Ir para o Chat"

### Etapa 2: Com Dados de Peso
1. Configurar dados de peso no localStorage
2. Verificar que LineChart é exibido
3. Verificar StatCard "Último peso"

### Etapa 3: Com Dados de Refeições
1. Configurar dados de refeições no localStorage
2. Verificar que BarChart de calorias é exibido
3. Verificar StatCard "Média kcal"

### Etapa 4: StatCards
1. Verificar que exibe: Último peso, Treinos, Média kcal
2. Se houver BF, verifica StatCard de Body Fat

### Etapa 5: Troca de Período
1. Testar seleção de 7, 14, 30 dias
2. Verificar que dados atualizam

### Etapa 6: Insights Gerados
1. Configurar dados que geram insights
2. Verificar que InsightText aparece
3. Testar regras: déficit, superávit, proteína, treinos

## Resultado Esperado

- Empty state quando não há dados
- Gráficos exibidos corretamente
- StatCards com valores agregados
- Troca de período funciona
- Insights gerados corretamente

## Regras de Insights

| Condição | Tipo | Título |
|----------|------|--------|
| Peso < -0.5kg | positive | "Peso em queda" |
| Peso > +0.5kg | warning | "Peso em alta" |
| Peso estável (>=5 dias) | neutral | "Peso estável" |
| Déficit > 30% BMR | warning | "Déficit muito agressivo" |
| Déficit 10-25% BMR | positive | "Déficit saudável" |
| Superávit | info | "Superávit calórico" |
| Proteína < 50g | warning | "Proteína baixa" |
| Proteína >= 100g | positive | "Boa ingestão de proteína" |
| Treinos >= 3 | positive | "Treinos consistentes" |
| 0 treinos | neutral | "Sem treinos registrados" |

## Código Playwright

Arquivo: `tests/e2e/T007_insights.spec.ts`
