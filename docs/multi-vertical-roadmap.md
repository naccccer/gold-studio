# Ovala Multi-Vertical Roadmap

## Purpose

Ovala is moving from a jewelry-only studio product into a multi-vertical product photography system. The first expansion vertical is Food & Drink, with Clothing and Furniture reserved for later.

This roadmap is the live execution path. Each phase should be implemented in a focused session, verified, committed, and pushed before the next phase starts.

## Operating Rules For Each Session

- Work only on `codex/multi-vertical-platform` unless the user explicitly changes the branch.
- Start every session by reading this file, `roadmap.md`, `AGENTS.md`, and the files directly relevant to the current phase.
- Do not skip ahead. Finish the current phase, verify it, commit it, and update this file before starting the next phase.
- Before any phase that creates or applies migrations, create and use an isolated local test database for that phase. Never run phase work against the main local launch database, staging, or production.
- Keep the app as one Next.js repo, one database, one auth system, one admin console, one billing system, and one generation worker.
- Preserve the existing Jewelry experience unless the phase explicitly changes it.
- Keep user-facing text-to-image out of scope.
- Keep AI logic inside `src/lib/ai`.
- Update `roadmap.md` whenever a phase changes product scope or current status.

## Database Safety

Feature-branch implementation must not mutate the main app database until the work has been reviewed, selected, merged, and intentionally deployed.

Required database workflow for implementation phases:

1. Confirm the current `DATABASE_URL` is not production, staging, or the main local launch database.
2. Use the shared isolated Codex execution database for this multi-vertical branch:
   - `gold_studio_phase1_codex`
3. Point the current shell session to that test database before running Prisma commands:

   ```powershell
   $env:DATABASE_URL="mysql://root@127.0.0.1:3306/gold_studio_phase1_codex?allowPublicKeyRetrieval=true"
   C:\xampp\mysql\bin\mysql.exe -h 127.0.0.1 -P 3306 -u root -e "CREATE DATABASE IF NOT EXISTS gold_studio_phase1_codex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   npx prisma migrate deploy
   ```

4. Use that same shell-scoped `DATABASE_URL` for targeted checks, local dev, and final phase verification.
5. Do not edit `.env` to point at a test database unless the user explicitly asks for a persistent local switch.
6. Do not run `npx prisma migrate deploy`, `npx prisma migrate dev`, or `npx prisma migrate reset` against `gold_studio` during feature-branch work.
7. If local MySQL/MariaDB is not running, stop database work and repair local MySQL or use a separate local test server. Never use production or staging as a fallback test database.

Before any final merge/deploy, take a backup and apply migrations intentionally through the deployment process.

## Target Architecture

- `vertical` is a first-class concept.
- Initial verticals:
  - `jewelry`
  - `food`
- Reserved future verticals:
  - `clothing`
  - `furniture`
- Subdomains define the user-facing vertical context:
  - current jewelry host -> `jewelry`
  - `food.ovala.ir` -> `food`
- Accounts are shared across verticals.
- The credit wallet is shared across verticals.
- Gallery, projects, styles, ready samples, and generation prompts are scoped by vertical.
- Admin remains shared, with vertical filters where operational behavior changes.

## Pricing Direction

Use internal credit units from the start:

- `100 creditUnits = 1 visible credit`
- Food & Drink generation cost: `100 creditUnits`
- Jewelry generation cost: `300 creditUnits`

User-facing screens should display visible credits. Billing and reservation logic should store and calculate internal units.

## Phase 1 - Vertical Foundation

Goal: make the app vertical-aware without changing the visible Jewelry product behavior.

Implement:

- Add a central vertical registry in shared logic.
- Resolve the current vertical from the request host, with a local development fallback.
- Add `vertical` to behavior-critical records:
  - product assets
  - projects
  - generation batches
  - creative styles
  - style categories if needed for filtering
  - ready style/reference samples where user-visible selection depends on vertical
- Backfill all existing production records as `jewelry`.
- Scope user gallery, projects, style lists, and ready samples to the current vertical.
- Keep admin global for this phase, but make the stored vertical visible where useful.

Do not:

- Add Food UI copy yet.
- Refactor all prompts yet.
- Add Clothing or Furniture behavior beyond reserved IDs.
- Split auth, billing, admin, database, or worker.

Exit criteria:

- Existing Jewelry flows still work on the current host.
- New records created on the Jewelry host are stored as `jewelry`.
- No Food content is visible yet unless seeded deliberately in a later phase.
- Schema and migration testing was done against a phase-specific test database, not the main local launch database.
- Worktree is clean after commit and push.

## Phase 2 - Credit Units

Goal: move credit accounting to internal units and support different generation costs per vertical.

Implement:

