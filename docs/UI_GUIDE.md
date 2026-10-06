# UI guide (for anyone building screens)

Read this, then copy the patterns in `src/app/(owner)/home.tsx`, `src/app/sign-in.tsx` and `src/app/setup.tsx`.

## Rules
- **No hard-coded colours, fonts or sizes.** Use `useTheme().colors`, `space`, `radius` from `src/theme/tokens.ts`, and the UI kit in `src/components/ui` (`Text`, `Button`, `Card`, `Input`, `Select`, `DateField`, `TimeField`, `MonthStepper`, `Segmented`, `Chips`, `Badge`, `Avatar`, `Progress`, `ListRow`, `ListGroup`, `EmptyState`, `Skeleton`, `Sheet`, `Screen`, `Section`, `Reveal`, `Icon` (Feather names), `Pressable`, `useToast`).
- **Every visible string goes through `t()`** from `useI18n()`. Add keys to *your* section file in `src/i18n/sections/` (both `en` and `ur`; for `ur` you may copy the English text — it will be translated in a later pass). Never edit another area's section file, `en.ts` or `ur.ts`.
- Money: `money(n)` from `useI18n()`. Months: `monthLabel("2026-10")`. Dates: `dateLabel("2026-10-07")`. Weekdays: `dayName(0..6)` (0 = Sunday).
- Codes, IDs, phone numbers, times and amounts are rendered with `<Text latin …>` so they stay in Latin digits in Urdu.
- Right-to-left: use `marginStart/End`, `paddingStart/End`, `start/end` — never `left/right`. `flexDirection: "row"` flips automatically. Directional icons (`chevron-right`, `arrow-left`, …) are auto-mirrored by `Icon`.
- Layout: wrap a page in `<Screen title subtitle action back narrow>`. Group with `<Section title action>`. Stagger sections with `<Reveal index={n}>` (keep to the first ~6). Lists use `ListGroup` + `ListRow`. Phone width (375px) must work with no horizontal scroll; wide screens (≥900px) get more columns where it helps (`useWindowDimensions`, `layout.wideBreakpoint`).
- Forms and confirmations open in a `<Sheet>` with the primary `Button full` in `footer`. Validate on the client for obvious mistakes; always show server errors with `errorMessage(e, t("common.somethingWrong"))` from `src/lib/errors.ts` (server messages are plain English sentences). Confirm success with `useToast()`.
- Loading state: `Skeleton`s, never a blank screen. Empty state: `EmptyState` with a helpful action.
- Queries that depend on the date take `today`/`month` from `useToday()` (`src/lib/useToday.ts`). Never compute fee status yourself — the server returns `status`.
- Current academy: `useAcademyId()` (owner area only). Current user: `useMe()`.
- WhatsApp: `openWhatsApp(phone, text)` from `src/lib/whatsapp.ts`; message templates are in the core dictionary under `whatsapp.*` (`reminder`, `overdue`, `received`, `absent`, `signInCode`).
- Status badges: paid → success, partial → warning, due → neutral, overdue → danger, voided → neutral with strikethrough amounts. Attendance: present → success, late → warning, absent → danger.
- Destructive or money actions (void, archive, delete) always open a confirm `Sheet`; voids require a typed reason (min 3 chars). Never offer "delete" for money.
- Typed routes: navigate with `router.push("/students/" + id as never)` when the route type complains.
- Taste: calm, plenty of whitespace, one accent colour, hairline borders, no shadows, no emoji, no gradients. Motion is subtle (the kit already handles press springs and reveals).

## Routes
Owner area (`src/app/(owner)/`, URL has no group prefix): `/home`, `/students`, `/students/new`, `/students/[id]`, `/fees`, `/fees/[id]` (invoice), `/attendance` (optional `?batch=`), `/more`, `/classes`, `/tests`, `/tests/[id]`, `/timetable`, `/notices`, `/expenses`, `/activity`, `/settings`.
Shared: `/receipt/[id]` (payment receipt — owner or the student it belongs to).
Student portal: `/s` (home), `/s/fees`, `/s/attendance`, `/s/results`, `/s/timetable`, `/s/notices`.
Admin: `/admin`, `/admin/academies/[id]`, `/admin/users`.

## Backend
All API is in `convex/*.ts` — read the function's args before calling it. Owner functions take `academyId`; portal functions take nothing but `today` where needed; admin functions need a platform admin.
