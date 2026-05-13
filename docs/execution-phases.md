# Ovala Execution Phases

این سند برای اجرای مرحله‌ای کارهای بعدی Ovala است. هر فاز کوچک نگه داشته شده تا در یک سشن Codex قابل بررسی، برنامه‌ریزی و اجرا باشد.

## قواعد مشترک هر فاز

- قبل از اجرا، کد مرتبط خوانده شود و فرضیات با وضعیت فعلی repo تطبیق داده شود.
- اگر گزارش Claude یا ابزار دیگر داده شد، اول اعتبار هر مورد در کد بررسی شود؛ هر پیشنهاد الزاماً اجرا نشود.
- متن فارسی باید UTF-8 سالم بماند و mojibake وارد نشود.
- تغییرات هر فاز محدود به همان فاز باشد.
- بعد از هر فاز اجرا شود:

```powershell
npm run check:mojibake
npm run lint
npm run build
```

اگر build فقط به خاطر مشکل شناخته‌شده Prisma engine/client در `src/lib/db.ts` یا file-lock ویندوز شکست خورد، همان را شفاف گزارش کن.

## Phase 1: Claude Review Triage

هدف: گزارش Claude را با کد واقعی مقایسه کنیم و فقط ایرادهای معتبر و مهم را وارد برنامه اجرا کنیم.

خروجی:

- فهرست ایرادهای پذیرفته‌شده با اولویت.
- فهرست موارد ردشده یا کم‌اهمیت با دلیل کوتاه.
- برنامه اصلاح کوچک برای موارد پذیرفته‌شده.

Prompt:

```text
تو در repo Ovala هستی. اول AGENTS.md، docs/architecture.md، docs/conventions.md و فایل‌های مرتبط با گزارش زیر را بخوان. بعد گزارش Claude را موردبه‌مورد با کد واقعی بررسی کن.

قانون مهم: هیچ تغییری نده تا اول بگویی کدام موارد واقعاً معتبرند، کدام‌ها غلط/کم‌اهمیت‌اند، و برای موارد معتبر چه فازهای کوچک اجرایی پیشنهاد می‌کنی. اگر موردی امنیتی، مالی، auth، ownership یا generation را تحت تأثیر می‌گذارد اولویت بالاتر بده.

گزارش Claude:
[اینجا گزارش Claude را paste می‌کنم]
```

## Phase 2: Vision Metadata A/B Test

Status: Implemented on 2026-05-13.

Implementation note: Liara vision metadata uses `LIARA_VISION_MODEL`, defaulting to `google/gemini-2.0-flash-lite-001`. Metadata is stored on `ProductAsset`; `productType` is user-editable, while angle, description, confidence, and quality issues remain internal.

هدف: مدل کمکی تحلیل عکس را با تست کوچک انتخاب کنیم، بدون قفل شدن به یک provider/model.

مدل‌های کاندید:

- `Google: Gemini 2.0 Flash Lite`
- `Google: Gemini 2.5 Flash`
- `OpenAI: GPT-5.4 Nano` یا `OpenAI: GPT-5 Nano`

رفتار مطلوب:

- ورودی: عکس محصول آپلودی.
- خروجی JSON کوتاه شامل `shortTitle`, `productType`, `confidence`, `internalDescription`, `detectedAngle`, `qualityIssues`.
- `shortTitle` فارسی، طبیعی، ۱ تا ۳ کلمه.
- `productType` قابل ویرایش توسط کاربر باشد.
- استایل و زاویه در UI کاربر editable نشوند؛ فقط metadata داخلی باشند.

Prompt:

```text
در repo Ovala اول مسیرهای فعلی AI و generation را بررسی کن: src/lib/ai، src/lib/generation، prisma/schema.prisma، و مسیرهای upload/project. سپس برای Vision metadata یک برنامه اجرای کوچک بده و اگر امن بود همان را پیاده کن.

نیاز: مدل از env قابل تغییر باشد؛ خروجی Vision JSON قابل parse باشد؛ shortTitle فارسی ۱ تا ۳ کلمه باشد؛ productType ذخیره و بعداً قابل ویرایش باشد؛ internalDescription به prompt تولید تصویر کمک کند؛ UI کاربر prompt-heavy نشود.

قبل از کدنویسی بررسی کن آیا بهتر است metadata روی ProductAsset ذخیره شود یا Project یا هر دو. تصمیم را با دلیل کوتاه بگو و بعد اجرا کن.
```

## Phase 3: Product Type Editing UX

Status: Implemented on 2026-05-13.

Implementation note: product type can be edited from gallery asset detail and project detail without exposing prompt-heavy metadata.

هدف: اگر تشخیص نوع محصول اشتباه بود، کاربر بتواند آن را ساده اصلاح کند.

رفتار مطلوب:

- ویرایش نوع محصول در مسیر مناسب و سبک انجام شود، نه به شکل فرم سنگین.
- نام پروژه همچنان قابل ویرایش بماند.
- تغییر productType روی prompt نسخه‌های بعدی اثر بگذارد.
- اگر Vision هنوز اجرا نشده یا fail شده، UI بدون خطا کار کند.

Prompt:

```text
در repo Ovala اول UI فعلی gallery، new project، project detail و projects list را بررسی کن. بعد بهترین جای کم‌اصطکاک برای ویرایش productType را پیشنهاد بده و اجرا کن.

قواعد: Ovala باید guided assistant بماند نه dashboard/form app. فقط نام پروژه و نوع محصول برای کاربر قابل ویرایش باشند. استایل، زاویه و description داخلی را به کاربر نشان نده. فارسی مستقیم UTF-8 استفاده کن و UI موبایل 393x852 را در نظر بگیر.
```

## Phase 4: Prompt Enhancement Integration

Status: Implemented on 2026-05-13.

Implementation note: generation prompts include vision metadata only when confidence and description are usable; the uploaded image remains the identity source of truth.

هدف: metadata تحلیل عکس به تولید تصویر کمک کند، اما هویت محصول همچنان از خود عکس حفظ شود.

رفتار مطلوب:

- prompt نهایی شامل اطلاعات کمکی productType/internalDescription باشد.
- دستورهای حفظ هویت محصول در prompt فعلی تضعیف نشوند.
- اگر metadata نیست یا confidence پایین است، generation همچنان با prompt فعلی کار کند.
- متن-to-image کاربر همچنان out of scope بماند.

Prompt:

```text
در repo Ovala اول ساخت prompt فعلی را در src/features/projects/actions.ts و src/lib/ai/liara.ts بررسی کن. بعد metadata تحلیل عکس را طوری به prompt اضافه کن که فقط کمک‌کننده باشد و هویت محصول از عکس اصلی حفظ شود.

قواعد: عکس اصلی همیشه reference اصلی است. metadata نباید باعث تغییر جنس، رنگ، سنگ، فرم، قطعه، حکاکی یا جزئیات محصول شود. اگر metadata مشکوک یا خالی است fallback تمیز داشته باش. تست یا بررسی لازم را اضافه کن.
```

## Phase 5: Batch Generation Cleanup

هدف: تولید گروهی داخل برنامه قابل فهم، قابل پیگیری و قابل اعتماد شود.

وضعیت فعلی:

- مدل‌های `GenerationBatch` و `GenerationBatchItem` وجود دارند.
- ساخت گروهی از Gallery وجود دارد.
- صفحه batch فعلی نیاز به polish و احتمالاً اصلاح encoding/icon دارد.

رفتار مطلوب:

- کاربر قبل از ساخت گروهی تعداد عکس‌ها، سبک، قاب خروجی و اعتبار مصرفی را واضح ببیند.
- batch detail پیشرفت هر آیتم، وضعیت کلی، لینک پروژه‌ها و failed/retry را روشن نشان دهد.
- credit consumption و owner scoping دقیق بماند.
- batch UI از Gallery source assets جدا از Project review بماند.

Prompt:

```text
در repo Ovala اول تمام مسیرهای batch را بررسی کن: prisma schema، src/features/gallery/actions.ts، src/lib/generation/jobs.ts، صفحه gallery و gallery/batches. بعد یک برنامه کوچک برای سر و سامان دادن batch generation بده و همان فاز اول امن را اجرا کن.

تمرکز: UX ساخت گروهی، نمایش وضعیت، خطاها، retry، مصرف اعتبار، و جداسازی Gallery از Projects. تغییرات را کوچک نگه دار. اگر schema migration لازم است قبل از اجرا دلیلش را بگو.
```

## Phase 6: Pre-Market Readiness Audit

هدف: قبل از ورود محصول به بازار، repo از نظر ریسک‌های فنی، امنیتی، محصولی و عملیاتی بررسی شود.

حوزه بررسی:

- auth/session/role و owner scoping.
- billing, credits, purchase requests و receipt flow.
- generation failure, provider events, retry و credit refund/consumption.
- upload/storage limits, file validation و local/S3 behavior.
- admin-only controls و text-to-image isolation.
- deployment env, Prisma, logs, backups, cleanup.
- UX blockers مهم برای اولین کاربران.

Prompt:

```text
در repo Ovala یک pre-market readiness audit انجام بده. اول docs/architecture.md، docs/deployment-runbook.md، prisma/schema.prisma و مسیرهای auth, billing, generation, uploads, admin را بخوان.

هیچ کدی تغییر نده. خروجی فقط گزارش اولویت‌بندی‌شده باشد: Critical, High, Medium, Low. برای هر مورد مسیر فایل، ریسک، اثر روی کاربر/بیزنس، و فاز کوچک پیشنهادی بده. موارد حدسی را از موارد قطعی جدا کن.
```

## Phase 7: Release Hardening

هدف: موارد پذیرفته‌شده از audit و Claude review را به اصلاحات کوچک قابل release تبدیل کنیم.

رفتار مطلوب:

- هر سشن فقط یک بسته اصلاح محدود انجام دهد.
- اصلاحات امنیتی/مالی/generation قبل از polish انجام شوند.
- docs مرتبط مثل `docs/deployment-runbook.md` یا همین فایل فقط وقتی به‌روز شوند که رفتار واقعی تغییر کرده باشد.

Prompt:

```text
در repo Ovala می‌خواهم یک بسته کوچک release hardening اجرا کنی. اول گزارش audit/Claude و کد مرتبط را بررسی کن. فقط مواردی را اجرا کن که در این سشن کم‌ریسک و کامل‌شدنی هستند.

قبل از تغییر، بگو دقیقاً چه مواردی را انتخاب کردی و چرا. بعد اجرا کن، verification را انجام بده، و در پایان فایل‌های تغییرکرده، چک‌های اجراشده، و ریسک باقی‌مانده را کوتاه گزارش کن.
```
