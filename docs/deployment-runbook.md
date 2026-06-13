# Deploy Ovala

این راهنما برای آپدیت نسخه جدید روی VPS است.

## 1. قبل از deploy

روی سرور برو داخل پروژه:

```bash
cd /var/www/gold-studio
```

فایل `.env` باید این مقدارها را داشته باشد:

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
```

## 2. آپدیت نسخه

همین دستورها را به ترتیب بزن:

```bash
git pull
npm install
npm run db:deploy
npm run build
pm2 restart gold-studio
```

اگر worker قبلا ساخته شده:

```bash
pm2 restart gold-studio-worker
```

اگر worker هنوز وجود ندارد:

```bash
pm2 start npm --name gold-studio-worker -- run worker:generation
pm2 save
```

## 3. چک بعد از deploy

```bash
pm2 status
curl -I http://127.0.0.1:3000/api/health
pm2 logs gold-studio --lines 50
pm2 logs gold-studio-worker --lines 50
```

بعد داخل سایت این‌ها را تست کن:

- ثبت‌نام با پیامک
- ورود
- فراموشی رمز
- آپلود یک عکس در گالری
- ساخت یک پروژه و گرفتن خروجی
- آپلود رسید خرید
- تایید خرید از ادمین

## 4. اگر خروجی تصویر گیر کرد

ادمین را باز کن و پروژه‌ها را ببین. اگر پروژه‌ای روی `QUEUED` یا `PROCESSING` ماند:

```bash
pm2 logs gold-studio-worker --lines 100
```

اگر worker خاموش بود:

```bash
pm2 restart gold-studio-worker
```

اگر باز هم درست نشد، از پنل ادمین همان پروژه را retry کن.
