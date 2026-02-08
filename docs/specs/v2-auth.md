# Feature 3: Autenticação Social

## Visão Geral

Implementar login social com Apple e Google para permitir que usuários sincronizem dados entre dispositivos e tenham backup na nuvem (futuro).

## MVP vs Futuro

### MVP (Esta implementação)
- Login com Google (mais simples de configurar)
- Login com Apple (necessário para App Store)
- Sessão persistente no navegador
- Migração de dados locais para conta autenticada
- Logout

### Futuro (v3+)
- Sincronização de dados na nuvem
- Backup automático
- Compartilhamento de progresso

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Fit Track PWA                         │
├─────────────────────────────────────────────────────────┤
│  NextAuth.js                                            │
│  ├── /api/auth/[...nextauth] (API routes)              │
│  ├── GoogleProvider                                     │
│  └── AppleProvider                                      │
├─────────────────────────────────────────────────────────┤
│  AuthProvider (Context)                                 │
│  ├── useSession() hook                                  │
│  ├── signIn() / signOut()                              │
│  └── Dados do usuário autenticado                      │
├─────────────────────────────────────────────────────────┤
│  UI                                                     │
│  ├── LoginPage (/login)                                │
│  ├── Botões de login social                            │
│  └── Seção de conta no Profile                         │
└─────────────────────────────────────────────────────────┘
```

## Fluxo de Autenticação

### Primeiro Login
1. Usuário clica em "Entrar com Google/Apple"
2. Redirecionado para OAuth provider
3. Após autorização, retorna ao app
4. NextAuth cria sessão
5. App detecta sessão e oferece migrar dados locais
6. Dados locais são associados ao ID do usuário

### Login Subsequente
1. Usuário clica em "Entrar"
2. OAuth flow
3. Sessão restaurada
4. Dados carregados do localStorage (ou nuvem no futuro)

### Logout
1. Usuário clica em "Sair"
2. Sessão encerrada
3. Dados locais permanecem no dispositivo
4. Pode fazer login novamente ou usar como anônimo

## Configuração Necessária

### Google OAuth
```env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

1. Ir para Google Cloud Console
2. Criar projeto ou usar existente
3. Ativar Google+ API
4. Criar credenciais OAuth 2.0
5. Adicionar URLs autorizados:
   - http://localhost:3000 (dev)
   - https://seudominio.com (prod)

### Apple Sign-In
```env
APPLE_ID=xxx
APPLE_TEAM_ID=xxx
APPLE_PRIVATE_KEY=xxx
APPLE_KEY_ID=xxx
```

1. Apple Developer Account necessária ($99/ano)
2. Criar App ID com Sign In with Apple
3. Criar Service ID
4. Gerar chave privada

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `app/api/auth/[...nextauth]/route.ts` | API routes do NextAuth |
| `lib/auth.ts` | Configuração do NextAuth |
| `components/providers/AuthProvider.tsx` | Provider de sessão |
| `app/login/page.tsx` | Página de login |
| `components/auth/LoginButtons.tsx` | Botões de login social |
| `components/profile/AccountSection.tsx` | Seção de conta no Profile |

## Dependências

```bash
npm install next-auth
```

## Considerações de Segurança

- Tokens armazenados em httpOnly cookies (NextAuth padrão)
- CSRF protection habilitado
- Secrets em variáveis de ambiente
- Não expor dados sensíveis no cliente

## Limitações do MVP

- Sem sincronização de dados (apenas auth)
- Dados permanecem no localStorage
- Um dispositivo por vez (sem sync)
- Sem recuperação de conta se perder localStorage
