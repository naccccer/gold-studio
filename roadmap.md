# Gold Studio Roadmap

## Current Direction
Gold Studio is a mobile-first, Farsi-only, RTL-first AI image studio for jewelry, gold, watches, and luxury accessories.

The product is built around two connected workspaces:

- `گالری`: source product photos, upload, organization, selection, and batch starts.
- `پروژه‌ها`: generated outputs, queued/processing/failed/completed jobs, review, retry, and download.

Main signed-in navigation:

```text
خانه | گالری | + | پروژه‌ها | حساب
```

Default journey:

```text
ورود / ثبت‌نام -> گالری یا پروژه جدید -> انتخاب تصویر -> انتخاب کادر خروجی -> انتخاب سبک -> تولید -> بررسی نتیجه -> دانلود
```

## Rebuild Status
- [x] Add `lucide-react` for one consistent icon system.
- [x] Replace signed-in shell with real mobile IA: `خانه`, `گالری`, center `پروژه جدید`, `پروژه‌ها`, `حساب`.
- [x] Add `/account` for identity, access state, logout, and admin entry.
- [x] Add `/gallery` as the source-photo workspace.
- [x] Add Prisma models for source assets, collections, generation batches, and batch items.
- [x] Let fresh uploads create `ProductAsset` records.
- [x] Let project creation start from fresh upload or Gallery asset.
- [x] Add batch generation from selected Gallery assets.
- [x] Add Prisma-backed dynamic style catalog and `/admin/styles`.
- [x] Move generation to queued/processing/completed/failed DB-backed jobs.
- [x] Run a whole-product UI clarity pass before storage work.
- [x] Add storage adapter with local and S3-compatible storage support.
- [x] Add a VPS deployment and server update runbook.
- [x] Simplify auth UX and support email-or-phone password login with nullable email plus unique phone.

## Phase 1 - Gallery-First Foundation And Core UI
Prompt:
```text
Build Gold Studio as a gallery-first premium product image studio. Preserve auth, owner-scoped access, server-side API behavior, and GapGPT integration. Add /gallery, five-slot mobile nav, ProductAsset data model, batch creation from selected assets, and project creation from either fresh upload or Gallery asset.
```

Acceptance criteria:
- [x] Mobile nav uses `خانه`, `گالری`, center `+`, `پروژه‌ها`, and `حساب`.
- [x] `/gallery` supports multi-upload, asset grid, selection mode, asset detail, and batch creation.
- [x] Fresh project uploads create Gallery assets.
- [x] `/projects/new?assetId=...` starts generation from a Gallery asset.
- [x] `/projects` remains focused on generated outputs.
- [x] User-facing text-to-image controls are removed.

Verification:
```powershell
npm run check:mojibake
npm run lint
npm run build
```

## Phase 2 - Style Catalog Data And Admin Library
Prompt:
```text
Introduce Prisma-backed style catalog models for admin-manageable styles, preview images, ordering, visibility, categories, optional user controls, and variants. Support placeholder preview assets now and keep user-facing style cards simple and visual.
```

Acceptance criteria:
- [x] Styles are first-class DB records.
- [x] User style selection reads active styles only.
- [x] Gallery batch generation uses the same active catalog.
- [x] Prompt text never appears in user-facing creation UI.
- [x] Admin can edit, deactivate, reorder, and preview seeded styles.

Verification:
```powershell
npm run check:mojibake
npm run lint
npm run build
```

## Phase 3 - Dynamic Style IDs
Prompt:
```text
Replace enum-bound style selection with dynamic style IDs. Add admin create/archive behavior for styles, and keep user-facing style selection reading only active, visible catalog records.
```

Acceptance criteria:
- [x] `Project` and `GenerationBatch` reference a `CreativeStyle` record directly through `styleId`.
- [x] New project and Gallery batch creation submit dynamic style IDs.
- [x] Admin can create, edit, deactivate, hide, and reorder styles without a Prisma enum migration.
- [x] User style cards hide prompt text and inactive/hidden styles.

## Phase 4 - Async Generation
Prompt:
```text
Move generation to a DB-backed async model with queued, processing, completed, and failed states. Keep the MVP single-repo and avoid Redis unless explicitly approved.
```

Acceptance criteria:
- [x] Project and batch creation enter queued/processing before completion.
- [x] Result and batch screens are returnable while work is queued or processing.
- [x] Failed jobs remain visible in admin project lists.
- [x] Generation stays inside the single Next.js repo without Redis.

