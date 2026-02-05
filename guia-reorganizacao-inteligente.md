# Guia de Reorganização Inteligente de Documentação

Você é um assistente especializado em organização de projetos de software. Sua tarefa é:

1. **Detectar** o tipo de projeto automaticamente
2. **Ler** toda a documentação existente
3. **Classificar** cada trecho na categoria correta
4. **Reorganizar** tudo na estrutura padronizada
5. **Gerar** o CLAUDE.md adaptado ao tipo de projeto

---

## FASE 0 — Detecção do Tipo de Projeto

Antes de qualquer reorganização, identifique o tipo de projeto. Rode os comandos abaixo e analise os resultados:

```bash
# 1. Listar arquivos de configuração na raiz
ls -la *.json *.yaml *.yml *.toml *.lock *.config.* 2>/dev/null

# 2. Verificar package.json ou equivalente
cat package.json 2>/dev/null | head -50
cat pubspec.yaml 2>/dev/null | head -30
cat Podfile 2>/dev/null | head -20
cat build.gradle 2>/dev/null | head -30
cat Cargo.toml 2>/dev/null | head -20
cat requirements.txt 2>/dev/null | head -20
cat Gemfile 2>/dev/null | head -20
cat go.mod 2>/dev/null | head -10

# 3. Verificar estrutura de diretórios
find . -maxdepth 2 -type d | grep -v node_modules | grep -v .git | grep -v __pycache__ | sort

# 4. Verificar arquivos-chave
ls -la app.json expo.json next.config.* nuxt.config.* vite.config.* angular.json vue.config.* 2>/dev/null
ls -la Dockerfile docker-compose.yml serverless.yml vercel.json netlify.toml 2>/dev/null
ls -la ios/ android/ macos/ windows/ 2>/dev/null
```

### Matriz de Detecção

Analise os sinais e classifique:

#### 📱 Mobile App
| Sinal | Framework |
|-------|-----------|
| `app.json` + `expo` em package.json | Expo (React Native) |
| `react-native` em dependencies + `ios/` e `android/` | React Native CLI |
| `pubspec.yaml` + `flutter` | Flutter |
| `*.xcodeproj` ou `*.xcworkspace` | iOS Nativo (Swift/ObjC) |
| `build.gradle` + `kotlin` ou `java` em `app/src/` | Android Nativo |
| `capacitor.config.ts` ou `ionic.config.json` | Ionic/Capacitor |

#### 🌐 Web App (Frontend)
| Sinal | Framework |
|-------|-----------|
| `next.config.*` | Next.js |
| `nuxt.config.*` | Nuxt.js |
| `vite.config.*` + `react` em dependencies | Vite + React |
| `vite.config.*` + `vue` em dependencies | Vite + Vue |
| `angular.json` | Angular |
| `svelte.config.*` | SvelteKit |
| `astro.config.*` | Astro |
| `remix.config.*` | Remix |

#### ⚙️ API / Backend
| Sinal | Framework |
|-------|-----------|
| `express` ou `fastify` ou `hono` em dependencies | Node.js API |
| `nestjs` em dependencies | NestJS |
| `manage.py` + `django` em requirements | Django |
| `flask` ou `fastapi` em requirements | Flask/FastAPI |
| `rails` em Gemfile | Ruby on Rails |
| `spring` em build.gradle | Spring Boot |
| `gin` ou `echo` ou `fiber` em go.mod | Go API |
| `actix` ou `axum` em Cargo.toml | Rust API |
| `serverless.yml` ou `sam.yml` | Serverless Functions |

#### 🔀 Fullstack / Monorepo
| Sinal | Framework |
|-------|-----------|
| `workspaces` em package.json | Monorepo npm/yarn |
| `turbo.json` | Turborepo |
| `nx.json` | Nx Monorepo |
| `pnpm-workspace.yaml` | pnpm Monorepo |
| Next.js/Nuxt com `api/` ou `server/` routes | Fullstack integrado |

#### 📦 Biblioteca / SDK
| Sinal | Framework |
|-------|-----------|
| `main` + `types` em package.json, sem `start` script | NPM Package |
| `setup.py` ou `pyproject.toml` com `[build-system]` | Python Package |
| `[lib]` em Cargo.toml | Rust Crate |

#### 🏗️ Infraestrutura / DevOps
| Sinal | Framework |
|-------|-----------|
| `*.tf` files | Terraform |
| `pulumi.*` | Pulumi |
| `helmfile.*` ou `Chart.yaml` | Kubernetes/Helm |
| `docker-compose.yml` sem código app | Docker Infra |

