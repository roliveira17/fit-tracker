# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fit Track v3 — AI-powered fitness tracking app (food, workouts, sleep, glucose). Built with Next.js 16 + React 19, Supabase backend, and OpenAI for natural language parsing. Documentation and UI copy are in **Portuguese (pt-BR)**.

Deployed at: https://fit-tracker-murex.vercel.app

## Commands

```bash
npm run dev          # Dev server with Turbopack
npm run dev:clean    # Kill stale node processes, remove .next/dev/lock, restart (Windows/PowerShell)
npm run build        # Production build
npm run lint         # Next.js linting
npx playwright test  # Run all E2E tests (starts dev server automatically)
npx playwright test tests/e2e/T001-onboarding.spec.ts  # Run a single test
```

## Architecture

### Data Flow: Chat → Persistence

1. User sends message via `/chat` page → POST to `/api/chat/route.ts`
2. `lib/ai.ts` classifies intent and calls OpenAI GPT-4o-mini to parse food/exercise/weight/body fat/glucose
3. `lib/parsers.ts` normalizes parsed data into typed structures
4. Data saved via `lib/supabase.ts` RPC calls (authenticated) or `lib/storage.ts` localStorage (offline fallback)

### Dual Storage Strategy

- **`lib/supabase.ts`**: Primary storage when authenticated. All writes use RPC functions with `SECURITY DEFINER` to bypass RLS. Key RPCs: `get_home_summary()`, `get_insights()`, `import_apple_health()`, `import_hevy()`.
- **`lib/storage.ts`**: localStorage fallback for offline use and unauthenticated state. Mirrors the same data types.

### Food Lookup Pipeline

`lib/food-lookup.ts` orchestrates multi-source food resolution:
1. `lib/food-cache.ts` (in-memory cache) → 2. `lib/food-database.ts` (embedded 1,196-line PT-BR food DB) → 3. `lib/tbca-database.ts` (TBCA Brazilian food table, 17MB JSON in `data/`) → 4. `lib/openfoodfacts.ts` (OpenFoodFacts API for barcodes) → 5. OpenAI fallback

### Import System

`app/import/page.tsx` handles three import types:
- **Apple Health**: ZIP → XML extraction via JSZip → parsing in `lib/import/appleHealth*.ts` → Supabase RPC
- **Hevy**: CSV parsing in `lib/parsers/hevy.ts`
- **Barcode scanning**: `components/import/BarcodeScanner.tsx` uses html5-qrcode → OpenFoodFacts API → `lib/barcode-cache.ts`

### Auth

Supabase Auth with Google OAuth. Provider setup in `components/providers/SupabaseAuthProvider.tsx`. Auth helpers in `lib/auth.ts`. All database tables have RLS policies.

## Key Conventions

- **Path alias**: `@/*` maps to project root (e.g., `@/lib/storage`, `@/components/ui/Button`)
- **Supabase RPCs over direct table access**: All authenticated writes go through RPC functions with `SECURITY DEFINER`, not direct table inserts
- **Mobile-first**: Design targets 390x844 viewport. Playwright tests use this viewport.
- **Design system colors**: Primary orange `#eb6028`, custom Tailwind tokens in `tailwind.config.ts`
- **Component library**: Custom components in `components/ui/` (not raw shadcn/ui — there's a legacy `button.tsx` being migrated)

## Database

Migrations in `supabase/migrations/` (run in order). Schema documented in `docs/back-end/data-model.md`. Core tables: `profiles`, `meals`/`meal_items`, `workouts`/`workout_sets`, `sleep_sessions`/`sleep_stages`, `weight_logs`, `body_fat_logs`, `glucose_logs`, `foods`, `import_records`.

## Environment Variables

Required in `.env.local` (see `.env.example`):
- `OPENAI_API_KEY` — OpenAI API key (server-side only)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)

## Known Issues

Tracked in `docs/PENDENCIAS.md`. Key ones:
- Home dashboard carbs/fat hardcoded to 0 (RPC `get_home_summary` needs update)
- Apple Health sleep data parsed but not persisted
- FreeStyle Libre CGM uses generic parser instead of device-specific one
