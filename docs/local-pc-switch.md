# Switching Between PCs

Use this when moving local Ovala development from one Windows PC to another.

## Before Leaving The Old PC

Commit and push code:

```powershell
git status
git add .
git commit -m "Describe the work"
git push
```

Create a full local backup from the admin panel (`/admin/backups`) or CLI:

```powershell
cd C:\xampp\htdocs\gold-studio
npm run backup:run
```

This writes a `.tar.gz` backup under `.local-storage\backups` with `database.sql`, `manifest.json`, and current storage files.

If you only need the old database-only export:

```powershell
npm run db:export-local
```

Copy these private/local items separately:

- `.env`
- `.local-storage\backups\*.tar.gz` or `Desktop\gold_studio_local.sql`
- `.local-storage\uploads` if it exists and you need local uploaded/generated files

Do not commit `.env`, database dumps, or `.local-storage/uploads`.

## On The New PC

Install prerequisites:

- Git
- Node.js 20+
- XAMPP with MySQL running on `127.0.0.1:3306`

Clone and install:

```powershell
cd C:\xampp\htdocs
git clone https://github.com/naccccer/gold-studio.git
cd C:\xampp\htdocs\gold-studio
npm install
```

Restore `.env` into the project root. Current local default:

```env
DATABASE_URL="mysql://root@127.0.0.1:3306/gold_studio?allowPublicKeyRetrieval=true"
```

Keep the `mysql://` scheme; Prisma CLI commands and the app use it directly.

Create the database if needed:

```powershell
C:\xampp\mysql\bin\mysql.exe -h 127.0.0.1 -P 3306 -u root -e "CREATE DATABASE IF NOT EXISTS gold_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Import the dump:

```powershell
cmd /c "C:\xampp\mysql\bin\mysql.exe -h 127.0.0.1 -P 3306 -u root gold_studio < %USERPROFILE%\Desktop\gold_studio_local.sql"
```

If you used the full `.tar.gz` backup, extract it first and import the included `database.sql`.

Restore uploads if you copied them:

```powershell
New-Item -ItemType Directory -Force .local-storage | Out-Null
Copy-Item -Recurse "$env:USERPROFILE\Desktop\uploads" .local-storage\uploads
```

Generate Prisma Client, check whether newer migrations exist, then start one dev server:

```powershell
npm run db:generate
npx prisma migrate status
```

Only if `migrate status` says migrations are pending, apply them deliberately:

```powershell
npx prisma migrate deploy
```

`migrate deploy` is a database-changing command. On a new/restored PC it may apply old data migrations that seed or transform billing packages. It should not be part of every local vertical switch.

Start the vertical you want:

```powershell
npm run dev
npm run dev:food
```

Run only one dev command at a time. Stop the current server with `Ctrl+C` before starting the other one.

## Local Vertical Switching

Use the vertical dev shortcuts when localhost should behave like a specific Ovala product:

```powershell
npm run dev:jewelry
npm run dev:food
```

These commands start the normal Next.js dev server and set `OVALA_LOCAL_VERTICAL` only for that terminal process. Stop the server with `Ctrl+C`, then run the other command to switch.

- `npm run dev:jewelry`: default Jewelry localhost behavior.
- `npm run dev:food`: Food localhost behavior, matching `food.ovala.ir`.
- `npm run dev`: normal host-based behavior; localhost falls back to Jewelry unless that shell already has `OVALA_LOCAL_VERTICAL`.
- When the normal dev server is already running, open `/gallery?vertical=food` or `/gallery?vertical=jewelry` on localhost to set the local preview vertical cookie without editing `.env`.

Do not use local Clothing or Furniture overrides yet. Those verticals are reserved IDs only until Phase 6 intentionally starts.

## Admin Access

If the admin user is missing or the password is unknown, reset it intentionally:

```powershell
npm run admin:bootstrap -- --email "nacerzafar@gmail.com" --password "new-strong-password" --name "Admin"
```

If the email already exists, this promotes it to `ADMIN` and resets the password.

## Important Notes

- `npm run db:generate` does not reset your database. It only regenerates Prisma Client when Prisma inputs changed. If Windows is holding the Prisma DLL open, stop the running dev server or worker and run `npm run db:generate -- --force`.
- `npx prisma migrate deploy` changes database structure by applying committed migrations. Some historical migrations also seed or transform billing packages; use `npx prisma migrate status` first and deploy only when pending migrations are expected.
- `npx prisma migrate reset` can wipe local data; do not use it unless that is intentional.
- Keep `.env` private and rotate any leaked API/storage keys before production use.
