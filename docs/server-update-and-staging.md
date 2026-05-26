# به‌روزرسانی VPS و نسخه آزمایشی

این چک‌لیست برای سروری است که نسخه لایو Ovala روی آن اجرا می‌شود؛ یعنی همان VPS با Nginx، PM2، MySQL و مسیرهایی مثل `/var/www/gold-studio`.

## قبل از ورود به سرور

روی سیستم خودت مطمئن شو آخرین تغییرات commit و push شده‌اند:

```powershell
git status
git log -1 --oneline
git push
```

بعد با SSH وارد VPS شو:

```bash
ssh root@SERVER_IP
```

اگر با کاربر غیر root وصل می‌شوی، برای دستورهای Nginx و نصب پکیج‌ها از `sudo` استفاده کن.

## آوردن کامیت جدید روی نسخه لایو

روی VPS:

```bash
cd /var/www/gold-studio
git status
git pull origin main
npm install
npm run check:mojibake
npm run lint
npm run db:deploy
npm run build
pm2 restart gold-studio --update-env
pm2 save
```

اگر migration دیتابیس داری، `npm run db:deploy` باید روی دیتابیس لایو اجرا شود. برای تغییرات حساس بهتر است اول همین commit را روی staging تست کنی.

بعد از restart:

```bash
pm2 status
pm2 logs gold-studio --lines 80
curl -I http://127.0.0.1:3000
curl -I https://ovala.ir
```

## اگر build شکست خورد

تا وقتی build سالم نشده، PM2 را restart نکن. در این حالت نسخه قبلی که در حال اجراست معمولاً هنوز فعال می‌ماند.

برای دیدن وضعیت:

```bash
pm2 status
pm2 logs gold-studio --lines 120
```

اگر build فقط به خاطر مشکل شناخته‌شده PrismaClient در `src/lib/db.ts` شکست خورد، آن را جدا گزارش کن و بدون بررسی بیشتر به عنوان تغییر مرتبط با deploy حساب نکن.

## نکته‌های مهم روی VPS

- فایل `.env` روی سرور را با Git جابه‌جا نکن و داخل repo commit نکن.
- پوشه `.local-storage/uploads` را حذف یا overwrite نکن؛ عکس‌های کاربران آنجاست.
- اگر مسیر لایو قبلاً با zip ساخته شده و `.git` ندارد، داخل همان مسیر `git pull` جواب نمی‌دهد.
- اگر دسترسی GitHub، npm یا Prisma روی VPS مشکل داشت، اول مستقیم تست کن و فقط در صورت نیاز طبق `docs/proxy.md` پروکسی بگذار.
- بعد از تغییر `.env`، حتماً `pm2 restart gold-studio --update-env` بزن.

## راه‌اندازی staging روی همان VPS

بله، تست کردن نسخه آزمایشی روی همان VPS کار راحت و منطقی‌ای است. مدل پیشنهادی این است:

```text
/var/www/gold-studio          نسخه لایو
/var/www/gold-studio-staging  نسخه آزمایشی
```

staging باید دیتابیس و storage جدا داشته باشد تا تست‌ها روی داده واقعی اثر نگذارند.

## ساخت دیتابیس staging

روی VPS:

```bash
mysql
```

```sql
CREATE DATABASE gold_studio_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gold_studio_staging_user'@'127.0.0.1' IDENTIFIED BY 'CHANGE_THIS_STAGING_PASSWORD';
GRANT ALL PRIVILEGES ON gold_studio_staging.* TO 'gold_studio_staging_user'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

## ساخت کلون staging

```bash
cd /var/www
git clone https://github.com/naccccer/gold-studio.git gold-studio-staging
cd /var/www/gold-studio-staging
cp ../gold-studio/.env .env
nano .env
```

در `.env` staging حداقل این‌ها را جدا کن:

```env
DATABASE_URL="mysql://gold_studio_staging_user:CHANGE_THIS_STAGING_PASSWORD@127.0.0.1:3306/gold_studio_staging"
STORAGE_DRIVER="local"
```

اگر هزینه Liara مهم است، برای staging کلید جدا بگذار یا تولید واقعی تصویر را خیلی محدود تست کن.

بعد:

```bash
mkdir -p .local-storage/uploads
chmod -R 775 .local-storage
npm install
npm run check:mojibake
npm run lint
npm run db:deploy
npm run build
pm2 start npm --name gold-studio-staging -- start -- -p 3001
pm2 save
```

## وصل کردن staging به Nginx

اگر ساب‌دامین staging داری، مثلاً `staging.ovala.ir`، یک فایل جدید بساز:

```bash
nano /etc/nginx/sites-available/gold-studio-staging
```

نمونه تنظیم:

```nginx
server {
    listen 80;
    server_name staging.ovala.ir;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3001;
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

فعال‌سازی:

```bash
ln -sf /etc/nginx/sites-available/gold-studio-staging /etc/nginx/sites-enabled/gold-studio-staging
nginx -t
systemctl reload nginx
```

اگر SSL می‌خواهی:

```bash
certbot --nginx -d staging.ovala.ir
```

اگر ساب‌دامین نداری، می‌توانی موقتاً با `http://SERVER_IP:3001` تست کنی، به شرطی که firewall اجازه بدهد. برای استفاده طولانی، ساب‌دامین پشت Nginx تمیزتر است.

## جریان انتشار امن

1. روی لوکال commit را push کن.
2. روی VPS وارد staging شو:

```bash
cd /var/www/gold-studio-staging
git pull origin main
npm install
npm run check:mojibake
npm run lint
npm run db:deploy
npm run build
pm2 restart gold-studio-staging --update-env
```

3. روی `staging.ovala.ir` مسیرهای اصلی را دستی تست کن: ورود، گالری، پروژه جدید، پروژه‌ها، حساب، billing و admin.
4. اگر سالم بود، همان commit را روی نسخه لایو deploy کن:

```bash
cd /var/www/gold-studio
git pull origin main
npm install
npm run check:mojibake
npm run lint
npm run db:deploy
npm run build
pm2 restart gold-studio --update-env
pm2 save
```

## تفاوت staging با deploy روی لوکال

staging اینجا روی همان VPS یا یک VPS جدا اجرا می‌شود، نه روی لپ‌تاپ. یعنی:

- با PM2 اجرا می‌شود.
- پشت Nginx قرار می‌گیرد.
- دیتابیس MySQL واقعی خودش را دارد.
- storage جدا دارد.
- با شرایط نزدیک به نسخه لایو تست می‌شود.
