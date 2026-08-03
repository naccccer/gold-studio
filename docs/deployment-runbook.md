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

IMAGE_PROVIDER="avalai"
GENERATION_WORKER_SECRET="یک_متن_طولانی_و_تصادفی_دیگر"
GENERATION_WORKER_URL="http://127.0.0.1:3000/api/internal/generation/worker"
GENERATION_WORKER_INTERVAL_MS="15000"
GENERATION_WORKER_LIMIT="1"
GENERATION_STALE_PROCESSING_MINUTES="90"

HEALTH_WATCHDOG_URL="http://127.0.0.1:3000/api/health"
HEALTH_WATCHDOG_PM2_APP="gold-studio"
HEALTH_WATCHDOG_INTERVAL_MS="30000"
HEALTH_WATCHDOG_TIMEOUT_MS="10000"
HEALTH_WATCHDOG_FAILURE_THRESHOLD="4"
HEALTH_WATCHDOG_RESTART_COOLDOWN_MS="120000"

AVALAI_API_KEY="..."
AVALAI_BASE_URL="https://api.avalai.ir/v1"
AVALAI_IMAGE_MODEL="gemini-3.1-flash-image"
AVALAI_VISION_MODEL="gemini-3.1-flash-lite"
LIARA_API_KEY="..."
LIARA_VISION_API_KEY="..."
FARAZSMS_API_KEY="..."
FARAZSMS_PATTERN_CODE="..."
FARAZSMS_LINE_NUMBER="..."

