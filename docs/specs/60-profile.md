# PRD — Profile & Settings

> **Dependências:** `00_MASTER.md`, `01_GLOSSARIO.md`, `02_ARQUITETURA.md`
> **Relacionado:** `30_importacao.md` (reprocessamento), `10_onboarding.md` (dados iniciais)
> **Posição:** Tab — "Profile"

---

## 1. Objetivo

Centralizar controle, preferências e transparência.

| Função | Descrição |
|--------|-----------|
| Principal | Edição de dados pessoais e preferências |
| Secundária | Controle explícito sobre dados e importações |

> Não é uma tela de uso frequente. É uma tela de **governança pessoal**.

---

## 2. Filosofia

| Princípio | Aplicação |
|-----------|-----------|
| Simples | Poucas opções, bem organizadas |
| Explícito | Nada escondido |
| Sem opções desnecessárias | Só o que importa para v1 |

---

## 3. Estrutura (seções verticais)

```
┌─────────────────────────────────────────┐
│  1. Perfil                              │
│  2. Preferências                        │
│  3. Dados & Importações                 │
│  4. Privacidade                         │
│  5. Avançado                            │
└─────────────────────────────────────────┘
```

---

## 4. Seção: Perfil

### Campos editáveis

| Campo | Tipo | Impacto |
|-------|------|---------|
| Nome | texto | — |
| Gênero | select | Recalcula BMR |
| Data de nascimento | date | Recalcula BMR |
| Altura (cm) | number | Recalcula BMR |
| Peso atual (kg) | number | Recalcula BMR/TDEE |

### Regras
- Alterações atualizam cálculos de BMR/TDEE (ver `02_ARQUITETURA.md#7`)
- Mudanças **não** reprocessam histórico automaticamente
- Peso pode ser atualizado aqui, mas Chat continua sendo canal preferencial

---

## 5. Seção: Preferências

### Unidades (v1 — fixas)

| Tipo | Valor |
|------|-------|
| Peso | kg |
| Energia | kcal |
| Comprimento | cm |

> Outras unidades fora do escopo v1

### Timezone

| Aspecto | Valor |
|---------|-------|
| Default | Automático (browser) |
| Exibição | Timezone atual visível |
| Comportamento | Atualização dinâmica em viagens |

---

## 6. Seção: Dados & Importações

### Informações exibidas

| Info | Descrição |
|------|-----------|
| Última importação | Data e hora |
| Fontes ativas | Apple Health, Hevy |

### Ações

| Botão | Destino |
|-------|---------|
| Ir para Importar | Navega para tab Importar |

---

## 7. Seção: Privacidade

### Mensagem fixa

> "Seus dados pertencem a você. Nada é compartilhado sem sua ação explícita."

### Conteúdo
- Explicação curta sobre armazenamento
- Nenhuma opção de compartilhamento social

> Reforça princípio de controle do usuário (ver `00_MASTER.md#3`)

---

## 8. Seção: Avançado

### Reprocessamento (v1)

(ver também `30_importacao.md#11`)

| Elemento | Descrição |
|----------|-----------|
| Botão | "Apagar dados importados e reimportar" |
| Escopo | Apenas dados importados |
| Preserva | Dados registrados via Chat |
| Confirmação | Explícita (modal) |

---

## 9. Fora do Escopo (v1)

- Exportação de dados
- Exclusão total de conta
- Preferências avançadas de AI
- Customização de dashboards
- Outras unidades de medida

---

## 10. Estados

| Estado | Descrição |
|--------|-----------|
| Loading | Carregando dados do perfil |
| Dados atualizados | Feedback de sucesso |
| Erro de validação | Mensagem específica por campo |

---

## 11. Métricas de Sucesso

| Métrica | Alvo |
|---------|------|
| Usuário encontra configuração desejada | < 30 segundos |
| Nenhuma configuração essencial escondida | 0 reclamações |
| Baixa taxa de alterações acidentais | < 5% rollbacks |

---

## 12. Checklist de Implementação

### Componentes necessários
- [ ] `ScreenContainer` (layout)
- [ ] `Header` ("Profile")
- [ ] `SectionHeader` (separador de seções)
- [ ] `FormField` (campos editáveis)
- [ ] `SelectField` (gênero)
- [ ] `DatePicker` (nascimento)
- [ ] `NumberInput` (altura, peso)
- [ ] `InfoRow` (exibição de dados)
- [ ] `Button` (ações)
- [ ] `Modal` (confirmação de reprocessamento)
- [ ] `Toast` (feedback de sucesso/erro)

### Seção Perfil
- [ ] Form com todos os campos
- [ ] Validações (altura > 120, peso > 35, idade > 13)
- [ ] Trigger de recálculo BMR/TDEE ao salvar
- [ ] Feedback de sucesso

### Seção Preferências
- [ ] Exibição de unidades (read-only v1)
- [ ] Detecção de timezone do browser
- [ ] Exibição do timezone atual

### Seção Dados & Importações
- [ ] Fetch de `lastImportDate`
- [ ] Fetch de `importSources`
- [ ] Navegação para tab Importar

### Seção Privacidade
- [ ] Texto estático
- [ ] Nenhuma ação necessária

### Seção Avançado
- [ ] Botão de reprocessamento
- [ ] Modal de confirmação
- [ ] Lógica de deleção seletiva (source != 'chat')
- [ ] Feedback de conclusão

### Persistência
- [ ] Update de `User` no banco
- [ ] Trigger de recálculo de métricas derivadas

