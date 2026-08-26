# Repo Readiness

این فایل چک سریع قبل از merge، deploy، یا گرفتن کاربر واقعی است.

## Git

```bash
git status --short --branch
git log --oneline -5
```

- Worktree باید clean باشد یا تغییرات pending کاملا شناخته‌شده باشند.
- Migrationهای Prisma باید commit شده باشند.
- `.env`, dump دیتابیس، `.local-storage`, private keys، receipt files، و خروجی‌های test نباید commit شوند.
- اگر branch از remote جلوتر است، قبل از handoff مشخص کن commit/push لازم است یا نه.

## Database Guard

برای branch چندعمودی، اگر تسک دیتابیس ایزوله خواسته، قبل از هر Prisma/build/check مقدار shell را تنظیم و چاپ کن:

```powershell
$env:DATABASE_URL="mysql://root@127.0.0.1:3306/gold_studio_phase1_codex?allowPublicKeyRetrieval=true"
node -e "console.log(process.env.DATABASE_URL)"
```

- برای این حالت از `.env DATABASE_URL` استفاده نکن.
- `gold_studio` را mutate نکن.
- دیتابیس phase جدید مثل `gold_studio_phase2_codex` نساز مگر task صریحا بخواهد.
- قبل از `migrate reset` یا هر wipe، تایید صریح بگیر.

## Required Checks

```bash
npm run check:prompts
npm run check:model-routing
npm run check:readiness
npm run check:mojibake
npm run check:image-delivery
npm run check:storage-access
npm run check:observability
npm run lint
npm run build
```

Deploy smoke:

```bash
npm run smoke -- https://ovala.ir
```

Staging smoke:

```bash
npm run smoke -- https://test.ovala.ir
```

## Multi-Vertical Gate

قبل از merge یا deploy تغییرات چندعمودی:

- Jewelry و Food را جداگانه تست کن؛ مسیر سریع لوکال `npm run dev:jewelry` و `npm run dev:food` است.
- Gallery، projects، styles، samples، home carousel، outputs، و quality reviews نباید بین Jewelry و Food leak داشته باشند.
- Avalai باید primary بماند.
- Liara باید در `/admin/ai` قابل انتخاب و به‌عنوان fallback/support path قابل استفاده بماند.
- Prompt checks باید Jewelry safeguards و Food identity/appetite rules را پوشش دهند.
- هزینه‌ها باید `jewelry = 300 creditUnits` و `food = 100 creditUnits` بمانند.
- Admin billing/users باید در credit balance، manual credit، custom plan، package assignment، subscription assignment، receipts و credit events برچسب یا انتخاب صریح Jewelry/Food داشته باشد.
- Food sample-reference باید با `food_style_sample_reference` و Jewelry sample-reference با `style_sample_reference` بررسی شود.
- Clothing/Furniture فقط reserved هستند تا Phase 6 عمدا شروع شود.

## Env And Storage

- `.env.example` فقط نام envهای لازم را داشته باشد، نه مقدار واقعی.
- `STORAGE_DRIVER="local"` یعنی فایل‌ها زیر `.local-storage/uploads` هستند و از `/api/storage/...` خوانده می‌شوند.
- `public/uploads` مسیر عملیاتی user upload نیست.
- thumbnailهای خصوصی با URL امضاشده خوانده می‌شوند؛ در صورت نبود/انقضای امضا endpoint باید به مجوز session/ownership برگردد.
- warmup تصاویر جدید، تطبیق هزینه Avalai، و پاک‌سازی کش توسط generation worker و فقط با اولویت پایین انجام می‌شود.
- قبل از `cleanup:archives` باید backup داشته باشی؛ این script DB row و فایل storage را حذف می‌کند.

## Docs

- اگر رفتار محصول، deploy، env، storage، billing، SMS، provider، worker، watchdog، یا عملیات ادمین تغییر کرد، doc مربوطه همان تغییر را بگیرد.
- `roadmap.md` باید وضعیت فعلی و اولویت‌های نزدیک را نشان دهد، نه تاریخچه بلند.
- `docs/multi-vertical-roadmap.md` باید وضعیت Phase 6 را روشن بگوید: شروع شده یا hold است.
- `docs/local-pc-switch.md` باید مسیر سوییچ لوکال Jewelry/Food را دقیق نگه دارد.
- `docs/launch-readiness.md` باید آخرین launch gate و QA واقعی را پوشش دهد.

## Release Gate

قبل از release برای کاربر واقعی:

- Backup دیتابیس و storage گرفته شده باشد.
- `db:deploy` و `build` پاس شده باشند.
- App، worker، watchdog، و backup scheduler در PM2 فعال باشند.
- Smoke test پاس باشد.
- حداقل یک generation واقعی، یک SMS، یک پرداخت/رسید، یک quality review، و یک notification تست شده باشد.
