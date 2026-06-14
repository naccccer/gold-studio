# ساخت نسخه staging روی test.ovala.ir

این راهنما برای بالا آوردن نسخه تست روی `https://test.ovala.ir` است، بدون اینکه نسخه اصلی روی `https://ovala.ir` دست بخورد.

## 1. DNS را تنظیم کن

در پنل دامنه یک رکورد بساز:

```text
Type: A
Name: test
Value: IP عمومی VPS
TTL: 1 ساعت
Proxy: DNS فقط
```

برای راه اندازی اولیه، پروکسی/CDN را خاموش نگه دار. اگر رکورد پشت پروکسی باشد، `dig` ممکن است IP پروکسی مثل `185.x.x.x` بدهد و عیب یابی Nginx و Certbot سخت می شود.

روی VPS چک کن:

```bash
resolvectl flush-caches
dig test.ovala.ir +short
```

خروجی باید IP عمومی VPS باشد، نه IP خصوصی مثل `10.x.x.x` و نه IP پروکسی.

## 2. کد را clone کن

روی VPS:

```bash
cd /var/www
git clone https://github.com/naccccer/gold-studio.git gold-studio-test
cd /var/www/gold-studio-test
```

اگر GitHub از VPS باز نشد، مستقیم اول تست کن:

```bash
curl -I --connect-timeout 15 https://github.com
```

اگر timeout شد و روی VPS Xray داری، proxy را فقط برای دستور Git استفاده کن:

```bash
git -c http.proxy=socks5h://127.0.0.1:10808 clone --depth 1 https://github.com/naccccer/gold-studio.git gold-studio-test
```

جزئیات proxy در `docs/proxy.md` است. برای درخواست های local مثل health check از proxy استفاده نکن.

## 3. دیتابیس staging را بساز

```bash
mysql -u root -p
```

داخل MySQL:

```sql
CREATE DATABASE IF NOT EXISTS gold_studio_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'gold_studio_user'@'127.0.0.1' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';
ALTER USER 'gold_studio_user'@'127.0.0.1' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON gold_studio_test.* TO 'gold_studio_user'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

پسورد را ساده و URL-safe انتخاب کن؛ برای مثال در پسورد از `@`، `#` و `%` استفاده نکن مگر اینکه آن را encode کنی.

## 4. فایل env تست را بساز

```bash
cp .env.example .env
nano .env
```

این مقدارها را حتما درست کن:

```bash
DATABASE_URL="mysql://gold_studio_user:CHANGE_THIS_PASSWORD@127.0.0.1:3306/gold_studio_test?allowPublicKeyRetrieval=true"
AUTH_SECRET="یک_متن_طولانی_تصادفی"
ALLOW_INSECURE_COOKIES="false"
SESSION_COOKIE_NAME="gold_session_test"

GENERATION_WORKER_SECRET="یک_متن_طولانی_تصادفی_دیگر"
GENERATION_WORKER_URL="http://127.0.0.1:3001/api/internal/generation/worker"

STORAGE_DRIVER="local"
```

کلیدهای واقعی `LIARA_*` و `FARAZSMS_*` را هم مثل production پر کن.

مهم: `SESSION_COOKIE_NAME` در staging باید با production فرق داشته باشد. برای staging همین مقدار را بگذار:

```bash
SESSION_COOKIE_NAME="gold_session_test"
```

اتصال دیتابیس را قبل از build تست کن:

```bash
mysql -u gold_studio_user -p -h 127.0.0.1 gold_studio_test -e "SELECT 1;"
```

## 5. پوشه آپلود تست را بساز

```bash
mkdir -p .local-storage/uploads
chmod -R 775 .local-storage
```

## 6. نصب، migration و build

اگر برای npm یا Prisma به proxy نیاز شد، فقط همان دستورها را با proxy اجرا کن و بعد برای تست local آن را unset کن.

```bash
npm install
npm run db:deploy
npm run build
```

## 7. PM2 را روی پورت 3001 بالا بیاور

```bash
pm2 start npm --name gold-studio-test -- start -- -p 3001
pm2 start npm --name gold-studio-test-worker -- run worker:generation
pm2 save
```

اگر قبلش proxy env فعال کرده بودی:

```bash
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
export no_proxy="127.0.0.1,localhost"
export NO_PROXY="127.0.0.1,localhost"
```

چک کن:

```bash
pm2 status
curl --noproxy '*' -i http://127.0.0.1:3001/api/health
```

