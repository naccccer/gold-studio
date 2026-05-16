# Deployment Runbook

Practical VPS checklist for deploying, updating, restarting, and debugging Ovala.

## Hosting Baseline
Use a normal VPS/cloud server, not shared hosting or serverless hosting.

Recommended:
- Ubuntu 24.04
- Node.js 20+
- MySQL
- Nginx
- PM2
- writable local filesystem when `STORAGE_DRIVER="local"`
- outbound access to npm, GitHub or deploy uploads, Prisma downloads, and Liara

Install base packages:

```bash
apt update
apt install -y git nginx mysql-server unzip
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

## App Setup
Clone or upload the project:

```bash
cd /var/www
git clone https://github.com/naccccer/gold-studio.git
cd /var/www/gold-studio
```

If direct Git access is blocked, upload a clean project zip and extract it to `/var/www/gold-studio`.

Preferred rule:
- Keep the live app in a real Git clone when possible.
- If you had to deploy by zip first, clone the repo into a separate folder such as `/var/www/gold-studio-git`, verify it on port `3001`, then switch PM2/Nginx to the clone.
- Do not rely on `git pull` inside a zip-extracted folder that has no `.git` directory.

## Database Setup
Open MySQL:

```bash
mysql
```

Create database and user:

```sql
CREATE DATABASE gold_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gold_studio_user'@'127.0.0.1' IDENTIFIED BY 'CHANGE_THIS_DB_PASSWORD';
GRANT ALL PRIVILEGES ON gold_studio.* TO 'gold_studio_user'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

## Required Env
Create `/var/www/gold-studio/.env`.

```env
DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
AUTH_SECRET="CHANGE_THIS_TO_A_LONG_RANDOM_SECRET"
ADMIN_EMAIL="admin@example.com"
ALLOW_INSECURE_COOKIES="false"

LIARA_API_KEY="CHANGE_THIS"
LIARA_VISION_API_KEY="CHANGE_THIS_IF_YOU_WANT_SEPARATE_VISION_COSTS"
LIARA_BASE_URL="https://ai.liara.ir/api/69fe30c50bb427e049d327f6/v1"
LIARA_IMAGE_MODEL="google/gemini-3-pro-image-preview"
LIARA_VISION_MODEL="google/gemini-2.0-flash-lite-001"
LIARA_IMAGE_SIZE="2048x2048"
LIARA_IMAGE_QUALITY="2K"
LIARA_FALLBACK_LONG_EDGE="2048"
LIARA_ALLOW_UPSCALE_FALLBACK="false"

STORAGE_DRIVER="local"

S3_ENDPOINT="https://hot.ir-central1.arvanstorage.ir"
S3_REGION="ir-central1"
S3_BUCKET="gold-studio"
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_PUBLIC_BASE_URL="https://gold-studio.hot.ir-central1.arvanstorage.ir"
S3_FORCE_PATH_STYLE="true"
```

Notes:
- Rotate secrets immediately if they were pasted into chat, screenshots, or logs.
- `ALLOW_INSECURE_COOKIES="true"` is only a temporary HTTP/live-IP workaround before HTTPS is ready.
- After SSL is active, set `ALLOW_INSECURE_COOKIES="false"` or remove it.
- Current VPS live tests should use `STORAGE_DRIVER="local"` with writable `public/uploads`.
- `public/uploads` is intentionally Git-ignored and must be preserved separately when moving between deploy folders.
- Switch to `STORAGE_DRIVER="s3"` only when persistent object storage is intentionally configured.

## First Deploy
```bash
cd /var/www/gold-studio
npm install
export DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
npm run db:generate
npx prisma migrate deploy
npm run build
pm2 start npm --name gold-studio -- start
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup`, then:

```bash
pm2 save
```

Prisma packages must stay on matching major versions. If `@prisma/client` and `prisma` are on `6.x`, keep `@prisma/adapter-mariadb` on `6.x` too.

Prisma runtime note:
- This repo now uses Prisma's MariaDB JS adapter at runtime to avoid the old Windows engine DLL file-lock failure during `prisma generate`.

