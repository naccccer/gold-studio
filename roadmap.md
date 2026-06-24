# Ovala Roadmap

## Product Direction

Ovala is a mobile-first Farsi RTL app for turning low-quality product photos into premium studio-style product images. The current launch product is focused on jewelry, gold, watches, and luxury accessories; the accepted expansion path is a multi-vertical system starting with Food & Drink.

The product should stay professional, minimal, premium, image-led, and easy for non-technical users. The normal user flow is a guided assistant, not a SaaS dashboard, form-heavy admin panel, prompt-heavy AI tool, or text-to-image playground.

Text-to-image and provider/debug controls are admin/internal only. The default user path is clean catalog/product imagery.

Multi-vertical expansion is tracked in `docs/multi-vertical-roadmap.md`. The implementation branch is `codex/multi-vertical-platform`, and each phase should be completed, verified, committed, and pushed before the next phase starts.

## Current Status

- Auth, password login, phone OTP signup, phone OTP password reset, account, billing, gallery, project creation, project status, result review, support, FAQ, and admin routes are implemented in the single Next.js app; the login/signup entry is a swipe-driven "studio stage" scene (draggable Ovala medallion with a 3D depth transition into the form sheet, tap and reduced-motion fallbacks included).
- User navigation is organized around Home, Gallery, New Project, Projects, and Account.
- Gallery owns uploaded source product photos. Projects owns generated outputs and generation status.
- `/billing` owns packages, standalone credits, card-to-card payment details, purchase status, and receipt upload.
- `/admin` is a calm white/deep-navy operations console built on the `console.tsx` primitive kit: one job per page, link-driven tabs, master-detail surfaces (styles, support), and `<details>`-based progressive disclosure instead of always-visible mega-forms.
- Local uploads and generated results are stored under `.local-storage/uploads` when `STORAGE_DRIVER="local"` and are streamed through authorized `/api/storage/...` routes.
- Prisma uses MySQL through Prisma's standard query engine and keeps `DATABASE_URL` on the Prisma-compatible `mysql://` scheme.
- Image generation uses the provider boundary in `src/lib/ai`, with Avalai as the default primary path and Liara kept as the fallback path if Avalai fails.
- DB-backed rate limits, credit reservations, manual purchase review, sales referral codes, support tickets, FAQ, and admin billing operations are present.
- `SALES` is a real operational role for sales/payment work across users, billing, and referral codes, while system/admin-only surfaces remain blocked.
- `/admin/backups` and `npm run backup:run` create full launch backups with database dump, manifest, and current storage; `npm run backup:scheduler` keeps nightly backups with latest-3 retention.
- Launch security hardening includes identifier-based auth throttling, long-lived signed session revocation, global security headers, and guarded storage responses for non-display objects.
- Batch generation starts from Gallery, creates one project per selected source photo, and reserves generation credit until each output succeeds.
- Generation now has a DB-backed recovery worker (`npm run worker:generation`) that polls queued projects, resumes stale `PROCESSING` jobs, and runs as a separate PM2 process in production.
- Production availability now includes a PM2 health watchdog (`npm run watchdog:health`) that checks local `/api/health` and restarts the app after repeated failures. Public health is minimal, while detailed DB, generation, and storage metrics live in `/admin/health`.
- New project creation supports optional supporting product photos for complicated products: one primary source plus up to two extra product angles still creates one project and one output.
- Home now uses an admin-managed before/after carousel (`/admin/home`) with fallback placeholder slides until active slides are uploaded.
- Style reference empty-state samples now come from the ready sample folder and can be uploaded or removed from `/admin/assets/samples`.
- Curated style labels are simplified for users: social is "با جای متن", editorial is "با دکور", and cinematic is "سینمایی".
- With-model necklace prompts now default to no visible clasp: normal rear clasps are treated as hidden back-neck hardware, even when supporting images show them, unless the product has an unmistakable decorative front clasp.
- Product-only generation prompts now explicitly remove source-photo hands, wrists, people, clothing, and selfie reflections while preserving product identity; human context remains reserved for explicitly wearable/model styles.
- Sample-reference generation now treats the sample image as scene/composition only, keeps uploaded product identity locked, and asks providers for realistic replacement with perspective, shadows, occlusion, reflections, and physical placement.
- In-app notifications now support user inbox messages, admin manual/broadcast sends, and quality-review refund outcomes from the project result flow.
- Billing now supports admin-assigned custom user plans with separate project and output quotas, per-plan "نسخه دیگر" limits, and output-only accounting for alternate versions.
- Image generation now routes hard user styles (`style_with_model` and `style_sample_reference`) to Pro image models first, keeps easier styles on Flash-first routing, and clamps configured 4K image settings back to 2K.
- Admin style management now uploads style preview images directly with an inline preview instead of asking operators to paste image URLs.
- Admin console copy is being kept terse and operational, with redundant helper text removed, style preview uploads in place, and style metrics moved into a focused admin stats tab.
- Multi-vertical Phase 1 is implemented: the app has a central vertical registry, host-based current vertical resolution, jewelry-default vertical storage/backfill on behavior-critical records, user-facing gallery/project/style/sample scoping, and lightweight admin vertical filters/labels.
- Multi-vertical Phase 2 is implemented: credit accounting now stores internal units, user/admin displays remain in visible credits, Jewelry generation costs 3 visible credits, and Food cost support is ready at 1 visible credit.
- Multi-vertical Phase 3 is implemented: `food.ovala.ir` and `OVALA_LOCAL_VERTICAL=food` now present a dedicated Ovala Food user experience with Food copy, Food product types, Food-only styles/samples/assets, vertical-scoped home carousel records/fallbacks, Food fallback gallery/project visuals, and Food-scoped user flows on the shared account, wallet, admin, database, and worker.
- Multi-vertical Phase 4 is implemented: generation prompt assembly, provider suffixes, and product vision analysis are vertical-aware; Jewelry prompt safeguards remain protected, while Food prompts preserve appetite appeal, freshness, plating, packaging, labels, and dish/drink/package identity.
- Multi-vertical Phase 5 is implemented: admin assets, reference assets, ready samples, projects, outputs, and quality reviews now have stronger vertical filtering, vertical-aware ready sample management, scoped operational counts, and project credit-unit cost visibility for generation/debug review.

