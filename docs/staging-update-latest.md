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
curl --noproxy '*' -i http://127.0.0.1:3001/api/health
npm run smoke -- https://test.ovala.ir
```

خروجی health باید `{"ok":true}` باشد و smoke test باید `0 failed` بدهد. `WARN` شکست deploy نیست، ولی قبل لانچ بررسی اش کن.

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
