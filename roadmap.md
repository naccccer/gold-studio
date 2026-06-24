# Ovala Roadmap

## Product Direction

Ovala is a mobile-first Farsi RTL app for turning low-quality product photos into premium studio-style product images.

The launch product is Jewelry: gold, watches, luxury accessories, and related catalog imagery. The accepted expansion path is a shared multi-vertical platform, starting with Food & Drink.

The user experience should stay professional, minimal, premium, image-led, and easy for non-technical users. Ovala is a guided assistant, not a SaaS dashboard, form-heavy admin panel, prompt-heavy AI tool, or text-to-image playground.

Text-to-image and provider/debug controls are admin/internal only. The default user path is clean catalog/product imagery.

## Current Product

- Single Next.js app with shared auth, account, billing, gallery, project creation, project status/result review, notifications, support, FAQ, and admin routes.
- User navigation is Home, Gallery, New Project, Projects, and Account.
- Gallery owns uploaded source product photos. Projects owns generated outputs and generation status.
- `/billing` owns packages, standalone credits, card-to-card payment details, purchase status, and receipt upload.
- `/admin` is a separate operations console with health, AI/provider, assets, styles, projects, billing, users, support, FAQ, backups, audit, and referrals.
- Local uploads/generated results use `.local-storage/uploads` when `STORAGE_DRIVER="local"` and are streamed through authorized `/api/storage/...` routes.
- Image generation goes through `src/lib/ai`; Avalai is the default primary image provider and Liara remains fallback/support and manually selectable in `/admin/ai`.
- Generation recovery runs through `npm run worker:generation`; production health recovery uses `npm run watchdog:health`; backups use `/admin/backups`, `npm run backup:run`, and `npm run backup:scheduler`.
- Billing supports credit reservations, manual purchase review, referral/sales codes, admin-assigned custom plans, per-plan "نسخه دیگر" limits, and output-only accounting for alternate versions.
- Prompt policy protects product identity: jewelry safeguards remain active, product-only outputs remove source-photo people/hands, model styles allow human context only when explicit, and sample-reference styles borrow scene/composition while preserving the uploaded product.
- Jewelry ready style references now include a broader curated set of product, editorial, model, and watch samples for users who do not have their own style photo yet.

## Multi-Vertical Status

Multi-vertical expansion is tracked in `docs/multi-vertical-roadmap.md` on `codex/multi-vertical-platform`.

- Phases 1-5 are implemented: vertical foundation, credit units, Ovala Food UX, vertical-aware prompt architecture, and admin/operations filtering.
- The Validation Gate Before Phase 6 is complete for Jewelry + Food: user/admin vertical scoping, Food host/local routing, provider routing, prompt policy, and credit-unit costs were audited.
- Phase 6 is on hold. Clothing/Furniture remain reserved IDs only; reserved local overrides fall back to Jewelry until Phase 6 intentionally starts.
- Jewelry generation costs `300 creditUnits`; Food generation costs `100 creditUnits`.
- Food is active through `food.ovala.ir` and local `npm run dev:food`.
- Jewelry remains the default host/local behavior and can be forced locally with `npm run dev:jewelry`.
- Food now uses restaurant/cafe product types, six visible launch styles, a Food-specific sample-photo style (`food_style_sample_reference`), and Food-aware sample-reference prompt/routing paths.
- Food ready style references now include a broader Pinterest-like set across cafe drinks, desserts, clean menu catalog shots, social compositions, and restaurant plating.
- Style-reference entry points use a saved/bookmark-style icon treatment; save-to-samples menu actions use the matching archive-add icon.

## Next Priorities

- Keep Phase 6 held until Jewelry + Food polish and launch QA are accepted.
- Finish Food/Jewelry QA across auth, home, gallery, new project, project detail, projects, notifications, quality reviews, account, billing, support, settings, and admin.
- Verify real Avalai primary generation, Liara fallback behavior, provider cost, storage display URLs, failed-state recovery, backups, worker, watchdog, and PM2 process health on the deployment target.
- Check the `393x852` mobile layout target for Farsi wrapping, RTL controls, bottom navigation, action placement, calm motion, and accidental scrolling.
- Keep launch/readiness/deployment docs current when deploy, env, storage, billing, SMS, provider, worker, watchdog, or admin operations change.
- Add the approved FarazSMS pattern code and line number before testing phone verification with real users.

## Local Database

Current local default is XAMPP MySQL on `127.0.0.1:3306`.

Normal local app work:

```powershell
npm run db:generate
npx prisma migrate deploy
```

`npm run db:generate` only regenerates Prisma Client. It does not reset data.

Multi-vertical branch verification must use the isolated Codex database when a task asks for it:

```powershell
$env:DATABASE_URL="mysql://root@127.0.0.1:3306/gold_studio_phase1_codex?allowPublicKeyRetrieval=true"
node -e "console.log(process.env.DATABASE_URL)"
```

Do not run Prisma/build/check work against `gold_studio` when the task explicitly requires `gold_studio_phase1_codex`.

## Verification

Run the full suite at the end of each implementation phase, after that phase is complete and before its commit/push:

```powershell
npm run check:prompts
npm run check:model-routing
npm run check:readiness
npm run check:mojibake
npm run lint
npm run build
```

During a phase, use targeted fast checks. Do not run `npm run build` repeatedly for small intermediate edits or documentation-only updates unless explicitly requested.
