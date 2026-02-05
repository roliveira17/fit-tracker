# PRD — Importação de Dados

> **Dependências:** `00_MASTER.md`, `01_GLOSSARIO.md`, `02_ARQUITETURA.md`
> **Relacionado:** `20_chat.md` (fonte de correções), `60_profile.md` (reprocessamento)
> **Posição:** Tab dedicada — "Importar"

---

## 1. Objetivo

Reduzir trabalho manual através de importação de dados externos.

| Objetivo | Descrição |
|----------|-----------|
| Primário | Reduzir trabalho manual |
| Secundário | Validar e enriquecer dados do Chat |

> A importação **nunca compete** com o Chat como ponto principal de input.
(ver `00_MASTER.md#3`)

---

## 2. Papel no Produto

A importação existe para:
- popular histórico automaticamente
- reduzir dependência de registro manual
- enriquecer análises e projeções do Chat

---

## 3. Fontes Suportadas (v1)

### Apple Health

| Aspecto | Valor |
|---------|-------|
| Formato | export ZIP (XML) |
| Conteúdo | cardio, sono, peso, BF, séries temporais |

(ver mapeamento completo em `02_ARQUITETURA.md#6.1`)

### Hevy

| Aspecto | Valor |
|---------|-------|
| Formato | CSV |
| Conteúdo | sessões de musculação, exercícios, sets, reps, carga |

(ver mapeamento completo em `02_ARQUITETURA.md#6.2`)

### Fora do escopo (v1)
- Strava
- Integrações via API direta

---

## 4. UI — Estado Padrão

```
┌─────────────────────────────────────────┐
│         Importar dados                  │
│─────────────────────────────────────────│
│                                         │
│     [ Arraste o arquivo aqui ]          │
│               ou                        │
│       [ Selecionar arquivo ]            │
│                                         │
│     Formatos aceitos:                   │
│     • Apple Health (export.zip)         │
│     • Hevy (CSV)                        │
│                                         │
└─────────────────────────────────────────┘
```

Usar componente `FileDropzone` (ver `02_ARQUITETURA.md#4.3`)

---

## 5. UI — Histórico de Importações

Exibido abaixo da área de upload:

| Coluna | Descrição |
|--------|-----------|
| Data | Quando foi importado |
| Fonte | Apple Health / Hevy |
| Status | sucesso / parcial / erro |

---

## 6. Feedback Durante Importação

### Durante o processo
- Indicador de progresso (`LoadingSpinner`)
- Mensagem de status atual

### Ao final — Sucesso

```
┌─────────────────────────────────────────┐
│  ✓ Importação concluída                 │
│─────────────────────────────────────────│
│  Sono: 14 noites                        │
│  Cardio: 8 sessões                      │
│  Peso: 12 registros                     │
│                                         │
│  [ Ver detalhes ]                       │
└─────────────────────────────────────────┘
```

### Ao final — Parcial

```
┌─────────────────────────────────────────┐
│  ⚠ Importação parcial                   │
│─────────────────────────────────────────│
│  Importados:                            │
│  • Sono: 14 noites                      │
│  • Cardio: 8 sessões                    │
│                                         │
│  Avisos:                                │
│  • 3 registros de sono ignorados        │
│  • 2 duplicatas detectadas              │
│                                         │
│  [ Ver detalhes ]                       │
└─────────────────────────────────────────┘
```

---

## 7. Importações Parciais

O sistema deve aceitar:
- apenas Apple Health
- apenas Hevy
- ambos
- arquivos incompletos

> Não exigir conteúdo mínimo.

---

## 8. Duplicidade e Prioridade

(ver `00_MASTER.md#4.2` para regra-mãe)

| Critério | Prioridade |
|----------|------------|
| Registros com séries temporais | Alta |
| Dados corrigidos via Chat | Máxima (nunca sobrescrever) |
| Importações repetidas | Detectar e ignorar duplicatas |

---

## 9. Séries Temporais

(ver `01_GLOSSARIO.md#séries-temporais`)

- Sempre importadas quando disponíveis
- Nunca editáveis manualmente
- Utilizadas para cálculo de resumos
- Visíveis apenas em drill-down (Insights)

---

## 10. Tratamento de Erros

| Princípio | Comportamento |
|-----------|---------------|
| Importar o máximo possível | Não bloquear importação inteira por erro parcial |
| Avisar claramente | Listar arquivos inválidos e registros não lidos |

**Exemplo de mensagem:**
> "Não foi possível ler 3 registros de sono. O restante foi importado com sucesso."

---

## 11. Reprocessamento (v1)

(ver também `60_profile.md` — seção Avançado)

| Aspecto | Valor |
|---------|-------|
| Opção | Apagar dados importados e reimportar |
| Ação | Manual |
| Escopo | Apenas dados importados |
| Preserva | Dados do Chat |
| Local | Configuração avançada na tab Importar |

---

## 12. Estados da Tela

| Estado | Descrição |
|--------|-----------|
| Idle | Sem importações recentes |
| Importando | Processando arquivo |
| Sucesso | Tudo importado |
| Sucesso parcial | Importado com avisos |
| Erro | Falha crítica |

(ver `01_GLOSSARIO.md#5` para definições de estados)

---

## 13. Fora do Escopo (v1)

- Reprocessamento automático
- Importação em background
- Integração direta via API
- Strava

---

## 14. Métricas de Sucesso

| Métrica | Alvo |
|---------|------|
| Taxa de importação sem erro crítico | > 95% |
| Usuário entende o que foi importado | feedback qualitativo |
| Redução de inputs manuais | mensurável via analytics |

---

## 15. Checklist de Implementação

### Componentes necessários
- [ ] `FileDropzone` (drag & drop + seleção)
- [ ] `LoadingSpinner` com progresso
- [ ] `SuccessSummary` (resumo de importação)
- [ ] `ErrorMessage` (avisos e erros)
- [ ] Lista de histórico de importações

### Lógica de parsing — Apple Health
- [ ] Unzip do arquivo
- [ ] Parser XML
- [ ] Extração de workouts → `CardioSession`
- [ ] Extração de sono → `SleepSession` + `SleepStage`
- [ ] Extração de peso → `WeightLog`
- [ ] Extração de BF → `BodyFatLog`
- [ ] Extração de séries temporais → `TimeSeries`

### Lógica de parsing — Hevy
- [ ] Parser CSV
- [ ] Extração de sessões → `Workout`
- [ ] Extração de sets → `WorkoutSet`

### Lógica de duplicidade
- [ ] Detecção de registros duplicados (mesmo timestamp + tipo)
- [ ] Comparação de detalhe (manter mais completo)
- [ ] Preservação de dados do Chat
- [ ] Relatório de duplicatas ignoradas

### Lógica de erro
- [ ] Try/catch por registro individual
- [ ] Acumulador de erros
- [ ] Geração de relatório de erros
- [ ] Continuação da importação após erro parcial

### Reprocessamento
- [ ] Botão de apagar dados importados
- [ ] Confirmação explícita
- [ ] Deleção seletiva (apenas `source != 'chat'`)
- [ ] Trigger de nova importação

### Persistência
- [ ] Salvar histórico de importações
- [ ] Atualizar `lastImportDate` no estado global
- [ ] Atualizar `importSources` no estado global

