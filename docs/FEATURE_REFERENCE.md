# Build "Academiee" — academy management app

Build a mobile-first management app for coaching academies and tuition centres (initial market: Pakistan). One owner runs one or more academies and uses the app to manage students, batches, fees, attendance, exams, the timetable, teacher salaries and expenses, and to message parents on WhatsApp. One codebase must run on **iOS, Android and web**.

## Tech stack

- **Frontend:** Expo (latest SDK) + Expo Router (file-based routing) + TypeScript. Must run in **Expo Go** during development (no custom native modules required), and export as a static web app deployable to **Vercel**.
- **Backend:** Convex (database, queries, mutations, real-time sync).
- **Auth:** Convex Auth (email + password). **Every query and mutation must derive the current user on the server** (`getAuthUserId`) and check that the user owns the academy or record being read or changed. Never trust a `userId` or `academyId` sent by the client as proof of identity.
- **Session storage:** secure storage on native and `localStorage` on web, behind a single storage wrapper.
- **UI:** native look per platform (iOS-style on iOS, Material-style on Android), light + dark mode, accent colour `#5B4BE8`. Bottom tabs on mobile; tabs work on web too.

## Roles

1. **Academy owner** — signs up themselves. Can create and manage any number of academies, and works inside one "current" academy at a time with an option to switch.
2. **Platform admin** — a single account, created by a seed script using credentials from environment variables (never hard-coded). The admin sees a list of all academies with owner name and email, city, status, and student and teacher counts, plus platform totals. Admins cannot create academies. The admin can change an academy's status (active / inactive / suspended); a suspended academy's owner cannot use it.

## App flow

1. **Onboarding** (first launch only): 3 swipeable slides with Skip and Next/Get started buttons —
   - "Every student in one place" — admissions, batches, parent numbers, searchable.
   - "Fees that chase themselves" — a month of invoices in one tap; paid / partial / due / overdue at a glance.
   - "Attendance in under a minute" — mark a whole batch from one screen.
2. **Sign up** — full name, email, phone (optional), password (minimum 6 characters), confirm password. **Log in** — email + password.
3. Routing after login:
   - admin → Admin screen
   - owner with 0 academies → Create academy
   - owner with exactly 1 academy → straight into that academy's dashboard
   - owner with 2 or more academies → Select academy
4. **Create academy** — name, phone, email, address, city, country (default Pakistan), currency (default PKR), WhatsApp number.
5. Inside an academy: bottom tabs **Home · Students · Fees · Attendance · More**.

## Features (all scoped to the current academy)

### Dashboard (Home)
For a chosen month (default: current), show:
- total and active students, teachers, active batches
- fees collected, outstanding balance, expenses, net income (collected − expenses)
- attendance rate (% present)
- counts of fee invoices that are paid, partial, due and overdue, plus a "fees needing action" card that links to the Fees tab

### Courses
Name, description, duration (months), monthly fee, status (active/inactive). Cannot delete a course that still has batches.

### Teachers
Name, email, phone, subject, address, monthly salary, hire date, status (active / inactive / on leave). Cannot delete a teacher who is assigned to a batch.

### Batches
Course, teacher, name, start and end time, days of the week, capacity, status (active / inactive / completed). Show enrolled count / capacity, computed from the students actually in the batch (not a stored counter that can drift). Cannot delete a batch that still has students.

