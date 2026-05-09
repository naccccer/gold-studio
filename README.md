# OVALA MVP

OVALA is a mobile-first Farsi/RTL web app for turning low-quality jewelry/product photos into premium studio-style images.

## Tech
- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + MySQL
- Liara OpenAI-compatible image API
- lucide-react icons

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your env file:
   ```bash
   cp .env.example .env
   ```
3. Fill the required env vars:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `LIARA_API_KEY`
   - `ADMIN_EMAIL` is optional
   - `LIARA_IMAGE_MODEL` is optional
4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
5. Run the first migration:
   ```bash
   npx prisma migrate dev --name init
   ```
6. Start the app:
   ```bash
   npm run dev
   ```

## Liara setup
- Create `LIARA_API_KEY` from Liara.
- Keep `LIARA_BASE_URL` on the Liara OpenAI-compatible `/v1` endpoint for this app.
- Keep `LIARA_IMAGE_MODEL` unset to use `google/gemini-2.5-flash-image`, or override it with another Liara-supported image model.
- Keep `LIARA_IMAGE_SIZE` unset to try native `2048x2048` catalog generation first.
- Keep `LIARA_IMAGE_QUALITY` unset to use `2K`; Liara accepts `1K`, `2K`, or `4K`.
- Keep `LIARA_FALLBACK_LONG_EDGE` unset to upscale fallback results to a `2048px` long edge only when Liara rejects the native size.
- The current product flow requires image-to-image support through an OpenAI-compatible image edit endpoint.

## Proxy notes
- If you are in Iran or using v2rayN, read `docs/proxy.md` before running external commands.
- Try direct access first. Enable proxy only for commands that fail because of blocked external access, commonly Prisma engine download or Gemini/Liara calls.

## Live test notes
- Read `docs/live-test.md` before deploying. VPS-style hosting works with the current filesystem upload flow; serverless hosting needs persistent object storage first.
- Read `docs/deployment-runbook.md` for the actual VPS deployment/update checklist, PM2/Nginx setup, and post-commit server update flow.

## Routes
- `/` landing
- `/signup` and `/login`
- `/dashboard`
- `/gallery`
- `/gallery/[assetId]`
- `/gallery/batches/[batchId]`
- `/account`
- `/projects/new`
- `/projects` and `/projects/[projectId]`
- `/admin`
- `/admin/projects`
- `/admin/access`
- `/admin/styles`
