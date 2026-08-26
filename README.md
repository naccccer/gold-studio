# Ovala

Ovala is a mobile-first Farsi RTL web app for turning low-quality jewelry, gold, watch, and luxury accessory photos into premium studio-style product images.

## Stack

- Next.js App Router, React, TypeScript, Tailwind
- Prisma with MySQL
- Local filesystem storage by default, optional S3-compatible storage
- Liara/OpenAI-compatible image and vision APIs
- Vuesax icons for user-facing UI

## Local Setup

Use XAMPP MySQL on `127.0.0.1:3306` for current local development.

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` with local values. A typical local database URL is:

```env
DATABASE_URL="mysql://root@127.0.0.1:3306/gold_studio?allowPublicKeyRetrieval=true"
```

Keep the `mysql://` scheme in `.env`; Prisma CLI commands and the app use it directly.

Create the database if needed:

```sql
CREATE DATABASE gold_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Apply Prisma setup:

```powershell
npm run db:generate
npx prisma migrate deploy
npm run dev
```

Create or reset a local admin only when needed:

```powershell
npm run admin:bootstrap -- --email "admin@example.com" --password "strong-password" --name "Admin"
```

`admin:bootstrap` creates the admin if missing. If the email already exists, it promotes that user to `ADMIN` and resets the password.

## Important Commands

- `npm run db:generate`: regenerate Prisma Client only when Prisma inputs changed. It does not reset, migrate, or seed the database. Use `npm run db:generate -- --force` to force regeneration after stopping running Node processes.
- `npx prisma migrate deploy`: apply committed migrations to the current database.
- `npm run db:export-local`: export the current local DB to `Desktop\gold_studio_local.sql`.
- `npm run check:prompts`: verify prompt-policy guardrails for generation styles.
- `npm run check:model-routing`: verify hard image styles still route to stronger image models.
- `npm run check:readiness`: verify launch/readiness docs and repo guardrails stay current.
- `npm run check:mojibake`: detect corrupted Persian text.
- `npm run lint`: run ESLint.
- `npm run build`: ensure Prisma Client is current, then build the app.
- `npm run smoke -- http://localhost:3000`: check a running app without logging in or touching AI/payment flows.
- `npm run worker:generation`: run the queued generation worker.
- `npm run check:image-delivery`: verify thumbnail presets, pagination, caching headers, and explicit preview policy.
- `npm run check:storage-access`: exercise owner, other-user, admin, SALES, guest, and missing-file authorization policy.
- `npm run check:observability`: verify generation timing, model analytics, signed thumbnail URLs, and worker observability wiring.
- `npm run watchdog:health`: run the PM2 health watchdog loop.
- `npm run backup:run`: create a full DB + storage backup archive.
- `npm run backup:scheduler`: run the nightly backup scheduler loop.
- `npm run check:liara`: test direct Liara access from the local machine.
- `npm run check:avalai`: test Avalai when intentionally using or debugging that provider.
- `npm run cleanup:archives`: permanently delete archived DB rows and storage files after the retention window.

Avoid `npx prisma migrate reset` unless you intentionally want to wipe and recreate local data.

## Storage

With `STORAGE_DRIVER="local"`, uploads and generated results are stored under `.local-storage/uploads` and streamed through `/api/storage/...` with authorization.

Preserve `.local-storage/uploads` when moving PCs or deployment folders. Do not move user uploads into `public/uploads`.

## Canonical Docs

- [Agent rules](AGENTS.md)
- [Roadmap](roadmap.md)
- [Launch readiness](docs/launch-readiness.md)
- [Repo readiness](docs/repo-readiness.md)
- [Switching PCs](docs/local-pc-switch.md)
- [Deployment runbook](docs/deployment-runbook.md)
- [Proxy notes](docs/proxy.md)
