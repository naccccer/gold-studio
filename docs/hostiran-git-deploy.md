# HostIran Git Deploy Notes

Quick commands for updating Ovala on the HostIran VPS that needs the local Xray outbound proxy.

## Proxy

Make sure Xray is running:

```bash
systemctl status xray --no-pager
```

Enable proxy for the current shell, Git, and npm:

```bash
export HTTP_PROXY=http://127.0.0.1:10809
export HTTPS_PROXY=http://127.0.0.1:10809
export ALL_PROXY=http://127.0.0.1:10809

git config --global http.proxy http://127.0.0.1:10809
git config --global https.proxy http://127.0.0.1:10809

npm config set proxy http://127.0.0.1:10809/
npm config set https-proxy http://127.0.0.1:10809/
npm config set registry https://registry.npmjs.org/
```

## First Clone

```bash
cd /var/www
git clone https://github.com/naccccer/gold-studio.git gold-studio
cd gold-studio
```

Create `.env`, then verify `ADMIN_EMAIL` is absent:

```bash
nano .env
grep ADMIN_EMAIL .env
```

The `grep` command should print nothing.

Create private local storage:

```bash
rm -rf .local-storage
mkdir -p .local-storage/uploads
chmod -R 775 .local-storage
```

## Update Existing Deploy

```bash
cd /var/www/gold-studio
git pull
npm install --ignore-scripts
npm run db:generate
npm run db:deploy
npm run check:mojibake
npm run lint
npm run build
pm2 restart gold-studio --update-env
pm2 save
```

## Verify

```bash
curl --noproxy '*' -I http://127.0.0.1:3000
curl --noproxy '*' -I https://ovala.ir
pm2 list
systemctl status nginx --no-pager
systemctl status mysql --no-pager
```

Expected local app response is usually `307` to `/login` for anonymous users.

## Notes

- Keep `/var/www/gold-studio/.local-storage/uploads` private and writable.
- Do not serve uploaded user files from `public/uploads`.
- Do not use `ADMIN_EMAIL` for admin promotion. Use:

```bash
npm run admin:bootstrap -- --email YOUR_ADMIN_EMAIL --password "YOUR_STRONG_PASSWORD" --name "Admin"
```

