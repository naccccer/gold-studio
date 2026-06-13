# Deployment Runbook

Short VPS guide for deploying, updating, restoring, and debugging Ovala.

## Baseline

Recommended server:

- Ubuntu 24.04
- Node.js 20+
- MySQL
- Nginx
- PM2
- writable app directory for `.local-storage/uploads` when `STORAGE_DRIVER="local"`

Install base packages:

```bash
apt update
apt install -y git nginx mysql-server unzip
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

## First Deploy

Clone the app:

```bash
cd /var/www
git clone https://github.com/naccccer/gold-studio.git
cd /var/www/gold-studio
npm install
```

Create MySQL database and user:

```sql
CREATE DATABASE gold_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gold_studio_user'@'127.0.0.1' IDENTIFIED BY 'CHANGE_THIS_DB_PASSWORD';
GRANT ALL PRIVILEGES ON gold_studio.* TO 'gold_studio_user'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Create `.env` from `.env.example` and fill real values. Never commit `.env`.

For local VPS storage:

```bash
mkdir -p .local-storage/uploads
chmod -R 775 .local-storage
```

Build and migrate:

```bash
npm run db:generate
npm run db:deploy
npm run build
```

Bootstrap the first admin once:

```bash
npm run admin:bootstrap -- --email "admin@example.com" --password "strong-password" --name "Admin"
```

Start with PM2:

```bash
pm2 start npm --name gold-studio -- start
pm2 start npm --name gold-studio-worker -- run worker:generation
pm2 save
```

Minimal Nginx site:

```nginx
server {
    server_name ovala.ir www.ovala.ir;

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

Enable and test:

```bash
nginx -t
systemctl reload nginx
curl -I http://127.0.0.1:3000
```

## Update Existing VPS

```bash
cd /var/www/gold-studio
git pull
npm install
npm run db:generate
npm run db:deploy
npm run build
pm2 restart gold-studio
pm2 restart gold-studio-worker
```

Preserve `.env` and `.local-storage/uploads`. Do not replace or delete uploads during zip or folder-based deploys.

## Restore Local DB To VPS

On local Windows:

```powershell
cd C:\xampp\htdocs\gold-studio
npm run db:export-local
scp "$env:USERPROFILE\Desktop\gold_studio_local.sql" root@SERVER_IP:/root/gold_studio_local.sql
```

On VPS:

```bash
cd /var/www/gold-studio
mysql -h 127.0.0.1 -u gold_studio_user -p gold_studio < /root/gold_studio_local.sql
npm run db:deploy
npm run build
pm2 restart gold-studio
```

If restoring into a fresh clone, copy uploads before switching traffic:

```bash
mkdir -p /var/www/gold-studio/.local-storage
cp -a /path/to/old/.local-storage/uploads /var/www/gold-studio/.local-storage/
chmod -R 775 /var/www/gold-studio/.local-storage
```

## Health And Debug

Useful commands:

```bash
pm2 status
pm2 logs gold-studio --lines 100
pm2 logs gold-studio-worker --lines 100
journalctl -u nginx --since "30 min ago"
curl -I http://127.0.0.1:3000
curl -I https://ovala.ir
npm run db:deploy
npm run build
```

Common notes:

- `npm run db:generate` only regenerates Prisma Client.
- `npm run db:deploy` applies committed migrations.
- `npm run worker:generation` polls the internal generation worker endpoint and recovers stale queued jobs; keep `gold-studio-worker` running in PM2.
- Use `docs/proxy.md` only when GitHub, npm, Prisma, or Liara access is blocked.
- If login says the admin password is wrong after a DB restore, reset it with `npm run admin:bootstrap`.