## Next Priorities

- Multi-vertical QA: verify Jewelry and Food admin operations across assets, samples, styles, projects, outputs, and quality reviews without cross-vertical user catalog mixing.
- Launch operations: keep production worker/watchdog/backup scheduler active in PM2, verify real Avalai primary generation, Liara fallback behavior, storage display URLs, provider cost, backups, and failed-state recovery on the deployment target.
- Release QA: route QA across auth, home, gallery, new project, project detail, projects, notifications, quality reviews, account, billing, support, settings, and admin.
- Mobile polish: check the `393x852` mobile layout target for Farsi wrapping, RTL controls, bottom navigation, action placement, calm motion, and accidental scrolling.
- Admin operations QA: review the rebuilt navy/white console with real data across overview, health, audit, users, billing, projects, AI, assets, styles, support/FAQ, and referrals.
- Documentation hygiene: keep `docs/launch-readiness.md`, `docs/repo-readiness.md`, deployment docs, and this file current when launch/operations scope changes.
- SMS readiness: add the approved FarazSMS pattern code and line number before testing phone verification with real users.
- Backend reliability: keep generation worker recovery, project/output quota reservation consistency, and health/smoke coverage under review as real production traffic grows.

## Local Database

Current local default is XAMPP MySQL on `127.0.0.1:3306`.

Use:

```powershell
npm run db:generate
npx prisma migrate deploy
```

`npm run db:generate` only regenerates Prisma Client. It does not reset data.

## Verification

Run the full suite at the end of each implementation phase, after that phase is complete and before its commit/push. During a phase, use targeted fast checks; do not run `npm run build` repeatedly for small intermediate edits or documentation-only updates unless explicitly requested.

```powershell
npm run check:prompts
npm run check:model-routing
npm run check:readiness
npm run check:mojibake
npm run lint
npm run build
```