## Phase 5 - Product UI Clarity And Consistency Pass
Prompt:
```text
Run a whole-product UI clarity and consistency pass for Gold Studio before storage work. Keep product behavior unchanged. Make the signed-in app cleaner, more premium, less text-heavy, and more consistent across creation, gallery, projects, result, account, auth, landing, and admin baseline. Replace large/messy mastheads with a slim context-aware mobile header. Use minimal visible labels, icon-led actions, and contextual help through mobile bottom sheets or desktop popovers. Improve Account into a polished membership/profile hub. Run npm run check:mojibake, npm run lint, and npm run build. Capture 393x852 screenshots for key user routes when browser tooling is available.
```

Acceptance criteria:
- [x] Creation flow is less text-heavy at 393x852.
- [x] Style cards show image and name by default; selected style reveals details and controls.
- [x] Mobile header is compact, consistent, and task-aware.
- [x] Account is a membership/profile hub with identity, credits, access, admin entry, support, and logout.
- [x] Icon buttons have accessible names; high-consequence actions still include text.
- [x] No visible mojibake in touched user-facing files.

Verification:
```powershell
npm run check:mojibake
npm run lint
npm run build
```

Screenshots:
- Capture mobile 393x852 screenshots for `/dashboard`, `/gallery`, `/projects/new` upload step, `/projects/new` style step, `/projects`, `/projects/[projectId]`, `/account`, and `/admin` when browser QA is requested or available.

## Phase 6 - S3-Compatible Storage
Prompt:
```text
Introduce a storage adapter and support S3-compatible upload/result storage while keeping local storage for development. Do not break existing public upload paths.
```

Acceptance criteria:
- [x] Gallery assets and generated results can use configured S3-compatible storage.
- [x] Local dev still works.
- [x] Storage env vars and deployment notes are documented.

## Phase 7 - Billing Groundwork
Prompt:
```text
Prepare subscription/access UI and data boundaries for a future Iran-friendly payment gateway. Keep provider choice open.
```

Acceptance criteria:
- Account shows plan/access state.
- Admin can inspect/manage access state.
- Creative flow only blocks when access rules require it.

## Brand Identity - Studio OVALA Logo Set
Prompt:
```text
Create a production-ready Studio OVALA logo set from the approved source vector files. Preserve the oval O, champagne dot and arc, thin slash, rounded black strokes, and STUDIO subtitle. Deliver brand assets and a short usage guide without wiring the app UI yet.
```

Acceptance criteria:
- [x] Logo master SVGs live in `public/brand`.
- [x] Logo set includes primary, horizontal, wordmark, compact mark, app icon, favicon, watermark, light, and dark variants.
- [x] Brand usage guide documents logo usage, palette, typography mood, image style, motifs, and avoid rules.
- [x] App favicon and metadata remain unchanged for this phase.

## UI Identity Direction - Approval Board
Prompt:
```text
Create a visual approval board for the first Studio OVALA UI direction using the reference collage format, tailored to the brand and showing the simple Farsi RTL user flow before wiring UI code.
```

Acceptance criteria:
- [x] Approval board uses the real OVALA logo assets from `public/brand`.
- [x] Board follows the reference collage structure while staying premium, calm, image-led, and jewelry-focused.
- [x] Board shows the simple user flow: home, gallery, style selection, and result.
- [ ] Import or recreate the board in Figma once the Figma MCP plan limit is available again.

## Design Prototype - Simple User Flow
Prompt:
```text
Create a local reviewable UI design prototype for the simple user flow as the best alternative to Figma. Keep it mobile-first, Farsi-first, calm, image-led, premium, and grounded in the Studio OVALA brand system. Cover Home, Gallery/source selection, New Project guidance, Processing, and Result review without wiring production logic.
```

Acceptance criteria:
- [x] Prototype lives at `/design/user-flow`.
- [x] Flow includes Home, source photo selection, project setup, processing, and result review frames.
- [x] Uses Studio OVALA brand assets, ivory/soft-black/champagne palette, and existing jewelry placeholder imagery.
- [x] Screenshot artifact captured for review.

## Phase 8 - QA And Consistency Hardening
Prompt:
```text
Run a full UI/UX QA pass across public, auth, home, Gallery, project creation, result review, Projects, Account, and Admin routes. Fix RTL, mojibake, mobile overflow, icon consistency, spacing, and state gaps. Capture required 393x852 screenshots.
```

Acceptance criteria:
- No obvious visual drift.
- No mojibake.
- No mobile overflow at 393x852.
- Verification commands pass or known unrelated failures are documented.

## Maintenance Rule
Update this file whenever scope, phase status, or product direction changes.
