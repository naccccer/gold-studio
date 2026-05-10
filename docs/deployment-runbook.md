# Deployment Runbook

This file is the practical server checklist for Gold Studio.

Use it when you want to:
- deploy the app on a VPS/cloud server
- update the server after a new Git commit
- restart the app safely
- debug common production issues

## Recommended Hosting

Use a normal VPS/cloud server, not shared hosting and not serverless hosting.

Current app needs:
- Node.js
- MySQL
- writable local filesystem when `STORAGE_DRIVER="local"`
- outbound access to npm, GitHub, Prisma downloads, and Liara

## Server Baseline

Recommended minimum:
- Ubuntu 24.04
- 2 vCPU
- 4 GB RAM

Install base packages:

```bash
apt update
apt install -y git nginx mysql-server unzip
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

Check versions:

```bash
node -v
npm -v
git --version
nginx -v
mysql --version
pm2 -v
```

## App Setup

Clone the repo:

```bash
cd /var/www
git clone https://github.com/naccccer/gold-studio.git
cd /var/www/gold-studio
```

If direct Git access is blocked, upload a clean project zip instead and extract it into `/var/www/gold-studio`.

## Database Setup

Open MySQL:

```bash
mysql
```

Create DB and user:

```sql
CREATE DATABASE gold_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gold_studio_user'@'127.0.0.1' IDENTIFIED BY 'CHANGE_THIS_DB_PASSWORD';
GRANT ALL PRIVILEGES ON gold_studio.* TO 'gold_studio_user'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

## Required .env

Create `/var/www/gold-studio/.env`.

Example:

```env
DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
AUTH_SECRET="CHANGE_THIS_TO_A_LONG_RANDOM_SECRET"
LIARA_API_KEY="CHANGE_THIS"
LIARA_BASE_URL="https://ai.liara.ir/api/69fe30c50bb427e049d327f6/v1"
LIARA_IMAGE_MODEL="google/gemini-2.5-flash-image"
LIARA_IMAGE_SIZE="2048x2048"
LIARA_IMAGE_QUALITY="2K"
LIARA_FALLBACK_LONG_EDGE="2048"
ADMIN_EMAIL="admin@example.com"
STORAGE_DRIVER="local"
ALLOW_INSECURE_COOKIES="false"
S3_ENDPOINT="https://hot.ir-central1.arvanstorage.ir"
S3_REGION="ir-central1"
S3_BUCKET="gold-studio"
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_PUBLIC_BASE_URL="https://gold-studio.hot.ir-central1.arvanstorage.ir"
S3_FORCE_PATH_STYLE="true"
```

Notes:
- `ALLOW_INSECURE_COOKIES="true"` is a temporary local/live-IP workaround only before HTTPS is ready.
- After SSL is active, switch it back to `false` or remove it.
- Current live setup should use `STORAGE_DRIVER="local"` and a writable `public/uploads` directory.
- S3-compatible storage is optional for a later move away from local disk; only switch to `STORAGE_DRIVER="s3"` when that migration is intentional.
- Rotate secrets immediately if they were pasted into chat, screenshots, or logs.

## First Deploy

Run:

```bash
cd /var/www/gold-studio
npm install
export DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
npm run db:generate
npx prisma migrate deploy
npm run build
```

Prisma packages must stay on matching major versions.
If `@prisma/client` and `prisma` are on `6.x`, keep `@prisma/adapter-mariadb` on `6.x` too.

Start the app:

```bash
pm2 start npm --name gold-studio -- start
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup`, then:

```bash
pm2 save
```

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
- `@` -> server IP
- `www` -> server IP

When DNS is ready, replace:

```nginx
server_name _;
```

with:

```nginx
server_name example.com www.example.com;
```

Then reload Nginx and issue SSL:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d example.com -d www.example.com
```

After HTTPS works:
- remove `ALLOW_INSECURE_COOKIES="true"` if you used it
- restart the app

## Updating The Server After A New Commit

Standard Git-based update flow:

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

If you use another branch, replace `main`.

If dependencies did not change, `npm install` is still safe and simpler than guessing.

## Deploying Local Changes To The Server

If the server uses Git:
1. commit locally
2. push to GitHub
3. SSH into the server
4. run the update flow above

Basic local flow:

```bash
git add .
git commit -m "Describe the change"
git push origin main
```

Then on the server:

```bash
cd /var/www/gold-studio
git pull origin main
npm install
export DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
npm run db:generate
npx prisma migrate deploy
npm run build
pm2 restart gold-studio
```

If Git access is blocked on the server, upload a fresh deploy zip and replace the project files, then run:

```bash
npm install
export DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
npm run db:generate
npx prisma migrate deploy
npm run build
pm2 restart gold-studio
```

## Common Problems

### Login works, then every click returns to `/login`

Cause:
- cookie rejected on plain HTTP because secure cookies are enabled in production

Temporary fix before SSL:

```env
ALLOW_INSECURE_COOKIES="true"
```

Then rebuild and restart:

```bash
npm run build
pm2 restart gold-studio
```

Remove this after HTTPS is live.

### `@prisma/client did not initialize yet`

Run:

```bash
export DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
npm run db:generate
```

Then rebuild:

```bash
npm run build
```

### Prisma delegate is `undefined` after a schema change

Example:

```text
Cannot read properties of undefined (reading 'findMany')
```

If the missing property is a Prisma model delegate such as `db.userSubscription`, the generated client is stale.

Run:

```bash
export DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
npm run db:generate
```

This repo now generates Prisma into `src/generated/prisma` so local dev no longer depends on a writable `node_modules/.prisma` client output.

### `Missing required environment variable: DATABASE_URL`

For this repo, Prisma may need a shell env var in addition to `.env`.

Run:

```bash
export DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"
```

To persist it for the current user:

```bash
echo 'export DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:3306/gold_studio"' >> ~/.bashrc
source ~/.bashrc
```

### npm/GitHub access is unstable on the server

Read:
- `docs/proxy.md`

Try in this order:
1. direct access
2. fix DNS
3. use proxy only for blocked external commands

### Nginx shows `Welcome to nginx!`

Cause:
- default site is still active
- app site is not enabled

Fix:

```bash
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/gold-studio /etc/nginx/sites-enabled/gold-studio
nginx -t
systemctl restart nginx
```

### PM2 shows duplicate app entries

Check:

```bash
pm2 list
```

Delete the extra process by id:

```bash
pm2 delete ID
pm2 save
```

## Health Checks

Useful commands:

```bash
pm2 status
pm2 logs gold-studio --lines 100
systemctl status nginx --no-pager
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1
```

## Verification

Run after meaningful app changes:

```bash
npm run check:mojibake
npm run lint
npm run build
```
