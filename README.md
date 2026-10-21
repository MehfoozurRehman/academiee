# Academiee

Management software for coaching academies and tuition centres: one Expo codebase for web, iOS and Android, a Convex backend, and an interface in English and Urdu.

## The problem

Coaching academies and tuition centres track students, batches, monthly fees, attendance, exams and timetables, often across more than one branch. The owner needs one place to run all of it. Students need a read-only view of their own records. Money records have to stay auditable, so a mistake is voided with a reason rather than erased.

## What it does

- **Multi-academy owner console.** An owner can run several academies, switch between them, and every query is scoped to the current one.
- **Fees without duplicates.** Generate a month's invoices in one action. Duplicate invoices for the same student and month are rejected. Record payments, void a payment or an invoice with a reason, and show receipts.
- **Batch attendance.** Mark attendance for a batch and date, and read per-batch summaries.
- **Timetable clash checks.** A weekly slot is rejected if it overlaps another class for the same batch, or for the same teacher, on the same day.
- **Student portal.** Students sign in with a one-time code the owner issues, then see their fees, attendance, results, timetable and notices.
- **Platform admin.** A super-admin view lists academies with overview counts and can suspend an academy, which blocks its owner.
- **WhatsApp hand-off.** Messages open WhatsApp with the text prefilled, and the person presses send. The app never sends them itself.

## How it's built

- **Stack:** Expo SDK 57 with Expo Router, React Native 0.86 and `react-native-web`, all in TypeScript. Convex handles the database, functions and real-time queries, with `@convex-dev/auth` for sign-in. Vitest covers the tests. The web build exports statically for Vercel.
- **The server decides who you are.** Every public Convex function starts with a guard from `convex/lib/access.ts`: `requireUserId`, `requireAdmin` or `requireOwner`. The owner check also rejects suspended academies. The client never supplies a user ID as proof of identity.
- **Records are voided or archived, not erased.** Payments and invoices are voided with a reason and dropped from totals. Students, batches and courses are archived. A student can be hard-deleted only when no invoice, attendance or result history exists (`students.removeMistake`).
- **Two languages, one set of screens.** English and Urdu strings live in `src/i18n`, and Urdu renders right to left.

## Running it locally

```bash
pnpm install
npx convex dev            # backend (dev deployment), keep running
pnpm web                  # web app on http://localhost:8082
```

Dev deployments set `ALLOW_DEV_CODES=true`, so sign-in codes show on screen and "Use test account" works. To load demo data for an owner:

```bash
npx convex run seed:demo '{"ownerEmail":"owner@test.academiee.app"}'
```

Checks and builds:

```bash
pnpm typecheck && pnpm test   # type-check, then run Vitest
pnpm build:web                # export to dist/ (with the Vercel asset fix)
pnpm android / pnpm ios       # native runs through expo run:android and expo run:ios
```

## What I learned and what I'd do next

- Test coverage is two files, covering permissions and fee logic. Attendance, timetable clash rules and the portal reads have no tests. Timetable clashes are a good first addition, since the rule is small and easy to get wrong.
- `ALLOW_DEV_CODES` displays sign-in codes on screen. It must be unset in any production deployment. A startup check in Convex that refuses the flag in production would make that safe by default.
- `docs/FEATURE_REFERENCE.md` describes email and password sign-in, but the code uses one-time email codes. Update the document or the code so they agree.
- `docs/OLD_README.md` sits beside the current docs. Remove it, or keep it in git history only.
- The `auditLog` table records payments, voids and archives. Check that every write path listed in `docs/PLAN.md` writes to it.
