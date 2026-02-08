# PRD Backend Master — Fit Track v3

> Documento master para implementação do backend Supabase do Fit Track.
> Gerado em: 2026-01-26

---

## 1. Visão Geral

### 1.1 Objetivo
Migrar o Fit Track de localStorage para Supabase, habilitando:
- Persistência robusta em PostgreSQL
- Multi-device (PC + celular via mesma conta)
- Autenticação social (Google + Apple)
- Preparação para ingestão de dados externos (Apple Health, Hevy)

### 1.2 Escopo v3
| Incluído | Excluído |
|----------|----------|
| Database PostgreSQL | Push notifications robustas (v4) |
| Auth Supabase (Google/Apple) | Migração de dados do localStorage |
| RLS por usuário | Sync offline-first complexo |
| CRUD via PostgREST | API externa de alimentos |
| RPC para lógica complexa | Criptografia adicional |
| Importação Apple Health/Hevy | |
| Tabela de alimentos local | |

### 1.3 Princípios Mantidos
- **Chat-first:** Backend serve o Chat, não o substitui
- **Importação complementa:** Dados importados podem ser corrigidos via Chat
- **Regra de duplicidade:** Mais detalhado + mais recente
- **Controle do usuário:** Nenhuma ação automática sem consentimento

---

## 2. Arquitetura

### 2.1 Stack
```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│              Next.js + Supabase Client                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Auth       │  │  PostgREST  │  │  Storage    │     │
│  │  (OAuth)    │  │  (API auto) │  │  (arquivos) │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                           │                             │
│                           ▼                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │              PostgreSQL + RLS                    │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │ Tables  │ │ RPC Fns │ │ Triggers│           │   │
│  │  └─────────┘ └─────────┘ └─────────┘           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Decisões Técnicas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| API Layer | PostgREST + RPC | CRUD simples via PostgREST, lógica complexa em SQL functions |
| Auth | Supabase Auth nativo | Integração RLS perfeita, menos código |
| Séries temporais | Agregados + sleep stages | HR média/dia, sleep com stages detalhados |
| Fonte da verdade | Chat sobrescreve | Simplicidade, sem versioning |
| Importação | 1 chamada (direto) | Sem preview no backend |
| Alimentos | Tabela Supabase | Controlado, extensível |
| BMR | Função SQL | Atualiza com idade |
| Soft-delete | Não | Delete real, simplicidade |

---

## 3. Documentos Relacionados

| Documento | Descrição |
|-----------|-----------|
| [roadmap.md](./roadmap.md) | Prioridades e milestones |
| [data-model.md](./data-model.md) | ERD, tabelas, constraints |
| [auth-and-rls.md](./auth-and-rls.md) | Autenticação e políticas RLS |
| [api-contracts.md](./api-contracts.md) | Contratos frontend ↔ backend |
| [ingestion-prep.md](./ingestion-prep.md) | Preparação para importação |
| [mcp-execution-steps.md](./mcp-execution-steps.md) | Passo a passo executável |

---

## 4. Métricas de Sucesso

| Métrica | Alvo |
|---------|------|
| Latência CRUD | < 200ms p95 |
| Latência RPC (insights) | < 500ms p95 |
| Uptime Supabase | > 99.9% |
| Dados corrompidos | 0 |
| Vazamento RLS | 0 |

---

## 5. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| RLS mal configurado | Baixa | Alto | Testar policies com múltiplos users antes de prod |
| SQL functions lentas | Média | Médio | Usar EXPLAIN ANALYZE, criar índices |
| Migração NextAuth quebra sessões | Média | Baixo | Usuários fazem novo login (dados começam limpos) |
| Free tier insuficiente | Baixa | Baixo | 500MB é suficiente para 1 usuário por anos |

---

## 6. Fora do Escopo (Futuro)

- **v4:** Push notifications robustas (servidor)
- **v4:** API externa de alimentos (Nutritionix)
- **v5:** Sync offline-first
- **v5:** Backup automático
