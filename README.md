# Academiee

Academy and tuition-centre management for Pakistan: owners run students, batches, fees, attendance, tests, timetable and notices; students sign in to see their own data; a super admin oversees all academies. One Expo codebase for web, iOS and Android, with a Convex backend. English and Urdu (right-to-left).

- Product and build plan: [docs/PLAN.md](docs/PLAN.md)
- How screens are built: [docs/UI_GUIDE.md](docs/UI_GUIDE.md)
- Working agreement: [CLAUDE.md](CLAUDE.md)

## Run locally

```bash
pnpm install
npx convex dev          # backend (dev deployment), keep running
pnpm web                # web app on http://localhost:8082
```

Dev deployments set `ALLOW_DEV_CODES=true`, so sign-in codes are shown on screen and "Use test account" works. Load demo data for an owner with `npx convex run seed:demo '{"ownerEmail":"owner@test.academiee.app"}'`.

## Checks

```bash
pnpm typecheck && pnpm test
```

## Web build

`pnpm build:web` exports to `dist/` (with the Vercel asset fix) — deploy that folder to Vercel.