## Nginx
Create `/etc/nginx/sites-available/gold-studio`:

```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable it:

```bash
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/gold-studio /etc/nginx/sites-enabled/gold-studio
nginx -t
systemctl restart nginx
```

## Domain And SSL
Point DNS A records to the server IP:
- `@`
- `www`

Replace `server_name _;` with the real domain:

```nginx
server_name example.com www.example.com;
```

Issue SSL:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d example.com -d www.example.com
pm2 restart gold-studio
```

## Update After A New Commit
```bash
cd /var/www/gold-studio
git pull origin main
npm install
export DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
npm run db:generate
npx prisma migrate deploy
npm run build
pm2 restart gold-studio
pm2 save
```

If the server cannot pull from Git, upload a fresh deploy zip, replace project files, then run the same install/generate/migrate/build/restart sequence.

If your active VPS path is the verified Git clone, use that real clone directory instead of `/var/www/gold-studio`, for example:

```bash
cd /var/www/gold-studio-git
git pull origin main
npm install
export DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
npm run db:generate
npx prisma migrate deploy
npm run build
pm2 restart gold-studio
pm2 save
```

If the previous live app was a zip deploy and you are moving to a fresh clone:

```bash
cp /var/www/gold-studio/.env /var/www/gold-studio-git/.env
mkdir -p /var/www/gold-studio-git/public
cp -a /var/www/gold-studio/public/uploads /var/www/gold-studio-git/public/
```

Optional safety check before switching traffic:

```bash
cd /var/www/gold-studio-git
PORT=3001 npm start
curl -I http://127.0.0.1:3001
curl -I http://127.0.0.1:3001/login
```

Then stop the temporary `3001` process, switch PM2 to the clone, and keep Nginx pointing at port `3000`.

## Health Checks
```bash
pm2 status
pm2 logs gold-studio --lines 100
systemctl status nginx --no-pager
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1
```

## Common Problems

### Login works, then every click returns to `/login`
Cause: production secure cookies are rejected on plain HTTP.

Temporary pre-SSL fix:

```env
ALLOW_INSECURE_COOKIES="true"
```

Then rebuild and restart. Remove this after HTTPS works.

### Prisma client did not initialize
Run:

```bash
export DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
npm run db:generate
npm run build
pm2 restart gold-studio
```

### Prisma delegate is `undefined` after schema changes
If a missing property is a Prisma model delegate such as `db.userSubscription`, the generated client is stale.

Run `npm run db:generate`, then rebuild. This repo generates Prisma into `src/generated/prisma`.

### `git pull` says `not a git repository`
Cause: the app directory was created from a zip instead of a Git clone.

Fix:

```bash
cd /var/www
git clone https://github.com/naccccer/gold-studio.git gold-studio-git
cp /var/www/gold-studio/.env /var/www/gold-studio-git/.env
mkdir -p /var/www/gold-studio-git/public
cp -a /var/www/gold-studio/public/uploads /var/www/gold-studio-git/public/
```

Build and verify the clone, then switch PM2 to that directory.

### GitHub HTTPS works intermittently on the VPS
Symptoms may include `gnutls_handshake() failed: Handshake failed` even though a later `git ls-remote` succeeds.

Try:

```bash
git ls-remote https://github.com/naccccer/gold-studio.git
openssl s_client -connect github.com:443 -servername github.com
```

If the live clone works, prefer testing the real clone directly instead of reusing an old zip folder.

### `Missing required environment variable: DATABASE_URL`
For this repo, Prisma may need a shell env var in addition to `.env`:

```bash
export DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
```

### npm, GitHub, Prisma, or Liara access is blocked
Read `docs/proxy.md`. Try direct access first, then use proxy only for blocked external commands.

### Nginx shows the default welcome page
```bash
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/gold-studio /etc/nginx/sites-enabled/gold-studio
nginx -t
systemctl restart nginx
```

### PM2 shows duplicate app entries
```bash
pm2 list
pm2 delete ID
pm2 save
```

## Verification
Run after meaningful app changes:

```bash
npm run check:mojibake
npm run lint
npm run build
```
