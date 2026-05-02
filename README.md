# Gold Studio MVP

Gold Studio is a mobile-first Farsi/RTL web app for turning low-quality jewelry/product photos into premium studio-style images.

## Tech
- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + MySQL
- GapGPT OpenAI-compatible image API
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
   - `GAPGPT_API_KEY`
   - `ADMIN_EMAIL` is optional
   - `GAPGPT_IMAGE_MODEL` is optional
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

## GapGPT setup
- Create `GAPGPT_API_KEY` from GapGPT.
- Keep `GAPGPT_BASE_URL` as `https://api.gapgpt.app/v1`.
- Keep `GAPGPT_IMAGE_MODEL` unset to use the default Gemini image model, or override it with a supported GapGPT image model.
- The current product flow requires image-to-image support through an OpenAI-compatible image edit endpoint.

## Proxy notes
- If you are in Iran or using v2rayN, read `docs/proxy.md` before running external commands.
- Try direct access first. Enable proxy only for commands that fail because of blocked external access, commonly Prisma engine download or Gemini calls.

## Live test notes
- Read `docs/live-test.md` before deploying. VPS-style hosting works with the current filesystem upload flow; serverless hosting needs persistent object storage first.

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