### Resultado da Detecção

Após a análise, declarar:

```
TIPO DE PROJETO DETECTADO: [Mobile App | Web App | API/Backend | Fullstack | Biblioteca | Infra]
FRAMEWORK: [nome e versão]
LINGUAGEM PRINCIPAL: [TypeScript | Python | Dart | Swift | Kotlin | Go | Rust | ...]
GERENCIADOR DE PACOTES: [npm | yarn | pnpm | pip | cargo | go mod | ...]
BANCO DE DADOS: [PostgreSQL | MySQL | MongoDB | SQLite | Firebase | Supabase | ...]
DEPLOY: [Vercel | AWS | GCP | App Store | Play Store | Docker | ...]
TESTES: [Jest | Vitest | Pytest | XCTest | Detox | Cypress | Playwright | ...]
```

Se o projeto for um **monorepo** com múltiplos tipos (ex: mobile + API), detectar cada subprojeto separadamente e gerar documentação para cada um.

---

## FASE 1 — Inventário de Documentação

```bash
find . -name "*.md" -o -name "*.txt" -o -name "*.doc" | grep -v node_modules | grep -v .git | grep -v __pycache__ | sort
```

Para cada arquivo, registrar:
- Caminho
- Conteúdo resumido (1 linha)
- Classificação: CLAUDE.md | ROADMAP | SPEC | ADR | LEARNING | CONTEXT | GLOSSÁRIO

---

## FASE 2 — Classificação de Conteúdo

### Regras de Classificação (universal, vale para todo tipo de projeto)

#### → CLAUDE.md
- Comandos de build, test, lint, deploy
- Regras de code style e convenções
- Mapa de diretórios do projeto
- Stack tecnológica
- Descrição curta do projeto
- Workflow do agente

#### → ROADMAP.md
- Features planejadas, em andamento, concluídas
- TODOs e tarefas pendentes
- Priorização
- Bugs conhecidos
- Milestones e deadlines

#### → docs/specs/[nome-feature].md
- Requisitos funcionais e não-funcionais de features
- Fluxos de usuário
- Regras de negócio de features
- Design de API endpoints
- Modelos de dados de features
- Critérios de aceitação

#### → docs/decisions/[NNN]-[titulo].md
- Escolhas tecnológicas e justificativas
- Trade-offs e alternativas descartadas
- Mudanças arquiteturais

#### → docs/learnings/o-que-funciona.md
- Padrões que deram certo
- Configurações otimizadas
- Atalhos úteis

#### → docs/learnings/armadilhas.md
- Bugs difíceis e soluções
- Limitações de libs/serviços
- Workarounds

#### → docs/context/business-context.md
- Modelo de negócio, público-alvo
- Métricas (CAC, LTV, conversão)
- Restrições regulatórias
- Sazonalidade

#### → docs/context/glossario.md
- Termos de domínio e definições
- Siglas e abreviações

---

## FASE 3 — Geração do CLAUDE.md Adaptado

Após detectar o tipo de projeto, gerar o CLAUDE.md combinando:
1. **Bloco UNIVERSAL** (vale para todo projeto)
2. **Bloco ESPECÍFICO** do tipo detectado

### Bloco UNIVERSAL (incluir sempre)

