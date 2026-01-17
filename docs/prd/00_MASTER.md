# FIT TRACK — MASTER (v1)

> **Este documento é obrigatório em toda interação com LLM.**
> Sempre carregue junto: `01_GLOSSARIO.md` + `02_ARQUITETURA.md`

---

## 1. Visão do Produto

**Fit Track** é uma ferramenta pessoal, data-driven e premium para acompanhar alimentação, peso, sono e balanço energético, usando AI como diário inteligente.

O produto existe para:
- reduzir fricção de registro
- ajudar o usuário a pensar melhor sobre seus dados
- transformar dados brutos em decisões práticas

**Não é:** app social, gamificado ou motivacional.

---

## 2. Público-alvo

- Usuário único (self-use)
- Perfil analítico, orientado a dados
- Uso diário leve (chat) + análises semanais (insights)

---

## 3. Princípios Não Negociáveis

| # | Princípio | Implicação |
|---|-----------|------------|
| 1 | **Chat-first** | Todo input acontece via Chat. Nenhuma tela substitui o Chat como ponto de ação. |
| 2 | **Importação complementa** | Import reduz trabalho manual. Chat é fonte de correção e contexto. |
| 3 | **Pouca informação por tela** | Home e Insights são deliberadamente enxutos. |
| 4 | **Dados > motivação** | Linguagem direta. Sem frases vazias. |
| 5 | **Controle do usuário** | Nada automático sem ação explícita. Zero proatividade invasiva. |

---

## 4. Regras Globais de Dados

### 4.1 Fonte da verdade
- Chat tem prioridade para correções
- Importações **nunca** sobrescrevem correções manuais

### 4.2 Duplicidade (regra-mãe)
> Sempre manter o registro **mais detalhado e mais recente**

### 4.3 Séries temporais
- Sempre armazenadas quando disponíveis
- Nunca editáveis manualmente
- Usadas para agregações
- Visíveis apenas em drill-down (ver `01_GLOSSARIO.md`)

---

## 5. AI — Comportamento Global

- **Nunca** inicia conversa sozinha
- Responde apenas a input explícito
- Linguagem: direta, humana, técnica
- Sugestões aparecem apenas quando úteis (chips contextuais)

---

## 6. Memória da AI (v1)

| Aspecto | Regra |
|---------|-------|
| Escopo | Apenas alimentação |
| Gatilho | Apenas após confirmação explícita |
| Uso | Facilitar registro e sugestões de repetição |

---

## 7. Fora do Escopo (v1)

- Push notifications
- Chat com foto
- Integrações automáticas (API direta)
- Social / ranking
- Gamificação
- Exportação de dados
- Exclusão total de conta

---

## 8. Métricas de Sucesso (alto nível)

- Uso recorrente do Chat
- Redução de input manual
- Clareza percebida nos Insights
- Conversão: simulações → registros

---

## 9. Como Usar Este Documento com LLMs

### 9.1 Ordem de leitura obrigatória

```
1. 00_MASTER.md        ← você está aqui
2. 01_GLOSSARIO.md     ← definições de termos
3. 02_ARQUITETURA.md   ← navegação e componentes
4. [PRD específico]    ← feature a implementar
```

### 9.2 Regra de contexto

Sempre forneça os 3 documentos base (Master, Glossário, Arquitetura) **antes** de qualquer PRD específico.

### 9.3 Exemplo de prompt

```
Contexto base:
- [conteúdo do 00_MASTER.md]
- [conteúdo do 01_GLOSSARIO.md]
- [conteúdo do 02_ARQUITETURA.md]

Tarefa:
Gere tasks para implementar a feature descrita no PRD abaixo:
- [conteúdo do PRD específico]
```

### 9.4 Referências cruzadas

PRDs específicos usam notação `(ver 00_MASTER.md#seção)` para evitar redundância.

---

## 10. Mapa de PRDs

| # | Arquivo | Feature | Dependências |
|---|---------|---------|--------------|
| 10 | `10_onboarding.md` | Fluxo de entrada | — |
| 20 | `20_chat.md` | Core do produto | — |
| 30 | `30_importacao.md` | Upload de dados | 20_chat |
| 40 | `40_home.md` | Hub minimalista | 20_chat |
| 50 | `50_insights.md` | Tendências visuais | 30_importacao |
| 60 | `60_profile.md` | Configurações | 30_importacao |

