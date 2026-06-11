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

Export the local database:

```powershell
cd C:\xampp\htdocs\gold-studio
npm run db:export-local
```

This writes `gold_studio_local.sql` to your Desktop by default.

Copy these private/local items separately:

- `.env`
- `Desktop\gold_studio_local.sql`
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
DATABASE_URL="mysql://root@127.0.0.1:3306/gold_studio"
```

Create the database if needed:

```powershell
C:\xampp\mysql\bin\mysql.exe -h 127.0.0.1 -P 3306 -u root -e "CREATE DATABASE IF NOT EXISTS gold_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Import the dump:

```powershell
cmd /c "C:\xampp\mysql\bin\mysql.exe -h 127.0.0.1 -P 3306 -u root gold_studio < %USERPROFILE%\Desktop\gold_studio_local.sql"
```

Restore uploads if you copied them:

```powershell
New-Item -ItemType Directory -Force .local-storage | Out-Null
Copy-Item -Recurse "$env:USERPROFILE\Desktop\uploads" .local-storage\uploads
```

Generate Prisma Client, apply any newer migrations, and start:

```powershell
npm run db:generate
npx prisma migrate deploy
npm run dev
```

## Admin Access

If the admin user is missing or the password is unknown, reset it intentionally:

```powershell
npm run admin:bootstrap -- --email "admin@example.com" --password "new-strong-password" --name "Admin"
```

If the email already exists, this promotes it to `ADMIN` and resets the password.

## Important Notes

- `npm run db:generate` does not reset your database. It only regenerates Prisma Client.
- `npx prisma migrate deploy` changes database structure by applying committed migrations.
- `npx prisma migrate reset` can wipe local data; do not use it unless that is intentional.
- Keep `.env` private and rotate any leaked API/storage keys before production use.