- Migrate user credit balances and reserved balances to internal units.
- Migrate package credits and subscription counters to internal units where they represent spendable generation balance.
- Update reservation, capture, release, package purchase, subscription, referral, quality refund, admin credit, and sales code paths to use units.
- Add a single helper layer for formatting visible credits from internal units.
- Charge by vertical:
  - `food`: `100`
  - `jewelry`: `300`
- Ensure batch generation reserves the correct units per output.

Do not:

- Create separate wallets per vertical.
- Create per-vertical billing packages unless explicitly requested later.

Exit criteria:

- Existing balances display correctly as visible credits.
- Jewelry generation costs 3 visible credits.
- Food cost support exists even if Food UI is not fully launched yet.
- Admin billing operations remain understandable.

## Phase 3 - Ovala Food User Experience

Goal: launch `food.ovala.ir` as a dedicated Food & Drink product experience on the shared platform.

Implement:

- Host-based Food context for `food.ovala.ir`.
- Food-specific auth/home/gallery/project copy and visual direction.
- Food-only gallery and projects inside the Food host.
- New project flow defaults to Food and never asks the user to choose Jewelry vs Food inside the Food host.
- Food product types:
  - food dish
  - drink
  - dessert
  - cafe item
  - restaurant plate
  - packaged food or drink
- Five Food styles:
  - Menu/catalog
  - Instagram/social
  - Minimal
  - Luxury
  - UGC/natural
- Food preview/sample assets good enough for launch-quality trust.

Do not:

- Show Jewelry samples, product types, or styles inside Food.
- Add free-form user prompt entry.

Exit criteria:

- `food.ovala.ir` feels like Ovala Food, not Jewelry with renamed labels.
- Same account can use Jewelry and Food.
- Food gallery/projects/styles remain isolated from Jewelry.

## Phase 4 - Prompt Architecture

Goal: make generation prompt assembly vertical-aware while preserving Jewelry quality.

Implement:

- Keep shared prompt primitives for product identity, output preset, and provider constraints.
- Add Jewelry prompt rules as the protected existing behavior.
- Add Food prompt rules for appetite appeal, freshness, plating, packaging, labels, and dish/drink identity preservation.
- Add product-type-specific Food refinements where necessary.
- Keep admin style prompts usable, but apply vertical rules automatically during generation.

Do not:

- Build an abstract plugin system for prompts.
- Rewrite all style controls unless required by Food behavior.

Exit criteria:

- Jewelry hard cases still preserve stones, metal, watches, clasps, model-wear behavior, and sample-reference replacement.
- Food outputs do not turn the item into a different dish, drink, package, or brand.

## Phase 5 - Admin And Operations

Goal: make operations reliable across verticals without creating separate admin apps.

Implement:

- Add vertical filters to admin assets, projects, styles, samples, and quality review surfaces.
- Let styles and samples be assigned to a vertical.
- Show project vertical and credit unit cost where operationally useful.
- Keep support, notifications, audit, and billing global unless a real workflow requires vertical scoping.

Exit criteria:

- Admin can inspect and manage Food and Jewelry without mixing user-facing catalogs.
- Operators can debug generation cost and vertical routing per project.

## Validation Gate Before Phase 6

Goal: prove the Jewelry + Food multi-vertical foundation before adding more vertical behavior.

Run before starting Phase 6:

- QA Food on `food.ovala.ir` and local `OVALA_LOCAL_VERTICAL=food`.
- QA Jewelry on the default host to confirm launch behavior did not drift.
- Verify users on Jewelry cannot see Food gallery items, projects, styles, samples, or home carousel content.
- Verify users on Food cannot see Jewelry gallery items, projects, styles, samples, or home carousel content.
- Audit admin assets, projects, styles, samples, outputs, and quality reviews with both Jewelry and Food filters.
- Verify generation routing and prompt behavior for both verticals:
  - Avalai remains the default primary image provider.
  - Liara remains manually selectable in `/admin/ai` and available as fallback/support path.
  - Jewelry prompts preserve jewelry-specific safeguards.
  - Food prompts preserve dish/drink/package identity and appetite appeal.
- Verify credit unit costs during real or controlled generation:
  - `jewelry`: `300 creditUnits`
  - `food`: `100 creditUnits`
- Fix any cross-vertical leaks, cost mismatches, prompt regressions, or admin filter confusion before adding Clothing/Furniture behavior.

Exit criteria:

- Jewelry and Food pass user-flow QA.
- Admin can inspect both verticals without accidental catalog mixing.
- Provider routing, prompt policy, and credit reservations match the intended vertical.
- Any fixes found during QA are committed and pushed before Phase 6 begins.

Validation result on 2026-06-24:

- Host routing passed for default Jewelry hosts, `food.ovala.ir`, and local `OVALA_LOCAL_VERTICAL=food`.
- Local reserved future vertical overrides now fall back to Jewelry so Clothing/Furniture behavior cannot activate before Phase 6.
- User-facing gallery, projects, styles, ready samples, style-reference assets, storage reads, and home carousel paths were audited for Jewelry/Food vertical scoping.
- Admin assets, reference assets, ready samples, outputs, projects, home carousel slides, and quality reviews were audited with Jewelry/Food filters.
- Isolated DB audit on `gold_studio_phase1_codex` found no Jewelry/Food credit reservation cost mismatches.
- Provider routing remained Avalai-primary with Liara selectable in `/admin/ai` and available in the fallback attempt order.
- Prompt policy checks covered Jewelry safeguards and Food identity/appetite-preservation rules.

## Phase 6 - Future Verticals

Goal: add Clothing and Furniture through the same foundation, not new architecture, only after the validation gate passes.

Implement later:

- Add `clothing` and `furniture` to the registry.
- Add subdomain mapping.
- Add product types, styles, samples, prompt rules, and credit costs.
- Reuse shared auth, billing, admin, storage, and worker.

## Required Verification

Run the full verification suite only at the end of each phase, after that phase is functionally complete and before the phase commit/push:

```powershell
$env:DATABASE_URL="mysql://root@127.0.0.1:3306/gold_studio_phase1_codex?allowPublicKeyRetrieval=true"
npm run check:prompts
npm run check:model-routing
npm run check:readiness
npm run check:mojibake
npm run lint
npm run build
```

During a phase, use targeted fast checks only for the files or behavior being changed. Do not run `npm run build` repeatedly for small intermediate edits or documentation-only updates unless the user explicitly asks for it.

For UI phases, manually review the `393x852` mobile layout target. Capture screenshots only when explicitly requested.

## Phase Log

- 2026-06-24: Roadmap created on `codex/multi-vertical-platform`. No product implementation started yet.
- 2026-06-24: Phase 1 Vertical Foundation implemented on `codex/phase-1-vertical-foundation`: added the central vertical registry and host resolver, stored `vertical` on behavior-critical records with a jewelry backfill, scoped user gallery/projects/styles/ready samples to the current vertical, and added lightweight admin vertical filters/labels. Existing Jewelry behavior remains the default.
- 2026-06-24: Phase 2 Credit Units implemented on `codex/multi-vertical-platform`: migrated spendable credit balances, reservations, packages, subscriptions, credit events, referrals, and sales codes to internal units; added centralized credit unit helpers; charged generation by vertical (`jewelry` 300 units, `food` 100 units); kept user/admin displays in visible credits; and verified migrations against `gold_studio_phase1_codex`, not `gold_studio`.
- 2026-06-24: Phase 3 Ovala Food User Experience implemented on `codex/multi-vertical-platform`: marked Food launch-ready for `food.ovala.ir` and `OVALA_LOCAL_VERTICAL=food`, added Food product types, Food user-facing copy and surface treatment across auth/home/gallery/project flows, Food-only ready samples and fallback carousel/assets, five Food visible styles, and a Food style data migration verified against `gold_studio_phase1_codex`.
- 2026-06-24: Phase 3 separation hardening added vertical-scoped `HomeCarouselSlide` records/admin filtering so Food home carousel uploads only render in Food mode and existing carousel rows remain Jewelry by default; migration verified against `gold_studio_phase1_codex`.
- 2026-06-24: Phase 4 Prompt Architecture implemented on `codex/multi-vertical-platform`: moved generation prompt assembly to vertical-aware prompt rules, preserved Jewelry model/clasp/sample-reference behavior, added Food prompt rules for appetite appeal, freshness, plating, packaging, labels, dish/drink/package identity, and product-type refinements, and passed vertical context through provider suffixes and product vision analysis. No schema migration was needed.
- 2026-06-24: Provider routing clarified after Phase 4: Avalai is the default primary image provider and Liara remains the fallback provider if Avalai fails; admin/provider docs and routing checks were updated to prevent the primary/fallback order from drifting.
- 2026-06-24: Phase 5 Admin And Operations implemented on `codex/multi-vertical-platform`: tightened vertical filtering across admin assets, reference assets, ready samples, projects, outputs, and quality reviews; made ready sample upload/delete vertical-aware for Jewelry and Food; scoped operational counters to the selected vertical; and surfaced project credit-unit costs on project, output, and quality-review inspection paths. No schema migration was needed.
- 2026-06-24: Validation Gate Before Phase 6 completed on `codex/multi-vertical-platform`: audited Jewelry/Food host routing, local Food override, user/admin vertical scoping, provider routing, prompt policy, and credit-unit costs against `gold_studio_phase1_codex`; fixed local reserved-vertical routing so Clothing/Furniture cannot activate before Phase 6. Phase 6 was not started.