```markdown
## Princípios de Desenvolvimento

1. Simplicidade primeiro. Não abstrair prematuramente.
2. Código legível > código esperto.
3. Falhar rápido e explicitamente.
4. Menos código é melhor.
5. Fazer funcionar, fazer certo, fazer rápido. Nessa ordem.

## Code Style

- Strict typing, zero tipos genéricos (`any`, `dynamic`, `Object`).
- Named exports quando a linguagem suportar.
- Funções puras quando possível.
- Early returns para evitar nesting.
- Máximo ~20 linhas por função.
- Máximo 3 parâmetros. Se mais, usar objeto.
- Nomes descritivos, sem abreviações ambíguas.

## Tratamento de Erros

- Nunca catch vazio ou silencioso.
- Erros de negócio são tipados, não strings.
- Logar com contexto: { operação, entidade, id, erro }.
- Não expor detalhes internos em respostas ao usuário.

## Testes

- Testar comportamento, não implementação.
- Todo bug corrigido ganha teste de regressão ANTES do fix.
- Nomes descritivos: 'deve rejeitar pedido sem estoque'.
- Fixtures/factories para dados de teste.

## Git

- Conventional Commits: feat, fix, refactor, test, docs, chore.
- Commits atômicos — cada um compila e testa.
- Branch por feature/fix.
- Nunca commitar secrets, .env, dados pessoais.

## Segurança

- Input validation em toda fronteira.
- Secrets em variáveis de ambiente, nunca hardcoded.
- Dependências atualizadas, rodar audit regularmente.
- Principle of least privilege.

## Documentação do Projeto

- ROADMAP.md — Status e priorização
- docs/specs/ — Especificações de features
- docs/decisions/ — ADRs
- docs/learnings/ — Lições aprendidas
- docs/context/ — Contexto de negócio e glossário

Antes de implementar, ler spec. Ao finalizar, atualizar ROADMAP.md e learnings.

## Compact Instructions

Ao compactar, preservar:
- Arquivos modificados na sessão
- Comandos de teste que passaram/falharam
- Decisões tomadas e motivos
- Estado atual das tarefas
```

---

### Blocos ESPECÍFICOS por Tipo de Projeto

Incluir APENAS o bloco correspondente ao tipo detectado.

---

#### 📱 BLOCO: Mobile App

```markdown
## Mobile — Regras Específicas

### Comandos
- Documentar: start, build:ios, build:android, test, test:e2e, lint
- Documentar como rodar em simulador/emulador
- Documentar processo de build para stores (se existir)

### Arquitetura Mobile
- Documentar padrão de navegação (Stack, Tab, Drawer)
- Documentar gerenciamento de estado (Redux, Zustand, MobX, Provider, Riverpod)
- Documentar camada de storage local (AsyncStorage, MMKV, Hive, SQLite, SecureStore)
- Documentar lógica offline-first se existir

### UI/UX Mobile
- Touch targets mínimos de 44x44pt (iOS) / 48x48dp (Android).
- Respeitar Safe Areas (notch, home indicator, status bar).
- Feedback háptico para ações destrutivas.
- Skeleton screens em vez de spinners para loading.
- Otimizar listas longas com FlatList/RecyclerView/ListView virtualizado.
- Testar em tamanhos diferentes: SE (pequeno), padrão, Pro Max (grande).
- Dark mode: toda cor deve vir de theme, nunca hardcoded.
- Animações a 60fps. Mover para thread nativa quando possível (Reanimated, Lottie nativo).

### Performance Mobile
- Bundle size importa. Monitorar e manter enxuto.
- Imagens: usar formatos otimizados (WebP), caching com prefetch.
- Evitar re-renders desnecessários em listas.
- Memory leaks: limpar listeners, timers e subscriptions no cleanup.
- Medir startup time. Lazy load telas secundárias.
- Cuidado com uso de bateria (GPS, polling, background tasks).

### Navegação
- Deep linking configurado para todas as rotas principais.
- Back button behavior consistente (Android hardware back).
- Não perder estado ao navegar back.
- Modais para fluxos secundários, push para fluxos primários.

### Permissões e Device APIs
- Pedir permissões just-in-time, não tudo de uma vez.
- Sempre ter fallback para permissão negada.
- Camera, localização, notificações push: explicar POR QUE antes de pedir.

### Testes Mobile
- Testes unitários para lógica de negócio.
- Testes de componente para UI isolada.
- Testes E2E em simulador (Detox, Maestro, Patrol, XCUITest, Espresso).
- Testar fluxos offline e reconexão.
- Testar em iOS E Android antes de considerar pronto.

### Deploy Mobile
- App Store Review: 1-3 dias. Planejar releases com antecedência.
- Play Store Review: horas a 1 dia.
- Usar CodePush/EAS Update para hotfixes que não mudam nativo.
- Manter versão semântica sincronizada entre stores.
- Feature flags para rollout progressivo.
- Crashlytics/Sentry configurado desde o dia 1.
```

---

#### 🌐 BLOCO: Web App (Frontend)

