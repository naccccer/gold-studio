# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Ovala

Ovala is a mobile-first, Farsi RTL web app for turning low-quality jewelry, gold, watch, and luxury accessory photos into premium studio-style product images. The default output is clean catalog/product imagery. User-facing text-to-image is out of scope — that lives in admin.

### Mobile user nav (fixed)
`خانه | گالری | [+ پروژه جدید] | پروژه‌ها | حساب` — Gallery owns uploaded source photos; Projects owns generated outputs; Account is the gateway to billing/profile/support and (for admins) to `/admin`. Billing is at `/billing`.

## Stack
- Next.js 16 App Router, TypeScript, Tailwind v4, React 19.
- Prisma 6 with MySQL; client is generated into `src/generated/prisma` (not the default location).
- MariaDB JS adapter (`@prisma/adapter-mariadb`) is used at runtime to avoid Windows engine file-lock issues.
- Signed cookie auth (`gold_session`) with role-based admin access via `middleware.ts`.
- Liara OpenAI-compatible image API for generation (`src/lib/ai/liara.ts`); admin can configure active model and fallback order (`src/lib/ai/provider-settings.ts`).
- Storage: local filesystem by default under `.local-storage/uploads` (gitignored), served through `/api/storage/...` with authorization checks. S3-compatible storage is opt-in via `STORAGE_DRIVER="s3"`. Do not put user uploads in `public/uploads`.
- Icons: Vuesax for user-facing UI; existing lucide usage remains until deliberately migrated.

## Common commands
All scripts run via `npm run <name>`. `dev` and `build` ensure Prisma Client is current before starting.

