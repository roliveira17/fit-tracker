# Auth & RLS — Fit Track v3

> Autenticação e Row Level Security para Supabase.

---

## 1. Autenticação

### 1.1 Providers

| Provider | Status | Configuração |
|----------|--------|--------------|
| Google | Habilitado | OAuth 2.0 via Supabase Dashboard |
| Apple | Habilitado | Sign in with Apple via Supabase Dashboard |
| Email/Password | Desabilitado | Não usado no Fit Track |

### 1.2 Configuração no Supabase Dashboard

```
Authentication > Providers > Google
├── Client ID: [do Google Cloud Console]
├── Client Secret: [do Google Cloud Console]
└── Authorized redirect URI: https://<project>.supabase.co/auth/v1/callback

Authentication > Providers > Apple
├── Client ID: [do Apple Developer]
├── Secret Key: [do Apple Developer]
└── Authorized redirect URI: https://<project>.supabase.co/auth/v1/callback
```

### 1.3 Fluxo de Autenticação

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Supabase   │────▶│   Google/    │
│              │     │   Auth       │     │   Apple      │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │◀───────────────────┘
       │                    │   (token de retorno)
       │◀───────────────────┘
       │   (session JWT)
       ▼
┌──────────────┐
│  Supabase    │
│  Client      │
│  (com JWT)   │
└──────────────┘
```

### 1.4 Código Frontend

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Login com Google
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}

// Login com Apple
async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}

// Logout
async function signOut() {
  const { error } = await supabase.auth.signOut()
}

// Obter sessão atual
async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Listener de mudanças de auth
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Usuário logou
  } else if (event === 'SIGNED_OUT') {
    // Usuário deslogou
  }
})
```

### 1.5 Callback Route

```typescript
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

---

## 2. Row Level Security (RLS)

### 2.1 Princípio

> Cada usuário só pode acessar seus próprios dados.

O RLS usa `auth.uid()` para obter o ID do usuário autenticado e compara com `user_id` das tabelas.

### 2.2 Habilitar RLS

```sql
-- Habilitar RLS em TODAS as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_fat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_records ENABLE ROW LEVEL SECURITY;
```

### 2.3 Policies

#### `profiles`

```sql
-- Usuário só acessa próprio perfil
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  USING (auth.uid() = id);
```

#### Tabelas com `user_id` direto

```sql
-- weight_logs
CREATE POLICY "weight_logs_all_own"
  ON weight_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- body_fat_logs
CREATE POLICY "body_fat_logs_all_own"
  ON body_fat_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- meals
CREATE POLICY "meals_all_own"
  ON meals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- workouts
CREATE POLICY "workouts_all_own"
  ON workouts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- sleep_sessions
CREATE POLICY "sleep_sessions_all_own"
  ON sleep_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- import_records
CREATE POLICY "import_records_all_own"
  ON import_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### Tabelas filhas (via JOIN)

```sql
-- meal_items (via meals)
CREATE POLICY "meal_items_all_own"
  ON meal_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meals
      WHERE meals.id = meal_items.meal_id
      AND meals.user_id = auth.uid()
    )
  );

-- workout_sets (via workouts)
CREATE POLICY "workout_sets_all_own"
  ON workout_sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_sets.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

-- sleep_stages (via sleep_sessions)
CREATE POLICY "sleep_stages_all_own"
  ON sleep_stages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sleep_sessions
      WHERE sleep_sessions.id = sleep_stages.sleep_session_id
      AND sleep_sessions.user_id = auth.uid()
    )
  );
```

#### `foods` (global + custom)

```sql
-- Leitura: global (user_id NULL) + próprios
CREATE POLICY "foods_select"
  ON foods FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

-- Insert/Update/Delete: apenas próprios
CREATE POLICY "foods_insert_own"
  ON foods FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "foods_update_own"
  ON foods FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "foods_delete_own"
  ON foods FOR DELETE
  USING (user_id = auth.uid());
```

---

## 3. Testes de RLS

### 3.1 Testar via SQL Editor

```sql
-- Simular usuário A
SET request.jwt.claim.sub = 'user-a-uuid';

-- Tentar ler dados do usuário B (deve retornar vazio)
SELECT * FROM weight_logs WHERE user_id = 'user-b-uuid';
-- Resultado esperado: 0 rows

-- Tentar inserir com user_id diferente (deve falhar)
INSERT INTO weight_logs (user_id, weight_kg, date, source)
VALUES ('user-b-uuid', 75, '2026-01-26', 'chat');
-- Resultado esperado: ERROR
```

### 3.2 Testar via Frontend

```typescript
// Criar 2 usuários de teste
// Logar como usuário A, criar dados
// Logar como usuário B, verificar que não vê dados de A
```

---

## 4. Segurança Adicional

### 4.1 Variáveis de Ambiente

```env
# .env.local (frontend)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Nunca expor no frontend:
# SUPABASE_SERVICE_ROLE_KEY (apenas server-side se necessário)
```

### 4.2 Proteções Automáticas do Supabase

- **JWT validation:** Tokens verificados automaticamente
- **Rate limiting:** Proteção contra DDoS
- **SQL injection:** PostgREST sanitiza inputs
- **CORS:** Configurável no dashboard

### 4.3 Checklist de Segurança

- [ ] RLS habilitado em TODAS as tabelas
- [ ] Policies testadas com múltiplos usuários
- [ ] Anon key é público (ok), service key é secreto
- [ ] Redirect URIs configurados corretamente
- [ ] Domínio de produção adicionado no Supabase

---

## 5. Migração de NextAuth

### 5.1 O que remover

```typescript
// Remover:
// - pages/api/auth/[...nextauth].ts
// - lib/auth.ts (NextAuth config)
// - Dependência next-auth do package.json
```

### 5.2 O que adicionar

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 5.3 Atualizar componentes

```typescript
// Antes (NextAuth)
import { useSession } from 'next-auth/react'
const { data: session } = useSession()

// Depois (Supabase)
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
const [session, setSession] = useState(null)
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => setSession(data.session))
}, [])
```
