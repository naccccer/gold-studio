# Repo Readiness

این فایل چک سریع قبل از merge، deploy، یا گرفتن کاربر واقعی است.

## وضعیت Git

```bash
git status --short --branch
git log --oneline -5
```

- worktree باید عمدا clean باشد یا تغییرات pending شناخته‌شده باشند.
- migrationهای Prisma باید commit شده باشند.
- فایل‌های private مثل `.env`, dump دیتابیس، `.local-storage`, و خروجی‌های test نباید commit شوند.

## چک‌های اجباری

```bash
npm run check:prompts
npm run check:model-routing
npm run check:readiness
npm run check:mojibake
npm run lint
npm run build
```

برای deploy زنده:

```bash
npm run smoke -- https://ovala.ir
```

برای staging:

```bash
npm run smoke -- https://test.ovala.ir
```

## Env و Storage

- `.env.example` باید نام envهای production را بدون مقدار واقعی نگه دارد.
- `STORAGE_DRIVER="local"` یعنی فایل‌ها زیر `.local-storage/uploads` هستند و از `/api/storage/...` خوانده می‌شوند.
- `public/uploads` مسیر عملیاتی نیست و نباید برای user upload استفاده شود.
- قبل از اجرای `cleanup:archives` مطمئن شو backup داری؛ این script DB row و فایل storage را حذف می‌کند.

## Docs

- اگر رفتار محصول، deploy، env، storage، billing، SMS، provider، worker، watchdog، یا عملیات ادمین تغییر کرد، Markdown مرتبط را همان PR به‌روز کن.
- `README.md` باید لینک سندهای اصلی را داشته باشد.
- `roadmap.md` باید وضعیت فعلی و اولویت‌های نزدیک را نشان دهد، نه تاریخچه بلند.

## Release Gate

قبل از release برای کاربر واقعی:

- backup دیتابیس و storage گرفته شده باشد.
- `db:deploy` و `build` پاس شده باشند.
- app، worker، و watchdog در PM2 فعال باشند.
- smoke test پاس باشد.
- حداقل یک generation واقعی، یک SMS، یک پرداخت/رسید، یک quality review، و یک notification تست شده باشد.
