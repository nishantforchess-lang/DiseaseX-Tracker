# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Applications

### DiseaseX — Triage & Protocol Engine (Web)
- **Frontend**: `artifacts/diseasex/` — React + Vite, served at `/`
- **Backend**: `artifacts/api-server/` — Express 5, served at `/api`
- **Purpose**: Field triage tool for community health workers (CHWs) in remote regions

### DiseaseX Mobile — Native App (Expo)
- **Mobile**: `artifacts/diseasex-mobile/` — Expo + React Native, served at `/diseasex-mobile/`
- **Shares the same API backend** as the web app
- **Purpose**: Native iOS/Android version of DiseaseX for field use

## Features (both web & mobile)
- Dashboard with live stats and outbreak alerts
- Multi-step patient intake with symptom selector (20 symptoms)
- Pattern matching engine (Severe Malaria, Pneumonia, Cholera, Meningitis, Severe Anemia)
- Treatment protocols with WHO guidelines and dosage calculator
- Patient queue with urgency triage (low/monitor/critical)
- Protocol library (searchable)
- Outbreak alert reporting
- Patient records with assessment history

## Mobile Screens
- `app/(tabs)/index.tsx` — Dashboard with stats + queue + outbreak alert
- `app/(tabs)/queue.tsx` — Patient queue with urgency filter chips
- `app/(tabs)/intake.tsx` — 3-step assessment wizard (patient info → symptoms → vitals)
- `app/(tabs)/protocols.tsx` — Searchable protocol library
- `app/(tabs)/outbreaks.tsx` — Outbreak alerts + report form (modal)
- `app/results/[id].tsx` — Pattern match results with confidence bars
- `app/protocol/[id].tsx` — Protocol detail with live dosage calculator
- `app/patient/[id].tsx` — Patient detail with assessment history

## Database Schema
- `patients` — patient records (name, age, weight, location, status)
- `assessments` — triage assessments with JSONB pattern_matches column
- `protocols` — WHO treatment protocols (seeded with 5 diseases)
- `outbreak_alerts` — atypical case reports with GPS data

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Design System
- Primary Teal: #0D9488
- Slate Dark: #1E293B
- Background: #F8FAFC
- Critical: #DC2626 (Crimson)
- Monitor: #F59E0B (Amber)
- Low Risk: #059669 (Emerald)
- Font: Inter (400/500/600/700)

## Notes
- After running codegen, manually fix `lib/api-zod/src/index.ts` to only export from `./generated/api`
- Pattern matching engine: `artifacts/api-server/src/lib/pattern-matcher.ts`
- API topMatch must be `undefined` (not `null`) in patient queue response to satisfy Zod schema
