# Ovala Roadmap

## Product Direction

Ovala is a mobile-first Farsi RTL app for turning low-quality jewelry, gold, watch, and luxury accessory photos into premium studio-style product images.

The product should stay professional, minimal, premium, image-led, and easy for non-technical users. The normal user flow is a guided assistant, not a SaaS dashboard, form-heavy admin panel, prompt-heavy AI tool, or text-to-image playground.

Text-to-image and provider/debug controls are admin/internal only. The default user path is clean catalog/product imagery.

## Current Status

- Auth, password login, phone OTP signup, phone OTP password reset, account, billing, gallery, project creation, project status, result review, support, FAQ, and admin routes are implemented in the single Next.js app; the login/signup entry is a swipe-driven "studio stage" scene (draggable Ovala medallion with a 3D depth transition into the form sheet, tap and reduced-motion fallbacks included).
- User navigation is organized around Home, Gallery, New Project, Projects, and Account.
- Gallery owns uploaded source product photos. Projects owns generated outputs and generation status.
- `/billing` owns packages, standalone credits, card-to-card payment details, purchase status, and receipt upload.
- `/admin` is a calm white/deep-navy operations console built on the `console.tsx` primitive kit: one job per page, link-driven tabs, master-detail surfaces (styles, support), and `<details>`-based progressive disclosure instead of always-visible mega-forms.
- Local uploads and generated results are stored under `.local-storage/uploads` when `STORAGE_DRIVER="local"` and are streamed through authorized `/api/storage/...` routes.
- Prisma uses MySQL, keeps `DATABASE_URL` on the Prisma-compatible `mysql://` scheme, and normalizes it for the MariaDB JS adapter at runtime.
- Image generation uses the provider boundary in `src/lib/ai`, with Liara as the default path and an admin-controlled Avalai path for Gemini image testing.
- DB-backed rate limits, credit reservations, manual purchase review, sales referral codes, support tickets, FAQ, and admin billing operations are present.
- Batch generation starts from Gallery, creates one project per selected source photo, and reserves generation credit until each output succeeds.
- Generation now has a DB-backed recovery worker (`npm run worker:generation`) that polls queued projects, resumes stale `PROCESSING` jobs, and should run as a separate PM2 process in production.
- New project creation supports optional supporting product photos for complicated products: one primary source plus up to two extra product angles still creates one project and one output.
- Home now uses an admin-managed before/after carousel (`/admin/home`) with fallback placeholder slides until active slides are uploaded.
- Curated style labels are simplified for users: social is "با جای متن", editorial is "با دکور", and cinematic is "سینمایی".
- With-model necklace prompts now treat rear clasps as hidden hardware, so normal back clasps should not be moved into the visible neck or collarbone area.

## Next Priorities

- Production hardening: verify real Liara/Avalai generation, worker recovery behavior, storage display URLs, provider cost, and failed-state recovery on the deployment target.
- Release readiness: route QA across auth, home, gallery, new project, project detail, projects, account, billing, support, settings, and admin.
- Mobile polish: check the `393x852` mobile layout target for Farsi wrapping, RTL controls, bottom navigation, action placement, calm motion, and accidental scrolling.
- Admin operations QA: review the rebuilt navy/white console with real data across overview, health, audit, users, billing, projects, AI, assets, styles, support/FAQ, and referrals.
- Documentation hygiene: keep docs short and current; update this file only when scope or active priorities change.
- SMS readiness: add the approved FarazSMS pattern code and line number before testing phone verification with real users.

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