خروجی health باید `{"ok":true}` باشد. اگر `503` شد، معمولاً `DATABASE_URL` یا permission دیتابیس اشتباه است:

```bash
pm2 logs gold-studio-test --lines 80
grep DATABASE_URL .env
```

## 8. Nginx را برای test.ovala.ir تنظیم کن

فایل Nginx را بساز:

```bash
nano /etc/nginx/sites-available/test.ovala.ir
```

محتوا:

```nginx
server {
    listen 80;
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
ln -sf /etc/nginx/sites-available/test.ovala.ir /etc/nginx/sites-enabled/test.ovala.ir
nginx -t
systemctl reload nginx
```

مطمئن شو `test.ovala.ir` واقعاً به پورت `3001` وصل است:

```bash
nginx -T | grep -A25 -B5 "server_name test.ovala.ir"
curl -I http://test.ovala.ir
```

اگر `nginx -T` چیزی نشان نداد، یعنی staging هنوز route اختصاصی ندارد و احتمالاً default/production را می بینی.

## 9. SSL بگیر

اگر certbot نصب نیست:

```bash
apt install -y certbot python3-certbot-nginx
```

بعد:

```bash
certbot --nginx -d test.ovala.ir
```

بعد از SSL:

```bash
curl -I https://test.ovala.ir
```

## 10. smoke test سریع را اجرا کن

Smoke test یک چک سریع برای نسخه در حال اجرا است. این تست وارد حساب کاربری نمی شود و به AI، پرداخت، پیامک یا ساخت پروژه دست نمی زند؛ فقط مطمئن می شود deploy از بیرون زنده است و مسیرهای پایه درست رفتار می کنند.

چیزهایی که چک می کند:

- `/api/health` باید `200` و `{"ok":true}` بدهد.
- صفحه های عمومی `/`، `/login`، `/signup` و `/forgot-password` باید render شوند.
- صفحه های محافظت شده مثل `/dashboard`، `/gallery`، `/projects`، `/account` و `/admin` باید کاربر ناشناس را به `/login` بفرستند.
- مسیر قدیمی `/uploads/...` باید بسته باشد.
- فایل private از `/api/storage/...` بدون session نباید خوانده شود.
- چند security header پایه را فقط به صورت هشدار چک می کند.

بعد از بالا آمدن staging:

```bash
cd /var/www/gold-studio-test
npm run smoke -- https://test.ovala.ir
```

یا:

```bash
SMOKE_BASE_URL=https://test.ovala.ir npm run smoke
```

اگر همه چیز درست باشد، خروجی باید `0 failed` داشته باشد. `WARN` شکست deploy حساب نمی شود، ولی اگر مربوط به headerهای امنیتی بود قبل لانچ بررسی کن. اگر `FAIL` دیدی، همان endpoint را دستی با `curl -I` چک کن و بعد لاگ app را ببین:

```bash
pm2 logs gold-studio-test --lines 80
```

برای production هم بعد از deploy می توانی همین را اجرا کنی:

```bash
npm run smoke -- https://ovala.ir
```

## 11. آپدیت staging در دفعات بعد

```bash
cd /var/www/gold-studio-test
git -c http.proxy=socks5h://127.0.0.1:10808 pull --ff-only origin main
npm install
npm run db:deploy
rm -rf .next
npm run build
pm2 restart gold-studio-test --update-env
pm2 restart gold-studio-test-worker --update-env
npm run smoke -- https://test.ovala.ir
```

اگر GitHub مستقیم کار می کند، بخش `-c http.proxy=...` را حذف کن.

## 12. تست های دستی

در `https://test.ovala.ir` این ها را تست کن:

- ثبت نام با پیامک
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

اگر بعد از لاگین با کلیک روی هر دکمه بیرون پریدی:

1. داخل `.env` تست این مقدار را چک کن:

```bash
grep SESSION_COOKIE_NAME .env
```

باید این باشد:

```bash
SESSION_COOKIE_NAME="gold_session_test"
```

2. بعد app تست را با env جدید restart کن:

```bash
pm2 restart gold-studio-test --update-env
```

3. در مرورگر، cookieهای `test.ovala.ir` را پاک کن و دوباره لاگین کن.

## 13. اگر staging درست بود، production را آپدیت کن

```bash
cd /var/www/gold-studio
git pull
npm install
npm run db:deploy
npm run build
pm2 restart gold-studio
pm2 restart gold-studio-worker
npm run smoke -- https://ovala.ir
```

بعد نسخه اصلی را چک کن:

```text
https://ovala.ir
```
