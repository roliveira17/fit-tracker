# PRD — Onboarding

> **Dependências:** `00_MASTER.md`, `01_GLOSSARIO.md`, `02_ARQUITETURA.md`
> **Relacionado:** `20_chat.md` (destino final do fluxo)

---

## 1. Objetivo

Criar confiança, explicar o valor do Fit Track e coletar dados mínimos para:
- identificar o usuário
- calcular BMR e estimar TDEE (ver `01_GLOSSARIO.md`)
- habilitar uso imediato do Chat

---

## 2. Fluxo Geral

```
Boas-vindas/Login → Feature Tour (4 telas) → Perfil Básico → Chat
```

---

## 3. Tela: Boas-vindas / Login

### Conteúdo

| Elemento | Valor |
|----------|-------|
| Logo | Fit Track |
| Headline | "Seu corpo, explicado por dados reais" |
| Subheadline | "Treino, sono e alimentação em um só lugar, com AI." |

### Ações

| Botão | Comportamento |
|-------|---------------|
| Continuar com Apple | Login social, cria conta vinculada |
| Continuar com Google | Login social, cria conta vinculada |
| Continuar sem login | Cria perfil local migrável |

### Regras
- Nenhuma permissão solicitada aqui
- Sucesso → Feature Tour

### Estados
- Loading
- Erro de autenticação (mensagem clara)
- Sucesso

---

## 4. Feature Tour (obrigatório)

> Não pode ser pulado. Exibido apenas na primeira sessão.

### Tela 1 — Dados reais
- **Título:** Todos os seus dados, sem ruído
- **Texto:** Importamos Apple Health, sono e cardio completos, incluindo séries temporais. Nada de médias enganosas.

### Tela 2 — Evolução e performance
- **Título:** Veja o progresso que realmente importa
- **Texto:** Evolução mensal de cardio, sono, peso e balanço energético com alertas inteligentes.

### Tela 3 — AI como coach
- **Título:** Um coach direto, baseado em dados
- **Texto:** Fale com o Fit Track por texto ou áudio. Ele registra, analisa e recomenda com base no seu histórico.

### Tela 4 — Controle total
- **Título:** Você no controle
- **Texto:** Importação manual quando quiser. Seus dados permanecem privados.

### Ação final
- Botão: **Começar** → Perfil Básico

---

## 5. Tela: Perfil Básico

### Campos

| Campo | Tipo | Validação |
|-------|------|-----------|
| Nome | texto | obrigatório |
| Gênero | select | Masculino, Feminino, Prefiro não informar |
| Data de nascimento | date | idade mínima 13 anos |
| Altura | number (cm) | > 120 cm |
| Peso atual | number (kg) | > 35 kg |

### Defaults
- Unidades: kg, cm, kcal
- Timezone: automático (browser)

### Regras
- Dados usados para cálculo de BMR (Mifflin-St Jeor)
- TDEE inicial estimado, ajustado depois por dados reais
- Ver fórmulas em `02_ARQUITETURA.md#7`

### Ação
- Botão: **Continuar** → App (Chat)

---

## 6. Entrada no App (pós-onboarding)

### Estado inicial
- Tab ativo: **Chat**
- Mensagem inicial da AI:
  > "Pode me dizer o que você comeu hoje, como foi seu treino ou como está se sentindo."

---

## 7. Fora do Escopo (v1)

(ver `00_MASTER.md#7` para lista completa)

Específico do onboarding:
- Configurações avançadas
- Importação durante onboarding
- Permissões de notificação

---

## 8. Métricas de Sucesso

| Métrica | Alvo |
|---------|------|
| % usuários que completam onboarding | > 80% |
| Tempo até primeiro input no Chat | < 2 min |
| Taxa de retorno no dia seguinte | > 40% |

---

## 9. Checklist de Implementação

### Componentes necessários
- [ ] `ScreenContainer` (layout)
- [ ] `Header` (layout)
- [ ] Botões de login social (Apple, Google)
- [ ] Botão secundário (modo local)
- [ ] Carousel/Stepper para Feature Tour
- [ ] Form de Perfil Básico
- [ ] Validações de campos

### Lógica
- [ ] Integração Apple Sign-In
- [ ] Integração Google Sign-In
- [ ] Criação de perfil local
- [ ] Cálculo de BMR no submit do perfil
- [ ] Persistência de `isOnboardingComplete`
- [ ] Navegação para Chat após conclusão

### Estados
- [ ] Loading states para login
- [ ] Tratamento de erro de autenticação
- [ ] Feedback visual de validação