### Students
- Fields: name, father's name, gender, student phone (optional), parent phone (required), email, address, batch, monthly fee (defaults to the course fee, editable per student, e.g. for discounts), admission date, status (active / inactive / graduated), plus the academy's **custom fields**.
- List with search (name, father's name, phone) and filters by status.
- Student detail screen: profile, batch, attendance rate, full fee history with balances, test results, and a button to message the parent on WhatsApp.
- Move a student to another batch. Block enrolment or a move when the batch is full.

### Custom fields
In Settings the owner adds extra student fields (for example "CNIC" or "Blood group") with a label. A key is generated from the label and must be unique per academy. The fields appear on the student form and the detail screen.

### Fees
- One invoice per student per month: fee amount, discount, amount paid, balance, due date, payment method, payment date, remarks.
- **"Generate invoices"** for a month creates an invoice for every active student who doesn't have one yet, using each student's monthly fee and a chosen due date. Running it again must never create duplicates.
- **Record payment:** amount (> 0 and ≤ balance), method (Cash, Bank Transfer, JazzCash, EasyPaisa) and date. Partial payments are allowed.
- **Status is derived, not stored stale:** paid if balance = 0; overdue if the due date has passed and balance > 0; partial if something has been paid; otherwise due. Status must stay correct as dates pass — compute it when reading, or use a scheduled daily job.
- Fees tab: month picker, filter by status, totals for collected and outstanding.

### Attendance
Pick a batch and date (default today). Show every active student in the batch and mark each one present, absent or late, with "mark all present" as a shortcut. Saving again for the same batch and date updates the existing records instead of creating duplicates. Show attendance history per student.

### Tests & results
Create a test per batch: name, subject, date, total marks. Enter marks for each student in the batch; marks must be between 0 and the total. Re-saving updates existing results. Show results with percentage and rank.

### Timetable
Weekly slots: batch, teacher, day, start and end time, subject. End time must be after the start time. Reject clashes, meaning the same teacher or the same batch with overlapping times on the same day, and show a clear error message. Display grouped by day, Monday to Sunday.

### Salaries
For a teacher and month: base salary (from the teacher), bonus, deduction, payable = base + bonus − deduction, and status pending or paid with a paid date. At most one salary record per teacher per month. Allow marking a pending salary as paid.

### Expenses
Date, category (Rent, Salary, Electricity, Internet, Maintenance, Other), description, amount, paid by, payment method. List by month with a total.

### WhatsApp messages
Pick a student and a template, and the app opens WhatsApp (`whatsapp://send`, falling back to `https://wa.me/`) with the parent's number in international format (convert a leading `0` to `92`) and the message filled in. **The app never sends anything itself.** Templates, filled with the student's name, amounts, and the academy name:
- Fee reminder (monthly fee amount)
- Overdue notice (outstanding balance)
- Payment received
- Attendance warning

Log each message opened (student, type, phone, text, time).

### Recycle bin (soft delete)
Deleting a student, teacher, batch, course, fee, attendance record, expense, test, timetable slot or salary only marks it deleted. The recycle bin lists everything deleted, newest first, with **Restore** and **Delete forever**. Restoring a student requires their batch to exist and have room. Every normal list and calculation ignores deleted records.

### Activity log
Record important actions (created a student, recorded a payment, deleted a batch and so on) with the user and a timestamp.

### Settings
Edit academy details, manage custom fields, change password (current + new, minimum 6 characters), switch academy, sign out.

## Formatting & conventions
- Money: `PKR 12,000` style, using the academy's currency. Use compact numbers on dashboard cards (e.g. 1.2M).
- Months are `YYYY-MM`, dates are `YYYY-MM-DD`, times are `HH:mm`.
- Every list has an empty state and a loading state. Show errors from the server as friendly messages.
- Forms open in native bottom sheets on mobile and modals on web.

## Seed / demo data
A seed script, which must refuse to run in production, that creates:
- the admin account, with credentials from environment variables
- a demo owner `owner@academy.pk` with 2 academies, "Bright Future Academy" in Lahore and "City Science Academy" in Karachi
- 5 courses (Matric Science, FSc Pre-Medical, FSc Pre-Engineering, ICS Computer Science, English Language), 5 teachers, 6 batches and 12 students
- 3 months of fees, attendance, tests, results, salaries and expenses

## Non-negotiables
- Server-side authorisation on every function (see Auth above).
- No secrets or passwords in source code.
- Use indexes for every query that filters by academy, and paginate long lists. Don't load whole tables into memory.
- Separate Convex dev and prod deployments. Use `.env.local` for development and Vercel / EAS environment variables for builds.
- The same screens work on iOS, Android and web; test all three.
