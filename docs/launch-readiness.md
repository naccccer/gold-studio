# Launch Readiness

این چک‌لیست برای آماده‌سازی Ovala برای کاربر واقعی است. مقدار secret، شماره کارت واقعی، API key، پسورد، یا داده خصوصی کاربر را داخل git ننویس.

## قبل از لانچ

- Production `.env` کامل باشد: `DATABASE_URL`, `AUTH_SECRET`, `ALLOW_INSECURE_COOKIES=false`, `SESSION_COOKIE_NAME`, `IMAGE_PROVIDER`, worker/watchdog/backup vars, `LIARA_*`, `FARAZSMS_*`, و `STORAGE_DRIVER`.
- اگر پشت Nginx یا proxy قابل اعتماد هستی و rate limit باید IP واقعی را ببیند، `TRUST_PROXY=true` را فقط بعد از بررسی headerهای proxy فعال کن.
- FarazSMS pattern code و line number تایید شده باشند و ثبت‌نام و فراموشی رمز با شماره واقعی تست شوند.
- Liara مسیر اصلی باشد و حداقل یک generation واقعی برای کاتالوگ، با مدل، و عکس نمونه تست شود. Avalai فقط وقتی لازم است و با توجه به هزینه بررسی شود.
- تنظیمات پرداخت در `/admin/billing` کامل باشد: بسته‌ها، اعتبار مستقل، پلن سفارشی کاربر، توضیح پرداخت، و اطلاعات کارت به کارت.
- مسیرهای پشتیبانی و FAQ آماده باشند و یک تیکت تستی از سمت کاربر پاسخ داده شود.
- Home carousel، ready style samples، style previews، و متن‌های اصلی ادمین مرور شوند.
- Multi-vertical host routing is verified: current Jewelry host resolves to `jewelry`; `food.*` resolves to `food`; local development may use optional `OVALA_LOCAL_VERTICAL` and otherwise falls back to `jewelry`.
- backup قبل لانچ از `/admin/backups` یا `npm run backup:run` گرفته و دانلود/بازبینی شود.
- نقش `SALES` با یک حساب تستی بررسی شود: دسترسی به users/billing/referrals باز باشد و health/AI/backups/audit بسته باشد.

## روز لانچ

```bash
cd /var/www/gold-studio
git status --short --branch
git pull --ff-only origin main
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
npm run smoke -- https://ovala.ir
```

اگر app، worker، watchdog، یا backup scheduler هنوز در PM2 نیستند، اول طبق `docs/deployment-runbook.md` بساز و بعد `pm2 save` بزن.

## QA دستی

- ثبت‌نام با پیامک، ورود، خروج، و فراموشی رمز.
- گالری: آپلود، crop، تغییر نوع محصول، و نمایش فایل ذخیره‌شده.
- پروژه جدید: خروجی کاتالوگ، با مدل، و عکس نمونه.
- پروژه‌ها: وضعیت `QUEUED/PROCESSING/COMPLETED/FAILED`، retry، نسخه دیگر، و درخواست بررسی کیفیت.
- حساب: اعلان‌ها، پشتیبانی، ارجاع، تنظیمات خروجی، آرشیو.
- پرداخت: خرید بسته/اعتبار، آپلود رسید، تایید/رد از ادمین، و اعمال credit یا پلن.
- ادمین: health، AI/provider، پروژه‌ها، quality reviews، اعلان‌ها، کاربران، billing، support، assets، styles، backups.
- فروش: رسیدها و عملیات فروش را انجام دهد، ولی تنظیمات سیستم، backup، role/password، و package/payment settings را نبیند.
- موبایل هدف `393x852`: nav پایین، متن فارسی، دکمه‌ها، فرم‌ها، و project result.

## عملیات روزانه بعد لانچ

- `/admin/health`: صف generation، failed 24h، stale processing، storage driver، و envهای ضروری.
- `/admin/projects`: خطاهای provider و پروژه‌های گیرکرده.
- `/admin/quality-reviews`: درخواست‌های refund/quality pending.
- `/admin/billing`: رسیدهای pending و پلن‌های کاربر.
- `/admin/backups`: آخرین بکاپ و وضعیت retention.
- `/admin/support`: تیکت‌های باز.
- PM2 logs برای app، worker، watchdog، و backups.
- حجم دیتابیس و `.local-storage/uploads` یا bucket را بررسی کن.

## Incident

- سایت down: `pm2 status`, app logs, watchdog logs, `/api/health`, و `journalctl` را قبل از restart بگیر.
- دیتابیس down: MySQL status، connection count، `DATABASE_URL`، و آخرین migration را بررسی کن.
- worker stuck: لاگ worker، `GENERATION_WORKER_SECRET`, queue count، و `/admin/health`.
- provider down: provider events، `check:liara`، موجودی/دسترسی provider، و fallback model.
- SMS down: FarazSMS pattern approval، line number، API key، و پیام خطای auth flow.
- پرداخت مشکل دارد: purchase request، receipt storage، credit event، و audit event را بررسی کن.
