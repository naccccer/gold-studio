# آپدیت سریع staging به آخرین نسخه

این راهنما برای وقتی است که staging روی `https://test.ovala.ir` قبلا ساخته شده و فقط می خواهی آخرین `main` را روی سرور تست pull کنی.

همه دستورها را روی VPS اجرا کن.

## 1. ورود به پروژه تست

```bash
cd /var/www/gold-studio-test
git status --short --branch
```

اگر فایل local تغییر کرده دیدی، قبل از ادامه بررسی کن. روی سرور تست بهتر است worktree تمیز باشد.

## 2. گرفتن آخرین کد

اگر GitHub مستقیم کار می کند:

```bash
git pull --ff-only origin main
```

اگر GitHub از سرور باز نمی شود و Xray/v2rayN روی `127.0.0.1:10808` داری:

```bash
git -c http.proxy=socks5h://127.0.0.1:10808 pull --ff-only origin main
```

برای تست های local بعدی proxy را خاموش کن:

```bash
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
export no_proxy="127.0.0.1,localhost"
export NO_PROXY="127.0.0.1,localhost"
```

Proxy را global نگه ندار. برای GitHub فقط همان دستور `git -c http.proxy=...` را استفاده کن؛ app و worker staging باید بدون outbound proxy اجرا شوند تا Liara، Avalai و FarazSMS مستقیم وصل شوند.

## 3. نصب، migration و build

```bash
npm install
npm run db:deploy
rm -rf .next
npm run build
```

اگر این اولین deploy بعد از hardening سشن باشد، migration ستون `sessionVersion` را اضافه می کند و ممکن است کاربرهای قبلی لازم باشد دوباره login کنند.

## 4. restart سرویس ها

```bash
export http_proxy=""
export https_proxy=""
export HTTP_PROXY=""
export HTTPS_PROXY=""
export no_proxy="127.0.0.1,localhost"
export NO_PROXY="127.0.0.1,localhost"

pm2 restart gold-studio-test --update-env
pm2 restart gold-studio-test-worker --update-env
pm2 save
```

اگر worker هنوز وجود ندارد:

```bash
pm2 start npm --name gold-studio-test-worker -- run worker:generation
pm2 save
```

## 5. چک سریع

```bash
pm2 status
pm2 env 1 | grep -i proxy
pm2 env 2 | grep -i proxy
curl --noproxy '*' -i http://127.0.0.1:3001/api/health
npm run smoke -- https://test.ovala.ir
```

اگر idهای PM2 فرق داشت، عددهای `1` و `2` را از خروجی `pm2 status` برای `gold-studio-test` و `gold-studio-test-worker` بردار.

خروجی health باید `{"ok":true}` باشد و smoke test باید `0 failed` بدهد. `WARN` شکست deploy نیست، ولی قبل لانچ بررسی اش کن.

در خروجی proxy برای app و worker، مقدارهای `http_proxy` و `https_proxy` باید خالی باشند. فقط `NO_PROXY=127.0.0.1,localhost` باید بماند.

برای چک مستقیم providerها، فقط وقتی لازم است و با توجه به هزینه Avalai اجرا کن:

```bash
npm run check:liara
npm run check:avalai
```

## 6. اگر خطا دیدی

لاگ app:

```bash
pm2 logs gold-studio-test --lines 100
```

لاگ worker:

```bash
pm2 logs gold-studio-test-worker --lines 100
```

اگر health `503` بود، اول `.env` و دسترسی دیتابیس را چک کن:

```bash
grep DATABASE_URL .env
mysql -u gold_studio_user -p -h 127.0.0.1 gold_studio_test -e "SELECT 1;"
```

اگر بعد از login از حساب بیرون افتادی، نام کوکی staging را چک کن:

```bash
grep SESSION_COOKIE_NAME .env
```

برای staging باید این باشد:

```bash
SESSION_COOKIE_NAME="gold_session_test"
```

اگر با HTTP صفحه بدون CSS بود یا HTTPS نسخه قدیمی را نشان داد، یعنی Nginx روی پورت 443 به staging وصل نیست. `https://test.ovala.ir` باید به `127.0.0.1:3001` proxy شود و smoke test روی HTTPS پاس شود.
