# Arquitetura Híbrida de APIs de Alimentos

## Visão Geral

Sistema de busca de alimentos em múltiplas camadas, otimizado para **velocidade**, **cobertura brasileira** e **custo zero** na maioria dos casos.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FLUXO DE BUSCA DE ALIMENTOS                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Usuário digita: "comi açaí com granola"                           │
│                         │                                           │
│                         ▼                                           │
│  ┌─────────────────────────────────────┐                           │
│  │ 1. CACHE DO USUÁRIO (localStorage)  │ ← ~0ms, offline           │
│  │    Alimentos já registrados antes   │                           │
│  └─────────────────┬───────────────────┘                           │
│                    │ não encontrou                                  │
│                    ▼                                                │
│  ┌─────────────────────────────────────┐                           │
│  │ 2. DATABASE LOCAL (food-database)   │ ← ~0ms, offline           │
│  │    130 alimentos comuns brasileiros │                           │
│  └─────────────────┬───────────────────┘                           │
│                    │ não encontrou                                  │
│                    ▼                                                │
│  ┌─────────────────────────────────────┐                           │
│  │ 3. TBCA SUPABASE (food_database)    │ ← ~50ms, online           │
│  │    5.700 alimentos brasileiros      │                           │
│  │    Busca fuzzy com pg_trgm          │                           │
│  └─────────────────┬───────────────────┘                           │
│                    │ não encontrou                                  │
│                    ▼                                                │
│  ┌─────────────────────────────────────┐                           │
│  │ 4. OPENAI (fallback)                │ ← ~500ms, $0.01/req       │
│  │    Calcula nutrição via IA          │                           │
│  │    Salva resultado no cache         │                           │
│  └─────────────────────────────────────┘                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     FLUXO DE BARCODE SCANNER                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Usuário escaneia: 7891000100103 (Nescau)                          │
│                         │                                           │
│                         ▼                                           │
│  ┌─────────────────────────────────────┐                           │
│  │ 1. BARCODE CACHE (Supabase)         │ ← ~50ms                   │
│  │    Produtos já escaneados antes     │                           │
│  └─────────────────┬───────────────────┘                           │
│                    │ não encontrou                                  │
│                    ▼                                                │
│  ┌─────────────────────────────────────┐                           │
│  │ 2. OPEN FOOD FACTS API              │ ← ~200ms, grátis          │
│  │    31K+ produtos brasileiros        │                           │
│  │    Rate limit: 10 req/min           │                           │
│  └─────────────────┬───────────────────┘                           │
│                    │ encontrou                                      │
│                    ▼                                                │
│  ┌─────────────────────────────────────┐                           │
│  │ 3. SALVAR NO CACHE                  │                           │
│  │    Beneficia todos os usuários      │                           │
│  └─────────────────────────────────────┘                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Componentes

### 1. Client-Side (Offline, Instantâneo)

#### 1.1 food-cache.ts (existente)
- **Função**: Cache personalizado do usuário
- **Dados**: Alimentos já registrados com frequência de uso
- **Storage**: localStorage
- **Tamanho**: ~50KB (500 alimentos max)

#### 1.2 food-database.ts (existente)
- **Função**: Alimentos comuns brasileiros
- **Dados**: 130+ alimentos com aliases e valores padrão
- **Storage**: Bundle JS
- **Tamanho**: ~15KB

### 2. Supabase (Online, Busca Avançada)

#### 2.1 food_database (nova tabela)
- **Função**: Base completa TBCA
- **Dados**: 5.700 alimentos brasileiros
- **Features**:
  - Full-text search com `pg_trgm`
  - Busca fuzzy ("carn" → "carne moída")
  - 34 nutrientes por alimento
- **Tamanho**: ~2MB

#### 2.2 barcode_cache (nova tabela)
- **Função**: Cache de produtos escaneados
- **Dados**: Resultados do Open Food Facts
- **Features**:
  - Compartilhado entre usuários
  - Evita rate limit do OFF
  - TTL de 30 dias

### 3. External APIs (Fallback)

#### 3.1 Open Food Facts
- **Função**: Barcode scanner
- **Cobertura**: 31K+ produtos brasileiros
- **Rate Limit**: 10 req/min
- **Custo**: Grátis

#### 3.2 OpenAI
- **Função**: Fallback para alimentos desconhecidos
- **Custo**: ~$0.01 por request
- **Uso**: Apenas quando todas as outras fontes falharem

---

## Schema do Banco de Dados

### Tabela: food_database

