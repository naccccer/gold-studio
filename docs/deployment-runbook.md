# Deploy Ovala

این راهنما برای آپدیت production روی VPS است. همه دستورها را از داخل پروژه بزن:

```bash
cd /var/www/gold-studio
```

## 1. قبل از deploy

فایل `.env` باید این کلیدها را داشته باشد. مقدارها را اینجا کپی نکن و داخل git نگذار.

```bash
DATABASE_URL="mysql://gold_studio_user:DB_PASSWORD@127.0.0.1:3306/gold_studio?allowPublicKeyRetrieval=true"
AUTH_SECRET="یک_متن_طولانی_و_تصادفی"
ALLOW_INSECURE_COOKIES="false"

IMAGE_PROVIDER="liara"
GENERATION_WORKER_SECRET="یک_متن_طولانی_و_تصادفی_دیگر"
GENERATION_WORKER_URL="http://127.0.0.1:3000/api/internal/generation/worker"
GENERATION_WORKER_INTERVAL_MS="15000"
GENERATION_WORKER_LIMIT="1"
GENERATION_STALE_PROCESSING_MINUTES="45"

HEALTH_WATCHDOG_URL="http://127.0.0.1:3000/api/health"
HEALTH_WATCHDOG_PM2_APP="gold-studio"
HEALTH_WATCHDOG_INTERVAL_MS="30000"
HEALTH_WATCHDOG_TIMEOUT_MS="10000"
HEALTH_WATCHDOG_FAILURE_THRESHOLD="4"
HEALTH_WATCHDOG_RESTART_COOLDOWN_MS="120000"

LIARA_API_KEY="..."
LIARA_VISION_API_KEY="..."
FARAZSMS_API_KEY="..."
FARAZSMS_PATTERN_CODE="..."
FARAZSMS_LINE_NUMBER="..."

STORAGE_DRIVER="local"
```

اگر `STORAGE_DRIVER="local"` است، این پوشه باید وجود داشته باشد:

```bash
mkdir -p .local-storage/uploads
chmod -R 775 .local-storage
chmod 600 .env
```

## 2. آپدیت نسخه

ترتیب مهم است. قبل از restart حتما build بگیر، وگرنه `next start` می‌تواند با خطای نبودن production build بیفتد.

```bash
git fetch origin main
git switch main
git merge --ff-only origin/main
npm install
npm run db:deploy
npm run build
pm2 restart gold-studio --update-env
pm2 restart gold-studio-worker --update-env
pm2 restart gold-studio-watchdog --update-env
pm2 save
```

اگر worker هنوز ساخته نشده:

```bash
pm2 start npm --name gold-studio-worker -- run worker:generation
pm2 save
```

اگر watchdog هنوز ساخته نشده:

```bash
pm2 start npm --name gold-studio-watchdog -- run watchdog:health
pm2 save
```

## 3. چک بعد از deploy

```bash
pm2 status
curl --noproxy '*' -i http://127.0.0.1:3000/api/health
pm2 logs gold-studio --lines 80 --nostream
pm2 logs gold-studio-worker --lines 80 --nostream
pm2 logs gold-studio-watchdog --lines 80 --nostream
```

خروجی health باید `200` و `{"ok":true}` باشد. داخل سایت هم این مسیرها را سریع تست کن:

- ثبت‌نام با پیامک
- ورود
- آپلود یک عکس در گالری
- ساخت یک پروژه و گرفتن خروجی
- آپلود رسید خرید
- تایید خرید از ادمین

## 4. وقتی سایت بالا نمی‌آید

اول شواهد را بگیر، بعد restart کن:

```bash
pm2 status
pm2 logs gold-studio --lines 120 --nostream
pm2 logs gold-studio-watchdog --lines 120 --nostream
tail -n 160 /root/.pm2/pm2.log
curl --noproxy '*' -i --max-time 10 http://127.0.0.1:3000/api/health
journalctl -k --since "24 hours ago" --no-pager | egrep -i "oom|killed process|segfault|node|mysql"
```

اگر خطای `Could not find a production build` دیدی، یعنی app قبل از `npm run build` restart شده است:

```bash
npm run build
pm2 restart gold-studio --update-env
```

اگر health خطای Prisma pool timeout داد، معمولاً app زنده است ولی pool دیتابیس گیر کرده است. برای برگرداندن سایت:

```bash
pm2 restart gold-studio --update-env
curl --noproxy '*' -i http://127.0.0.1:3000/api/health
```

بعدش علت را بررسی کن:

```bash
mysql -NBe "SHOW GLOBAL STATUS LIKE 'Threads_connected'; SHOW GLOBAL STATUS LIKE 'Max_used_connections'; SHOW VARIABLES LIKE 'max_connections'; SHOW FULL PROCESSLIST;"
pm2 logs gold-studio --lines 160 --nostream
pm2 logs gold-studio-watchdog --lines 160 --nostream
```

## 5. وقتی worker گیر می‌کند

اگر پروژه روی `QUEUED` یا `PROCESSING` ماند:

```bash
pm2 status
pm2 logs gold-studio-worker --lines 120 --nostream
```

اگر worker خطای `GENERATION_WORKER_SECRET env var is required` داد، کلید در `.env` نیست یا app بعد از اضافه شدن کلید restart نشده است. یک secret جدید بساز، هم app و هم worker را restart کن، و مقدار secret را جایی عمومی ننویس:

```bash
openssl rand -hex 32
pm2 restart gold-studio --update-env
pm2 restart gold-studio-worker --update-env
pm2 save
```

اگر worker سالم بود ولی خروجی تولید نشد، پروژه را از پنل ادمین retry کن و لاگ provider را ببین.
