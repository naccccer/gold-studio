# Ovala Roadmap

## Product Direction

Ovala is a mobile-first Farsi RTL app for turning low-quality jewelry, gold, watch, and luxury accessory photos into premium studio-style product images.

The product should stay professional, minimal, premium, image-led, and easy for non-technical users. The normal user flow is a guided assistant, not a SaaS dashboard, form-heavy admin panel, prompt-heavy AI tool, or text-to-image playground.

Text-to-image and provider/debug controls are admin/internal only. The default user path is clean catalog/product imagery.

## Current Status

- Auth, signup/login, account, billing, gallery, project creation, project status, result review, support, FAQ, and admin routes are implemented in the single Next.js app.
- User navigation is organized around Home, Gallery, New Project, Projects, and Account.
- Gallery owns uploaded source product photos. Projects owns generated outputs and generation status.
- `/billing` owns packages, standalone credits, card-to-card payment details, purchase status, and receipt upload.
- `/admin` is now a separate operations console with overview, health, audit, users, billing, projects, AI operations, assets, style controls, support/FAQ, and referrals.
- Local uploads and generated results are stored under `.local-storage/uploads` when `STORAGE_DRIVER="local"` and are streamed through authorized `/api/storage/...` routes.
- Prisma uses MySQL and generates the client into `src/generated/prisma`.
- Image generation uses the provider boundary in `src/lib/ai`, with Liara as the default path and an admin-controlled Avalai path for Gemini image testing.
- DB-backed rate limits, credit reservations, manual purchase review, sales referral codes, support tickets, FAQ, and admin billing operations are present.
- Batch generation starts from Gallery, creates one project per selected source photo, and reserves generation credit until each output succeeds.
- New project creation supports optional supporting product photos for complicated products: one primary source plus up to two extra product angles still creates one project and one output.

## Next Priorities

- Production hardening: verify real Liara/Avalai generation, retry behavior, storage display URLs, provider cost, and failed-state recovery on the deployment target.
- Release readiness: route QA across auth, home, gallery, new project, project detail, projects, account, billing, support, settings, and admin.
- Mobile polish: check the `393x852` mobile layout target for Farsi wrapping, RTL controls, bottom navigation, action placement, calm motion, and accidental scrolling.
- Admin operations QA: review the rebuilt navy/white console with real data across overview, health, audit, users, billing, projects, AI, assets, styles, support/FAQ, and referrals.
- Documentation hygiene: keep docs short and current; update this file only when scope or active priorities change.

## Local Database

Current local default is XAMPP MySQL on `127.0.0.1:3306`.

Use:

```powershell
npm run db:generate
npx prisma migrate deploy
```

`npm run db:generate` only regenerates Prisma Client. It does not reset data.

## Verification

Run after meaningful implementation or docs cleanup:

```powershell
npm run check:mojibake
npm run lint
npm run build
```
