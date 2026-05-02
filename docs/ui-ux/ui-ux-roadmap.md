# Gold Studio UI/UX Production Roadmap

## Visual Mission
Gold Studio is a mobile-first luxury AI product photo studio for Farsi/RTL users. The core experience is:

`upload product image -> choose premium visual style -> generate enhanced advertising image -> review/download result`

Every UI phase must move the product toward a private luxury creative atelier: calm, precise, editorial, image-led, and low-friction. The app must never drift into a startup SaaS dashboard, analytics product, admin panel, or generic Tailwind template.

## Progress And Execution Plan

### [x] Phase 0A - AI Coding Foundation
Objective: Make the repository understandable and safe for repeated AI coding sessions.

Usually affected:
- `src/app`
- `src/features`
- `src/components`
- `src/lib`
- `docs`

Completed notes:
- App Router structure is established.
- Routes are thin.
- Feature folders own feature screens and components.
- Shared UI lives in `src/components`.
- Shared logic lives in `src/lib`.

Do not accidentally redesign:
- No UI redesign work belongs in this phase retroactively.
- Do not move route or feature boundaries without a product reason.

### [x] Phase 0B - Persian Mojibake Protection
Objective: Protect Farsi/RTL copy from encoding corruption.

Usually affected:
- `docs/conventions.md`
- `scripts/check-mojibake.mjs`
- Persian strings across `src`

Completed notes:
- UTF-8 Persian rules are documented.
- Mojibake check is available and must be run after UI phases.
- Persian strings must stay direct UTF-8.

Do not accidentally redesign:
- Do not rewrite large UI areas just because copy is being repaired.
- Do not convert Persian copy to escaped Unicode unless technically required.

### [x] Phase 1 - Visual Foundation And Shared Luxury Tokens
Objective: Establish the base visual language: warm ivory, soft white, charcoal, muted stone, sparse champagne-gold, restrained radius, and calm shared primitives.

