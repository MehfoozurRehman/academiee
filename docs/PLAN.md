# Academiee v1 build plan

Web first. Each phase ends tested, committed and deployed to Vercel.

## Roles

- **Owner** — runs one or more academies; full control. (Staff roles later; memberships are built to allow them.)
- **Student** — signs in with academy code + student ID + one-time code; read-only view of their own data.

## Features (v1)

### Owner
- **Academy setup** — name, phone, city, address, WhatsApp number, logo; switch between academies. Each academy gets a short public **academy code** students use to sign in.
- **Courses & batches** — course with monthly fee; batch with teacher name, days, start/end time, capacity. Enrolled count kept in one place so it never drifts.
- **Students** — add/edit, search, filter by batch/status, move batch, profile with full history. Each student gets a **student ID** (e.g. `S-0012`) and the owner can generate a one-time sign-in code and send it on WhatsApp.
- **Fees** — generate a month's invoices in one tap (never duplicates); record full/partial payments (Cash, Bank, JazzCash, EasyPaisa); each payment is its own record with a receipt number; status (paid / partial / due / overdue) is always derived from the dates, never stale; shareable receipt.
- **Attendance** — pick batch + date, mark present/absent/late, "all present" shortcut; re-saving updates.
- **Tests & results** — test per batch, marks entry, percentage and rank.
- **Timetable** — weekly slots per batch; clashes (same batch, or same teacher, overlapping on the same day) rejected.
- **Notices** — short announcements to one batch or the whole academy.
- **WhatsApp** — templates (fee reminder, overdue, payment received, absence) open WhatsApp with the message ready; the app never sends on its own.
- **Dashboard** — month's collected vs outstanding, attendance rate, students needing follow-up, quick actions.
- **Expenses** — monthly list, total, and net on the dashboard.
- **Audit log** — every payment, void, archive and restore is recorded with who, when and why.
- **Settings** — academy details, language, theme, sign out, delete account.

### Record safety (no risky deletes)
- **Money is never deleted.** Payments, invoices and expenses can only be **voided** with a reason. Voided records stay visible (marked "Voided") and are excluded from all totals. Fix a wrong payment by voiding it and recording the correct one.
- An invoice can be voided only after its payments are voided. Its receipt numbers are never reused.
- **Students, batches and courses are archived, not deleted**, so their fee, attendance and result history stays intact. Archived items can be restored. A batch or course with active students can't be archived.
- A student can be permanently deleted only if they have no invoices, payments, attendance or results (i.e. added by mistake).
- Attendance and marks are corrected by editing, not deleted.
- No recycle bin: archive filters and voided records replace it.

### Student
- Today's classes and weekly timetable
- Fee status, amount due, payment history and receipts
- Attendance percentage and record
- Test results
- Notices

### Everywhere
- English and Urdu (Urdu script, right-to-left), switchable in-app.
- Light/dark mode following the system, with a toggle.
- Mobile-first, works at phone width with no horizontal scroll.
- Every server function checks who is signed in and what they may see.

### Later (not v1)
Teachers & salaries, staff roles, parent login, push notifications, AI, custom domain + email login via Resend.

## Phases

| # | Phase | Result |
|---|---|---|
| 0 | Foundation: clean slate, design system, i18n + RTL, auth, roles | Design preview signed off; login works on Vercel |
| 1 | Academy, courses, batches, students, student invites | Set up an academy and add students |
| 2 | Fees, payments, receipts | Full fee cycle |
| 3 | Attendance | Mark and review attendance |
| 4 | Tests, timetable, notices | Academic features |
| 5 | Student portal | Student sees their own data |
| 6 | Dashboard, WhatsApp, expenses, audit log, settings | Owner side complete |
| 7 | Full web QA pass (every flow, both languages, both themes, phone width) | Bugs fixed and re-verified |
| 8 | iOS & Android: native polish, push, EAS builds, preview OTA | Apps on the phone |

## Status (2026-10-07)

Phases 0–7 for **web** are built and tested in a browser (owner, student portal, super admin; English + Urdu; light + dark; phone + desktop widths). Live test build: https://academiee-rho.vercel.app (uses the Convex **dev** deployment and on-screen test codes — not for real data).

Before going live for real:
- Set up Resend (email codes) and a Convex **prod** deployment; build the web app against prod without `EXPO_PUBLIC_DEV_TOOLS`.
- Phase 8 (iOS/Android) is next.

## Issues log

Running list of problems found and fixed, newest first.

- Vercel never uploads `node_modules` folders, so fonts/icons from Expo's web export 404'd — `scripts/fix-web-assets.mjs` flattens them (run by `pnpm build:web`).
- Urdu: Latin names showed in Nastaliq's serif Latin glyphs; time ranges reversed inside RTL text — Urdu web font now limited to Arabic-script ranges; Latin runs forced LTR.
- Dashboard follow-ups only looked at this month — now the last 12 months, grouped per student.
- Nested buttons (WhatsApp button inside a tappable row) — `ListRow` has a separate `action` slot.
- Detail queries threw on missing/foreign IDs — now return null so pages show "not found".
- Sign-in redirect raced the session token — auth screens redirect once the session is live.

- Design change (user request): removed delete/recycle bin for money and history records; replaced with void-with-reason, archive, and an audit log.