```markdown
## Web App — Regras Específicas

### Comandos
- Documentar: dev, build, preview, lint, test, test:e2e, deploy

### Arquitetura Web
- Documentar padrão de rotas (file-based, config-based)
- Documentar estratégia de rendering (SSR, SSG, CSR, ISR)
- Documentar gerenciamento de estado
- Documentar padrão de data fetching (SWR, React Query, loader, server action)

### UI/UX Web
- Mobile-first responsive design.
- Breakpoints consistentes: sm (640), md (768), lg (1024), xl (1280).
- Acessibilidade WCAG 2.1 AA: labels, roles ARIA, navegação por teclado, contraste.
- Toda imagem tem alt text.
- Todo form tem labels associados (não placeholders como labels).
- Focus management correto em modais e dropdowns.
- Skip to content link para screen readers.

### Performance Web
- Core Web Vitals são meta: LCP < 2.5s, FID < 100ms, CLS < 0.1.
- Imagens: next/image ou equivalente com lazy loading e srcset.
- Fonts: preload, font-display: swap, subset.
- JavaScript: code splitting por rota. Dynamic imports para componentes pesados.
- CSS: Tailwind purge ou equivalente. Zero CSS não utilizado em produção.
- Prefetch de rotas prováveis (next/link prefetch, speculation rules).
- Cache headers corretos em assets estáticos.

### SEO (se aplicável)
- Metadata: title, description, og:image em toda página pública.
- Sitemap.xml e robots.txt configurados.
- URLs semânticas e legíveis.
- Structured data (JSON-LD) para conteúdo relevante.
- Canonical URLs para evitar duplicação.

### Autenticação Web
- Tokens em httpOnly cookies, nunca localStorage.
- CSRF protection ativa.
- Redirect loop prevention no middleware de auth.
- Session refresh silencioso antes de expirar.

### Testes Web
- Unit tests para hooks e utilitários.
- Component tests com Testing Library (testar como usuário interage).
- E2E com Playwright/Cypress para fluxos críticos.
- Visual regression para componentes de UI (se configurado).
- Testar em Chrome, Firefox, Safari. Mobile Chrome e Safari.

### Deploy Web
- Preview deployments para cada PR (Vercel, Netlify, Cloudflare).
- Environment variables diferentes por ambiente (dev, staging, prod).
- Health check endpoint.
- Rollback instantâneo disponível.
- CDN para assets estáticos.
- Monitoramento de erros (Sentry) desde o dia 1.
```

---

#### ⚙️ BLOCO: API / Backend

```markdown
## API/Backend — Regras Específicas

### Comandos
- Documentar: dev, build, test, test:integration, lint, migrate, seed, deploy

### Arquitetura API
- Documentar padrão: REST, GraphQL, gRPC, tRPC
- Documentar camadas: controller/handler → service → repository
- Documentar autenticação: JWT, session, API key, OAuth
- Documentar fila/workers se existir (BullMQ, Celery, Sidekiq)
- Documentar cache strategy (Redis, in-memory)

### API Design
- Substantivos no plural para recursos: /users, /orders.
- Verbos HTTP corretos: GET, POST, PUT/PATCH, DELETE.
- Status codes: 200, 201, 204, 400, 401, 403, 404, 422, 429, 500.
- Paginação: ?page=1&limit=20 com meta { total, page, limit }.
- Filtros como query params: ?status=active&createdAfter=2025-01-01.
- Versionamento no path: /v1/users.
- Formato de erro consistente: { error: { code, message, details? } }.
- Rate limiting em todos os endpoints públicos.
- Request/response sempre validados com schema (Zod, Joi, Pydantic, etc).

### Banco de Dados
- Migrations para toda alteração. Nunca DDL manual.
- Tabelas no plural, snake_case.
- Toda tabela: id, created_at, updated_at.
- Soft delete (deleted_at) para dados que não podem ser perdidos.
- Foreign keys com ON DELETE correto.
- Transações para operações multi-tabela.
- Índices nas colunas de WHERE, ORDER BY, JOIN.
- N+1: sempre eager loading ou joins.
- Paginação em toda listagem. Nunca SELECT * sem LIMIT.

### Segurança API
- Input validation em TODA rota (body, params, query, headers).
- Parameterized queries sempre. NUNCA interpolar SQL.
- Rate limiting e throttling.
- CORS restritivo com domínios explícitos.
- Helmet/security headers.
- Logs nunca contêm senhas, tokens, CPF, cartão.
- Secrets em env vars, nunca em código.
- Autenticação stateless (JWT) ou stateful (session) — documentar qual.

### Observabilidade
- Structured logging (JSON) com correlation ID por request.
- Health check endpoint: GET /health retorna 200 com status de dependências.
- Métricas: latência por endpoint, taxa de erro, throughput.
- Alertas para: error rate > 1%, latência P95 > 1s, serviço down.
- Tracing distribuído se arquitetura tem múltiplos serviços.

### Testes API
- Unit tests para services e lógica de negócio.
- Integration tests com banco real (testcontainers ou banco de teste).
- Contract tests se API é consumida por outros serviços.
- Load tests para endpoints críticos antes de lançar.
- Testar cenários de erro: timeout, banco fora, serviço externo fora.

### Deploy API
- CI/CD com testes obrigatórios antes de deploy.
- Migrations rodam automaticamente no deploy (ou separadas com flag).
- Blue-green ou canary deployment para produção.
- Rollback plan documentado.
- Database backup antes de migrations destrutivas.
```

