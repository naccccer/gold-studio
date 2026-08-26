# Launch Readiness

این چک‌لیست برای آماده‌سازی Ovala برای کاربر واقعی است. secret، شماره کارت واقعی، API key، پسورد، dump دیتابیس، یا داده خصوصی کاربر را داخل git ننویس.

## Before Launch

- Production `.env` کامل باشد: `DATABASE_URL`, `AUTH_SECRET`, `ALLOW_INSECURE_COOKIES=false`, `SESSION_COOKIE_NAME`, `IMAGE_PROVIDER=avalai`, worker/watchdog/backup vars, `AVALAI_*`, `LIARA_*`, `FARAZSMS_*`, و `STORAGE_DRIVER`.
- اگر پشت Nginx یا proxy قابل اعتماد هستی و rate limit باید IP واقعی را ببیند، `TRUST_PROXY=true` را فقط بعد از بررسی headerهای proxy فعال کن.
- FarazSMS pattern code و line number تایید شده باشند و signup/password reset با شماره واقعی تست شوند.
- Avalai مسیر primary باشد و حداقل یک generation واقعی برای catalog، with-model، و sample-reference تست شود.
- Liara در `/admin/ai` قابل انتخاب بماند و fallback/support path آن بررسی شود.
- تنظیمات پرداخت در `/admin/billing` کامل باشد: packageها، اعتبار مستقل، پلن سفارشی کاربر، توضیح پرداخت، و اطلاعات کارت به کارت.
- مسیرهای پشتیبانی و FAQ آماده باشند و یک تیکت تستی از سمت کاربر پاسخ داده شود.
- Home carousel، ready style samples، style previews، و متن‌های اصلی ادمین مرور شوند.
- Backup قبل لانچ از `/admin/backups` یا `npm run backup:run` گرفته و دانلود/بازبینی شود.
- نقش `SALES` با یک حساب تستی بررسی شود: users/billing/referrals باز باشد و health/AI/backups/audit بسته باشد.
- App روی `127.0.0.1:3000` گوش دهد؛ firewall فقط SSH و HTTP/HTTPS را از اینترنت باز بگذارد و اتصال SSH جدید بعد از فعال‌سازی تست شود.

## Multi-Vertical Gate

- Jewelry روی host اصلی به `jewelry` resolve شود.
- `food.*` به Food resolve شود.
- لوکال با `npm run dev:jewelry` و `npm run dev:food` جداگانه تست شود.
- Clothing/Furniture تا Phase 6 فقط reserved باشند و رفتار فعال نداشته باشند.
- Jewelry/Food در gallery، projects، styles، ready samples، style-reference assets، home carousel، outputs، و quality reviews leak نداشته باشند.
- Food content با taxonomy فعلی مرور شود: product typeهای رستوران/کافه، شش style قابل نمایش، Food sample-photo style، و Food-only ready samples.
- Jewelry sample-reference با `style_sample_reference` و Food sample-reference با `food_style_sample_reference` تست شود.
- اعتبار کاربر خروجی‌محور باشد: در هر vertical، `1 credit = 1 output`. هزینه داخلی جدا بماند: `jewelry = 300 creditUnits` و `food = 100 creditUnits`.
- Admin billing/users باید vertical را صریح نشان دهند: اختصاص اعتبار دستی، پلن اختصاصی، اختصاص بسته اعتبار، اختصاص اشتراک، رسیدها، دفتر اعتبار، و خلاصه اعتبار کاربر نباید Jewelry/Food را قاطی کنند.

## Launch Commands

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

## Manual QA

- Auth: ثبت‌نام با پیامک، ورود، خروج، و فراموشی رمز.
- Home: carousel، متن‌ها، CTAها، و رفتار Jewelry/Food.
- Gallery: آپلود، crop، تغییر نوع محصول، نمایش فایل ذخیره‌شده، batch generation، و ذخیره در نمونه‌ها.
- New project: catalog، with-model، sample-reference، supporting images، preset خروجی، و هزینه credit.
- Food project flow: product typeهای غذا/نوشیدنی، شش style Food، Food sample-reference، ذخیره در نمونه‌ها، و جداسازی کامل از Jewelry.
- Projects: `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`, retry، نسخه دیگر، quality review، و نمایش زمان ساخت خروجی به ثانیه.
- Account: notifications، support، referral، خروجی‌ها، آرشیو، و لینک admin برای ادمین.
- Billing: خرید بسته/اعتبار vertical فعلی، آپلود رسید، تایید/رد از ادمین، اعمال credit و custom plan با انتخاب/نمایش صریح Jewelry یا Food.
- Admin: health، AI/provider، assets، samples، styles، projects، outputs، quality reviews، users، billing، support، referrals، backups، audit.
- Mobile target `393x852`: nav پایین، متن فارسی، RTL controls، button wrapping، forms، menus، و project result.

## Daily Operations

- `/admin/health`: queue، failed 24h، stale processing، storage driver، و envهای ضروری.
- `/admin/projects`: stuck/failed projects و provider errors.
- `/admin/quality-reviews`: درخواست‌های refund/quality pending.
- `/admin/billing`: رسیدهای pending و پلن‌های کاربر.
- `/admin/backups`: آخرین backup و retention.
- `/admin/support`: تیکت‌های باز.
- PM2 logs برای app، worker، watchdog، و backups.
- حجم دیتابیس و `.local-storage/uploads` یا bucket.

## Incident Checks

- Site down: `pm2 status`, app logs, watchdog logs, `/api/health`, و `journalctl` را قبل از restart بگیر.
- Database down: MySQL status، connection count، `DATABASE_URL`، و آخرین migration را بررسی کن.
- Worker stuck: worker logs، `GENERATION_WORKER_SECRET`, queue count، و `/admin/health`.
- Provider down: provider events و مدت هر تلاش، تفکیک زمان صف/پردازش پروژه، `check:avalai`, `check:liara`, provider balance/access، fallback model، و ابعاد واقعی خروجی (خروجی کاربر باید 2K باشد).
- SMS down: FarazSMS pattern approval، line number، API key، و پیام خطای auth flow.
- Billing issue: purchase request، receipt storage، credit event، و audit event را بررسی کن.
