# Roadmap Backend — Fit Track v3

> Prioridades e milestones para implementação do backend.

---

## Visão Geral

```
M1: Foundation     M2: Core Data      M3: Import         M4: Polish
(Auth + Profile)   (CRUD completo)    (Apple/Hevy)       (Otimização)
     │                  │                  │                  │
     ▼                  ▼                  ▼                  ▼
┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐
│ Supabase│       │ Tabelas │       │ Import  │       │ Índices │
│ Project │       │ + RLS   │       │ Functions│      │ + Perf  │
│ + Auth  │       │ + CRUD  │       │ + Dedup │       │ + Docs  │
└─────────┘       └─────────┘       └─────────┘       └─────────┘
```

---

## Milestone 1: Foundation (Auth + Profile)

**Objetivo:** Usuário consegue criar conta e salvar perfil.

### Tasks

| # | Task | Dependência | Prioridade |
|---|------|-------------|------------|
| 1.1 | Criar projeto Supabase | - | P0 |
| 1.2 | Configurar Auth (Google + Apple) | 1.1 | P0 |
| 1.3 | Criar tabela `profiles` | 1.1 | P0 |
| 1.4 | Criar RLS para `profiles` | 1.3 | P0 |
| 1.5 | Criar função `get_bmr()` | 1.3 | P1 |
| 1.6 | Integrar frontend com Supabase Auth | 1.2 | P0 |
| 1.7 | Substituir NextAuth por Supabase Auth | 1.6 | P0 |
| 1.8 | Ajustar Onboarding para criar profile | 1.4 | P0 |
| 1.9 | Ajustar Profile page para ler/editar | 1.4 | P0 |

### Critério de Conclusão
- [ ] Usuário faz login com Google
- [ ] Perfil é salvo no Supabase
- [ ] Perfil é carregado ao reabrir app

---

## Milestone 2: Core Data (CRUD)

**Objetivo:** Todas as entidades funcionam via Supabase.

### Tasks

| # | Task | Dependência | Prioridade |
|---|------|-------------|------------|
| 2.1 | Criar tabela `weight_logs` + RLS | M1 | P0 |
| 2.2 | Criar tabela `body_fat_logs` + RLS | M1 | P1 |
| 2.3 | Criar tabelas `meals` + `meal_items` + RLS | M1 | P0 |
| 2.4 | Criar tabelas `workouts` + `workout_sets` + RLS | M1 | P0 |
| 2.5 | Criar tabelas `sleep_sessions` + `sleep_stages` + RLS | M1 | P1 |
| 2.6 | Criar tabela `foods` + seed inicial | M1 | P0 |
| 2.7 | Criar função `get_home_summary()` | 2.1-2.4 | P0 |
| 2.8 | Criar função `get_insights()` | 2.1-2.5 | P0 |
| 2.9 | Ajustar Chat para salvar no Supabase | 2.1-2.4 | P0 |
| 2.10 | Ajustar Home para usar `get_home_summary()` | 2.7 | P0 |
| 2.11 | Ajustar Insights para usar `get_insights()` | 2.8 | P0 |
| 2.12 | Remover código de localStorage | 2.9-2.11 | P1 |

### Critério de Conclusão
- [ ] Registrar peso via Chat persiste no Supabase
- [ ] Registrar refeição via Chat persiste no Supabase
- [ ] Registrar treino via Chat persiste no Supabase
- [ ] Home exibe dados do Supabase
- [ ] Insights exibe gráficos do Supabase

---

## Milestone 3: Import (Apple Health + Hevy)

**Objetivo:** Importação funciona via backend com deduplicação.

### Tasks

| # | Task | Dependência | Prioridade |
|---|------|-------------|------------|
| 3.1 | Criar tabela `import_records` + RLS | M2 | P0 |
| 3.2 | Criar função `import_apple_health()` | 3.1 | P0 |
| 3.3 | Criar função `import_hevy()` | 3.1 | P1 |
| 3.4 | Ajustar frontend Import para chamar RPC | 3.2 | P0 |
| 3.5 | Testar deduplicação (import + chat) | 3.4 | P0 |
| 3.6 | Implementar reprocessamento (delete importados) | 3.1 | P1 |

### Critério de Conclusão
- [ ] Upload Apple Health importa dados no Supabase
- [ ] Duplicatas são ignoradas corretamente
- [ ] Histórico de importações é exibido

---

## Milestone 4: Polish

**Objetivo:** Otimização e documentação final.

### Tasks

| # | Task | Dependência | Prioridade |
|---|------|-------------|------------|
| 4.1 | Criar índices para queries frequentes | M3 | P1 |
| 4.2 | Testar RLS com múltiplos usuários | M3 | P0 |
| 4.3 | Medir latência e otimizar se necessário | 4.1 | P1 |
| 4.4 | Documentar variáveis de ambiente | M3 | P1 |
| 4.5 | Atualizar README com setup Supabase | 4.4 | P1 |

### Critério de Conclusão
- [ ] Todas queries < 500ms
- [ ] RLS testado e validado
- [ ] Documentação completa

---

## Resumo de Prioridades

| Prioridade | Significado | Tasks |
|------------|-------------|-------|
| **P0** | Bloqueia uso do app | 18 tasks |
| **P1** | Importante mas não bloqueia | 9 tasks |
| **Total** | | 27 tasks |

---

## Ordem de Execução Recomendada

```
1. Criar projeto Supabase (1.1)
2. Configurar Auth Google (1.2)
3. Criar profiles + RLS (1.3, 1.4)
4. Integrar Auth no frontend (1.6, 1.7)
5. Ajustar Onboarding (1.8)
   ─── M1 COMPLETO ───
6. Criar weight_logs, meals, workouts (2.1, 2.3, 2.4)
7. Criar foods + seed (2.6)
8. Ajustar Chat (2.9)
9. Criar get_home_summary (2.7)
10. Criar get_insights (2.8)
11. Ajustar Home e Insights (2.10, 2.11)
    ─── M2 COMPLETO ───
12. Criar import_records (3.1)
13. Criar import_apple_health (3.2)
14. Ajustar Import page (3.4)
15. Testar deduplicação (3.5)
    ─── M3 COMPLETO ───
16. Índices e otimização (4.1-4.5)
    ─── M4 COMPLETO ───
```

---

## Timeline Estimada

> **Nota:** Sem estimativas de tempo conforme solicitado. A ordem acima representa a sequência lógica de dependências.
