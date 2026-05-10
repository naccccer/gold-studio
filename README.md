# Ovala

Ovala is a mobile-first Farsi RTL web app for turning low-quality jewelry, gold, watch, and luxury accessory photos into premium studio-style product images.

## Tech Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma with MySQL
- Liara OpenAI-compatible image API
- Local filesystem storage by default, optional S3-compatible storage
- lucide-react icons

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create an env file:
   ```bash
   cp .env.example .env
   ```
3. Fill required env vars:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `LIARA_API_KEY`
   - `ADMIN_EMAIL` optional initial admin marker
4. Generate Prisma client:
   ```bash
   npm run db:generate
   ```
5. Apply migrations:
   ```bash
   npx prisma migrate dev
   ```
6. Start the app:
   ```bash
   npm run dev
   ```

## Useful Scripts
- `npm run dev`: generate Prisma client and start Next dev server.
- `npm run build`: generate Prisma client and build production app.
- `npm run start`: start the built app.
- `npm run lint`: run ESLint.
- `npm run check:mojibake`: detect common Persian mojibake.
- `npm run db:generate`: generate Prisma client into `src/generated/prisma`.
- `npm run db:start` / `npm run db:stop`: manage the isolated local MariaDB helper.
- `npm run cleanup:archives`: hard-delete archived assets/projects after the retention window.

## Environment
Use `.env.example` as the source of current env names.

Image generation defaults in docs should match `.env.example`:
- `LIARA_BASE_URL` points to Liara's OpenAI-compatible `/v1` endpoint.
- `LIARA_IMAGE_MODEL` is currently `google/gemini-3-pro-image-preview`.
- `LIARA_IMAGE_SIZE` is the default provider size when no output preset overrides it.
- `LIARA_IMAGE_QUALITY` is `2K`.

For local/live VPS tests, keep `STORAGE_DRIVER="local"` and make sure `public/uploads` is writable. Switch to `STORAGE_DRIVER="s3"` only when persistent object storage is intentionally configured.

## Routes
User routes:
- `/`
- `/signup`
- `/login`
- `/dashboard`
- `/gallery`
- `/gallery/[assetId]`
- `/gallery/batches/[batchId]`
- `/projects/new`
- `/projects`
- `/projects/[projectId]`
- `/account`
- `/account/profile`
- `/account/referral`
- `/account/output-settings`
- `/account/security`
- `/account/support`
- `/account/faq`
- `/billing`

Admin routes:
- `/admin`
- `/admin/access`
- `/admin/assets`
- `/admin/packages`
- `/admin/projects`
- `/admin/provider`
- `/admin/styles`
- `/admin/support`
- `/admin/users`

## Operational Docs
- `roadmap.md`: current product status and priorities.
- `AGENTS.md`: active agent rules for this repo.
- `docs/architecture.md`: architecture and boundaries.
- `docs/conventions.md`: coding, UI, Farsi/RTL, and verification rules.
- `docs/brand-identity.md`: brand, logo, typography, and image constraints.
- `docs/proxy.md`: Iran/proxy and network guidance.
- `docs/deployment-runbook.md`: VPS deployment and update checklist.
