# I APP — React frontend (Phase 11.5)

Parallel React implementation of the I APP clinic system. The legacy
applications at `/iapp/` and `/iapp/v2/` remain the production system and the
emergency fallback; this app deploys alongside them at `/iapp/app/`.

**The backend is unchanged and authoritative.** This project contains no
migrations, no schema, no RLS, and no business rules. Appointment state lives
in PostgreSQL RPCs; AI secrets live in Supabase Edge Function secrets.

## Setup

```bash
cp .env.example .env      # same live Supabase project as the legacy apps
npm install
npm run dev
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build + Pages 404 fallback |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | oxlint |
| `npm run smoke` | Build a jsdom bundle and run the Step 2 smoke tests |

## Before Step 3 — generate the database types

`src/types/database.types.ts` is a placeholder. Replace it with the generated
types from the live project (read-only, creates no migration):

```bash
npx supabase login
npx supabase gen types typescript \
  --project-id vkkjatrawzpmdhfloens \
  --schema iapp,public \
  > src/types/database.types.ts
```

## Rules this project holds to

- Components call services; services call Supabase. No Supabase queries in components.
- Route guards are UX. RLS is the security boundary.
- No secret may be added to `.env` — anything `VITE_`-prefixed ships in the bundle.
- Never use `toISOString()` for a date: use `todayLocal()` from `utils/date.ts`.
- CSS uses logical properties only, so RTL keeps working.
