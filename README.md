# DiseaseX-Tracker

A field triage and clinical-protocol engine for community health workers (CHWs) operating in remote, low-resource regions. Given a patient's presenting symptoms, DiseaseX matches against structured disease patterns, ranks likely conditions, and surfaces the recommended triage level and protocol so a non-physician worker can make safer decisions in the field.

Built as a pnpm-workspace monorepo with a shared API backend serving both a web dashboard and a native mobile app.

## Applications

**DiseaseX (Web):** React + Vite triage dashboard for clinics and coordination points.

**DiseaseX Mobile:** Expo / React Native app for CHWs using the same backend in the field.

**API Server:** Express 5 backend with a pattern-matching engine for symptom-to-condition ranking.

## Stack

TypeScript 5.9 (Node.js 24), React + Vite, React Native (Expo), Express 5, PostgreSQL with Drizzle ORM, Zod validation, Orval API codegen from an OpenAPI spec, and a pnpm-workspace monorepo built with esbuild.

## Getting started

```bash
pnpm install
pnpm build
```

Regenerate API hooks from the OpenAPI spec with `pnpm --filter @workspace/api-spec run codegen`.

## Status

Active prototype. Core triage flow, patient queue, and pattern-matching engine are implemented across web and mobile.