| Command | Purpose |
|---|---|
| `npm run dev` | Ensure Prisma client is current + start Next dev server |
| `npm run build` | Ensure Prisma client is current + production build |
| `npm run start` | Run the built app |
| `npm run lint` | ESLint |
| `npm run check:prompts` | Prompt-policy regression checks for style and reference-image behavior |
| `npm run check:model-routing` | Model-routing checks for hard image styles |
| `npm run check:readiness` | Repo/docs readiness checks for launch guardrails |
| `npm run check:mojibake` | Detect corrupted Persian text in source |
| `npm run db:generate` | Safely run `prisma generate` into `src/generated/prisma` only when Prisma inputs changed |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:start` / `db:stop` | Manage the isolated local MariaDB helper (`.local-mariadb`, usually `127.0.0.1:3307`) |
| `npm run db:repair-access` | Repair DB role/permissions against the local MariaDB |
| `npm run db:export-local` | Safe local DB export (avoids PowerShell dump encoding issues) |
| `npm run admin:bootstrap` | Create/promote a local admin via terminal (preferred over `ADMIN_EMAIL` signup promotion, which was removed) |
| `npm run check:liara` | Direct-access check for diagnosing v2rayN/TUN bypass before testing generation |
| `npm run check:avalai` | Avalai provider check when intentionally using/debugging Avalai |
| `npm run smoke -- <url>` | Availability smoke test for a running deployment |
| `npm run worker:generation` | Queued generation worker loop |
| `npm run watchdog:health` | PM2 health watchdog loop |
| `npm run backup:run` | Create a full DB + storage backup archive |
| `npm run backup:scheduler` | Nightly backup scheduler loop |
| `npm run cleanup:archives` | Hard-delete archived assets/projects after the retention window |
| `npm run convert:placeholders` | Convert placeholder assets to WebP |

### Verification (run after meaningful work)
```powershell
npm run check:prompts
npm run check:model-routing
npm run check:readiness
npm run check:mojibake
npm run lint
npm run build
```

## Layout
- `src/app` — App Router routes. Thin route files; the (auth), (dashboard), (marketing) groupings hold user-facing flows; `admin/` holds admin; `api/` holds API routes (including `/api/storage/...`).
- `src/components` — Shared UI primitives.
- `src/features` — Feature modules: `account`, `admin`, `auth`, `dashboard`, `gallery`, `projects`, `style-references`.
- `src/lib` — Cross-cutting logic. AI stays in `src/lib/ai`. Generation job orchestration in `src/lib/generation`. Auth helpers in `src/lib/auth`. Single Prisma client in `src/lib/db.ts`. Other helpers: `billing`, `credits`, `output-presets`, `placeholders`, `product-types`, `product-vision`, `rate-limit` (DB-backed, shared), `referrals`, `storage`, `styles`, `support-code`, `uploads`.
- `prisma/` — Schema and migrations.
- `docs/` — Proxy notes, deployment runbooks, launch readiness, repo readiness, and local handoff docs.
- `scripts/` — Standalone Node/PowerShell helpers invoked by npm scripts.

## Architectural rules (enforced)
- Single Next.js repo; no extra architecture layers.
- App Router, TypeScript, Tailwind. Prisma + MySQL.
- Business logic stays out of UI components.
- AI logic stays inside `src/lib/ai` — routes call into it, components don't.
- Admin and user flows share the app but are separated by route and feature — admin-only controls must not leak into user-facing screens.
- Prompt-heavy and text-to-image controls stay admin/internal.
- Owner-scoped reads/writes for user assets, batches, projects, purchases, and support.
- S3-compatible storage is only used when intentionally configured (`STORAGE_DRIVER="s3"`).

## UI/design rules
- Image-led, calm, premium. No SaaS dashboard look, no prompt editor, no perfume/chat/magic-wand clichés.
- `393x852` mobile target. Don't capture screenshots unless asked.
- Vazirmatn for body/UI; Doran only for very short display titles.
- Primary actions are text + icon; secondary familiar actions may be icon-only with accessible labels.
- Champagne-gold is sparse — for selection, progress, central creation action, badges.
- Avoid nested cards, noisy filters, random borders, and one-off visual hacks.
- Keep Gallery asset UI separate from generated Project review UI.
- Admin is denser and more operational but must remain visually related to Ovala.

## Coding rules
- Prefer server-side logic for sensitive operations.
- Never hardcode secrets; read from env (see `.env.example` for current names: auth/session, worker/watchdog, Liara, Avalai, FarazSMS, storage, and S3 vars).
- Edit existing files before creating new ones when practical; avoid duplicate helpers.
- Update `roadmap.md` whenever scope, progress, or active priorities change.
- Keep `docs/` short and current — no implementation diaries, phase histories, or stale warnings.
- Update `docs/launch-readiness.md` and `docs/repo-readiness.md` when production operations, env, deploy, storage, provider, SMS, billing, or worker behavior changes.

## Persian/encoding
- Source and docs are UTF-8. Keep Persian as direct UTF-8 in TSX/TS/MD, not escaped Unicode.
- Never paste mojibake. If text looks corrupted, stop and repair the source before editing.
- `npm run check:mojibake` catches common cases.

## Network/proxy (Iran context)
The developer may be in Iran with limited paid proxy bandwidth. Default to direct access; enable proxy only for blocked services (Prisma engine downloads, Gemini/Liara, npm when it fails).

- v2rayN typically listens on `127.0.0.1:10808` — proxy env vars must include a scheme: `http://127.0.0.1:10808` or `socks5://127.0.0.1:10808`. Bare host:port is invalid for Prisma and most Node tools.
- Liara image generation should use direct Iran IP access; if v2rayN/TUN is enabled, add bypass rules for `ai.liara.ir`, `.liara.ir`, `185.208.181.174`. Use `npm run check:liara` to verify before testing generation.
- See `docs/proxy.md` before changing any network setup instructions.

## Product notes worth remembering
- New users get 1 tracked signup credit; subscription credit is consumed before standalone wallet credit.
- Referral grants 5 credits to both sides only after the invitee's first approved purchase.
- Output preset is persisted per project (1:1, 9:16, 16:9) — generation sends the per-project size, not a global square default.
- Each successful project can grant «نسخه دیگر» according to the user's active package/custom plan; alternate versions consume output quota only.
- Quality review requests can refund credit after admin approval and notify the user.
- User notifications support system/admin/quality/billing/support messages and live under `/account/notifications`; admins can send manual/broadcast notifications.
- Six user-visible style directions: `با مدل`, `پس‌زمینه`, `دکور انتزاعی`, `شبکه اجتماعی`, `ادیتوریال`, `سینماتیک`. Model style targets 25–35 year olds.
- Batch generation creates one project per selected source photo and reserves credit until each output succeeds.
- Local uploads normalize images before storage (metadata stripped, large files resized); gallery crop exports JPEG.
- Local storage lives under `.local-storage/uploads` and is served through `/api/storage/...`; `public/uploads` is not an active user-upload path.
- `/design/*` prototypes are not part of the shipped app.
