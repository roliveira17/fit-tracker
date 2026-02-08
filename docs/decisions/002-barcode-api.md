# Barcode Scanner — API Interna

## Fluxo Completo

```
Usuario escaneia barcode
        |
BarcodeScanner.tsx (html5-qrcode)
        |
lookupBarcode() [lib/barcode-cache.ts]
   |--- 1. Cache Supabase (tabela barcode_cache)
   |       Hit? -> retorna produto + log analytics
   |--- 2. Open Food Facts API [lib/openfoodfacts.ts]
   |       fetchWithRetry() -> br.openfoodfacts.org
   |       fallback -> world.openfoodfacts.org
   |       3 tentativas com backoff (500ms, 1s, 2s)
   |       Encontrou? -> salva no cache + log analytics
   |--- 3. Nao encontrado -> log analytics "not_found"
        |
ScannedProductCard (selecao de quantidade)
        |
logMeal() [lib/supabase.ts] ou saveMeal() [lib/storage.ts]
```

## Endpoints Open Food Facts

| Endpoint | Uso |
|----------|-----|
| `https://br.openfoodfacts.org/api/v2/product/{barcode}.json` | Primario (produtos brasileiros) |
| `https://world.openfoodfacts.org/api/v2/product/{barcode}.json` | Fallback (global) |

**Rate limit:** 10 req/min (enforced pelo servidor)
**Timeout:** 5s por requisicao
**Retry:** 3 tentativas com exponential backoff (500ms, 1s, 2s)

## Formato NormalizedProduct

```typescript
interface NormalizedProduct {
  barcode: string;
  productName: string;
  brand: string | null;
  quantity: string | null;       // "200 ml", "500g"
  imageUrl: string | null;
  energyKcal: number | null;    // por 100g
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sodiumMg: number | null;
  sugarG: number | null;
  nutriscore: string | null;    // A-E
  novaGroup: number | null;     // 1-4
  source: "openfoodfacts";
}
```

## Cache (Supabase)

- **Tabela:** `barcode_cache`
- **Chave:** `barcode` (unique)
- **Estrategia:** Write-through (salva apos cache miss)
- **Hit count:** Incrementado a cada consulta
- **TTL:** Nenhum (sem expiracao)

## Analytics (localStorage)

- **Chave:** `barcode_analytics`
- **Formato:** Array de eventos (max 200)
- **Campos:** `barcode`, `source` (cache/api/not_found), `latencyMs`, `timestamp`

## Arquivos

| Arquivo | Responsabilidade |
|---------|------------------|
| `components/import/BarcodeScanner.tsx` | UI do scanner + loading states |
| `lib/openfoodfacts.ts` | Cliente da API + retry + normalizacao |
| `lib/barcode-cache.ts` | Cache Supabase + analytics |
