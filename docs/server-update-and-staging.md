# به‌روزرسانی سرور و نسخه آزمایشی

این فایل چک‌لیست کوتاه برای وقتی است که یک کامیت جدید آماده شده و باید روی سرور بیاید.

## آوردن کامیت جدید روی سرور اصلی

قبل از سرور، روی لوکال مطمئن شو تغییرات کامیت و پوش شده‌اند:

```powershell
git status
git log -1 --oneline
git push
```

روی سرور:

```bash
cd /var/www/gold-studio
git status
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

بعد از ری‌استارت:

```bash
pm2 list
curl --noproxy '*' -I http://127.0.0.1:3000
curl --noproxy '*' -I https://ovala.ir
```

اگر `git pull` یا `npm install` به خاطر دسترسی خارجی گیر کرد، اول مستقیم امتحان کن؛ فقط اگر واقعاً لازم شد طبق `docs/proxy.md` یا `docs/hostiran-git-deploy.md` پراکسی را فعال کن.

## نکته‌های مهم قبل از اجرا

- فایل `.env` روی سرور را با Git جابه‌جا نکن.
- پوشه `.local-storage/uploads` را حذف نکن؛ عکس‌های کاربران آنجاست.
- اگر migration دیتابیس داری، `npm run db:deploy` را قبل از `build` اجرا کن.
- اگر build شکست، قبل از ری‌استارت PM2 مشکل را حل کن تا نسخه سالم قبلی فعال بماند.

## نسخه آزمایشی قبل از دامنه اصلی

بله، کار نسبتاً راحتی است و برای کاهش ریسک پیشنهاد می‌شود. بهترین مدل این است که یک کلون دوم داشته باشی:

```text
/var/www/gold-studio          نسخه اصلی
/var/www/gold-studio-staging  نسخه آزمایشی
```

برای اولین راه‌اندازی staging:

```bash
cd /var/www
git clone https://github.com/naccccer/gold-studio.git gold-studio-staging
cd /var/www/gold-studio-staging
cp ../gold-studio/.env .env
nano .env
```

در `.env` نسخه آزمایشی، بهتر است این‌ها جدا باشند:

```env
DATABASE_URL="mysql://gold_studio_staging_user:CHANGE_THIS@127.0.0.1:3306/gold_studio_staging"
STORAGE_DRIVER="local"
```

بعد:

```bash
mkdir -p .local-storage/uploads
chmod -R 775 .local-storage
npm install --ignore-scripts
npm run db:generate
npm run db:deploy
npm run build
pm2 start npm --name gold-studio-staging -- start -- -p 3001
pm2 save
```

برای Nginx، یک ساب‌دامین مثل `staging.ovala.ir` را به پورت `3001` وصل کن. اگر ساب‌دامین نداری، موقتاً با `http://SERVER_IP:3001` هم می‌شود تست کرد، به شرطی که فایروال اجازه بدهد.

## جریان پیشنهادی انتشار امن

1. کامیت را روی GitHub پوش کن.
2. روی staging برو و `git pull` بزن.
3. روی staging این‌ها را اجرا کن:

```bash
npm install --ignore-scripts
npm run db:generate
npm run db:deploy
npm run check:mojibake
npm run lint
npm run build
pm2 restart gold-studio-staging --update-env
```

4. چند مسیر اصلی را دستی تست کن: ورود، گالری، پروژه جدید، پروژه‌ها، حساب، billing و admin.
5. اگر سالم بود، همان کامیت را روی `/var/www/gold-studio` اصلی pull و deploy کن.

## هشدار staging

- اگر staging از همان دیتابیس اصلی استفاده کند، دیگر آزمایشی امن نیست؛ ممکن است migration یا تست‌ها روی داده واقعی اثر بگذارند.
- اگر هزینه Liara مهم است، روی staging تولید واقعی تصویر را کم تست کن یا کلید/اعتبار جدا بگذار.
- اگر storage جدا نباشد، فایل‌های تستی کنار فایل‌های اصلی می‌نشینند.
