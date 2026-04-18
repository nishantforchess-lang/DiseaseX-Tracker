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

### DiseaseX — Triage & Protocol Engine
- **Frontend**: `artifacts/diseasex/` — React + Vite, served at `/`
- **Backend**: `artifacts/api-server/` — Express 5, served at `/api`
- **Purpose**: Field triage tool for community health workers (CHWs) in remote regions

### Features
- Dashboard with live stats and outbreak alerts
- Multi-step patient intake with symptom selector
- Pattern matching engine (Severe Malaria, Pneumonia, Cholera, Meningitis, Severe Anemia)
- Treatment protocols with WHO guidelines and dosage calculator
- Patient queue with urgency triage (low/monitor/critical)
- Protocol library (searchable, offline-ready)
- Outbreak alert reporting with GPS coordinates
- Patient records with assessment history

### Database Schema
- `patients` — patient records (name, age, weight, location, status)
- `assessments` — triage assessments with JSONB pattern_matches column
- `protocols` — WHO treatment protocols (seeded with 5 diseases)
- `outbreak_alerts` — atypical case reports with GPS data

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Notes

- After running codegen, manually fix `lib/api-zod/src/index.ts` to only export from `./generated/api` (not `./generated/types`) to avoid duplicate export errors
- The pattern matching engine is in `artifacts/api-server/src/lib/pattern-matcher.ts`
- Design system: Primary Teal #0D9488, Slate #1E293B, Off-White #F8FAFC; Status: Emerald/Amber/Crimson

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