```sql
CREATE TABLE food_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  tbca_id VARCHAR(20) UNIQUE,           -- ID original da TBCA
  name VARCHAR(255) NOT NULL,            -- Nome do alimento
  name_normalized VARCHAR(255) NOT NULL, -- Nome sem acentos, lowercase
  category VARCHAR(100),                 -- Categoria (cereais, carnes, etc)

  -- Macronutrientes (por 100g)
  calories DECIMAL(8,2),
  protein_g DECIMAL(8,2),
  carbs_g DECIMAL(8,2),
  fat_g DECIMAL(8,2),
  fiber_g DECIMAL(8,2),

  -- Micronutrientes (por 100g)
  sodium_mg DECIMAL(8,2),
  potassium_mg DECIMAL(8,2),
  calcium_mg DECIMAL(8,2),
  iron_mg DECIMAL(8,2),
  zinc_mg DECIMAL(8,2),
  vitamin_a_mcg DECIMAL(8,2),
  vitamin_c_mg DECIMAL(8,2),
  vitamin_d_mcg DECIMAL(8,2),
  vitamin_b12_mcg DECIMAL(8,2),
  folate_mcg DECIMAL(8,2),

  -- Porções padrão
  default_portion_g DECIMAL(8,2) DEFAULT 100,
  portion_description VARCHAR(100),      -- "1 colher de sopa", "1 unidade"

  -- Metadados
  source VARCHAR(50) DEFAULT 'tbca',     -- 'tbca', 'taco', 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca
CREATE INDEX idx_food_name_trgm ON food_database USING gin (name_normalized gin_trgm_ops);
CREATE INDEX idx_food_category ON food_database (category);

-- Habilitar extensão para fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Tabela: barcode_cache

```sql
CREATE TABLE barcode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  barcode VARCHAR(50) UNIQUE NOT NULL,   -- EAN-13, UPC, etc

  -- Dados do produto
  product_name VARCHAR(255),
  brand VARCHAR(255),
  quantity VARCHAR(100),                  -- "200g", "1L"

  -- Nutrição (por 100g)
  calories DECIMAL(8,2),
  protein_g DECIMAL(8,2),
  carbs_g DECIMAL(8,2),
  fat_g DECIMAL(8,2),
  fiber_g DECIMAL(8,2),
  sodium_mg DECIMAL(8,2),
  sugar_g DECIMAL(8,2),

  -- Classificações
  nutriscore VARCHAR(1),                  -- A, B, C, D, E
  nova_group INTEGER,                     -- 1, 2, 3, 4

  -- Imagem
  image_url TEXT,

  -- Metadados
  source VARCHAR(50) DEFAULT 'openfoodfacts',
  hit_count INTEGER DEFAULT 1,            -- Quantas vezes foi buscado
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- Índice para busca por barcode
CREATE UNIQUE INDEX idx_barcode ON barcode_cache (barcode);
```

### RPC: search_food

```sql
CREATE OR REPLACE FUNCTION search_food(
  search_term TEXT,
  limit_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  category VARCHAR,
  calories DECIMAL,
  protein_g DECIMAL,
  carbs_g DECIMAL,
  fat_g DECIMAL,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.category,
    f.calories,
    f.protein_g,
    f.carbs_g,
    f.fat_g,
    similarity(f.name_normalized, lower(unaccent(search_term))) as similarity
  FROM food_database f
  WHERE
    f.name_normalized % lower(unaccent(search_term))
    OR f.name_normalized ILIKE '%' || lower(unaccent(search_term)) || '%'
  ORDER BY similarity DESC, f.name
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;
```

---

## Arquivos a Criar/Modificar

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `lib/tbca-database.ts` | Client para buscar na tabela food_database |
| `lib/openfoodfacts.ts` | Client para API do Open Food Facts |
| `lib/barcode-cache.ts` | Client para cache de barcodes |
| `components/import/BarcodeScanner.tsx` | Componente de scanner |
| `supabase/migrations/20260127_002_food_database.sql` | Migração das tabelas |
| `scripts/import-tbca.ts` | Script para importar dados da TBCA |

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `lib/food-lookup.ts` | Adicionar camada TBCA entre database e IA |
| `app/import/page.tsx` | Adicionar tab de Barcode Scanner |

---

## Fases de Implementação

### Fase 1: TBCA no Supabase
**Objetivo**: Adicionar 5.700 alimentos brasileiros com busca fuzzy

1. Criar migração `food_database`
2. Baixar dados da TBCA (JSON/CSV)
3. Criar script de importação
4. Criar `lib/tbca-database.ts`
5. Integrar no `food-lookup.ts`
6. Testar busca fuzzy

**Critério de Sucesso**: Buscar "açaí" retorna dados nutricionais corretos

### Fase 2: Barcode Scanner
**Objetivo**: Escanear produtos industrializados

1. Criar migração `barcode_cache`
2. Criar `lib/openfoodfacts.ts`
3. Criar `lib/barcode-cache.ts`
4. Criar `BarcodeScanner.tsx` com câmera
5. Integrar na Import page
6. Testar com produtos brasileiros

**Critério de Sucesso**: Escanear Nescau (7891000100103) retorna nutrição

### Fase 3: Otimizações
**Objetivo**: Performance e UX

1. Adicionar loading states
2. Implementar retry com backoff
3. Adicionar analytics de uso
4. Criar testes E2E
5. Documentar API interna

---

## Estimativa de Custos

| Componente | Custo Mensal | Notas |
|------------|--------------|-------|
| Supabase | $0 | Dentro do free tier (500MB, 50K requests) |
| Open Food Facts | $0 | API gratuita |
| OpenAI (fallback) | ~$5-10 | Estimando 500-1000 requests/mês |
| **Total** | **~$5-10** | 95% das buscas sem custo |

---

## Métricas de Sucesso

| Métrica | Meta | Como Medir |
|---------|------|------------|
| Hit rate cache local | >60% | Logs no food-lookup |
| Hit rate TBCA | >30% | Queries Supabase |
| Hit rate OpenAI | <10% | Billing OpenAI |
| Latência P50 | <100ms | Performance monitoring |
| Latência P99 | <500ms | Performance monitoring |
| Barcode success rate | >80% | Logs scanner |

---

## Referências

- [TBCA - Tabela Brasileira](https://www.tbca.net.br/)
- [Open Food Facts API](https://openfoodfacts.github.io/openfoodfacts-server/api/)
- [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Supabase Full-Text Search](https://supabase.com/docs/guides/database/full-text-search)
