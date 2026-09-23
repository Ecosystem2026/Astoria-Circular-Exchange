# Astoria Circular Exchange

Astoria Circular Exchange helps local businesses turn useful leftover materials into nearby resources through transparent matching.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/astoria-exchange/src/` — React dashboard, match list, profile flow, and shared shell
- `artifacts/api-server/src/routes/ecosystem.ts` — dashboard, business profile, match ranking, and pickup request API
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/db/src/schema/businesses.ts` — business profiles and match requests
- `artifacts/astoria-exchange/src/index.css` — civic utility visual system and theme tokens

## Architecture decisions

- Match scores are always decomposed into material compatibility (40), distance (40), and pickup timing (20) so businesses can understand why a match ranks well.
- The first pilot is seeded with Astoria businesses and keeps the current business as the first seeded profile, making the exchange legible on first open.
- Addresses are stored as business data and the first pilot uses neighborhood-aware distance estimates; production geocoding can replace the estimator without changing the match response shape.
- API contracts are generated from OpenAPI and shared between the Express service and React Query client.

## Product

- See an impact overview for the current business, including local partners and materials diverted.
- Browse ranked matches with material, distance, timing, and total score breakdowns.
- Request a pickup from an available partner and see the match status update.
- Create or update a business profile with waste, wanted material, quantity, address, and pickup timing.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run API codegen after editing `lib/api-spec/openapi.yaml`.
- Restart `artifacts/api-server: API Server` and `artifacts/astoria-exchange: web` after backend or frontend changes.
- The Vite build expects workflow-provided `PORT` and `BASE_PATH`; use the artifact workflow for preview verification.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