STORAGE_DRIVER="local"
BACKUP_RETENTION_COUNT="3"
BACKUP_TIMEZONE="Asia/Tehran"
BACKUP_SCHEDULE_HOUR="3"
BACKUP_SCHEDULE_MINUTE="0"
```

اگر `STORAGE_DRIVER="local"` است، این پوشه باید وجود داشته باشد:

```bash
mkdir -p .local-storage/uploads
chmod -R 775 .local-storage
chmod 600 .env
```

قبل از هر deploy برای production، backup بگیر. مسیر ترجیحی پنل ادمین است: `/admin/backups`. از CLI هم می‌توانی همین archive کامل را بسازی:

```bash
npm run backup:run
```

این بکاپ شامل `database.sql`، `manifest.json`، و storage فعلی است. فایل‌ها در `.local-storage/backups` می‌مانند و فقط آخرین ۳ بکاپ نگهداری می‌شود.

## 2. آپدیت نسخه

ترتیب مهم است. قبل از restart حتما build بگیر، وگرنه `next start` می‌تواند با خطای نبودن production build بیفتد.

```bash
git fetch origin main
git switch main
git merge --ff-only origin/main
npm install
npm run check:prompts
npm run check:model-routing
npm run check:readiness
npm run check:mojibake
npm run lint
npm run db:deploy
npm run build
pm2 restart gold-studio --update-env
pm2 restart gold-studio-worker --update-env
pm2 restart gold-studio-watchdog --update-env
pm2 restart gold-studio-backups --update-env
pm2 save
```

اگر worker هنوز ساخته نشده:

```bash
pm2 start npm --name gold-studio-worker -- run worker:generation
pm2 save
```

اگر خود app هنوز در PM2 ساخته نشده، آن را فقط روی loopback بالا بیاور تا پورت `3000` مستقیماً از اینترنت در دسترس نباشد:

```bash
pm2 start npm --name gold-studio -- start -- -H 127.0.0.1
pm2 save
```

روی VPS تازه، قبل از فعال‌کردن firewall حتماً SSH و Nginx را allow کن و بعد از فعال‌سازی یک اتصال SSH جدید را تست کن:

```bash
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw enable
ss -ltnp | grep -E ':(22|80|443|3000|3306)[[:space:]]'
```

پورت‌های `3000` و `3306` باید فقط روی `127.0.0.1` گوش دهند. اگر SSH قطع شد، از Console پنل VPS دستور `ufw disable` را اجرا کن.

Sharp جدید روی Linux x64 به SSE4.2 و fallback آن به WebAssembly SIMD نیاز دارد. اگر VPS هیچ‌کدام را ارائه نکند، قبل از ارتقای Sharp باید نوع CPU/VPS را عوض کنی؛ در غیر این صورت build متوقف می‌شود. روی VPS فعلی فقط pin سازگار `0.32.6` اجرا می‌شود. بعد از `npm install` روی همان سرور load و پردازش واقعی Sharp را تست کن:

```bash
node -e "const sharp=require('sharp'); sharp({create:{width:2,height:2,channels:4,background:'#fff'}}).resize(1,1).png().toBuffer().then(() => console.log('sharp ok'))"
```

تا زمان ارتقای CPU، pin سازگار Sharp را خودکار بالا نبر و هشدار امنیتی باقی‌ماندهٔ آن را به‌عنوان بدهی launch پیگیری کن.

اگر watchdog هنوز ساخته نشده:

```bash
pm2 start npm --name gold-studio-watchdog -- run watchdog:health
pm2 save
```

اگر scheduler بکاپ هنوز ساخته نشده:

```bash
pm2 start npm --name gold-studio-backups -- run backup:scheduler
pm2 save
```

## 3. چک بعد از deploy

```bash
pm2 status
curl --noproxy '*' -i http://127.0.0.1:3000/api/health
npm run smoke -- https://ovala.ir
pm2 logs gold-studio --lines 80 --nostream
pm2 logs gold-studio-worker --lines 80 --nostream
pm2 logs gold-studio-watchdog --lines 80 --nostream
pm2 logs gold-studio-backups --lines 80 --nostream
```

خروجی public health باید `200` و `ok: true` داشته باشد. جزئیات دیتابیس و generation را از `/admin/health` ببین. داخل سایت هم این مسیرها را سریع تست کن:

- ثبت‌نام با پیامک
- ورود
- آپلود یک عکس در گالری
- ساخت پروژه کاتالوگ، با مدل، و عکس نمونه
- درخواست بررسی کیفیت و مشاهده اعلان کاربر
- آپلود رسید خرید
- تایید خرید از ادمین
- بررسی `/admin/health`، `/admin/projects`، `/admin/quality-reviews`، `/admin/notifications`، `/admin/billing`، و `/admin/backups`
- ورود با نقش `SALES`: فقط users/billing/referrals باز باشد و backup/system بسته باشد.

برای چک کامل‌تر قبل از گرفتن کاربر واقعی، `docs/launch-readiness.md` را اجرا کن.

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

اگر health خطای دیتابیس داد، اول وضعیت MySQL و تعداد اتصال‌ها را بررسی کن. اگر شواهد نشان داد app زنده است ولی اتصال دیتابیس گیر کرده، restart app آخرین اقدام عملیاتی است:

```bash
mysql -NBe "SHOW GLOBAL STATUS LIKE 'Threads_connected'; SHOW GLOBAL STATUS LIKE 'Max_used_connections'; SHOW VARIABLES LIKE 'max_connections'; SHOW FULL PROCESSLIST;"
pm2 logs gold-studio --lines 160 --nostream
pm2 logs gold-studio-watchdog --lines 160 --nostream
pm2 restart gold-studio --update-env
curl --noproxy '*' -i http://127.0.0.1:3000/api/health
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

## 6. rollback با احتیاط

Rollback کد فقط وقتی امن است که migration جدید schema را ناسازگار نکرده باشد. قبل از rollback، آخرین migrationها و خطای production را بررسی کن.

```bash
git log --oneline -5
git switch main
git reset --hard COMMIT_SHA
npm install
npm run build
pm2 restart gold-studio --update-env
pm2 restart gold-studio-worker --update-env
pm2 restart gold-studio-watchdog --update-env
pm2 restart gold-studio-backups --update-env
npm run smoke -- https://ovala.ir
```

اگر migration destructive یا ناسازگار deploy شده، بدون restore برنامه‌ریزی‌شده دیتابیس rollback نکن. اول backup قبل deploy را نگه دار و وضعیت را در ادمین/لاگ‌ها بررسی کن.