Usually affected:
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/field.tsx`
- `src/components/ui/surface.tsx`
- `src/components/ui/page-shell.tsx`
- `src/components/ui/status-pill.tsx`

Completed notes:
- Shared color tokens and typography defaults are in place.
- Buttons, fields, surfaces, page shells, and status pills have a luxury baseline.
- Shells no longer rely on slate/amber SaaS defaults.

Do not accidentally redesign:
- Do not redesign feature screens while doing foundation work.
- Do not chase every old utility class in feature files unless the phase scope includes that screen.

### [x] Phase 2 - App Shell And Navigation Reframe
Objective: Turn the signed-in app frame from dashboard chrome into a quiet studio shell that supports the project workflow.

Usually affected:
- `src/app/(dashboard)/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/features/auth/components/logout-button.tsx`
- shared navigation/button primitives if needed

Execution goals:
- Keep navigation minimal and mobile-first.
- Make `پروژه جدید` the strongest navigational action.
- Reduce visual weight of header/nav compared with page content.
- Keep admin reachable for admins without making admin chrome dominate.

Do not accidentally redesign:
- Do not rebuild dashboard home content in this phase.
- Do not add a desktop enterprise sidebar.
- Do not introduce new routes or change auth behavior.
- Do not make nav items into loud pills or badge rows.

### [x] Phase 3 - Landing And Dashboard Home
Objective: Make the public landing and signed-in home feel editorial and action-led, focused on starting the studio workflow.

Usually affected:
- `src/app/(marketing)/page.tsx`
- `src/features/dashboard/screens/dashboard-home-screen.tsx`
- shared hero/home primitives only if reuse is clear

Execution goals:
- Landing page communicates luxury AI product photography with one clear primary CTA.
- Dashboard home becomes studio home, not analytics overview.
- Recent work and status may appear, but upload/generate workflow must dominate.
- Empty states must feel intentional and premium.

Do not accidentally redesign:
- Do not redesign `/projects/new` in this phase.
- Do not add KPI-card grids as the dashboard center.
- Do not create startup gradient hero cliches.
- Do not invent claims, metrics, or fake analytics.

### [x] Phase 4 - New Project Workspace
Objective: Make upload, style selection, and generation feel like one guided creative workflow.

Usually affected:
- `src/features/projects/screens/new-project-screen.tsx`
- `src/features/projects/components/new-project-form.tsx`
- `src/features/projects/presets.ts` style catalog types
- possible new project-only components under `src/features/projects/components`
- shared primitives only if the pattern will be reused

Execution goals:
- Upload module is visually dominant at the right moment.
- Style selector feels premium and easy to compare.
- Text-to-image test mode stays internal or visually de-emphasized unless explicitly requested.
- Pending/generation state is calm, stable, and clear.

Do not accidentally redesign:
- Do not change server action contracts unless required.
- Do not move AI logic into UI components.
- Do not add too many style decisions on one screen.
- Do not make style cards look like pricing cards or feature cards.

### [x] Phase 5 - Result Review Room
Objective: Make project detail feel like a result review room where the generated image is the hero.

Usually affected:
- `src/features/projects/screens/project-detail-screen.tsx`
- project result components under `src/features/projects/components`
- `src/components/ui/status-pill.tsx` only for semantic status mapping if needed

Execution goals:
- Generated result gets primary visual attention.
- Source image, style, and status support review without crowding.
- Download action is unmistakable when complete.
- Pending and failed states preserve layout stability and explain next steps.

Do not accidentally redesign:
- Do not redesign project archive in this phase.
- Do not add complex editing tools or comparison features unless requested.
- Do not make failure states alarming or technical.
- Do not crop jewelry/product images in a way that hides product identity.

### [ ] Phase 5B - Motion System And Premium Microinteractions
Objective: Define and implement a restrained motion system so Gold Studio feels premium, smooth, cinematic, and Apple-like in interaction quality without becoming noisy or playful.

Usually affected:
- `src/app/globals.css`
- shared motion constants or helpers under `src/lib` if needed
- `src/components/ui/page-shell.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/field.tsx`
- upload, style selector, progress, modal, and result components under `src/features/projects/components`
- route shells under `src/app/(dashboard)` only if transitions require shell support

Execution goals:
- Establish global motion principles, durations, easing, and reduced-motion behavior before adding broad animation.
- Add calm page, shell, and navigation transitions that preserve orientation and hierarchy.
- Make upload selection, style selection, generation progress, result reveal, modal entry/exit, image preview hover/tap, buttons, and fields feel tactile and intentional.
- Prefer elegant progress and reveal patterns over cheap loading spinners when the state can be shown more gracefully.
- Use motion to support product flow, focus, hierarchy, perceived quality, and confidence.

Do not accidentally animate yet:
- Do not animate admin data density, tables, auth security states, or hidden/low-value surfaces unless they are part of a verified user flow.
- Do not add random decorative motion, ambient loops, sparkles, bouncing effects, or hover effects everywhere.
- Do not create one-off animation values scattered across screens.
- Do not introduce heavy animation libraries without explicit approval.
- Do not let motion delay essential actions, obscure loading/error states, or make image review harder.

Verification expectations:
- Verify mobile first for smoothness, tap feedback, stable layout, and no jank during upload, generation, and result review.
- Verify `prefers-reduced-motion` disables or simplifies non-essential movement while preserving state clarity.
- Verify keyboard focus, hover, tap, and modal transitions remain clear and accessible.
- Verify animations do not shift layout unexpectedly or crop/obscure jewelry/product images.
- Run the standard UI checks after implementation: `npm run check:mojibake`, `npm run lint`, and `npm run build`.

### [ ] Phase 6 - Archive, Auth, And Admin Polish
Objective: Bring secondary screens into the same design language while keeping them operational and lower priority than the core workflow.

Usually affected:
- `src/features/projects/screens/projects-list-screen.tsx`
- `src/features/auth/components/auth-form.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/features/admin/screens/admin-home-screen.tsx`
- `src/features/admin/components/credits-form.tsx`

Execution goals:
- Project archive feels like a studio library, not a SaaS table workaround.
- Auth screens feel calm, premium, and trustworthy.
- Admin remains compact, practical, and token-based.

Do not accidentally redesign:
- Do not make admin visually more important than user workflow.
- Do not introduce dense enterprise tables unless the user asks.
- Do not change authentication or admin permissions.
- Do not create marketing-style auth pages with excessive copy.

### [ ] Phase 7 - Demo QA And Consistency Hardening
Objective: Verify the complete demo flow for visual consistency, mobile behavior, Persian integrity, and production readiness.

Usually affected:
- `roadmap.md`
- `docs/ui-ux/*` if design rules changed
- any screen/component files with QA fixes

Execution goals:
- Walk through `/`, `/login`, `/signup`, `/dashboard`, `/projects/new`, `/projects`, `/projects/[projectId]`, and `/admin`.
- Check mobile first, then tablet/desktop.
- Remove inconsistent slate/amber leftovers only when in active screens.
- Update roadmap status after completed implementation.

Do not accidentally redesign:
- Do not start new feature work during QA hardening.
- Do not change database schema, AI integration, or auth unless a verified bug requires it.
- Do not polish hidden or low-value surfaces before core demo surfaces.

## Scope Boundaries
- Keep the MVP in one Next.js App Router repository.
- Keep business logic out of UI components.
- Keep AI logic inside `src/lib/ai`.
- Keep route files thin; feature screens own screen composition.
- Prefer shared primitives over screen-local hacks.
- Create new components only when they reduce real duplication or isolate a clear feature-owned UI concept.
- Update `roadmap.md` when product phase status or scope changes.

## Anti-Goals
- No generic SaaS dashboard.
- No analytics-first home screen.
- No KPI cards as primary experience.
- No loud amber/gold theme flooding.
- No gradients, glows, neon, glassmorphism, or decorative blobs as default language.
- No giant over-rounded cards as the core layout system.
- No enterprise sidebars, dense tables, or heavy admin bars in the user flow.
- No duplicate helper functions or one-off screen-local styling when shared primitives should carry the system.
- No corrupted Persian, escaped Persian by default, or skipped mojibake checks.

