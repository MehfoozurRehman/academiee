# Academiee

Academiee is a simple, beautiful management app for coaching academies and tuition centres in Pakistan. Owners run students, batches, fees, attendance, tests, the timetable and notices; students log in to see their own classes, fees, attendance and results. Package / bundle ID: `com.academiee.app`. Web app: `*.vercel.app` (no custom domain yet).

Feature reference (old app's functionality and its known flaws): [docs/FEATURE_REFERENCE.md](docs/FEATURE_REFERENCE.md). The current build plan lives in [docs/PLAN.md](docs/PLAN.md).

## Project decisions

- **Web first.** Build and fully test the web version, then do iOS and Android.
- **Languages: English and Urdu only.** Urdu is written in **Urdu script (not Roman)**, so every screen must work right-to-left. Use logical layout (`start`/`end`, never `left`/`right`) and the Urdu font from `theme/`.
- **Roles:** academy owner, and student. Students sign in with academy code + student ID + a one-time code the owner shares on WhatsApp. Owners sign in with email codes (Resend, later); until Resend is set up use the test/review login.
- **No AI features** for now.
- No brand guidelines were supplied: Claude owns the visual design, within the taste rules below.
- **Subagents:** delegate well-specified feature work to Sonnet subagents and mechanical work (translations, seed data, legal/store text) to Haiku. Keep architecture, data model, permissions, design system and final review on the main model.

## Who I am and how I work

I build apps for small teams and businesses, shipped on iOS, Android and the web from one codebase. I'm a product owner first: I judge by what I see and use, not by the code. I often dictate by voice, so my messages can be long, repetitive or have transcription mistakes. Work out what I mean and don't ask me to rephrase.

## How to work with me

- **Be autonomous.** When I say "do it", "go ahead" or "don't stop", keep going until it's actually finished: build, test, fix, deploy. Decide sensible defaults yourself instead of asking. Ask only when the decision is really mine (money, deleting things, publishing, product direction), and then ask one short question with a recommended option.
- **Finish properly.** "Done" means it works on the target platforms, is committed, and is deployed where it belongs. Don't hand back half-done work with a list of things for me to do unless they truly need me (passwords, payments, my accounts).
- **Test like a user, then fix.** Use the browser for web, and the iOS Simulator and Android emulator for native. When I ask for testing, test every flow and edge case, fix what's broken, re-verify, and only then report. Never claim something works without having seen it work.
- **Never break what works.** After any change, check web as well as native; a fix on one platform must not crash another. Run the typecheck and tests before deploying.
- **Explain in plain words.** Keep reports short: what changed, what I can see now and where, and anything that needs me. No jargon dumps, no long code explanations unless I ask.
- **Guide me click by click** when I must do something myself (store consoles, Firebase, Apple keys, terminal prompts). Give the exact menu path and what to type. When I say "check terminal", read my terminal and tell me what to pick next.
- **Be careful with shared things.** Before revoking keys, deleting data, or changing credentials, check what else uses them and tell me the impact first. When an action needs my approval (deploys, deletions), ask and I'll click Allow.
- **Builds:** don't make production/store builds unless I say so. Testing builds and OTA updates to the preview channel are fine any time. When I say "publish", build, upload and submit to both stores.

## Design taste

- Clean, calm, modern and natural. It must not look AI-generated: no emoji decoration, no glow on everything, no generic gradient soup. Use effects sparingly where they mean something (the main action, the hero).
- Smooth animation: scroll reveals, word-by-word headlines, subtle parallax, polished micro-interactions. Animate transform/opacity only (UI-thread animation on native) and respect "reduce motion".
- Light and dark mode everywhere, following the system, with a toggle.
- Mobile first: check layouts at phone width with no horizontal scroll, main buttons above the fold, nothing hidden under the keyboard or home bar.

## Tech stack (keep it consistent)

- Expo (latest SDK) + React Native + TypeScript (strict) + Expo Router, with React Native Web for the browser. No UI kit: our own small component set in `src/components/ui/` and design tokens in `src/theme/`, with no hard-coded colours in screens.
- Convex for the backend. Enforce roles and permissions in **every** Convex function (derive the user on the server, never trust IDs from the client), scope everything to the user's academy, and keep pure business logic in `src/lib/logic/` with tests. Separate dev and prod deployments. Read `convex/_generated/ai/guidelines.md` before writing Convex code.
- Convex Auth. Owners: email one-time codes via Resend (no passwords), plus a test/review login that works without email. Students: academy code + student ID + one-time access code.
- Push (native phase): expo-notifications with Firebase (FCM V1) for Android and one shared Apple push key for iOS.
- Builds and release: EAS Build, EAS Submit and EAS Update with channels production, preview and development. Expo account/team: devscot.com. Apple team: Hammad Habib (CTHT6GHZ3R). Google Play: Devscot organization account.
- Web hosting: Vercel.
- Store readiness: privacy policy, terms, support and account-deletion pages; in-app account deletion; privacy labels; store screenshots and listing text.

## My machine

- macOS with Xcode, the iOS Simulator and the Android emulator (Pixel; start it with `-gpu host`). The Mac is often busy, so if the emulator is unreliable, say so and test Android another way rather than looping.
- Port 8081 may be in use by another project, so run Metro on **8082**.
- Ask before installing anything system-wide. Project packages are fine.
- Never print secrets, keys or login codes in chat, and never type my passwords. Put secrets in `secrets/` (git-ignored) or Convex/EAS environment variables.

## Working rhythm

1. For anything bigger than a screen, make a short plan, then build it phase by phase.
2. After each working step: test it, commit with a clear message, and deploy (backend + web, plus an OTA to preview when native screens changed).
3. Keep a running list of issues found and fixed, and give me a short summary at the end with any decisions I need to make.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
