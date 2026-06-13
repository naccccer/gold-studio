# ساخت نسخه تست روی test.ovala.ir

فرض این راهنما:

- نسخه اصلی الان روی `https://ovala.ir` فعال است.
- نسخه تست هنوز وجود ندارد.
- می‌خواهیم نسخه تست را روی `https://test.ovala.ir` بالا بیاوریم.
- نسخه اصلی نباید دست بخورد.

## 1. DNS ساب‌دامین را وصل کن

در پنل دامنه، یک رکورد بساز:

```text
Type: A
Name: test
Value: IP سرور VPS
```

بعد چند دقیقه روی VPS تست کن:

```bash
ping test.ovala.ir
```

اگر IP سرور را نشان داد، برو مرحله بعد.

## 2. کد نسخه تست را جدا clone کن

روی VPS:

```bash
cd /var/www
git clone https://github.com/naccccer/gold-studio.git gold-studio-test
cd /var/www/gold-studio-test
```

## 3. دیتابیس تست بساز

```bash
mysql -u root -p
```

داخل MySQL:

```sql
CREATE DATABASE gold_studio_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON gold_studio_test.* TO 'gold_studio_user'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

## 4. فایل env تست را بساز

```bash
cp .env.example .env
nano .env
```

این مقدارها را حتما درست کن:

```bash
DATABASE_URL="mysql://gold_studio_user:DB_PASSWORD@127.0.0.1:3306/gold_studio_test?allowPublicKeyRetrieval=true"
AUTH_SECRET="یک_متن_طولانی_تصادفی"
ALLOW_INSECURE_COOKIES="false"

GENERATION_WORKER_SECRET="یک_متن_طولانی_تصادفی_دیگر"
GENERATION_WORKER_URL="http://127.0.0.1:3001/api/internal/generation/worker"

STORAGE_DRIVER="local"
```

کلیدهای واقعی `LIARA_*` و `FARAZSMS_*` را هم مثل نسخه اصلی پر کن.

## 5. پوشه آپلود تست را بساز

```bash
mkdir -p .local-storage/uploads
chmod -R 775 .local-storage
```

## 6. نسخه تست را build کن

```bash
npm install
npm run db:deploy
npm run build
```

## 7. نسخه تست را با PM2 روی پورت 3001 بالا بیاور

```bash
pm2 start npm --name gold-studio-test -- start -- -p 3001
pm2 start npm --name gold-studio-test-worker -- run worker:generation
pm2 save
```

چک کن روشن شده:

```bash
pm2 status
curl -I http://127.0.0.1:3001/api/health
```

## 8. Nginx را برای test.ovala.ir تنظیم کن

یک فایل Nginx بساز:

```bash
nano /etc/nginx/sites-available/test.ovala.ir
```

این را داخلش بگذار:

```nginx
server {
    server_name test.ovala.ir;

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

فعال کن:

```bash
ln -s /etc/nginx/sites-available/test.ovala.ir /etc/nginx/sites-enabled/test.ovala.ir
nginx -t
systemctl reload nginx
```

## 9. SSL برای test.ovala.ir بگیر

اگر certbot نصب نیست:

```bash
apt install -y certbot python3-certbot-nginx
```

بعد:

```bash
certbot --nginx -d test.ovala.ir
```

## 10. آدرس تست

حالا نسخه تست اینجاست:

```text
https://test.ovala.ir
```

نسخه اصلی همچنان اینجاست:

```text
https://ovala.ir
```

## 11. تست کن

در `https://test.ovala.ir` این‌ها را تست کن:

- ثبت‌نام با پیامک
- ورود
- فراموشی رمز
- آپلود عکس
- ساخت پروژه و گرفتن خروجی
- آپلود رسید خرید
- تایید خرید از ادمین

اگر خروجی تصویر گیر کرد:

```bash
pm2 logs gold-studio-test-worker --lines 100
```

## 12. اگر تست اوکی بود، نسخه اصلی را آپدیت کن

```bash
cd /var/www/gold-studio
git pull
npm install
npm run db:deploy
npm run build
pm2 restart gold-studio
pm2 restart gold-studio-worker
```

بعد نسخه اصلی را چک کن:

```text
https://ovala.ir
```
