# Ovala Roadmap

## Product Direction
Ovala is a mobile-first Farsi RTL app for turning low-quality jewelry, gold, watch, and luxury accessory photos into premium studio-style product images.

The product should stay professional, minimal, premium, image-led, and easy for non-technical users. The normal user flow is a guided assistant, not a SaaS dashboard, prompt-heavy AI tool, admin panel, or text-to-image playground.

Keep text-to-image and provider/debug controls admin/internal only. The default output path is clean catalog/product imagery.

## Navigation And Workspace Ownership
Mobile user navigation:

```text
خانه | گالری | پروژه جدید | پروژه‌ها | حساب
```

- `گالری`: uploaded source product photos, upload/camera intake, crop, source asset review, and source organization.
- `پروژه جدید`: fastest guided generation path from selected source image to size and visual style.
- `پروژه‌ها`: generated outputs, generation status, retry, result review, fullscreen preview, download, and archive.
- `حساب`: identity, onboarding/profile, usable credit, subscription summary, support, FAQ, referral, output defaults, security, logout, and admin entry for admins.
- `/billing`: packages, standalone credits, card-to-card payment instructions, purchase status, and receipt upload.
- `/admin`: separate operational area for users, projects, packages, styles, provider events, support, access/credits, and audit-style operations.

## Current Feature Status
- Auth, onboarding, account, billing, gallery, project creation, project status, result review, and admin routes are implemented in the single Next.js app.
- Prisma uses MySQL and generates the client into `src/generated/prisma`.
- Storage supports local filesystem uploads by default and optional S3-compatible storage when intentionally enabled.
- Image generation uses the Liara-compatible provider boundary in `src/lib/ai`.
- Output preset is persisted per project so ratio-specific generation settings do not collapse into one global square default.
- New users start with tracked signup credit and can consume active subscription credit before standalone wallet credit.
- Manual card-to-card purchase requests, receipt upload, admin approval, package/subscription groundwork, credit events, support tickets, FAQ, and provider event logging are present.
- Soft archive behavior exists for assets/projects, with `npm run cleanup:archives` for retention cleanup.
- UI Phase 2 is complete: shared tokens and primitives now cover action hierarchy, media cards, fields, menus, segmented controls, status pills, and the touched gallery/projects/new-project/account/billing surfaces.
- UI Phase 2.5 is implemented: user-shell gutters, desktop phone-frame rhythm, responsive media-card sizing, sticky bottom dock spacing, context-menu clamping, and long-page bottom spacing have been tuned. Screenshot QA was skipped after the latest request to conserve token budget.
- UI Phase 3 is complete: auth first-impression screens were reviewed without redesign, home thumbnail date tags were removed, and the home shell/hero rhythm was tuned to avoid accidental scrolling while preserving the existing direction for later redesign.
- UI Phase 4 is complete: gallery intake and selection, the new-project source/size/style wizard, and the active processing screen now read as one guided studio flow while keeping user-facing text-to-image out of scope.
- UI Phase 5 is complete: result review and project ownership now use clearer status/metadata cues, more discoverable before/after comparison, stronger download hierarchy, and more trustworthy project-card ownership signals without expanding beyond the project surfaces.
- UI Phase 6 is complete: account, billing, support, referral, FAQ, profile, security, and output settings now use clearer utility grouping, repaired Persian copy, more trustworthy payment/support presentation, and consistent Vuesax-based user-facing iconography on the touched surfaces.
- UI Phase 7 is implemented: live admin routes now use a desktop-first operations shell, denser shared admin primitives, Ovala token alignment, direct assets navigation, and Vuesax-based icons on touched admin-facing UI while keeping provider/debug controls admin-only.

## Next Priorities
- Production hardening: verify real Liara generation, retry behavior, storage display URLs, and failed-state recovery on the deployment target.
- Release readiness: finish route QA across auth, home, gallery, new project, project detail, projects, account, billing, support, settings, and admin, with special attention to the completed Phase 4 guided flow, Phase 5 result ownership polish, Phase 6 utility-surface updates, and Phase 7 admin desktop operations.
- Mobile polish: check `393x852` screenshots for Farsi wrapping, RTL controls, bottom navigation, action placement, and the no-accidental-scroll behavior on focused creation screens when screenshot capture is requested.
- Admin operations QA: review the desktop-first admin panel with real data for table density, payment review speed, provider event scanning, and long-form package editing.
- Documentation hygiene: keep docs short and current; update this file when scope or active priorities change.

## Verification
Run after meaningful implementation or docs cleanup:

```powershell
npm run check:mojibake
npm run lint
npm run build
```

If build fails only because of the known PrismaClient issue in `src/lib/db.ts`, report it as unrelated and unchanged.

## Local Database Notes
- `npm run db:start` starts the isolated local MariaDB helper for this project.
- `npm run db:stop` stops it.
- Local helper data lives in `.local-mariadb` and usually uses `127.0.0.1:3307` as configured in `.env`.