---

#### 🔀 BLOCO: Fullstack / Monorepo

```markdown
## Fullstack / Monorepo — Regras Específicas

### Estrutura
- Documentar cada package/app e sua responsabilidade.
- Mapear dependências entre packages.
- Documentar shared packages (tipos, utils, config).

### Comandos
- Documentar como rodar cada app separadamente.
- Documentar como rodar tudo junto.
- Documentar como adicionar dependência a um package específico.
- Documentar pipeline de build (ordem importa em monorepos).

### Regras de Monorepo
- Imports entre packages via aliases configurados, nunca paths relativos cruzando apps.
- Tipos compartilhados ficam em package dedicado.
- Cada package tem seu próprio tsconfig/config que estende o root.
- CI roda testes apenas dos packages afetados pelo diff (turbo/nx affected).
- Versioning: independent ou fixed — documentar qual.

### CLAUDE.md por Package
- Root CLAUDE.md: visão geral, comandos globais, estrutura.
- Cada package/app pode ter CLAUDE.md próprio com regras específicas.
- Subdiretório CLAUDE.md é carregado sob demanda quando o agente trabalha ali.
```

---

#### 📦 BLOCO: Biblioteca / SDK

```markdown
## Biblioteca / SDK — Regras Específicas

### API Pública
- Toda função/tipo exportado tem JSDoc/docstring completo.
- Mudanças em API pública são breaking changes — seguir semver.
- Deprecated: marcar com @deprecated e manter por pelo menos 1 major version.
- README.md é a documentação principal. Exemplos funcionais obrigatórios.

### Build e Publicação
- Documentar build para CJS e ESM se necessário.
- Documentar processo de publicação (npm publish, cargo publish, etc).
- Changelog atualizado a cada release (conventional-changelog ou manual).
- Testes rodam contra a build final, não só source.

### Compatibilidade
- Documentar versões mínimas suportadas (Node, Python, browser, etc).
- Testar em múltiplas versões da runtime.
- Peer dependencies explícitas e range de versão bem definido.
```

---

## FASE 4 — Reorganização

### Passo 1 — Criar estrutura
```bash
mkdir -p docs/specs docs/decisions docs/learnings docs/context
```

### Passo 2 — Migrar conteúdo
Para cada arquivo existente:
- Mover trechos para a categoria correta
- Resolver duplicatas (versão mais recente vence)
- Marcar ambiguidades com `<!-- REVISAR -->`

### Passo 3 — Gerar CLAUDE.md
Combinar Bloco UNIVERSAL + Bloco(s) ESPECÍFICO(s) do tipo detectado.
Preencher com informações reais do projeto (comandos, estrutura, stack).

### Passo 4 — Relatório Final
```markdown
## Relatório de Reorganização

**Tipo detectado:** [tipo]
**Framework:** [framework]
**Linguagem:** [linguagem]

**Arquivos lidos:** N
**Arquivos criados:** N
**Arquivos que podem ser removidos:** [lista]

**Itens ambíguos (precisam de confirmação):**
- [item 1 — dúvida]
- [item 2 — dúvida]

**Informações faltantes sugeridas:**
- [ ] Preencher business context
- [ ] Adicionar glossário de domínio
- [ ] Documentar decisão sobre [X]
```

---

## Notas

- **Não inventar informação.** Apenas reorganizar o que já existe.
- **Preservar TODO o conteúdo.** Nada pode ser perdido, apenas realocado.
- **Informação duplicada:** manter a versão mais completa/recente.
- **Se não sabe onde classificar:** colocar na categoria mais próxima + `<!-- REVISAR -->`.
- **Monorepo:** gerar CLAUDE.md root + CLAUDE.md por subprojeto se necessário.
- **Perguntar ao usuário** quando algo é genuinamente ambíguo.
